/**
 * Phase 7 · Exercise 05 — Retrieval and citations
 *
 * Both must pass:
 *   npm run ts    phases/07-rag-pipeline/05-retrieval-and-citations.ts
 *   npm run check phases/07-rag-pipeline/05-retrieval-and-citations.ts
 *
 * Query time: embed the query → top-k → build a prompt whose numbered
 * sources the model can cite — and you can map back to real files.
 * (Deterministic fake "embeddings" here; the checkpoint uses real ones.)
 */
import { expect, pass } from "../../helpers/assert";

type Hit = { id: string; score: number; metadata: { source: string; index: number }; text: string };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — assemble the context block
//
// Implement buildContext: number the hits 1..n in the GIVEN order (they
// arrive sorted by score) and format each as:
//   [n] (source) text
// joined with newlines. Empty hits → exactly "NO SOURCES FOUND".
// ─────────────────────────────────────────────────────────────────────────────
function buildContext(hits: Hit[]): string {
  return ""; // IMPLEMENT
}

const hits: Hit[] = [
  { id: "r1", score: 0.91, metadata: { source: "notes/rag.md", index: 2 }, text: "Chunk small, cite always." },
  { id: "e0", score: 0.72, metadata: { source: "notes/evals.md", index: 0 }, text: "Recall@k measures retrieval." },
];

expect(buildContext(hits)).toBe(
  "[1] (notes/rag.md) Chunk small, cite always.\n[2] (notes/evals.md) Recall@k measures retrieval."
);
expect(buildContext([])).toBe("NO SOURCES FOUND");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — the RAG prompt
//
// Implement buildPrompt(question, hits) with EXACTLY this shape (the
// checks are strict because prompt drift is a real bug class — teams
// version their prompts like code):
//
// Answer using ONLY the sources below. Cite as [1], [2] after each claim.
// If the sources don't contain the answer, say you don't know.
//
// <context block from exercise 1>
//
// Question: <question>
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(question: string, hits2: Hit[]): string {
  return ""; // IMPLEMENT
}

const prompt = buildPrompt("How should I chunk?", hits);
expect(prompt.startsWith("Answer using ONLY the sources below.")).toBe(true);
expect(prompt.includes("[1] (notes/rag.md)")).toBe(true);
expect(prompt.endsWith("Question: How should I chunk?")).toBe(true);
expect(prompt.includes("don't know")).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — resolve citations back to sources
//
// The model answered with [n] markers. Implement extractCitations: find
// every [n] in the answer (regex /\[(\d+)\]/g), map each to its hit
// (n is 1-BASED!), dedupe, preserve first-appearance order. Unknown
// numbers ([9] when there are 2 hits) are ignored.
// Return: Array<{ marker: number; source: string }>
// ─────────────────────────────────────────────────────────────────────────────
function extractCitations(answer: string, hits3: Hit[]): Array<{ marker: number; source: string }> {
  return []; // IMPLEMENT (matchAll is your friend)
}

const answer = "Chunk small [1], and always measure recall [2]. Really, chunk small [1]. See [9].";
expect(extractCitations(answer, hits)).toEqual([
  { marker: 1, source: "notes/rag.md" },
  { marker: 2, source: "notes/evals.md" },
]);
expect(extractCitations("No citations here.", hits)).toEqual([]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — the honesty check
//
// A cheap, effective guardrail: if the model's answer contains NO valid
// citation AND retrieval found sources, flag it. Implement isGrounded:
//   - hits empty → grounded only if the answer includes "don't know"
//     (the model correctly declined)
//   - hits present → grounded only if ≥ 1 valid citation
// ─────────────────────────────────────────────────────────────────────────────
function isGrounded(answer2: string, hits4: Hit[]): boolean {
  return false; // IMPLEMENT (reuse extractCitations)
}

expect(isGrounded("Chunk small [1].", hits)).toBe(true);
expect(isGrounded("Chunking is an art form, trust me.", hits)).toBe(false); // uncited claims!
expect(isGrounded("I don't know based on the sources.", [])).toBe(true);
expect(isGrounded("The answer is definitely 42.", [])).toBe(false); // hallucinating with no sources

pass("05-retrieval-and-citations");
