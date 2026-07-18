/** SOLUTION — Phase 6 · 06. */
import { expect, pass } from "../../helpers/assert";

type Grader =
  | { kind: "exact"; expected: string }
  | { kind: "contains"; mustInclude: string[] }
  | { kind: "numeric"; expected: number; tolerance: number };

type EvalCase = { name: string; input: string; grader: Grader };
type CaseResult = { name: string; passed: boolean; output: string };
type Scorecard = { total: number; passed: number; passRate: number; failures: string[] };

// EXERCISE 1 — a discriminated-union switch; each arm sees its own fields.
function grade(output: string, grader: Grader): boolean {
  switch (grader.kind) {
    case "exact":
      return output.trim() === grader.expected;
    case "contains":
      return grader.mustInclude.every((needle) => output.toLowerCase().includes(needle.toLowerCase()));
    case "numeric": {
      const match = output.match(/-?\d+(\.\d+)?/);
      if (!match) return false;
      return Math.abs(Number(match[0]) - grader.expected) <= grader.tolerance;
    }
  }
}

expect(grade("  Paris ", { kind: "exact", expected: "Paris" })).toBe(true);
expect(grade("paris", { kind: "exact", expected: "Paris" })).toBe(false);
expect(grade("RAG uses Retrieval and Generation.", { kind: "contains", mustInclude: ["retrieval", "generation"] })).toBe(true);
expect(grade("RAG uses retrieval.", { kind: "contains", mustInclude: ["retrieval", "generation"] })).toBe(false);
expect(grade("The answer is 42.1 exactly", { kind: "numeric", expected: 42, tolerance: 0.5 })).toBe(true);
expect(grade("It's about 40", { kind: "numeric", expected: 42, tolerance: 0.5 })).toBe(false);
expect(grade("no digits here", { kind: "numeric", expected: 42, tolerance: 100 })).toBe(false);

// EXERCISE 2 — all cases in flight at once; grade as they land.
async function runEvals(cases: EvalCase[], model: (input: string) => Promise<string>): Promise<Scorecard> {
  const results: CaseResult[] = await Promise.all(
    cases.map(async (c) => {
      const output = await model(c.input);
      return { name: c.name, passed: grade(output, c.grader), output };
    })
  );
  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    passRate: results.length === 0 ? 0 : Math.round((passed / results.length) * 100) / 100,
    failures: results.filter((r) => !r.passed).map((r) => r.name),
  };
}

async function modelUnderTest(input: string): Promise<string> {
  const canned: Record<string, string> = {
    "capital of France?": "Paris",
    "what is RAG?": "Retrieval of documents, then generation with context.",
    "tokens in 'hello world'?": "About 2 tokens.",
    "capital of Australia?": "Sydney",
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

// EXERCISE 3 — averages hide per-case regressions; check both.
function isRegression(before: Scorecard, after: Scorecard): boolean {
  if (after.passRate < before.passRate) return true;
  const previouslyFailing = new Set(before.failures);
  return after.failures.some((name) => !previouslyFailing.has(name));
}

const before: Scorecard = { total: 4, passed: 3, passRate: 0.75, failures: ["australia"] };
const worse: Scorecard = { total: 4, passed: 2, passRate: 0.5, failures: ["australia", "france"] };
const sneaky: Scorecard = { total: 4, passed: 3, passRate: 0.75, failures: ["france"] };
const better: Scorecard = { total: 4, passed: 4, passRate: 1, failures: [] };

expect(isRegression(before, worse)).toBe(true);
expect(isRegression(before, sneaky)).toBe(true);
expect(isRegression(before, better)).toBe(false);
expect(isRegression(before, before)).toBe(false);

pass("06-evals (solution)");
