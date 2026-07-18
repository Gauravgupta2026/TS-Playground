/** SOLUTION — capstone rag.ts (drop-in for capstone/src/rag.ts). */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "@huggingface/transformers";
import type { ChunkMeta, RetrievedChunk } from "./types";

export const MAX_CHUNK_WORDS = 60;

function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("length mismatch");
  return a.reduce((sum, value, i) => sum + value * b[i]!, 0);
}

export class NotesStore {
  private entries: { id: string; vector: number[]; metadata: ChunkMeta }[] = [];

  add(id: string, vector: number[], metadata: ChunkMeta): void {
    const existing = this.entries.findIndex((e) => e.id === id);
    if (existing !== -1) this.entries[existing] = { id, vector, metadata };
    else this.entries.push({ id, vector, metadata });
  }

  get size(): number {
    return this.entries.length;
  }

  topK(query: number[], k: number): RetrievedChunk[] {
    if (k <= 0) return [];
    return this.entries
      .map((entry) => ({ id: entry.id, score: dot(query, entry.vector), metadata: entry.metadata }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

const extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "fp32" });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await extractorPromise;
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

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

export async function buildStore(docsDir: string): Promise<NotesStore> {
  const store = new NotesStore();
  const files = (await readdir(docsDir)).filter((f) => f.endsWith(".md")).sort();

  const allChunks: ChunkMeta[] = [];
  for (const file of files) {
    const text = await readFile(join(docsDir, file), "utf-8");
    chunkSentences(text, MAX_CHUNK_WORDS).forEach((chunkText, index) => {
      allChunks.push({ source: file, index, text: chunkText });
    });
  }

  const vectors = await embedTexts(allChunks.map((c) => c.text));
  allChunks.forEach((chunk, i) => {
    store.add(`${chunk.source}#${chunk.index}`, vectors[i]!, chunk);
  });
  return store;
}

export async function retrieve(store: NotesStore, query: string, k: number): Promise<RetrievedChunk[]> {
  const [queryVector] = await embedTexts([query]);
  return store.topK(queryVector!, k);
}

export function formatChunks(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "NO SOURCES FOUND";
  return chunks.map((chunk, i) => `[${i + 1}] (${chunk.metadata.source}) ${chunk.metadata.text}`).join("\n");
}
