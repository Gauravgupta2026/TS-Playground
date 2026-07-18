/**
 * Phase 7 · Exercise 03 — Cosine similarity, by hand
 *
 * Both must pass:
 *   npm run ts    phases/07-rag-pipeline/03-cosine-similarity.ts
 *   npm run check phases/07-rag-pipeline/03-cosine-similarity.ts
 *
 * After this file, "vector similarity search" is a for-loop you own.
 */
import { expect, pass } from "../../helpers/assert";

// Tolerant float comparison for this file:
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — dot product
// dot(a, b) = Σ aᵢ·bᵢ. Throw Error("length mismatch") if lengths differ —
// a silent zip-to-shortest here would corrupt every similarity downstream.
// ─────────────────────────────────────────────────────────────────────────────
function dot(a: number[], b: number[]): number {
  return 0; // IMPLEMENT
}

expect(close(dot([1, 2, 3], [4, 5, 6]), 32)).toBe(true);
expect(close(dot([1, 0], [0, 1]), 0)).toBe(true); // orthogonal
expect(() => dot([1, 2], [1, 2, 3])).toThrow("length mismatch");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — magnitude
// |a| = √(Σ aᵢ²)  — which is √(dot(a, a)). Reuse, don't rewrite.
// ─────────────────────────────────────────────────────────────────────────────
function magnitude(a: number[]): number {
  return 0; // IMPLEMENT
}

expect(close(magnitude([3, 4]), 5)).toBe(true);
expect(close(magnitude([1, 0, 0]), 1)).toBe(true);
expect(close(magnitude([]), 0)).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — cosine
// cos(a,b) = dot / (|a|·|b|). Edge case: EITHER magnitude 0 → return 0
// (a zero vector is "similar to nothing", and dividing by 0 gives NaN,
// which silently poisons every sort comparison after it).
// ─────────────────────────────────────────────────────────────────────────────
function cosine(a: number[], b: number[]): number {
  return 0; // IMPLEMENT
}

expect(close(cosine([1, 2], [2, 4]), 1)).toBe(true); // same direction
expect(close(cosine([1, 0], [0, 1]), 0)).toBe(true); // orthogonal
expect(close(cosine([1, 2], [-1, -2]), -1)).toBe(true); // opposite
expect(close(cosine([0, 0], [1, 2]), 0)).toBe(true); // zero-vector guard
expect(Number.isNaN(cosine([0, 0], [0, 0]))).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — normalize once, dot forever
//
// Implement normalize(a): scale to unit length (zero vector → return it
// unchanged). Then verify the claim from the LESSON: for normalized
// vectors, dot === cosine. This is why embed-time normalization matters —
// at query time you do ONE dot loop instead of three.
// ─────────────────────────────────────────────────────────────────────────────
function normalize(a: number[]): number[] {
  return a; // IMPLEMENT
}

const rawA = [3, 4];
const rawB = [5, 12];
const normA = normalize(rawA);
const normB = normalize(rawB);

expect(close(magnitude(normA), 1)).toBe(true);
expect(close(dot(normA, normB), cosine(rawA, rawB))).toBe(true); // the whole point
expect(normalize([0, 0])).toEqual([0, 0]);

pass("03-cosine-similarity");
