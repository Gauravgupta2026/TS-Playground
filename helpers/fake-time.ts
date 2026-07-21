/**
 * Deterministic time for systems-design exercises (Phases 10–11).
 *
 * WHY: rate limiters, debouncers, backoff and circuit breakers are all about
 * TIME — and time is the enemy of a fast, reproducible test. Real timers make
 * tests slow and flaky. The fix is the same injection pattern as the fake
 * Anthropic client: your primitives never call `Date.now()` or `setTimeout`
 * directly — they take a clock. Production code does this too (it's how you
 * unit-test anything time-dependent), so the pattern is not a toy.
 *
 * ManualClock gives you a virtual `now()` plus a virtual `setTimeout` whose
 * callbacks fire ONLY when you call `advance(ms)`. Nothing waits in real time.
 */

/** A source of "the current time in ms". Pass `clock.now` wherever one is asked for. */
export type Now = () => number;

type ScheduledTimer = { at: number; fn: () => void };

export class ManualClock {
  private current: number;
  private timers = new Map<number, ScheduledTimer>();
  private nextId = 1;

  constructor(start = 0) {
    this.current = start;
  }

  /** Arrow property so `clock.now` stays bound when passed around unattached. */
  now: Now = () => this.current;

  /** Like setTimeout, but fires during advance() — never on the real clock. */
  setTimeout(fn: () => void, delayMs: number): number {
    const id = this.nextId++;
    this.timers.set(id, { at: this.current + Math.max(0, delayMs), fn });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  /** Move time forward by `ms`, firing every due timer in chronological order. */
  advance(ms: number): void {
    const target = this.current + ms;
    while (true) {
      let dueId = -1;
      let dueAt = Infinity;
      for (const [id, timer] of this.timers) {
        if (timer.at <= target && timer.at < dueAt) {
          dueAt = timer.at;
          dueId = id;
        }
      }
      if (dueId === -1) break;
      const timer = this.timers.get(dueId)!;
      this.timers.delete(dueId);
      this.current = timer.at;
      timer.fn();
    }
    this.current = target;
  }
}

/**
 * A fake `sleep` that resolves immediately but RECORDS the delay it was asked
 * to wait. Used to test backoff without real waiting: assert on `delays`.
 */
export function recordingSleep(): { sleep: (ms: number) => Promise<void>; delays: number[] } {
  const delays: number[] = [];
  return {
    delays,
    sleep: async (ms: number) => {
      delays.push(ms);
    },
  };
}

/**
 * Yield to the real event loop once. Used only to let genuinely-concurrent
 * promises (semaphore, worker pool) interleave in a test — it drives no
 * primitive's logic, it just flushes the microtask/macrotask queue.
 */
export const realTick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
