/**
 * Phase 7 · Exercise 02 — Embeddings, locally
 *
 * Both must pass (first run downloads a ~25MB model, then it's cached):
 *   npm run ts    phases/07-rag-pipeline/02-embeddings.ts
 *   npm run check phases/07-rag-pipeline/02-embeddings.ts
 *
 * Text in, vector out — such that MEANING determines position. This is the
 * component that makes RAG beat keyword search.
 */
import { pipeline } from "@huggingface/transformers";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — build the embedder
//
// Implement embedTexts using the feature-extraction pipeline:
//   1. const extractor = await pipeline("feature-extraction",
//        "Xenova/all-MiniLM-L6-v2", { dtype: "fp32" });
//      (create it ONCE at module level, not per call — model loading is the
//      expensive part; this is the once() pattern from Phase 1!)
//   2. const output = await extractor(texts, { pooling: "mean", normalize: true });
//      pooling "mean": one vector per TEXT instead of per token.
//      normalize true: unit length, so cosine === dot product later.
//   3. return output.tolist() as number[][];
// ─────────────────────────────────────────────────────────────────────────────
async function embedTexts(texts: string[]): Promise<number[][]> {
  return texts.map(() => []); // IMPLEMENT
}

const vectors = await embedTexts(["hello world", "namaste duniya"]);
expect(vectors.length).toBe(2);
expect(vectors[0]!.length).toBe(384); // MiniLM-L6 output dimensions

// normalized → magnitude ≈ 1
const magnitude = Math.sqrt(vectors[0]!.reduce((s, v) => s + v * v, 0));
expect(Math.abs(magnitude - 1) < 0.01).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — feel the geometry
//
// dot() is given (it's next file's exercise to build properly). Embed the
// four texts and fill in the two prediction booleans by REASONING first,
// then let the checks confirm: does meaning really beat vocabulary?
// ─────────────────────────────────────────────────────────────────────────────
function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
}

const [refund, moneyBack, samosa, invoice] = await embedTexts([
  "How do I get a refund for my order?",
  "I want my money back for this purchase",
  "The best samosas are fried twice",
  "Where can I download my invoice?",
]);

const refundVsMoneyBack = dot(refund!, moneyBack!); // no shared keywords!
const refundVsSamosa = dot(refund!, samosa!);
const refundVsInvoice = dot(refund!, invoice!);

// PREDICT before running:
const moneyBackBeatsSamosa: boolean = false; // will refund↔moneyBack score higher than refund↔samosa?
const moneyBackBeatsInvoice: boolean = false; // …and higher than refund↔invoice (related domain, different intent)?

expect(moneyBackBeatsSamosa).toBe(refundVsMoneyBack > refundVsSamosa);
expect(moneyBackBeatsInvoice).toBe(refundVsMoneyBack > refundVsInvoice);
expect(refundVsMoneyBack > 0.5).toBe(true); // strongly similar despite zero keyword overlap

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — batch, don't loop
//
// Embedding 100 chunks one-by-one wastes the model's batching ability.
// Implement embedInBatches: embed `texts` in slices of batchSize
// (sequentially — local model, no rate limits, keep memory flat), concat
// results, preserve order. (Slices via .slice(i, i + batchSize)).
// ─────────────────────────────────────────────────────────────────────────────
async function embedInBatches(texts: string[], batchSize: number): Promise<number[][]> {
  return []; // IMPLEMENT
}

const batched = await embedInBatches(["a", "b", "c", "d", "e"], 2);
expect(batched.length).toBe(5);
expect(batched[4]!.length).toBe(384);
// same input → same vector, batched or not:
const [single] = await embedTexts(["c"]);
expect(Math.abs(dot(batched[2]!, single!) - 1) < 0.01).toBe(true);

pass("02-embeddings");
