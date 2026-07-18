/** SOLUTION — Phase 7 · 03. */
import { expect, pass } from "../../helpers/assert";

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// EXERCISE 1
function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  return a.reduce((sum, value, i) => sum + value * b[i]!, 0);
}
expect(close(dot([1, 2, 3], [4, 5, 6]), 32)).toBe(true);
expect(close(dot([1, 0], [0, 1]), 0)).toBe(true);
expect(() => dot([1, 2], [1, 2, 3])).toThrow("length mismatch");

// EXERCISE 2 — √(a·a); reuse.
function magnitude(a: number[]): number {
  return Math.sqrt(dot(a, a));
}
expect(close(magnitude([3, 4]), 5)).toBe(true);
expect(close(magnitude([1, 0, 0]), 1)).toBe(true);
expect(close(magnitude([]), 0)).toBe(true);

// EXERCISE 3 — the zero-vector guard keeps NaN out of the pipeline.
function cosine(a: number[], b: number[]): number {
  const magProduct = magnitude(a) * magnitude(b);
  if (magProduct === 0) return 0;
  return dot(a, b) / magProduct;
}
expect(close(cosine([1, 2], [2, 4]), 1)).toBe(true);
expect(close(cosine([1, 0], [0, 1]), 0)).toBe(true);
expect(close(cosine([1, 2], [-1, -2]), -1)).toBe(true);
expect(close(cosine([0, 0], [1, 2]), 0)).toBe(true);
expect(Number.isNaN(cosine([0, 0], [0, 0]))).toBe(false);

// EXERCISE 4 — normalize once at embed time; dot IS cosine afterwards.
function normalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0) return a;
  return a.map((value) => value / mag);
}

const rawA = [3, 4];
const rawB = [5, 12];
const normA = normalize(rawA);
const normB = normalize(rawB);
expect(close(magnitude(normA), 1)).toBe(true);
expect(close(dot(normA, normB), cosine(rawA, rawB))).toBe(true);
expect(normalize([0, 0])).toEqual([0, 0]);

pass("03-cosine-similarity (solution)");
