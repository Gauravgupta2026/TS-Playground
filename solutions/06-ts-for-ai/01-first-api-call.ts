/** SOLUTION — Phase 6 · 01. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — system is top-level; messages carry only user/assistant turns.
const params: Anthropic.MessageCreateParamsNonStreaming = {
  model: "claude-sonnet-5",
  max_tokens: 200,
  system: "You are a concise assistant.",
  messages: [{ role: "user", content: "Explain RAG in one sentence." }],
};

expect(params.system).toBe("You are a concise assistant.");
expect(params.messages.length).toBe(1);
expect(params.messages[0]!.role).toBe("user");

// EXERCISE 2 — a type predicate in filter keeps the result typed TextBlock[].
function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

const scripted = makeScriptedClient([
  fakeMessage("RAG retrieves relevant documents and feeds them to the model as context."),
]);
const response = await scripted.client.messages.create(params);
expect(extractText(response)).toBe(
  "RAG retrieves relevant documents and feeds them to the model as context."
);
expect(scripted.requests[0]!.model).toBe("claude-sonnet-5");

// EXERCISE 3 — stop_reason decides what the text MEANS.
async function askOnce(client: ModelClient, question: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 200,
    messages: [{ role: "user", content: question }],
  });
  const text = extractText(msg);
  if (msg.stop_reason === "end_turn") return text;
  if (msg.stop_reason === "max_tokens") return `${text} …[truncated]`;
  return `[unexpected stop: ${msg.stop_reason}]`;
}

const happy = makeScriptedClient([fakeMessage("All good.")]);
expect(await askOnce(happy.client, "status?")).toBe("All good.");
const truncated = makeScriptedClient([fakeMessage("Half an answ", { stopReason: "max_tokens" })]);
expect(await askOnce(truncated.client, "long question")).toBe("Half an answ …[truncated]");
const weird = makeScriptedClient([fakeMessage("", { stopReason: "refusal" })]);
expect(await askOnce(weird.client, "?")).toBe("[unexpected stop: refusal]");

pass("01-first-api-call (solution)");
