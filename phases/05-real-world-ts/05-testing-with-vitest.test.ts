/**
 * Phase 5 · Exercise 05 — Writing tests with vitest
 *
 * Run me with:  npm test phases/05-real-world-ts/05-testing-with-vitest.test.ts
 * (and check:   npm run check phases/05-real-world-ts/05-testing-with-vitest.test.ts)
 *
 * Role reversal: the module below WORKS — your job is to write the tests.
 * Each `it` block contains a TODO. Replace every `expect(true).toBe(false)`
 * placeholder with real assertions until the whole file is green.
 *
 * Test the CONTRACT, not the implementation: happy path, edge cases
 * (empty, boundary-exact), failure modes.
 */
import { describe, it, expect } from "vitest";

// ── The module under test (do not modify) ───────────────────────────────────

export type Chunk = { index: number; text: string };

/**
 * Splits text into chunks of at most `maxWords` words, never splitting a
 * word. Throws on empty/whitespace-only input or maxWords < 1.
 */
export function chunkWords(text: string, maxWords: number): Chunk[] {
  if (maxWords < 1) throw new Error("maxWords must be >= 1");
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) throw new Error("empty input");
  const chunks: Chunk[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push({ index: chunks.length, text: words.slice(i, i + maxWords).join(" ") });
  }
  return chunks;
}

/** Mean of an array of numbers; throws on empty input. */
export function mean(values: number[]): number {
  if (values.length === 0) throw new Error("mean of empty array");
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ── Your tests ──────────────────────────────────────────────────────────────

describe("chunkWords", () => {
  it("splits ten words into chunks of four: 4 + 4 + 2", () => {
    const text = "one two three four five six seven eight nine ten";
    // TODO: call chunkWords(text, 4) and assert:
    //  - result has length 3            (toHaveLength)
    //  - first chunk text is "one two three four"
    //  - last chunk text is "nine ten"
    //  - indexes are 0, 1, 2            (map + toEqual)
    expect(true).toBe(false);
  });

  it("returns one chunk when the text fits exactly", () => {
    // TODO: 3 words with maxWords 3 → exactly one chunk, index 0.
    // Boundary-exact cases are where off-by-one bugs live — always test them.
    expect(true).toBe(false);
  });

  it("throws on empty and whitespace-only input", () => {
    // TODO: expect(() => chunkWords("", 2)).toThrow("empty")
    // and the same for "   ". NOTE the arrow function — passing the CALL
    // (already-thrown) instead of a FUNCTION is the classic toThrow mistake.
    expect(true).toBe(false);
  });

  it("throws when maxWords is zero or negative", () => {
    // TODO
    expect(true).toBe(false);
  });
});

describe("mean", () => {
  it("computes the mean of integers", () => {
    // TODO: mean([2, 4, 6]) — safe to use toBe (exact in floating point)
    expect(true).toBe(false);
  });

  it("handles floats with toBeCloseTo", () => {
    // TODO: mean([0.1, 0.2]) is NOT 0.15000000... exactly — floating point!
    // Use toBeCloseTo(0.15). (Try toBe once to see the failure. 0.1 + 0.2
    // in binary floating point is one of programming's oldest jokes.)
    expect(true).toBe(false);
  });

  it("throws on an empty array", () => {
    // TODO
    expect(true).toBe(false);
  });
});
