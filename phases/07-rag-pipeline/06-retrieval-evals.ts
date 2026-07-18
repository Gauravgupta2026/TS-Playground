/**
 * Phase 7 · Exercise 06 — Retrieval evals: recall@k and MRR
 *
 * Both must pass:
 *   npm run ts    phases/07-rag-pipeline/06-retrieval-evals.ts
 *   npm run check phases/07-rag-pipeline/06-retrieval-evals.ts
 *
 * Before tuning chunk size / k / models, you need numbers. Two metrics
 * cover most retrieval debugging.
 */
import { expect, pass } from "../../helpers/assert";

// A labeled case: for this query, ANY of expectedSources counts as correct.
type LabeledCase = { query: string; expectedSources: string[] };
// A retriever returns ranked source names (best first) for a query.
type Retriever = (query: string, k: number) => string[];

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — recall@k
//
// For each case: retrieve top k; a case PASSES if any expected source
// appears. recallAtK = passes / cases (0 for an empty case list).
// "Did we even find it" — the first number to look at when RAG misbehaves.
// ─────────────────────────────────────────────────────────────────────────────
function recallAtK(cases: LabeledCase[], retriever: Retriever, k: number): number {
  return -1; // IMPLEMENT
}

// A deterministic fake retriever with known behavior:
const rankings: Record<string, string[]> = {
  "how to chunk?": ["rag.md", "evals.md", "agents.md"],
  "what is recall?": ["agents.md", "evals.md", "rag.md"], // right doc at rank 2
  "upi settlement time?": ["rag.md", "agents.md", "evals.md"], // right doc missing entirely
};
const fakeRetriever: Retriever = (query, k) => (rankings[query] ?? []).slice(0, k);

const cases: LabeledCase[] = [
  { query: "how to chunk?", expectedSources: ["rag.md"] },
  { query: "what is recall?", expectedSources: ["evals.md"] },
  { query: "upi settlement time?", expectedSources: ["fintech.md"] },
];

expect(recallAtK(cases, fakeRetriever, 1)).toBe(1 / 3); // only "how to chunk?" hits at k=1
expect(recallAtK(cases, fakeRetriever, 2)).toBe(2 / 3); // "what is recall?" now caught
expect(recallAtK(cases, fakeRetriever, 3)).toBe(2 / 3); // fintech.md never appears
expect(recallAtK([], fakeRetriever, 3)).toBe(0);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — MRR (mean reciprocal rank)
//
// Per case: rank of the FIRST correct source in the top k (1-based);
// contribute 1/rank, or 0 if absent. Average over cases.
// Rewards putting the right doc FIRST — where it most influences the model.
// ─────────────────────────────────────────────────────────────────────────────
function meanReciprocalRank(cases2: LabeledCase[], retriever: Retriever, k: number): number {
  return -1; // IMPLEMENT
}

// ranks at k=3: 1, 2, none → (1 + 0.5 + 0) / 3 = 0.5
expect(meanReciprocalRank(cases, fakeRetriever, 3)).toBe(0.5);
expect(meanReciprocalRank([], fakeRetriever, 3)).toBe(0);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — use the numbers: compare two retrievers
//
// Implement betterRetriever: run both metrics at k on both retrievers;
// return "a", "b", or "tie". Recall decides; MRR breaks recall ties.
// (This tiny function is the honest core of every "we improved retrieval
// by 12%" claim you'll ever write in a case study.)
// ─────────────────────────────────────────────────────────────────────────────
function betterRetriever(
  cases3: LabeledCase[],
  a: Retriever,
  b: Retriever,
  k: number
): "a" | "b" | "tie" {
  return "tie"; // IMPLEMENT
}

// retriever B fixes the fintech miss but demotes evals.md to rank 3:
const rankingsB: Record<string, string[]> = {
  "how to chunk?": ["rag.md", "agents.md", "evals.md"],
  "what is recall?": ["agents.md", "rag.md", "evals.md"],
  "upi settlement time?": ["fintech.md", "rag.md", "agents.md"],
};
const fakeRetrieverB: Retriever = (query, k) => (rankingsB[query] ?? []).slice(0, k);

expect(betterRetriever(cases, fakeRetriever, fakeRetrieverB, 3)).toBe("b"); // recall 2/3 vs 3/3
expect(betterRetriever(cases, fakeRetriever, fakeRetriever, 3)).toBe("tie");

pass("06-retrieval-evals");
