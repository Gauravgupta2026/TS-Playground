/** SOLUTION — Phase 7 · 04. */
import { expect, pass } from "../../helpers/assert";

type Entry<M> = { id: string; vector: number[]; metadata: M };
type Hit<M> = { id: string; score: number; metadata: M };

function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  return a.reduce((sum, value, i) => sum + value * b[i]!, 0);
}

class VectorStore<M> {
  private entries: Entry<M>[] = [];

  add(entry: Entry<M>): void {
    const existing = this.entries.findIndex((e) => e.id === entry.id);
    if (existing !== -1) this.entries[existing] = entry;
    else this.entries.push(entry);
  }

  get size(): number {
    return this.entries.length;
  }

  topK(query: number[], k: number): Hit<M>[] {
    if (k <= 0) return [];
    return this.entries
      .map((entry) => ({ id: entry.id, score: dot(query, entry.vector), metadata: entry.metadata }))
      .sort((a, b) => b.score - a.score) // descending — the classic slip is a - b
      .slice(0, k);
  }

  filter(predicate: (metadata: M) => boolean): VectorStore<M> {
    const next = new VectorStore<M>();
    for (const entry of this.entries) {
      if (predicate(entry.metadata)) next.add(entry);
    }
    return next;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
type ChunkMeta = { source: string; index: number };
const store = new VectorStore<ChunkMeta>();

store.add({ id: "a0", vector: [1, 0, 0], metadata: { source: "a.md", index: 0 } });
store.add({ id: "b0", vector: [0, 1, 0], metadata: { source: "b.md", index: 0 } });
store.add({ id: "c0", vector: [0.8, 0.6, 0], metadata: { source: "c.md", index: 0 } });

expect(store.size).toBe(3);

const hits = store.topK([1, 0, 0], 2);
expect(hits.length).toBe(2);
expect(hits[0]!.id).toBe("a0");
expect(hits[0]!.score).toBe(1);
expect(hits[1]!.id).toBe("c0");
expect(Math.abs(hits[1]!.score - 0.8) < 1e-9).toBe(true);

expect(store.topK([1, 0, 0], 99).length).toBe(3);
expect(store.topK([1, 0, 0], 0)).toEqual([]);

store.add({ id: "a0", vector: [0, 0, 1], metadata: { source: "a.md", index: 0 } });
expect(store.size).toBe(3);
expect(store.topK([0, 0, 1], 1)[0]!.id).toBe("a0");

const onlyB = store.filter((meta) => meta.source === "b.md");
expect(onlyB.size).toBe(1);
expect(onlyB.topK([0, 1, 0], 5)[0]!.id).toBe("b0");
expect(store.size).toBe(3);

const tagStore = new VectorStore<{ tags: string[] }>();
tagStore.add({ id: "x", vector: [1, 0], metadata: { tags: ["ai"] } });
expect(tagStore.topK([1, 0], 1)[0]!.metadata.tags).toEqual(["ai"]);

pass("04-vector-store (solution)");
