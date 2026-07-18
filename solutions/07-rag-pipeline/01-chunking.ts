/** SOLUTION — Phase 7 · 01. */
import { expect, pass } from "../../helpers/assert";

export type Chunk = {
  text: string;
  source: string;
  index: number;
};

// EXERCISE 1 — fixed-size baseline; note how it cuts sentences.
function chunkFixed(text: string, source: string, maxWords: number): Chunk[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: Chunk[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push({ text: words.slice(i, i + maxWords).join(" "), source, index: chunks.length });
  }
  return chunks;
}

const doc = "RAG retrieves documents. It then generates answers. Citations build trust. Evals measure quality.";
const fixed = chunkFixed(doc, "notes.md", 5);
expect(fixed.length).toBe(3);
expect(fixed[0]).toEqual({ text: "RAG retrieves documents. It then", source: "notes.md", index: 0 });
expect(fixed[1]!.text).toBe("generates answers. Citations build trust.");
expect(fixed[2]!.text).toBe("Evals measure quality.");

// EXERCISE 2 — keep terminators with their sentence.
function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+/g) ?? []).map((s) => s.trim());
}

expect(splitSentences("One. Two! Three? Four.")).toEqual(["One.", "Two!", "Three?", "Four."]);
expect(splitSentences("Single sentence.")).toEqual(["Single sentence."]);
expect(splitSentences("")).toEqual([]);

// EXERCISE 3 — greedy packing of whole sentences.
function chunkSentences(text: string, source: string, maxWords: number): Chunk[] {
  const sentences = splitSentences(text);
  const chunks: Chunk[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const flush = () => {
    if (current.length > 0) {
      chunks.push({ text: current.join(" "), source, index: chunks.length });
      current = [];
      currentWords = 0;
    }
  };

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (currentWords + words > maxWords && current.length > 0) flush();
    current.push(sentence);
    currentWords += words;
  }
  flush();
  return chunks;
}

const sentenceChunks = chunkSentences(doc, "notes.md", 8);
expect(sentenceChunks.length).toBe(2);
expect(sentenceChunks[0]!.text).toBe("RAG retrieves documents. It then generates answers.");
expect(sentenceChunks[1]!.text).toBe("Citations build trust. Evals measure quality.");
expect(sentenceChunks.map((c) => c.index)).toEqual([0, 1]);

const longSentence = chunkSentences("Seven words in this one long sentence.", "d.md", 3);
expect(longSentence.length).toBe(1);

// EXERCISE 4 — tail of the previous chunk prefixed to the next.
function withOverlap(chunks: Chunk[], overlapWords: number): Chunk[] {
  return chunks.map((chunk, i) => {
    if (i === 0) return { ...chunk, index: 0 };
    const previousTail = chunks[i - 1]!.text.split(/\s+/).slice(-overlapWords).join(" ");
    return { text: `${previousTail} ${chunk.text}`, source: chunk.source, index: i };
  });
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

pass("01-chunking (solution)");
