/** SOLUTION — Phase 7 · 05. */
import { expect, pass } from "../../helpers/assert";

type Hit = { id: string; score: number; metadata: { source: string; index: number }; text: string };

// EXERCISE 1
function buildContext(hits: Hit[]): string {
  if (hits.length === 0) return "NO SOURCES FOUND";
  return hits.map((hit, i) => `[${i + 1}] (${hit.metadata.source}) ${hit.text}`).join("\n");
}

const hits: Hit[] = [
  { id: "r1", score: 0.91, metadata: { source: "notes/rag.md", index: 2 }, text: "Chunk small, cite always." },
  { id: "e0", score: 0.72, metadata: { source: "notes/evals.md", index: 0 }, text: "Recall@k measures retrieval." },
];

expect(buildContext(hits)).toBe(
  "[1] (notes/rag.md) Chunk small, cite always.\n[2] (notes/evals.md) Recall@k measures retrieval."
);
expect(buildContext([])).toBe("NO SOURCES FOUND");

// EXERCISE 2 — prompts are versioned artifacts; exact shape matters.
function buildPrompt(question: string, hits2: Hit[]): string {
  return (
    "Answer using ONLY the sources below. Cite as [1], [2] after each claim.\n" +
    "If the sources don't contain the answer, say you don't know.\n\n" +
    `${buildContext(hits2)}\n\n` +
    `Question: ${question}`
  );
}

const prompt = buildPrompt("How should I chunk?", hits);
expect(prompt.startsWith("Answer using ONLY the sources below.")).toBe(true);
expect(prompt.includes("[1] (notes/rag.md)")).toBe(true);
expect(prompt.endsWith("Question: How should I chunk?")).toBe(true);
expect(prompt.includes("don't know")).toBe(true);

// EXERCISE 3 — matchAll, 1-based markers, dedupe in first-seen order.
function extractCitations(answer: string, hits3: Hit[]): Array<{ marker: number; source: string }> {
  const seen = new Set<number>();
  const citations: Array<{ marker: number; source: string }> = [];
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    const marker = Number(match[1]);
    const hit = hits3[marker - 1];
    if (hit && !seen.has(marker)) {
      seen.add(marker);
      citations.push({ marker, source: hit.metadata.source });
    }
  }
  return citations;
}

const answer = "Chunk small [1], and always measure recall [2]. Really, chunk small [1]. See [9].";
expect(extractCitations(answer, hits)).toEqual([
  { marker: 1, source: "notes/rag.md" },
  { marker: 2, source: "notes/evals.md" },
]);
expect(extractCitations("No citations here.", hits)).toEqual([]);

// EXERCISE 4 — cheap guardrail against confident, uncited answers.
function isGrounded(answer2: string, hits4: Hit[]): boolean {
  if (hits4.length === 0) return answer2.includes("don't know");
  return extractCitations(answer2, hits4).length > 0;
}

expect(isGrounded("Chunk small [1].", hits)).toBe(true);
expect(isGrounded("Chunking is an art form, trust me.", hits)).toBe(false);
expect(isGrounded("I don't know based on the sources.", [])).toBe(true);
expect(isGrounded("The answer is definitely 42.", [])).toBe(false);

pass("05-retrieval-and-citations (solution)");
