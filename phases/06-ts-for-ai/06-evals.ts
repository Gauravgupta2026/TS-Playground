/**
 * Phase 6 · Exercise 06 — A minimal eval harness
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/06-ts-for-ai/06-evals.ts
 *   npm run check phases/06-ts-for-ai/06-evals.ts
 *
 * Unit tests assert exact answers; model outputs vary. Evals GRADE outputs
 * across many cases and report a pass rate — the safety net that makes
 * prompt/model changes safe to ship. This harness is tiny but structurally
 * identical to production ones.
 */
import { expect, pass } from "../../helpers/assert";

// One eval case: input, the grader to apply, and what "pass" means for it.
type Grader =
  | { kind: "exact"; expected: string }
  | { kind: "contains"; mustInclude: string[] }
  | { kind: "numeric"; expected: number; tolerance: number };

type EvalCase = { name: string; input: string; grader: Grader };
type CaseResult = { name: string; passed: boolean; output: string };
type Scorecard = { total: number; passed: number; passRate: number; failures: string[] };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — implement the graders
//
// grade(output, grader):
//   exact    → output.trim() === expected
//   contains → EVERY mustInclude string appears (case-insensitive)
//   numeric  → parse the FIRST number in the output (regex /-?\d+(\.\d+)?/)
//              and |parsed - expected| <= tolerance. No number → fail.
// Discriminated-union switch — let the compiler enforce all three arms.
// ─────────────────────────────────────────────────────────────────────────────
function grade(output: string, grader: Grader): boolean {
  return false; // IMPLEMENT
}

expect(grade("  Paris ", { kind: "exact", expected: "Paris" })).toBe(true);
expect(grade("paris", { kind: "exact", expected: "Paris" })).toBe(false);
expect(grade("RAG uses Retrieval and Generation.", { kind: "contains", mustInclude: ["retrieval", "generation"] })).toBe(true);
expect(grade("RAG uses retrieval.", { kind: "contains", mustInclude: ["retrieval", "generation"] })).toBe(false);
expect(grade("The answer is 42.1 exactly", { kind: "numeric", expected: 42, tolerance: 0.5 })).toBe(true);
expect(grade("It's about 40", { kind: "numeric", expected: 42, tolerance: 0.5 })).toBe(false);
expect(grade("no digits here", { kind: "numeric", expected: 42, tolerance: 100 })).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — run the suite
//
// Implement runEvals: run every case through `model` (CONCURRENTLY —
// Promise.all, Phase 2 muscle), grade each, and build the scorecard.
// passRate rounded to 2 decimals (Math.round(x * 100) / 100).
// failures: names of failed cases, in input order.
// ─────────────────────────────────────────────────────────────────────────────
async function runEvals(cases: EvalCase[], model: (input: string) => Promise<string>): Promise<Scorecard> {
  return { total: 0, passed: 0, passRate: 0, failures: [] }; // IMPLEMENT
}

// A fake "model under test" — imagine this is your RAG pipeline:
async function modelUnderTest(input: string): Promise<string> {
  const canned: Record<string, string> = {
    "capital of France?": "Paris",
    "what is RAG?": "Retrieval of documents, then generation with context.",
    "tokens in 'hello world'?": "About 2 tokens.",
    "capital of Australia?": "Sydney", // wrong! (it's Canberra) — should fail the eval
  };
  return canned[input] ?? "I don't know.";
}

const suite: EvalCase[] = [
  { name: "france", input: "capital of France?", grader: { kind: "exact", expected: "Paris" } },
  { name: "rag-def", input: "what is RAG?", grader: { kind: "contains", mustInclude: ["retrieval", "generation"] } },
  { name: "tokens", input: "tokens in 'hello world'?", grader: { kind: "numeric", expected: 2, tolerance: 0 } },
  { name: "australia", input: "capital of Australia?", grader: { kind: "exact", expected: "Canberra" } },
];

const scorecard = await runEvals(suite, modelUnderTest);
expect(scorecard.total).toBe(4);
expect(scorecard.passed).toBe(3);
expect(scorecard.passRate).toBe(0.75);
expect(scorecard.failures).toEqual(["australia"]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — regression gate
//
// The point of evals: comparing BEFORE vs AFTER a change. Implement
// isRegression: true when the new scorecard's passRate is lower, OR when a
// case that previously passed now fails (even if the overall rate went up —
// per-case regressions hide inside averages!).
// ─────────────────────────────────────────────────────────────────────────────
function isRegression(before: Scorecard, after: Scorecard): boolean {
  return false; // IMPLEMENT (hint: compare failures via Set)
}

const before: Scorecard = { total: 4, passed: 3, passRate: 0.75, failures: ["australia"] };
const worse: Scorecard = { total: 4, passed: 2, passRate: 0.5, failures: ["australia", "france"] };
const sneaky: Scorecard = { total: 4, passed: 3, passRate: 0.75, failures: ["france"] }; // same rate, new failure!
const better: Scorecard = { total: 4, passed: 4, passRate: 1, failures: [] };

expect(isRegression(before, worse)).toBe(true);
expect(isRegression(before, sneaky)).toBe(true);
expect(isRegression(before, better)).toBe(false);
expect(isRegression(before, before)).toBe(false);

pass("06-evals");
