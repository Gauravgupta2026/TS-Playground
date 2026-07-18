/** SOLUTION — Phase 7 · 06. */
import { expect, pass } from "../../helpers/assert";

type LabeledCase = { query: string; expectedSources: string[] };
type Retriever = (query: string, k: number) => string[];

// EXERCISE 1
function recallAtK(cases: LabeledCase[], retriever: Retriever, k: number): number {
  if (cases.length === 0) return 0;
  const passes = cases.filter((c) => {
    const retrieved = retriever(c.query, k);
    return c.expectedSources.some((source) => retrieved.includes(source));
  }).length;
  return passes / cases.length;
}

const rankings: Record<string, string[]> = {
  "how to chunk?": ["rag.md", "evals.md", "agents.md"],
  "what is recall?": ["agents.md", "evals.md", "rag.md"],
  "upi settlement time?": ["rag.md", "agents.md", "evals.md"],
};
const fakeRetriever: Retriever = (query, k) => (rankings[query] ?? []).slice(0, k);

const cases: LabeledCase[] = [
  { query: "how to chunk?", expectedSources: ["rag.md"] },
  { query: "what is recall?", expectedSources: ["evals.md"] },
  { query: "upi settlement time?", expectedSources: ["fintech.md"] },
];

expect(recallAtK(cases, fakeRetriever, 1)).toBe(1 / 3);
expect(recallAtK(cases, fakeRetriever, 2)).toBe(2 / 3);
expect(recallAtK(cases, fakeRetriever, 3)).toBe(2 / 3);
expect(recallAtK([], fakeRetriever, 3)).toBe(0);

// EXERCISE 2 — 1/rank of the first correct hit, averaged.
function meanReciprocalRank(cases2: LabeledCase[], retriever: Retriever, k: number): number {
  if (cases2.length === 0) return 0;
  const total = cases2.reduce((sum, c) => {
    const retrieved = retriever(c.query, k);
    const rankIndex = retrieved.findIndex((source) => c.expectedSources.includes(source));
    return sum + (rankIndex === -1 ? 0 : 1 / (rankIndex + 1));
  }, 0);
  return total / cases2.length;
}

expect(meanReciprocalRank(cases, fakeRetriever, 3)).toBe(0.5);
expect(meanReciprocalRank([], fakeRetriever, 3)).toBe(0);

// EXERCISE 3 — recall decides; MRR breaks ties.
function betterRetriever(
  cases3: LabeledCase[],
  a: Retriever,
  b: Retriever,
  k: number
): "a" | "b" | "tie" {
  const recallA = recallAtK(cases3, a, k);
  const recallB = recallAtK(cases3, b, k);
  if (recallA !== recallB) return recallA > recallB ? "a" : "b";
  const mrrA = meanReciprocalRank(cases3, a, k);
  const mrrB = meanReciprocalRank(cases3, b, k);
  if (mrrA !== mrrB) return mrrA > mrrB ? "a" : "b";
  return "tie";
}

const rankingsB: Record<string, string[]> = {
  "how to chunk?": ["rag.md", "agents.md", "evals.md"],
  "what is recall?": ["agents.md", "rag.md", "evals.md"],
  "upi settlement time?": ["fintech.md", "rag.md", "agents.md"],
};
const fakeRetrieverB: Retriever = (query, k) => (rankingsB[query] ?? []).slice(0, k);

expect(betterRetriever(cases, fakeRetriever, fakeRetrieverB, 3)).toBe("b");
expect(betterRetriever(cases, fakeRetriever, fakeRetriever, 3)).toBe("tie");

pass("06-retrieval-evals (solution)");
