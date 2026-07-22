/**
 * Phase 13 · Exercise 01 — Contextual retrieval (BM25 + contextual chunks)
 *
 * Both must pass (no API key needed):
 *   npm run ts    capstone/13-applied-ai-production/01-contextual-retrieval.ts
 *   npm run check capstone/13-applied-ai-production/01-contextual-retrieval.ts
 *
 * A chunk embedded ALONE loses its subject: "It grew 3% that quarter" doesn't
 * know it's about ACME revenue. You'll build BM25 by hand, then show the fix —
 * prepend a model-generated context blurb so the chunk gains the exact
 * vocabulary retrieval needs. Anthropic measured a 49% drop in retrieval
 * failures from this.
 */
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

/** GIVEN — tokenize to lowercase word tokens. */
function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — BM25
//
//   constructor(docs, k1=1.5, b=0.75): docs is an array of TOKENIZED documents.
//     Precompute document frequency df(term) and average doc length.
//   idf(term) = ln(1 + (N - df + 0.5) / (df + 0.5))   [smoothed; stays >= 0]
//   score(queryTerms, docIndex) = Σ over query terms of
//       idf(t) * ( f * (k1+1) ) / ( f + k1 * (1 - b + b * docLen/avgdl) )
//     where f = frequency of t in that doc. A term absent from the doc adds 0.
//   rank(queryTerms) = doc indices sorted by score DESC (ties keep index order).
// ─────────────────────────────────────────────────────────────────────────────
class BM25 {
  constructor(docs: string[][], k1 = 1.5, b = 0.75) {
    // IMPLEMENT
  }

  idf(term: string): number {
    return 0; // IMPLEMENT
  }

  score(queryTerms: string[], docIndex: number): number {
    return 0; // IMPLEMENT
  }

  rank(queryTerms: string[]): number[] {
    return []; // IMPLEMENT
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — contextualizeChunk(client, fullDoc, chunk)
//
// Ask the client for a short blurb situating `chunk` within `fullDoc`
// (system optional; user message includes both). Return
// `${context}\n\n${chunk}` — the blurb PLUS the original chunk. This is what
// you'd embed and BM25-index instead of the bare chunk.
// ─────────────────────────────────────────────────────────────────────────────
async function contextualizeChunk(client: ModelClient, fullDoc: string, chunk: string): Promise<string> {
  return chunk; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
// basic BM25 sanity: a doc containing the query term outranks one that doesn't.
const corpus = [
  tokenize("the cat sat on the mat"),
  tokenize("dogs are loyal companions"),
  tokenize("the cat chased the mouse"),
];
const bm = new BM25(corpus);
const catQuery = tokenize("cat");
const ranked = bm.rank(catQuery);
expect(ranked[0] === 0 || ranked[0] === 2).toBe(true); // a "cat" doc is first
expect(bm.score(catQuery, 1)).toBe(0); // the dog doc shares no query terms

// the contextual-retrieval payoff: a chunk with none of the query's words is
// UNRETRIEVABLE by BM25 — until we prepend context that adds the vocabulary.
const rawChunk = "It grew by 3 percent that quarter.";
const unrelated = "The weather was mild throughout the spring.";
const query = tokenize("acme revenue growth");

const rawIndex = new BM25([tokenize(rawChunk), tokenize(unrelated)]);
expect(rawIndex.score(query, 0)).toBe(0); // raw chunk shares no query terms → invisible

const ctx = makeScriptedClient([
  fakeMessage("This excerpt is from ACME Corp's Q3 revenue report, describing growth."),
]);
const contextualized = await contextualizeChunk(ctx.client, "ACME Q3 report ...", rawChunk);
expect(contextualized.includes(rawChunk)).toBe(true); // original chunk preserved

const ctxIndex = new BM25([tokenize(contextualized), tokenize(unrelated)]);
expect(ctxIndex.score(query, 0) > 0).toBe(true); // now it matches!
expect(ctxIndex.rank(query)[0]).toBe(0); // …and ranks first

pass("01-contextual-retrieval");
