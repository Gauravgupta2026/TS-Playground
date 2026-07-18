/**
 * Phase 9 · DRILL — Async
 *
 * Gate: npm run ts + npm run check, both green. No guidance below this line.
 */
import { expect, pass } from "../../helpers/assert";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// SPEC — runLimited<T, R>(items, worker, limit):
//   - runs worker(item, index) over every item
//   - at most `limit` workers in flight at any moment
//   - resolves to results in INPUT order
//   - a worker rejection rejects the whole run (fail-fast is fine)
//   - limit >= items.length must behave like Promise.all
//   - limit <= 0 → reject with Error("limit must be >= 1")
async function runLimited(
  items: unknown[],
  worker: (item: unknown, index: number) => Promise<unknown>,
  limit: number
): Promise<unknown[]> {
  return [];
}

// ── The spec ────────────────────────────────────────────────────────────────
// results in input order, transformed:
const doubled = await runLimited([1, 2, 3, 4, 5], async (n) => (n as number) * 2, 2);
expect(doubled).toEqual([2, 4, 6, 8, 10]);

// concurrency is actually bounded (peak tracking):
let inFlight = 0;
let peak = 0;
const timed = await runLimited(
  [30, 10, 20, 10, 10, 10],
  async (ms) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await delay(ms as number);
    inFlight -= 1;
    return ms;
  },
  2
);
expect(timed).toEqual([30, 10, 20, 10, 10, 10]);
expect(peak).toBe(2); // never more than 2 at once — and 2, not 1 (it IS concurrent)

// …and it's genuinely faster than serial: 90ms of work at limit 2 ≲ 60ms.
const t0 = Date.now();
await runLimited([20, 20, 20], async (ms) => delay(ms as number), 2);
const took = Date.now() - t0;
expect(took < 55).toBe(true);

// generic typing survives (no unknown leaking to callers when typed properly):
// If you kept the signature monomorphic (unknown), make it generic now —
// the checks below must compile with NO casts:
const lengths: number[] = (await runLimited(["a", "bb", "ccc"], async (s) => (s as string).length, 3)) as number[];
expect(lengths).toEqual([1, 2, 3]);

// fail-fast:
let rejected = false;
try {
  await runLimited([1, 2, 3], async (n) => {
    if (n === 2) throw new Error("boom");
    return n;
  }, 2);
} catch {
  rejected = true;
}
expect(rejected).toBe(true);

// invalid limit:
let badLimit = "";
try {
  await runLimited([1], async (n) => n, 0);
} catch (thrown) {
  badLimit = thrown instanceof Error ? thrown.message : "";
}
expect(badLimit).toBe("limit must be >= 1");

pass("drill-async — 2/4 gates down.");
