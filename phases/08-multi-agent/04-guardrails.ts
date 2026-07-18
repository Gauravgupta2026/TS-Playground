/**
 * Phase 8 · Exercise 04 — Guardrails: budgets, stop conditions, escalation
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/08-multi-agent/04-guardrails.ts
 *   npm run check phases/08-multi-agent/04-guardrails.ts
 *
 * Autonomy compounds cost. Every runaway-agent story ends with a bill or
 * an outage; every fix looks like this file.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — a token budget, shared across a whole run
//
// Implement TokenBudget:
//   constructor(maxTokens)
//   record(usage)   — add input+output tokens from an Anthropic.Usage
//   get spent()     — total so far
//   get exhausted() — spent >= max
// One budget instance is passed to EVERY agent in a run — that's what makes
// it a SYSTEM guardrail rather than a per-agent one.
// ─────────────────────────────────────────────────────────────────────────────
class TokenBudget {
  constructor(maxTokens: number) {
    // IMPLEMENT
  }
  record(usage: Anthropic.Usage): void {
    // IMPLEMENT
  }
  get spent(): number {
    return -1; // IMPLEMENT
  }
  get exhausted(): boolean {
    return false; // IMPLEMENT
  }
}

const budget = new TokenBudget(100);
expect(budget.spent).toBe(0);
expect(budget.exhausted).toBe(false);
budget.record(fakeMessage("x", { inputTokens: 30, outputTokens: 20 }).usage);
expect(budget.spent).toBe(50);
budget.record(fakeMessage("y", { inputTokens: 40, outputTokens: 15 }).usage);
expect(budget.spent).toBe(105);
expect(budget.exhausted).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — a budget-aware call wrapper
//
// Implement guardedCall: refuses BEFORE calling when the budget is already
// exhausted (err("budget exhausted") — the model is never invoked); records
// usage AFTER each successful call.
// ─────────────────────────────────────────────────────────────────────────────
async function guardedCall(
  client: ModelClient,
  budget2: TokenBudget,
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<Result<Anthropic.Message, string>> {
  return { ok: false, error: "IMPLEMENT me" };
}

const tightBudget = new TokenBudget(60);
const scripted = makeScriptedClient([
  fakeMessage("first", { inputTokens: 30, outputTokens: 25 }), // 55 total
  fakeMessage("second — should never be reached", { inputTokens: 10, outputTokens: 10 }),
]);
const params: Anthropic.MessageCreateParamsNonStreaming = {
  model: "claude-haiku-4-5",
  max_tokens: 100,
  messages: [{ role: "user", content: "hi" }],
};

const first = await guardedCall(scripted.client, tightBudget, params);
expect(first.ok).toBe(true);
expect(tightBudget.spent).toBe(55);

tightBudget.record(fakeMessage("z", { inputTokens: 5, outputTokens: 5 }).usage); // now 65 ≥ 60
const second = await guardedCall(scripted.client, tightBudget, params);
expect(second.ok).toBe(false);
expect(scripted.requests.length).toBe(1); // the refusal happened BEFORE the call

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — a critic loop with a stop condition AND an attempt cap
//
// The generator drafts; the critic answers exactly "APPROVED" or gives
// feedback; feedback goes back to the generator. Implement runCriticLoop:
//   - up to maxRounds rounds of (generate → critique)
//   - critic says "APPROVED" → ok(<the approved draft>)
//   - rounds exhausted → err("no approval after N rounds")   ← ESCALATION,
//     returning the failure explicitly instead of shipping the last draft.
// generate(feedback): first round feedback is null.
// ─────────────────────────────────────────────────────────────────────────────
async function runCriticLoop(
  generate: (feedback: string | null) => Promise<string>,
  critique: (draft: string) => Promise<string>,
  maxRounds: number
): Promise<Result<string, string>> {
  return { ok: false, error: "IMPLEMENT me" };
}

// approves on the second round:
let generatorCalls = 0;
const improving = await runCriticLoop(
  async (feedback) => {
    generatorCalls += 1;
    return feedback === null ? "draft v1" : `draft v2 (fixed: ${feedback})`;
  },
  async (draft) => (draft.includes("v2") ? "APPROVED" : "too vague"),
  3
);
expect(improving.ok).toBe(true);
if (improving.ok) expect(improving.value).toBe("draft v2 (fixed: too vague)");
expect(generatorCalls).toBe(2);

// never approves → escalates, doesn't ship:
const hopeless = await runCriticLoop(
  async () => "same draft",
  async () => "still bad",
  2
);
expect(hopeless.ok).toBe(false);
if (!hopeless.ok) expect(hopeless.error).toBe("no approval after 2 rounds");

pass("04-guardrails");
