/** SOLUTION — Phase 9 · drill-async. */
import { expect, pass } from "../../helpers/assert";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// The worker-pool pattern: `limit` loops share one cursor (a closure);
// each loop pulls the next index until items run out. Promise.all over the
// loops fail-fasts on any rejection.
async function runLimited<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  limit: number
): Promise<R[]> {
  if (limit < 1) throw new Error("limit must be >= 1");
  const results: R[] = new Array<R>(items.length);
  let cursor = 0;

  async function runLoop(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]!, index);
    }
  }

  const loops = Array.from({ length: Math.min(limit, items.length) }, () => runLoop());
  await Promise.all(loops);
  return results;
}

// ── The spec ────────────────────────────────────────────────────────────────
const doubled = await runLimited([1, 2, 3, 4, 5], async (n) => n * 2, 2);
expect(doubled).toEqual([2, 4, 6, 8, 10]);

let inFlight = 0;
let peak = 0;
const timed = await runLimited(
  [30, 10, 20, 10, 10, 10],
  async (ms) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await delay(ms);
    inFlight -= 1;
    return ms;
  },
  2
);
expect(timed).toEqual([30, 10, 20, 10, 10, 10]);
expect(peak).toBe(2);

const t0 = Date.now();
await runLimited([20, 20, 20], async (ms) => delay(ms), 2);
expect(Date.now() - t0 < 55).toBe(true);

const lengths: number[] = await runLimited(["a", "bb", "ccc"], async (s) => s.length, 3);
expect(lengths).toEqual([1, 2, 3]);

let rejected = false;
try {
  await runLimited(
    [1, 2, 3],
    async (n) => {
      if (n === 2) throw new Error("boom");
      return n;
    },
    2
  );
} catch {
  rejected = true;
}
expect(rejected).toBe(true);

let badLimit = "";
try {
  await runLimited([1], async (n) => n, 0);
} catch (thrown) {
  badLimit = thrown instanceof Error ? thrown.message : "";
}
expect(badLimit).toBe("limit must be >= 1");

pass("drill-async (solution)");
