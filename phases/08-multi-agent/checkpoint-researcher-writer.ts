/**
 * Phase 8 · CHECKPOINT — Researcher → Writer, production shape
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/08-multi-agent/checkpoint-researcher-writer.ts
 *   npm run check phases/08-multi-agent/checkpoint-researcher-writer.ts
 *
 * Assemble the phase: a two-agent pipeline with a typed handoff, retry on
 * bad structure, a shared token budget, and typed failure. This is the
 * skeleton the capstone extends to four agents.
 *
 * SPEC — runResearchPipeline(researcherClient, writerClient, topic, opts):
 *   opts: { maxResearchAttempts (default 2), budget: TokenBudget }
 *
 *   1. RESEARCH: ask the researcher (RESEARCHER_PROMPT system, user:
 *      `Research this topic: ${topic}`) for JSON matching
 *      ResearchHandoffSchema. Invalid → retry with the validation error
 *      appended (Phase 6 file 05 pattern), up to maxResearchAttempts total.
 *      All attempts fail → err("research failed").
 *   2. WRITE: writer (WRITER_PROMPT system) gets:
 *      `Write a short summary about ${topic}.\nFacts:\n- …\n- …`
 *      → its text is the draft.
 *   3. BUDGET: EVERY response's usage is recorded against opts.budget.
 *      If the budget is exhausted BEFORE any call → err("budget exhausted")
 *      without calling.
 *   4. Success: ok({ draft, handoff, tokensSpent }).
 */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const RESEARCHER_PROMPT =
  'You are a researcher. Respond ONLY with JSON: {"topic": "...", "keyFacts": ["..."], "confidence": "high|medium|low"}';
const WRITER_PROMPT = "You are a writer. Produce a crisp two-sentence summary from the given facts.";

const ResearchHandoffSchema = z.object({
  topic: z.string().min(1),
  keyFacts: z.array(z.string()).min(1).max(5),
  confidence: z.enum(["high", "medium", "low"]),
});
type ResearchHandoff = z.infer<typeof ResearchHandoffSchema>;

// From 04 (bring your own):
class TokenBudget {
  constructor(maxTokens: number) {
    // IMPLEMENT (or paste your 04 solution — it's YOUR library now)
  }
  record(usage: Anthropic.Usage): void {}
  get spent(): number {
    return -1;
  }
  get exhausted(): boolean {
    return true;
  }
}

type PipelineOutput = { draft: string; handoff: ResearchHandoff; tokensSpent: number };

async function runResearchPipeline(
  researcherClient: ModelClient,
  writerClient: ModelClient,
  topic: string,
  opts: { maxResearchAttempts?: number; budget: TokenBudget }
): Promise<Result<PipelineOutput, string>> {
  return { ok: false, error: "IMPLEMENT me" };
}

// ── The spec ────────────────────────────────────────────────────────────────
// happy path (researcher flubs once, recovers on retry):
const researcher = makeScriptedClient([
  fakeMessage("Let me think about credit scoring…", { inputTokens: 20, outputTokens: 10 }),
  fakeMessage(
    '{"topic": "credit scoring", "keyFacts": ["Bureaus track repayment history", "Alternative data is rising"], "confidence": "medium"}',
    { inputTokens: 45, outputTokens: 40 }
  ),
]);
const writer = makeScriptedClient([
  fakeMessage("Credit scores rest on repayment history; alternative data is expanding access.", {
    inputTokens: 60,
    outputTokens: 30,
  }),
]);

const budget = new TokenBudget(1000);
const result = await runResearchPipeline(researcher.client, writer.client, "credit scoring", { budget });

expect(result.ok).toBe(true);
if (result.ok) {
  expect(result.value.draft).toBe(
    "Credit scores rest on repayment history; alternative data is expanding access."
  );
  expect(result.value.handoff.keyFacts.length).toBe(2);
  expect(result.value.tokensSpent).toBe(205); // 30 + 85 + 90
}
// the retry carried the validation error back to the researcher:
expect(JSON.stringify(researcher.requests[1]!.messages).includes("failed validation")).toBe(true);
// both agents ran under their own prompts:
expect(researcher.requests[0]!.system).toBe(RESEARCHER_PROMPT);
expect(writer.requests[0]!.system).toBe(WRITER_PROMPT);
// facts crossed the boundary, prose didn't:
expect(JSON.stringify(writer.requests[0]!.messages).includes("Bureaus track repayment history")).toBe(true);

// researcher never produces valid JSON → typed failure, writer never runs:
const stubborn = makeScriptedClient([fakeMessage("nope"), fakeMessage("still nope")]);
const neverWriter = makeScriptedClient([fakeMessage("unreachable")]);
const failed = await runResearchPipeline(stubborn.client, neverWriter.client, "x", {
  budget: new TokenBudget(1000),
});
expect(failed.ok).toBe(false);
if (!failed.ok) expect(failed.error).toBe("research failed");
expect(neverWriter.requests.length).toBe(0);

// exhausted budget short-circuits before ANY model call:
const spent = new TokenBudget(10);
spent.record(fakeMessage("x", { inputTokens: 50, outputTokens: 50 }).usage);
const untouchedResearcher = makeScriptedClient([fakeMessage("unreachable")]);
const broke = await runResearchPipeline(untouchedResearcher.client, neverWriter.client, "x", { budget: spent });
expect(broke.ok).toBe(false);
if (!broke.ok) expect(broke.error).toBe("budget exhausted");
expect(untouchedResearcher.requests.length).toBe(0);

pass("checkpoint-researcher-writer — Phase 8 complete! Readiness check, then the capstone.");
