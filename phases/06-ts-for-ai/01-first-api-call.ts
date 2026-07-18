/**
 * Phase 6 · Exercise 01 — Your first (typed) API call
 *
 * Both must pass (no API key needed — see LESSON.md):
 *   npm run ts    phases/06-ts-for-ai/01-first-api-call.ts
 *   npm run check phases/06-ts-for-ai/01-first-api-call.ts
 *
 * The fake client speaks the REAL SDK types. Everything you write here is
 * exactly what you'd write against api.anthropic.com.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — build a valid request
//
// Fill in `params` for a request that:
//   - uses model "claude-sonnet-5"
//   - allows at most 200 output tokens (max_tokens is REQUIRED — the type
//     will tell you; try deleting it and reading the error)
//   - sets the system prompt "You are a concise assistant." (top-level
//     `system`, NOT a message with role system — that's an OpenAI-ism)
//   - sends ONE user message: "Explain RAG in one sentence."
// ─────────────────────────────────────────────────────────────────────────────
const params: Anthropic.MessageCreateParamsNonStreaming = {
  model: "claude-sonnet-5",
  max_tokens: 200,
  messages: [], // FILL IN system + the user message
};

expect(params.system).toBe("You are a concise assistant.");
expect(params.messages.length).toBe(1);
expect(params.messages[0]!.role).toBe("user");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — extract text from content blocks
//
// `response.content` is Anthropic.ContentBlock[] — a discriminated union on
// `type`. Implement extractText: join the text of every text block ("" if
// none). Use .filter with a type-predicate — (b): b is Anthropic.TextBlock —
// or a for-of with narrowing. NO casts.
// ─────────────────────────────────────────────────────────────────────────────
function extractText(response: Anthropic.Message): string {
  return ""; // IMPLEMENT
}

const scripted = makeScriptedClient([
  fakeMessage("RAG retrieves relevant documents and feeds them to the model as context."),
]);

const response = await scripted.client.messages.create(params);
expect(extractText(response)).toBe(
  "RAG retrieves relevant documents and feeds them to the model as context."
);
// and the request you built actually went over the wire:
expect(scripted.requests[0]!.model).toBe("claude-sonnet-5");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — respect stop_reason
//
// Implement askOnce: calls client.messages.create, then:
//   stop_reason "end_turn"   → return the text
//   stop_reason "max_tokens" → return text + " …[truncated]"
//   anything else            → return `[unexpected stop: ${stop_reason}]`
// Ignoring stop_reason is mistake #2 in the LESSON — this function is the
// habit you'll carry into every model call you ever make.
// ─────────────────────────────────────────────────────────────────────────────
async function askOnce(client: ModelClient, question: string): Promise<string> {
  return ""; // IMPLEMENT (reuse extractText)
}

const happy = makeScriptedClient([fakeMessage("All good.")]);
expect(await askOnce(happy.client, "status?")).toBe("All good.");

const truncated = makeScriptedClient([fakeMessage("Half an answ", { stopReason: "max_tokens" })]);
expect(await askOnce(truncated.client, "long question")).toBe("Half an answ …[truncated]");

const weird = makeScriptedClient([fakeMessage("", { stopReason: "refusal" })]);
expect(await askOnce(weird.client, "?")).toBe("[unexpected stop: refusal]");

// ─────────────────────────────────────────────────────────────────────────────
// GOING LIVE (optional, after setting ANTHROPIC_API_KEY in .env):
//
//   import Anthropic from "@anthropic-ai/sdk";
//   import "dotenv/config";
//   const real = new Anthropic();          // picks up the env var
//   console.log(await askOnce(real, "Explain RAG in one sentence."));
//
// `real` satisfies ModelClient — the fake and the real client are
// interchangeable BY TYPE. That's the whole point of the pattern.
// ─────────────────────────────────────────────────────────────────────────────

pass("01-first-api-call");
