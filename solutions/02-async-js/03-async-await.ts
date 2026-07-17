/** SOLUTION — Phase 2 · 03. */
import { expect, pass } from "../../helpers/assert";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchPrice(symbol: string): Promise<number> {
  await delay(40);
  const prices: Record<string, number> = { AAPL: 200, GOOG: 150, NVDA: 900 };
  const price = prices[symbol];
  if (price === undefined) throw new Error(`unknown symbol: ${symbol}`);
  return price;
}

// EXERCISE 1 — same logic, flat syntax.
function portfolioValueThen(symbol: string, shares: number): Promise<string> {
  return fetchPrice(symbol).then((price) => `${symbol}: $${price * shares}`);
}
async function portfolioValueAwait(symbol: string, shares: number): Promise<string> {
  const price = await fetchPrice(symbol);
  return `${symbol}: $${price * shares}`;
}
expect(await portfolioValueThen("AAPL", 2)).toBe("AAPL: $400");
expect(await portfolioValueAwait("AAPL", 2)).toBe("AAPL: $400");

// EXERCISE 2 — a rejected await throws; catch it like any other exception.
async function safePrice(symbol: string): Promise<number> {
  try {
    return await fetchPrice(symbol);
  } catch {
    return -1;
  }
}
expect(await safePrice("GOOG")).toBe(150);
expect(await safePrice("DOGE")).toBe(-1);

// EXERCISE 3 — start all three immediately; ~40ms total instead of ~120ms.
async function totalValue(): Promise<number> {
  const [aapl, goog, nvda] = await Promise.all([
    fetchPrice("AAPL"),
    fetchPrice("GOOG"),
    fetchPrice("NVDA"),
  ]);
  return aapl + goog + nvda;
}
const start = Date.now();
const total = await totalValue();
const took = Date.now() - start;
expect(total).toBe(1250);
expect(took < 100).toBe(true);

// EXERCISE 4 — async fns return promises; awaiting a plain value passes it through.
async function five(): Promise<number> {
  return 5;
}
const raw = five();
const isPromise: boolean = true;
const awaitedPlain = await 7;
const prediction: number = 7;
expect(isPromise).toBe(raw instanceof Promise);
expect(prediction).toBe(awaitedPlain);

pass("03-async-await (solution)");
