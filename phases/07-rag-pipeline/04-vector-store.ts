/**
 * Phase 7 · Exercise 04 — A typed in-memory vector store
 *
 * Both must pass:
 *   npm run ts    phases/07-rag-pipeline/04-vector-store.ts
 *   npm run check phases/07-rag-pipeline/04-vector-store.ts
 *
 * An array + cosine + a sort IS a vector database (minus the at-scale
 * engineering). Generic over metadata — the `K extends keyof`-style
 * thinking from Phase 4 pays off here.
 *
 * (Vectors in this file are tiny hand-made 3D ones so every expected value
 * is exact — the store neither knows nor cares about dimensionality.)
 */
import { expect, pass } from "../../helpers/assert";

type Entry<M> = { id: string; vector: number[]; metadata: M };
type Hit<M> = { id: string; score: number; metadata: M };

function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  return a.reduce((sum, value, i) => sum + value * b[i]!, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — implement VectorStore<M>
//
//   add(entry)        — store it; adding an EXISTING id replaces the entry
//                       (re-ingesting a doc must not duplicate it!)
//   size              — entry count (getter)
//   topK(query, k)    — the k most similar entries as Hit<M>, sorted by
//                       score DESCENDING (assume normalized vectors → dot).
//                       k larger than size → all entries. k ≤ 0 → [].
//   filter(predicate) — a NEW store containing only matching entries
//                       (metadata filtering — "only chunks from source X" —
//                       is a real vector-DB feature you get for free here).
// ─────────────────────────────────────────────────────────────────────────────
class VectorStore<M> {
  private entries: Entry<M>[] = [];

  add(entry: Entry<M>): void {
    // IMPLEMENT (remember the replace-on-same-id rule)
  }

  get size(): number {
    return -1; // IMPLEMENT
  }

  topK(query: number[], k: number): Hit<M>[] {
    return []; // IMPLEMENT — score all, sort desc, slice
  }

  filter(predicate: (metadata: M) => boolean): VectorStore<M> {
    return this; // IMPLEMENT — build a NEW store
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
type ChunkMeta = { source: string; index: number };
const store = new VectorStore<ChunkMeta>();

// Hand-made unit vectors: a ⟂ b, c close to a.
store.add({ id: "a0", vector: [1, 0, 0], metadata: { source: "a.md", index: 0 } });
store.add({ id: "b0", vector: [0, 1, 0], metadata: { source: "b.md", index: 0 } });
store.add({ id: "c0", vector: [0.8, 0.6, 0], metadata: { source: "c.md", index: 0 } });

expect(store.size).toBe(3);

// query along the a-axis: a0 first (score 1), c0 second (0.8), b0 last (0).
const hits = store.topK([1, 0, 0], 2);
expect(hits.length).toBe(2);
expect(hits[0]!.id).toBe("a0");
expect(hits[0]!.score).toBe(1);
expect(hits[1]!.id).toBe("c0");
expect(Math.abs(hits[1]!.score - 0.8) < 1e-9).toBe(true);

// k beyond size, k zero:
expect(store.topK([1, 0, 0], 99).length).toBe(3);
expect(store.topK([1, 0, 0], 0)).toEqual([]);

// replace-on-same-id (re-ingest):
store.add({ id: "a0", vector: [0, 0, 1], metadata: { source: "a.md", index: 0 } });
expect(store.size).toBe(3); // not 4!
expect(store.topK([0, 0, 1], 1)[0]!.id).toBe("a0");

// metadata filtering returns an independent store:
const onlyB = store.filter((meta) => meta.source === "b.md");
expect(onlyB.size).toBe(1);
expect(onlyB.topK([0, 1, 0], 5)[0]!.id).toBe("b0");
expect(store.size).toBe(3); // original untouched

// and the store is properly generic — different metadata type, same class:
const tagStore = new VectorStore<{ tags: string[] }>();
tagStore.add({ id: "x", vector: [1, 0], metadata: { tags: ["ai"] } });
expect(tagStore.topK([1, 0], 1)[0]!.metadata.tags).toEqual(["ai"]);

pass("04-vector-store");
