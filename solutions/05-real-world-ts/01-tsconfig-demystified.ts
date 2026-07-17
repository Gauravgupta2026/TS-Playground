/** SOLUTION — Phase 5 · 01. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — handle the undefined arm before touching the value.
type ModelInfo = { id: string; contextWindow: number };

const KNOWN_MODELS: ModelInfo[] = [
  { id: "claude-sonnet-5", contextWindow: 200000 },
  { id: "claude-haiku-4-5", contextWindow: 200000 },
];

function describeModel(id: string): string {
  const found = KNOWN_MODELS.find((m) => m.id === id);
  if (!found) return "model not found";
  return `${found.id}: ${found.contextWindow} tokens`;
}
expect(describeModel("claude-sonnet-5")).toBe("claude-sonnet-5: 200000 tokens");
expect(describeModel("gpt-9000")).toBe("model not found");

// EXERCISE 2 — .at() is honest about possible absence; ?? handles it.
function firstWord(sentence: string): string {
  const words = sentence.split(" ").filter((w) => w.length > 0);
  return words.at(0)?.toUpperCase() ?? "(none)";
}
expect(firstWord("hello world")).toBe("HELLO");
expect(firstWord("")).toBe("(none)");

// EXERCISE 3 — real types; the nonsense call is now impossible.
function invoiceTotal(items: { priceInr: number }[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.priceInr, 0);
  return Math.round(subtotal * (1 + taxRate));
}
expect(invoiceTotal([{ priceInr: 1000 }, { priceInr: 500 }], 0.18)).toBe(1770);

// Never called — the type error is the test; the crash never runs.
function _negativeSpec(): void {
  // @ts-expect-error -- a bare number is not an items array
  invoiceTotal(42, 0.18);
}

pass("01-tsconfig-demystified (solution)");
