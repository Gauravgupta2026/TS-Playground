/** SOLUTION — Phase 12 · 01. */
import { expect, pass } from "../../helpers/assert";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

type Block = { id: string; content: string; priority: number; pinned?: boolean };
type Assembled = { blocks: Block[]; tokens: number; droppedIds: string[] };

function assembleContext(blocks: Block[], budgetTokens: number): Assembled {
  const pinned = blocks.filter((b) => b.pinned);
  const optional = blocks.filter((b) => !b.pinned);

  const base = pinned.reduce((sum, b) => sum + estimateTokens(b.content), 0);
  if (base > budgetTokens) throw new Error("pinned content exceeds budget");

  // Highest priority first; ties keep input order (stable sort with index tiebreak).
  const ranked = optional
    .map((b, i) => ({ b, i }))
    .sort((x, y) => y.b.priority - x.b.priority || x.i - y.i)
    .map((x) => x.b);

  let remaining = budgetTokens - base;
  const selected: Block[] = [];
  const selectedIds = new Set<string>();
  for (const b of ranked) {
    const cost = estimateTokens(b.content);
    if (cost <= remaining) {
      selected.push(b);
      selectedIds.add(b.id);
      remaining -= cost;
    }
    // else: skip, but keep scanning — a smaller block may still fit.
  }

  const chosen = [...pinned, ...selected];
  return {
    blocks: chosen,
    tokens: chosen.reduce((sum, b) => sum + estimateTokens(b.content), 0),
    droppedIds: optional.filter((b) => !selectedIds.has(b.id)).map((b) => b.id),
  };
}

// ── The spec ────────────────────────────────────────────────────────────────
const tok = (n: number) => "x".repeat(n * 4);

const blocks: Block[] = [
  { id: "system", content: tok(10), priority: 0, pinned: true },
  { id: "memory", content: tok(5), priority: 0, pinned: true },
  { id: "docA", content: tok(20), priority: 5 },
  { id: "docB", content: tok(20), priority: 3 },
  { id: "small", content: tok(4), priority: 2 },
  { id: "docC", content: tok(20), priority: 1 },
];

const r = assembleContext(blocks, 40);
expect(r.blocks.map((b) => b.id)).toEqual(["system", "memory", "docA", "small"]);
expect(r.tokens).toBe(39);
expect(r.droppedIds).toEqual(["docB", "docC"]);

const all = assembleContext(blocks, 1000);
expect(all.blocks.map((b) => b.id)).toEqual(["system", "memory", "docA", "docB", "small", "docC"]);
expect(all.droppedIds).toEqual([]);

const tight = assembleContext(blocks, 15);
expect(tight.blocks.map((b) => b.id)).toEqual(["system", "memory"]);
expect(tight.droppedIds).toEqual(["docA", "docB", "small", "docC"]);

expect(() => assembleContext(blocks, 10)).toThrow("pinned content exceeds budget");

pass("01-context-budget (solution)");
