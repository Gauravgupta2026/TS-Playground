/** SOLUTION — Phase 8 · 04. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// EXERCISE 1 — one instance per RUN, shared by every agent in it.
class TokenBudget {
  private readonly maxTokens: number;
  private total = 0;

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
  }
  record(usage: Anthropic.Usage): void {
    this.total += usage.input_tokens + usage.output_tokens;
  }
  get spent(): number {
    return this.total;
  }
  get exhausted(): boolean {
    return this.total >= this.maxTokens;
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

// EXERCISE 2 — refuse BEFORE spending, record AFTER succeeding.
async function guardedCall(
  client: ModelClient,
  budget2: TokenBudget,
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<Result<Anthropic.Message, string>> {
  if (budget2.exhausted) return { ok: false, error: "budget exhausted" };
  const response = await client.messages.create(params);
  budget2.record(response.usage);
  return { ok: true, value: response };
}

const tightBudget = new TokenBudget(60);
const scripted = makeScriptedClient([
  fakeMessage("first", { inputTokens: 30, outputTokens: 25 }),
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

tightBudget.record(fakeMessage("z", { inputTokens: 5, outputTokens: 5 }).usage);
const second = await guardedCall(scripted.client, tightBudget, params);
expect(second.ok).toBe(false);
expect(scripted.requests.length).toBe(1);

// EXERCISE 3 — stop condition + attempt cap + explicit escalation.
async function runCriticLoop(
  generate: (feedback: string | null) => Promise<string>,
  critique: (draft: string) => Promise<string>,
  maxRounds: number
): Promise<Result<string, string>> {
  let feedback: string | null = null;
  for (let round = 1; round <= maxRounds; round++) {
    const draft = await generate(feedback);
    const verdict = await critique(draft);
    if (verdict === "APPROVED") return { ok: true, value: draft };
    feedback = verdict;
  }
  return { ok: false, error: `no approval after ${maxRounds} rounds` };
}

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

const hopeless = await runCriticLoop(
  async () => "same draft",
  async () => "still bad",
  2
);
expect(hopeless.ok).toBe(false);
if (!hopeless.ok) expect(hopeless.error).toBe("no approval after 2 rounds");

pass("04-guardrails (solution)");
