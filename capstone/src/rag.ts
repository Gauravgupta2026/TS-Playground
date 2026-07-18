/**
 * RAG module — YOU IMPLEMENT (your Phase 7 pipeline, project-shaped).
 *
 * SPEC:
 *  NotesStore — vector store over ChunkMeta:
 *    add(id, vector, metadata)   replace-on-same-id
 *    size                        entry count
 *    topK(query, k)              RetrievedChunk[], score desc (dot product —
 *                                vectors are normalized)
 *
 *  embedTexts(texts)             Xenova/all-MiniLM-L6-v2, mean pooling,
 *                                normalized, extractor created ONCE
 *
 *  buildStore(docsDir)           read every .md (sorted), sentence-aware
 *                                chunks ≤ MAX_CHUNK_WORDS, embed ALL chunks
 *                                in one batched call, ids `${file}#${i}`
 *
 *  retrieve(store, query, k)     embed query → store.topK
 *
 *  formatChunks(chunks)          "[1] (source.md) text" lines joined by \n;
 *                                empty → "NO SOURCES FOUND"
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "@huggingface/transformers";
import type { ChunkMeta, RetrievedChunk } from "./types";

export const MAX_CHUNK_WORDS = 60;

export class NotesStore {
  add(id: string, vector: number[], metadata: ChunkMeta): void {
    // IMPLEMENT
  }

  get size(): number {
    return 0; // IMPLEMENT
  }

  topK(query: number[], k: number): RetrievedChunk[] {
    return []; // IMPLEMENT
  }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  return []; // IMPLEMENT
}

export async function buildStore(docsDir: string): Promise<NotesStore> {
  return new NotesStore(); // IMPLEMENT
}

export async function retrieve(store: NotesStore, query: string, k: number): Promise<RetrievedChunk[]> {
  return []; // IMPLEMENT
}

export function formatChunks(chunks: RetrievedChunk[]): string {
  return ""; // IMPLEMENT
}
