/**
 * Phase 13 · Exercise 03 — Reranking for top-k precision
 *
 * Both must pass (no API key needed):
 *   npm run ts    capstone/13-applied-ai-production/03-reranking.ts
 *   npm run check capstone/13-applied-ai-production/03-reranking.ts
 *
 * Retrieval is cheap and recall-oriented: it casts a wide net, and the truly
 * relevant doc can land at rank 40. A reranker is expensive and
 * precision-oriented: it scores each (query, candidate) pair DIRECTLY and
 * reorders, lifting the right doc into the top-k the model actually reads.
 * You'll watch recall@3 jump from 0 to 1.
 */
import { expect, pass } from "../../helpers/assert";

/** GIVEN — tokenize to a lowercase token set. */
function tokenSet(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — lexicalOverlapScorer(query, candidate)
//
// A stand-in for a cross-encoder: return the Jaccard overlap of the query and
// candidate token sets — |intersection| / |union| (0 when the union is empty).
// (A real reranker is a trained model; the INTERFACE is identical.)
// ─────────────────────────────────────────────────────────────────────────────
function lexicalOverlapScorer(query: string, candidate: string): number {
  return 0; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — rerank(query, candidates, scorer, topK)
//
// Score every candidate with scorer(query, candidate), sort DESC (ties keep
// input order), and return the top `topK` candidates.
// ─────────────────────────────────────────────────────────────────────────────
function rerank(
  query: string,
  candidates: string[],
  scorer: (query: string, candidate: string) => number,
  topK: number
): string[] {
  return []; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — recallAtK(ranked, relevant, k)
//
// Fraction of the relevant set found within the first k of `ranked`:
// (# relevant ids in ranked.slice(0, k)) / relevant.size.
// ─────────────────────────────────────────────────────────────────────────────
function recallAtK(ranked: string[], relevant: Set<string>, k: number): number {
  return 0; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const query = "typescript generics constraints";
// retrieval order — the truly relevant doc is buried last:
const candidates = [
  "a post about python decorators",
  "cooking recipes for pasta night",
  "javascript array methods overview",
  "the history of the roman empire",
  "typescript generics and constraints explained", // relevant, at index 4
];
const relevant = new Set([candidates[4]!]);

// overlap scorer picks out the relevant candidate:
expect(lexicalOverlapScorer(query, candidates[4]!) > 0).toBe(true);
expect(lexicalOverlapScorer(query, candidates[1]!)).toBe(0); // pasta shares nothing

// before reranking, the relevant doc is outside the top 3:
expect(recallAtK(candidates, relevant, 3)).toBe(0);

// reranking floats it to the top:
const reranked = rerank(query, candidates, lexicalOverlapScorer, 3);
expect(reranked[0]).toBe(candidates[4]);
expect(recallAtK(reranked, relevant, 3)).toBe(1); // recall@3: 0 → 1

pass("03-reranking");
