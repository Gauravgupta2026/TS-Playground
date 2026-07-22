/** SOLUTION — Phase 12 · 04. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

const estimate = (text: string): number => Math.ceil(text.length / 4);
const LEAD_PROMPT = "You synthesize subagent findings into one answer.";

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function runSubagent(
  client: ModelClient,
  task: string
): Promise<{ summary: string; internalTokens: number }> {
  const history: Anthropic.MessageParam[] = [{ role: "user", content: task }];
  let internalTokens = 0;
  let lastText = "";
  for (let step = 0; step < 5; step++) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      messages: [...history],
    });
    internalTokens += response.usage.output_tokens;
    lastText = textOf(response);
    history.push({ role: "assistant", content: response.content });
    if (lastText.startsWith("DONE:")) {
      return { summary: lastText.slice("DONE:".length).trim(), internalTokens };
    }
    history.push({ role: "user", content: "continue" });
  }
  return { summary: lastText, internalTokens }; // ran out of steps — return the last thing said
}

async function runLead(
  leadClient: ModelClient,
  subagents: Array<{ client: ModelClient; task: string }>
): Promise<{ answer: string; leadContextTokens: number; subagentTokens: number[] }> {
  const summaries: string[] = [];
  const subagentTokens: number[] = [];
  for (const { client, task } of subagents) {
    const { summary, internalTokens } = await runSubagent(client, task);
    summaries.push(summary);
    subagentTokens.push(internalTokens);
  }

  const context = summaries.map((s) => `- ${s}`).join("\n");
  const response = await leadClient.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1000,
    system: LEAD_PROMPT,
    messages: [{ role: "user", content: context }],
  });

  return { answer: textOf(response), leadContextTokens: estimate(context), subagentTokens };
}

// ── The spec ────────────────────────────────────────────────────────────────
const subA = makeScriptedClient([
  fakeMessage("exploring the codebase and grepping for handlers...", { outputTokens: 120 }),
  fakeMessage("reading three suspicious files in detail...", { outputTokens: 120 }),
  fakeMessage("DONE: The auth bug is a missing await in verifyToken.", { outputTokens: 15 }),
]);
const subB = makeScriptedClient([
  fakeMessage("searching the rate-limit config across services...", { outputTokens: 120 }),
  fakeMessage("DONE: Limits are enforced per API key, not per IP.", { outputTokens: 15 }),
]);
const lead = makeScriptedClient([fakeMessage("Synthesis: fix the missing await; limits are per-key.")]);

const result = await runLead(lead.client, [
  { client: subA.client, task: "find the auth bug" },
  { client: subB.client, task: "how are rate limits enforced?" },
]);

expect(result.answer.includes("Synthesis")).toBe(true);
expect(result.subagentTokens).toEqual([255, 135]);
expect(result.leadContextTokens < result.subagentTokens[0]!).toBe(true);
const leadSaw = JSON.stringify(lead.requests[0]!.messages);
expect(leadSaw.includes("missing await")).toBe(true);
expect(leadSaw.includes("exploring the codebase")).toBe(false);
expect(lead.requests[0]!.system).toBe(LEAD_PROMPT);

pass("04-subagent-isolation (solution)");
