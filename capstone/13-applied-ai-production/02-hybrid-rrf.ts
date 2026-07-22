/**
 * Phase 13 · Exercise 02 — Hybrid search with Reciprocal Rank Fusion
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/13-applied-ai-production/02-hybrid-rrf.ts
 *   npm run check phases/13-applied-ai-production/02-hybrid-rrf.ts
 *
 * Semantic search grasps meaning but fumbles exact tokens (names, IDs, error
 * codes); BM25 nails tokens but misses paraphrases. Run BOTH and merge by RANK,
 * not by score — Reciprocal Rank Fusion needs no score calibration between the
 * two systems, which is why it's the industry default for hybrid retrieval.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — reciprocalRankFusion(rankings, k=60)
//
//   `rankings` is a list of ranked id-lists (best first), one per retriever.
//   Each id's fused score = Σ over the lists it appears in of 1 / (k + rank),
//   where rank is its 0-based index in that list. Ids missing from a list
//   contribute nothing from it. Return { id, score } for every id that appears
//   in at least one list, sorted by score DESC (ties → id ascending, for
//   determinism).
// ─────────────────────────────────────────────────────────────────────────────
function reciprocalRankFusion(rankings: string[][], k = 60): Array<{ id: string; score: number }> {
  return []; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — hybridSearch(bm25Ranking, vectorRanking, k=60)
//
// Convenience wrapper: fuse the two rankings and return just the fused ids
// (best first).
// ─────────────────────────────────────────────────────────────────────────────
function hybridSearch(bm25Ranking: string[], vectorRanking: string[], k = 60): string[] {
  return []; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const bm25 = ["d1", "d2", "d3"]; // keyword search order
const vector = ["d2", "d3", "d4"]; // semantic search order

const fused = reciprocalRankFusion([bm25, vector], 60);

// d2 is ranked highly by BOTH → it wins.
expect(fused[0]!.id).toBe("d2");
// every id from either list is represented.
expect(fused.map((f) => f.id).slice().sort()).toEqual(["d1", "d2", "d3", "d4"]);

// d1 (only bm25, rank 0) beats d4 (only vector, rank 2): a top hit in one list
// outranks a low hit in the other.
const order = fused.map((f) => f.id);
expect(order.indexOf("d1") < order.indexOf("d4")).toBe(true);

// exact score check for d2: 1/(60+1) [bm25 rank 1] + 1/(60+0) [vector rank 0].
const d2 = fused.find((f) => f.id === "d2")!;
expect(d2.score).toBe(1 / 61 + 1 / 60);

// the convenience wrapper returns fused ids, best first.
expect(hybridSearch(bm25, vector)[0]).toBe("d2");

pass("02-hybrid-rrf");
