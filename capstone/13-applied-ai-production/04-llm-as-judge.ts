/**
 * Phase 13 · Exercise 04 — LLM-as-judge (with bias mitigation)
 *
 * Both must pass (no API key needed):
 *   npm run ts    capstone/13-applied-ai-production/04-llm-as-judge.ts
 *   npm run check capstone/13-applied-ai-production/04-llm-as-judge.ts
 *
 * You can't improve what you can't measure, and human grading doesn't scale —
 * so a model grades outputs. But a pairwise judge suffers POSITION BIAS:
 * swapping A/B can flip the verdict. The load-bearing technique is running both
 * orders and only trusting a verdict that survives the swap. You'll build a
 * debiased judge that catches a position-biased judge red-handed.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Verdict = "A" | "B" | "tie";

function textOf(message: Anthropic.Message): string {
  return message.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — pairwiseJudge(client, question, a, b)
//
// Ask the judge which answer is better (put both in the user message, labeled
// "Answer A" and "Answer B"). Parse the reply: trimmed & uppercased, starts
// with "A" → "A", "B" → "B", else "tie".
// ─────────────────────────────────────────────────────────────────────────────
async function pairwiseJudge(client: ModelClient, question: string, a: string, b: string): Promise<Verdict> {
  return "tie"; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — debiasedPairwise(client, question, a, b)
//
// Run the judge in BOTH orders:
//   order 1: (a as A, b as B)
//   order 2: (b as A, a as B)  — then map its verdict back to the a/b frame
//            ("A"→b wins→"B", "B"→a wins→"A", "tie"→"tie").
// If both orders agree on the same winner (and it isn't a tie) → return it.
// Otherwise the judge flipped with position → return "tie" (bias detected).
// ─────────────────────────────────────────────────────────────────────────────
async function debiasedPairwise(client: ModelClient, question: string, a: string, b: string): Promise<Verdict> {
  return "tie"; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — rubricJudge(client, answer, criteria)
//
// For each criterion, ask the judge to reply "PASS" or "FAIL" (one call each).
// Return { passed, total, score } where score = passed / total. Binary
// per-criterion grading is more reliable than a vague 1–10 score.
// ─────────────────────────────────────────────────────────────────────────────
async function rubricJudge(
  client: ModelClient,
  answer: string,
  criteria: string[]
): Promise<{ passed: number; total: number; score: number }> {
  return { passed: 0, total: 0, score: 0 }; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
// basic pairwise:
const p = makeScriptedClient([fakeMessage("A")]);
expect(await pairwiseJudge(p.client, "which is better?", "answer a", "answer b")).toBe("A");

// a CONSISTENT judge prefers the same answer regardless of order → debiased trusts it.
// order1 (a,b) → "A" (=a). order2 (b,a) → "B" (=a again). Consistent → "A".
const consistent = makeScriptedClient([fakeMessage("A"), fakeMessage("B")]);
expect(await debiasedPairwise(consistent.client, "q", "answer a", "answer b")).toBe("A");

// a POSITION-BIASED judge always picks whatever is shown FIRST → the verdict
// flips across orders → debiased returns "tie" (bias caught).
// order1 (a,b) → "A" (=a, first). order2 (b,a) → "A" (=b, first). Flip!
const biased = makeScriptedClient([fakeMessage("A"), fakeMessage("A")]);
expect(await debiasedPairwise(biased.client, "q", "answer a", "answer b")).toBe("tie");

// rubric scoring: 2 of 3 criteria pass.
const rubric = makeScriptedClient([fakeMessage("PASS"), fakeMessage("PASS"), fakeMessage("FAIL")]);
const scored = await rubricJudge(rubric.client, "the answer", ["cites sources", "is concise", "no errors"]);
expect(scored).toEqual({ passed: 2, total: 3, score: 2 / 3 });

pass("04-llm-as-judge");
