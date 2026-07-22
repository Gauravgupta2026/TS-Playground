/** SOLUTION — Phase 13 · 03. */
import { expect, pass } from "../../helpers/assert";

function tokenSet(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function lexicalOverlapScorer(query: string, candidate: string): number {
  const q = tokenSet(query);
  const c = tokenSet(candidate);
  const intersection = [...q].filter((t) => c.has(t)).length;
  const union = new Set([...q, ...c]).size;
  return union === 0 ? 0 : intersection / union;
}

function rerank(
  query: string,
  candidates: string[],
  scorer: (query: string, candidate: string) => number,
  topK: number
): string[] {
  return candidates
    .map((candidate, i) => ({ candidate, i, score: scorer(query, candidate) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, topK)
    .map((x) => x.candidate);
}

function recallAtK(ranked: string[], relevant: Set<string>, k: number): number {
  const found = ranked.slice(0, k).filter((id) => relevant.has(id)).length;
  return found / relevant.size;
}

// ── The spec ────────────────────────────────────────────────────────────────
const query = "typescript generics constraints";
const candidates = [
  "a post about python decorators",
  "cooking recipes for pasta night",
  "javascript array methods overview",
  "the history of the roman empire",
  "typescript generics and constraints explained",
];
const relevant = new Set([candidates[4]!]);

expect(lexicalOverlapScorer(query, candidates[4]!) > 0).toBe(true);
expect(lexicalOverlapScorer(query, candidates[1]!)).toBe(0);

expect(recallAtK(candidates, relevant, 3)).toBe(0);

const reranked = rerank(query, candidates, lexicalOverlapScorer, 3);
expect(reranked[0]).toBe(candidates[4]);
expect(recallAtK(reranked, relevant, 3)).toBe(1);

pass("03-reranking (solution)");
