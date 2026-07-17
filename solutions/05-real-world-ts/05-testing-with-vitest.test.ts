/** SOLUTION — Phase 5 · 05. Run with: npm test solutions/05-real-world-ts/05-testing-with-vitest.test.ts */
import { describe, it, expect } from "vitest";

// ── The module under test (unchanged) ───────────────────────────────────────

export type Chunk = { index: number; text: string };

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

export function mean(values: number[]): number {
  if (values.length === 0) throw new Error("mean of empty array");
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ── The tests ───────────────────────────────────────────────────────────────

describe("chunkWords", () => {
  it("splits ten words into chunks of four: 4 + 4 + 2", () => {
    const text = "one two three four five six seven eight nine ten";
    const chunks = chunkWords(text, 4);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]!.text).toBe("one two three four");
    expect(chunks[2]!.text).toBe("nine ten");
    expect(chunks.map((c) => c.index)).toEqual([0, 1, 2]);
  });

  it("returns one chunk when the text fits exactly", () => {
    const chunks = chunkWords("alpha beta gamma", 3);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({ index: 0, text: "alpha beta gamma" });
  });

  it("throws on empty and whitespace-only input", () => {
    expect(() => chunkWords("", 2)).toThrow("empty");
    expect(() => chunkWords("   ", 2)).toThrow("empty");
  });

  it("throws when maxWords is zero or negative", () => {
    expect(() => chunkWords("a b c", 0)).toThrow("maxWords");
    expect(() => chunkWords("a b c", -1)).toThrow("maxWords");
  });
});

describe("mean", () => {
  it("computes the mean of integers", () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it("handles floats with toBeCloseTo", () => {
    expect(mean([0.1, 0.2])).toBeCloseTo(0.15);
  });

  it("throws on an empty array", () => {
    expect(() => mean([])).toThrow("empty");
  });
});
