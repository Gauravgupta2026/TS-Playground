/** SOLUTION — Phase 7 · 02. */
import { pipeline } from "@huggingface/transformers";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — the extractor is created once (module-level promise) and
// awaited per call: the once() pattern, async edition.
const extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "fp32" });

async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await extractorPromise;
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

const vectors = await embedTexts(["hello world", "namaste duniya"]);
expect(vectors.length).toBe(2);
expect(vectors[0]!.length).toBe(384);
const magnitude = Math.sqrt(vectors[0]!.reduce((s, v) => s + v * v, 0));
expect(Math.abs(magnitude - 1) < 0.01).toBe(true);

// EXERCISE 2 — meaning beats vocabulary.
function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
}

const [refund, moneyBack, samosa, invoice] = await embedTexts([
  "How do I get a refund for my order?",
  "I want my money back for this purchase",
  "The best samosas are fried twice",
  "Where can I download my invoice?",
]);

const refundVsMoneyBack = dot(refund!, moneyBack!);
const refundVsSamosa = dot(refund!, samosa!);
const refundVsInvoice = dot(refund!, invoice!);

const moneyBackBeatsSamosa: boolean = true;
const moneyBackBeatsInvoice: boolean = true;

expect(moneyBackBeatsSamosa).toBe(refundVsMoneyBack > refundVsSamosa);
expect(moneyBackBeatsInvoice).toBe(refundVsMoneyBack > refundVsInvoice);
expect(refundVsMoneyBack > 0.5).toBe(true);

// EXERCISE 3 — sequential batches keep memory flat; order preserved.
async function embedInBatches(texts: string[], batchSize: number): Promise<number[][]> {
  const result: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = await embedTexts(texts.slice(i, i + batchSize));
    result.push(...batch);
  }
  return result;
}

const batched = await embedInBatches(["a", "b", "c", "d", "e"], 2);
expect(batched.length).toBe(5);
expect(batched[4]!.length).toBe(384);
const [single] = await embedTexts(["c"]);
expect(Math.abs(dot(batched[2]!, single!) - 1) < 0.01).toBe(true);

pass("02-embeddings (solution)");
