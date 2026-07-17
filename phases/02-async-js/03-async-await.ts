/**
 * Phase 2 · Exercise 03 — async/await
 *
 * Run me with:  npm run ts phases/02-async-js/03-async-await.ts
 */
import { expect, pass } from "../../helpers/assert";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Fake API: returns the price of a stock after a short "network" delay. */
async function fetchPrice(symbol: string): Promise<number> {
  await delay(40);
  const prices: Record<string, number> = { AAPL: 200, GOOG: 150, NVDA: 900 };
  const price = prices[symbol];
  if (price === undefined) throw new Error(`unknown symbol: ${symbol}`);
  return price;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — rewrite a .then chain as async/await
//
// portfolioValueThen works. Reimplement the SAME logic in
// portfolioValueAwait using async/await — no .then anywhere. Notice how
// error handling and intermediate variables become ordinary code.
// ─────────────────────────────────────────────────────────────────────────────
function portfolioValueThen(symbol: string, shares: number): Promise<string> {
  return fetchPrice(symbol).then((price) => `${symbol}: $${price * shares}`);
}

async function portfolioValueAwait(symbol: string, shares: number): Promise<string> {
  return ""; // IMPLEMENT with await
}

expect(await portfolioValueThen("AAPL", 2)).toBe("AAPL: $400");
expect(await portfolioValueAwait("AAPL", 2)).toBe("AAPL: $400");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — rejections become throws
//
// safePrice should return the price, or -1 if the symbol is unknown —
// WITHOUT letting the error escape. Use try/catch around the await.
// ─────────────────────────────────────────────────────────────────────────────
async function safePrice(symbol: string): Promise<number> {
  return fetchPrice(symbol); // IMPLEMENT: try/catch, return -1 on failure
}

expect(await safePrice("GOOG")).toBe(150);
expect(await safePrice("DOGE")).toBe(-1);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the sequential-await trap
//
// totalValue fetches three prices ONE AFTER ANOTHER: ~120ms total. The
// checks demand it completes in under 100ms — only possible if all three
// fetches run CONCURRENTLY. Fix with Promise.all. (Start all, then await.)
// ─────────────────────────────────────────────────────────────────────────────
async function totalValue(): Promise<number> {
  const aapl = await fetchPrice("AAPL");
  const goog = await fetchPrice("GOOG");
  const nvda = await fetchPrice("NVDA");
  return aapl + goog + nvda;
}

const start = Date.now();
const total = await totalValue();
const took = Date.now() - start;

expect(total).toBe(1250);
expect(took < 100).toBe(true); // sequential is ~120ms; concurrent is ~40ms

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — async functions ALWAYS return promises
//
// No code to fix — fix the predictions. What does calling an async function
// return BEFORE you await it? And what is `await`ing a plain value like?
// ─────────────────────────────────────────────────────────────────────────────
async function five(): Promise<number> {
  return 5;
}

const raw = five();
const isPromise: boolean = false; // PREDICT: is `raw` a Promise object?
const awaitedPlain = await 7; // awaiting a non-promise value…
const prediction: number = 0; // PREDICT what awaitedPlain is

expect(isPromise).toBe(raw instanceof Promise);
expect(prediction).toBe(awaitedPlain);

pass("03-async-await");
