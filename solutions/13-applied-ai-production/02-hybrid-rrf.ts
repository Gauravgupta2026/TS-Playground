/** SOLUTION — Phase 13 · 02. */
import { expect, pass } from "../../helpers/assert";

function reciprocalRankFusion(rankings: string[][], k = 60): Array<{ id: string; score: number }> {
  const scores = new Map<string, number>();
  for (const list of rankings) {
    list.forEach((id, rank) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank));
    });
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function hybridSearch(bm25Ranking: string[], vectorRanking: string[], k = 60): string[] {
  return reciprocalRankFusion([bm25Ranking, vectorRanking], k).map((r) => r.id);
}

// ── The spec ────────────────────────────────────────────────────────────────
const bm25 = ["d1", "d2", "d3"];
const vector = ["d2", "d3", "d4"];

const fused = reciprocalRankFusion([bm25, vector], 60);

expect(fused[0]!.id).toBe("d2");
expect(fused.map((f) => f.id).slice().sort()).toEqual(["d1", "d2", "d3", "d4"]);

const order = fused.map((f) => f.id);
expect(order.indexOf("d1") < order.indexOf("d4")).toBe(true);

const d2 = fused.find((f) => f.id === "d2")!;
expect(d2.score).toBe(1 / 61 + 1 / 60);

expect(hybridSearch(bm25, vector)[0]).toBe("d2");

pass("02-hybrid-rrf (solution)");
