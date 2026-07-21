/**
 * Phase 12 · Exercise 01 — The attention budget
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/12-context-engineering/01-context-budget.ts
 *   npm run check phases/12-context-engineering/01-context-budget.ts
 *
 * Context is a budget, not a bucket. Every block competes for the model's
 * finite attention. You assemble a request by keeping the ESSENTIALS pinned
 * and spending the rest of the budget on the highest-priority blocks, dropping
 * the marginal ones. This assembler is the beating heart of every agent loop.
 */
import { expect, pass } from "../../helpers/assert";

/** GIVEN — cheap deterministic token estimate (~4 chars/token, the usual rule of thumb). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

type Block = {
  id: string;
  content: string;
  /** Higher = keep first. */
  priority: number;
  /** Pinned blocks are NEVER dropped (system prompt, task, live instructions). */
  pinned?: boolean;
};

type Assembled = {
  /** Pinned blocks (in input order), then selected blocks (priority desc). */
  blocks: Block[];
  tokens: number;
  droppedIds: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — assembleContext(blocks, budgetTokens)
//
//   1. Pinned blocks are always included. If their tokens alone exceed the
//      budget → throw Error("pinned content exceeds budget") (you must
//      guarantee room for the essentials).
//   2. Fill the REMAINING budget with non-pinned blocks in priority order
//      (highest first; ties keep input order). GREEDILY skip any block that
//      doesn't fit — but keep going: a smaller lower-priority block may still
//      fit after a big one is skipped.
//   3. Return { blocks: [...pinned in input order, ...selected in priority
//      order], tokens: total, droppedIds: non-selected non-pinned in input order }.
// ─────────────────────────────────────────────────────────────────────────────
function assembleContext(blocks: Block[], budgetTokens: number): Assembled {
  return { blocks: [], tokens: 0, droppedIds: [] }; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
// helper: content that costs exactly n tokens (n*4 chars).
const tok = (n: number) => "x".repeat(n * 4);

const blocks: Block[] = [
  { id: "system", content: tok(10), priority: 0, pinned: true },
  { id: "memory", content: tok(5), priority: 0, pinned: true },
  { id: "docA", content: tok(20), priority: 5 },
  { id: "docB", content: tok(20), priority: 3 },
  { id: "small", content: tok(4), priority: 2 },
  { id: "docC", content: tok(20), priority: 1 },
];

// budget 40: pinned = 15, remaining 25. docA(20) fits → 5 left. docB(20) skip.
// small(4) fits → 1 left. docC(20) skip.
const r = assembleContext(blocks, 40);
expect(r.blocks.map((b) => b.id)).toEqual(["system", "memory", "docA", "small"]);
expect(r.tokens).toBe(39); // 10 + 5 + 20 + 4
expect(r.droppedIds).toEqual(["docB", "docC"]);

// a generous budget keeps everything, still pinned-first then priority order:
const all = assembleContext(blocks, 1000);
expect(all.blocks.map((b) => b.id)).toEqual(["system", "memory", "docA", "docB", "small", "docC"]);
expect(all.droppedIds).toEqual([]);

// a tiny budget keeps only the pinned essentials:
const tight = assembleContext(blocks, 15);
expect(tight.blocks.map((b) => b.id)).toEqual(["system", "memory"]);
expect(tight.droppedIds).toEqual(["docA", "docB", "small", "docC"]);

// pinned content that can't fit is a hard error, not a silent drop:
expect(() => assembleContext(blocks, 10)).toThrow("pinned content exceeds budget");

pass("01-context-budget");
