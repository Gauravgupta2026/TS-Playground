/**
 * Phase 7 · Exercise 01 — Chunking
 *
 * Both must pass:
 *   npm run ts    phases/07-rag-pipeline/01-chunking.ts
 *   npm run check phases/07-rag-pipeline/01-chunking.ts
 *
 * Bad chunking is the #1 cause of bad RAG. You'll build the baseline
 * (fixed-size), feel its failure mode, then build the fix (sentence-aware
 * with overlap).
 */
import { expect, pass } from "../../helpers/assert";

export type Chunk = {
  text: string;
  source: string; // which document this came from
  index: number; // position within that document (0-based)
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — fixed-size chunking (the baseline)
//
// Implement chunkFixed: split into chunks of at most maxWords words.
// Every chunk carries source + its index. (You wrote chunkWords in Phase 5's
// vitest exercise — same skeleton, now with metadata.)
// ─────────────────────────────────────────────────────────────────────────────
function chunkFixed(text: string, source: string, maxWords: number): Chunk[] {
  return []; // IMPLEMENT
}

const doc = "RAG retrieves documents. It then generates answers. Citations build trust. Evals measure quality.";
const fixed = chunkFixed(doc, "notes.md", 5);

expect(fixed.length).toBe(3);
expect(fixed[0]).toEqual({ text: "RAG retrieves documents. It then", source: "notes.md", index: 0 });
expect(fixed[1]!.text).toBe("generates answers. Citations build trust.");
expect(fixed[2]!.text).toBe("Evals measure quality.");
// ^ look at chunk 0: it ends mid-sentence ("It then…"). That fragment
//   embeds badly and cites worse. This is the failure mode we fix next.

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — sentence splitting
//
// Implement splitSentences: split on ". ", "! ", "? " boundaries, keeping
// the punctuation with the sentence. Simplest robust approach: match with
// /[^.!?]+[.!?]+/g (runs of non-terminators followed by terminators), then
// trim each. Ignore leftover text without terminal punctuation.
// ─────────────────────────────────────────────────────────────────────────────
function splitSentences(text: string): string[] {
  return []; // IMPLEMENT
}

expect(splitSentences("One. Two! Three? Four.")).toEqual(["One.", "Two!", "Three?", "Four."]);
expect(splitSentences("Single sentence.")).toEqual(["Single sentence."]);
expect(splitSentences("")).toEqual([]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — sentence-aware chunking
//
// Implement chunkSentences: pack WHOLE sentences into chunks greedily —
// keep adding sentences while the chunk stays ≤ maxWords (a single
// too-long sentence becomes its own chunk). No sentence is ever split.
// ─────────────────────────────────────────────────────────────────────────────
function chunkSentences(text: string, source: string, maxWords: number): Chunk[] {
  return []; // IMPLEMENT (splitSentences + a greedy packer)
}

// The doc's sentences are 3, 4, 3, 3 words: greedy packing at 8 words gives
// [3+4=7][3+3=6] → two chunks, and — the point — no sentence is ever cut:
const sentenceChunks = chunkSentences(doc, "notes.md", 8);
expect(sentenceChunks.length).toBe(2);
expect(sentenceChunks[0]!.text).toBe("RAG retrieves documents. It then generates answers.");
expect(sentenceChunks[1]!.text).toBe("Citations build trust. Evals measure quality.");
expect(sentenceChunks.map((c) => c.index)).toEqual([0, 1]);

// a single over-long sentence still becomes its own chunk (never split):
const longSentence = chunkSentences("Seven words in this one long sentence.", "d.md", 3);
expect(longSentence.length).toBe(1);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — overlap
//
// Implement withOverlap: given chunks (from any chunker), prepend the last
// `overlapWords` words of chunk i-1 to chunk i (i ≥ 1). Re-index from 0.
// Overlap makes boundary-straddling ideas exist WHOLE in some chunk.
// ─────────────────────────────────────────────────────────────────────────────
function withOverlap(chunks: Chunk[], overlapWords: number): Chunk[] {
  return chunks; // IMPLEMENT
}

const overlapped = withOverlap(
  [
    { text: "alpha beta gamma delta", source: "d.md", index: 0 },
    { text: "epsilon zeta eta", source: "d.md", index: 1 },
  ],
  2
);
expect(overlapped[0]!.text).toBe("alpha beta gamma delta");
expect(overlapped[1]!.text).toBe("gamma delta epsilon zeta eta");
expect(withOverlap([], 2)).toEqual([]);

pass("01-chunking");
