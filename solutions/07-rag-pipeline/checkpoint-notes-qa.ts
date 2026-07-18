/** SOLUTION — Phase 7 · checkpoint. The full pipeline, assembled. */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";
import { expect, pass } from "../../helpers/assert";

// Solutions live in solutions/, but the docs stay with the exercise:
const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../phases/07-rag-pipeline/docs");

const MAX_CHUNK_WORDS = 60;

type ChunkMeta = { source: string; index: number; text: string };
type Hit = { id: string; score: number; metadata: ChunkMeta };

// ── from 01 ─────────────────────────────────────────────────────────────────
function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+/g) ?? []).map((s) => s.trim());
}

function chunkSentences(text: string, maxWords: number): string[] {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;
  const flush = () => {
    if (current.length > 0) {
      chunks.push(current.join(" "));
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

// ── from 02 ─────────────────────────────────────────────────────────────────
const extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "fp32" });

async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await extractorPromise;
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

// ── from 03/04 ──────────────────────────────────────────────────────────────
function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  return a.reduce((sum, value, i) => sum + value * b[i]!, 0);
}

class VectorStore {
  private entries: { id: string; vector: number[]; metadata: ChunkMeta }[] = [];

  add(entry: { id: string; vector: number[]; metadata: ChunkMeta }): void {
    const existing = this.entries.findIndex((e) => e.id === entry.id);
    if (existing !== -1) this.entries[existing] = entry;
    else this.entries.push(entry);
  }

  get size(): number {
    return this.entries.length;
  }

  topK(query: number[], k: number): Hit[] {
    if (k <= 0) return [];
    return this.entries
      .map((entry) => ({ id: entry.id, score: dot(query, entry.vector), metadata: entry.metadata }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

// ── from 05 ─────────────────────────────────────────────────────────────────
function buildContext(hits: Hit[]): string {
  if (hits.length === 0) return "NO SOURCES FOUND";
  return hits.map((hit, i) => `[${i + 1}] (${hit.metadata.source}) ${hit.metadata.text}`).join("\n");
}

function buildPrompt(question: string, hits: Hit[]): string {
  return (
    "Answer using ONLY the sources below. Cite as [1], [2] after each claim.\n" +
    "If the sources don't contain the answer, say you don't know.\n\n" +
    `${buildContext(hits)}\n\n` +
    `Question: ${question}`
  );
}

// ── The assembly ────────────────────────────────────────────────────────────
async function ingest(dir: string): Promise<VectorStore> {
  const store = new VectorStore();
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();

  // Collect all chunks first so embedding happens in ONE batched call.
  const allChunks: ChunkMeta[] = [];
  for (const file of files) {
    const text = await readFile(join(dir, file), "utf-8");
    chunkSentences(text, MAX_CHUNK_WORDS).forEach((chunkText, index) => {
      allChunks.push({ source: file, index, text: chunkText });
    });
  }

  const vectors = await embedTexts(allChunks.map((c) => c.text));
  allChunks.forEach((chunk, i) => {
    store.add({ id: `${chunk.source}#${chunk.index}`, vector: vectors[i]!, metadata: chunk });
  });
  return store;
}

async function ask(store: VectorStore, question: string, k: number): Promise<{ hits: Hit[]; prompt: string }> {
  const [queryVector] = await embedTexts([question]);
  const hits = store.topK(queryVector!, k);
  return { hits, prompt: buildPrompt(question, hits) };
}

// ── The spec ────────────────────────────────────────────────────────────────
const store = await ingest(DOCS_DIR);
expect(store.size >= 4).toBe(true);

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
  expect(hits[0]!.score >= hits[1]!.score && hits[1]!.score >= hits[2]!.score).toBe(true);
  expect(prompt.includes(`(${expectedSource})`)).toBe(true);
  expect(prompt.endsWith(`Question: ${question}`)).toBe(true);
}

pass("checkpoint-notes-qa (solution)");
