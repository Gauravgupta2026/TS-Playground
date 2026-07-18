/**
 * Phase 7 · CHECKPOINT — Q&A over your notes, end to end
 *
 * Both must pass (local embeddings — no API key; first run may take ~20s):
 *   npm run ts    phases/07-rag-pipeline/checkpoint-notes-qa.ts
 *   npm run check phases/07-rag-pipeline/checkpoint-notes-qa.ts
 *
 * Wire the whole pipeline over the four markdown files in ./docs:
 *
 *   ingest(dir):  read every .md file → chunk (sentence-aware, ≤ 60 words)
 *                 → embed all chunks in ONE batched call → VectorStore
 *   ask(store, question, k): embed the question → topK → return
 *                 { hits, prompt } with the citation prompt from file 05
 *
 * You've written every piece already — this checkpoint is assembly. Reuse
 * your own solutions (retype them from memory; that's the retention rep).
 *
 * SPEC DETAILS:
 *   - chunk ids: `${filename}#${index}` (e.g. "rag.md#0")
 *   - metadata: { source: filename, index }
 *   - store text alongside metadata (add it to your metadata type)
 *   - retrieval quality gate at the bottom: the RIGHT doc must be the TOP
 *     hit for all four topical questions. If one misses, don't tweak the
 *     checks — debug like it's production: print the top-3 with scores,
 *     look at WHICH chunk won, adjust chunking (size/overlap), re-run.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";
import { expect, pass } from "../../helpers/assert";

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), "docs");

// ── Bring your pieces (reimplement from your files 01-05) ───────────────────

type ChunkMeta = { source: string; index: number; text: string };
type Hit = { id: string; score: number; metadata: ChunkMeta };

function splitSentences(text: string): string[] {
  return []; // from 01
}

function chunkSentences(text: string, maxWords: number): string[] {
  return []; // from 01 (text-only variant is fine here)
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  return []; // from 02 (pipeline + mean pooling + normalize, cached extractor)
}

class VectorStore {
  add(entry: { id: string; vector: number[]; metadata: ChunkMeta }): void {
    // from 04
  }
  get size(): number {
    return -1;
  }
  topK(query: number[], k: number): Hit[] {
    return [];
  }
}

function buildPrompt(question: string, hits: Hit[]): string {
  return ""; // from 05 (use metadata.text as the chunk text)
}

// ── The assembly (implement these two) ──────────────────────────────────────

async function ingest(dir: string): Promise<VectorStore> {
  return new VectorStore(); // IMPLEMENT
}

async function ask(store: VectorStore, question: string, k: number): Promise<{ hits: Hit[]; prompt: string }> {
  return { hits: [], prompt: "" }; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const store = await ingest(DOCS_DIR);
expect(store.size >= 4).toBe(true); // at least one chunk per doc

// The retrieval quality gate — right doc on top for each topical question:
const questions: Array<[string, string]> = [
  ["How should I chunk documents for retrieval?", "rag.md"],
  ["How does an agent decide to call a tool?", "agents.md"],
  ["How quickly does money move between bank accounts?", "upi.md"],
  ["Which metrics measure whether the right document was found?", "evals.md"],
];

for (const [question, expectedSource] of questions) {
  const { hits, prompt } = await ask(store, question, 3);
  expect(hits.length).toBe(3);
  expect(hits[0]!.metadata.source).toBe(expectedSource);
  // scores are sorted descending:
  expect(hits[0]!.score >= hits[1]!.score && hits[1]!.score >= hits[2]!.score).toBe(true);
  // the prompt is ready for a model:
  expect(prompt.includes(`(${expectedSource})`)).toBe(true);
  expect(prompt.endsWith(`Question: ${question}`)).toBe(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// GOING LIVE (optional): feed `prompt` to the Phase 6 client —
//   const msg = await client.messages.create({ model: "claude-sonnet-5",
//     max_tokens: 400, messages: [{ role: "user", content: prompt }] });
// — and you have cited Q&A over your own notes. That's a real product.
// ─────────────────────────────────────────────────────────────────────────────

pass("checkpoint-notes-qa — Phase 7 complete! Multi-agent systems next.");
