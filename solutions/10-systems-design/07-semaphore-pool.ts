/** SOLUTION — Phase 10 · 07. */
import { realTick } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];

  constructor(permits: number) {
    this.available = permits;
  }

  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const grant = () => resolve(() => this.release());
      if (this.available > 0) {
        this.available -= 1;
        grant();
      } else {
        // Wait; when woken, the permit is passed hand-to-hand (no re-decrement).
        this.waiters.push(grant);
      }
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.available += 1;
  }
}

async function pool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const sem = new Semaphore(concurrency);
  const results = new Array<R>(items.length);
  await Promise.all(
    items.map(async (item, i) => {
      const release = await sem.acquire();
      try {
        results[i] = await worker(item, i);
      } finally {
        release();
      }
    })
  );
  return results;
}

// ── The spec ────────────────────────────────────────────────────────────────
const sem = new Semaphore(2);
const rel1 = await sem.acquire();
await sem.acquire();
let thirdGranted = false;
const pending = sem.acquire().then((rel) => {
  thirdGranted = true;
  return rel;
});
await realTick();
expect(thirdGranted).toBe(false);
rel1();
await realTick();
expect(thirdGranted).toBe(true);
(await pending)();

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
expect(out).toEqual([2, 4, 6, 8, 10]);
expect(maxActive).toBe(2);

pass("07-semaphore-pool (solution)");
