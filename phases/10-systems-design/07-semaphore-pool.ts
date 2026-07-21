/**
 * Phase 10 · Exercise 07 — Async semaphore & bounded worker pool
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/07-semaphore-pool.ts
 *   npm run check phases/10-systems-design/07-semaphore-pool.ts
 *
 * `Promise.all(thousandPrompts.map(callModel))` fires a thousand requests at
 * once: instant rate-limit wall, memory spike. A semaphore caps concurrency;
 * a pool applies it over a list. (Phase 9's drill-async, now with an explicit
 * semaphore underneath — the reusable primitive.)
 *
 * `realTick()` just yields to the event loop so genuinely-concurrent promises
 * interleave; it drives none of your logic.
 */
import { realTick } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — Semaphore
//
// `permits` slots. acquire() resolves with a release() function once a slot is
// free (immediately if one is, otherwise it waits in FIFO order). release()
// hands the slot to the next waiter, or returns it to the pool if none wait.
// ─────────────────────────────────────────────────────────────────────────────
class Semaphore {
  constructor(permits: number) {
    // IMPLEMENT
  }

  acquire(): Promise<() => void> {
    return Promise.resolve(() => {}); // IMPLEMENT (must actually block past `permits`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — bounded pool
//
// Run `worker` over every item, at most `concurrency` in flight at once.
// Return results in INPUT order (result[i] corresponds to items[i]).
// Build it on the Semaphore above.
// ─────────────────────────────────────────────────────────────────────────────
async function pool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  return []; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
// semaphore blocks past its permit count, then unblocks on release:
const sem = new Semaphore(2);
const rel1 = await sem.acquire();
await sem.acquire(); // both permits taken
let thirdGranted = false;
const pending = sem.acquire().then((rel) => {
  thirdGranted = true;
  return rel;
});
await realTick();
expect(thirdGranted).toBe(false); // no free permit → still waiting
rel1(); // free one
await realTick();
expect(thirdGranted).toBe(true);
(await pending)();

// pool preserves order AND actually parallelizes up to the cap:
let active = 0;
let maxActive = 0;
const worker = async (n: number): Promise<number> => {
  active += 1;
  maxActive = Math.max(maxActive, active);
  await realTick();
  active -= 1;
  return n * 2;
};
const out = await pool([1, 2, 3, 4, 5], worker, 2);
expect(out).toEqual([2, 4, 6, 8, 10]); // order preserved
expect(maxActive).toBe(2); // ran 2-at-a-time, never serial, never unbounded

pass("07-semaphore-pool");
