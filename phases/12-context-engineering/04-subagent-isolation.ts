/**
 * Phase 12 · Exercise 04 — Subagent context isolation
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/12-context-engineering/04-subagent-isolation.ts
 *   npm run check phases/12-context-engineering/04-subagent-isolation.ts
 *
 * The multiplier of agentic systems: a subagent explores in its OWN window —
 * thousands of tokens of searching and reading — and returns only a condensed
 * summary. The lead's attention budget is spent on SYNTHESIS, not raw material.
 * You'll measure the isolation directly: the lead's context stays tiny while
 * each subagent burns hundreds of tokens.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

/** GIVEN — token estimate. */
const estimate = (text: string): number => Math.ceil(text.length / 4);

const LEAD_PROMPT = "You synthesize subagent findings into one answer.";

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — runSubagent(client, task)
//
// Run a loop in the subagent's OWN private history: send the task, then keep
// sending "continue" until a reply begins with "DONE:" (or maxSteps=5 is hit).
// Sum every response's usage.output_tokens into `internalTokens`. Return
//   { summary: <text after "DONE:", trimmed>, internalTokens }.
// The summary is ALL the lead ever sees — the exploration stays quarantined here.
// ─────────────────────────────────────────────────────────────────────────────
async function runSubagent(
  client: ModelClient,
  task: string
): Promise<{ summary: string; internalTokens: number }> {
  return { summary: "", internalTokens: 0 }; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — runLead(leadClient, subagents)
//
// For each { client, task }, run a subagent and collect its summary. Build ONE
// lead context: a user message listing the summaries as `- ${summary}` lines.
// Call leadClient once (system = LEAD_PROMPT) and return:
//   { answer: <lead text>,
//     leadContextTokens: estimate(that user message),
//     subagentTokens: [each subagent's internalTokens] }.
// The lead must NEVER receive the raw exploration — only the summaries.
// ─────────────────────────────────────────────────────────────────────────────
async function runLead(
  leadClient: ModelClient,
  subagents: Array<{ client: ModelClient; task: string }>
): Promise<{ answer: string; leadContextTokens: number; subagentTokens: number[] }> {
  return { answer: "", leadContextTokens: 0, subagentTokens: [] }; // IMPLEMENT
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
// each subagent really did burn hundreds of tokens internally:
expect(result.subagentTokens).toEqual([255, 135]);
// …yet the lead's context is a tiny fraction of that (isolation!):
expect(result.leadContextTokens < result.subagentTokens[0]!).toBe(true);
// the lead saw the SUMMARIES, never the raw exploration:
const leadSaw = JSON.stringify(lead.requests[0]!.messages);
expect(leadSaw.includes("missing await")).toBe(true);
expect(leadSaw.includes("exploring the codebase")).toBe(false);
expect(lead.requests[0]!.system).toBe(LEAD_PROMPT);

pass("04-subagent-isolation");
