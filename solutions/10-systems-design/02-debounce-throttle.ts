/** SOLUTION — Phase 10 · 02. */
import { ManualClock } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — debounce: reset the timer on every call, fire after the quiet gap.
function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
  clock: ManualClock
): (...args: A) => void {
  let timer: number | null = null;
  return (...args: A) => {
    if (timer !== null) clock.clearTimeout(timer);
    timer = clock.setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}

// EXERCISE 2 — throttle: run on the leading edge, then ignore until the interval passes.
function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number,
  clock: ManualClock
): (...args: A) => void {
  let lastRun = -Infinity;
  return (...args: A) => {
    const t = clock.now();
    if (t - lastRun >= intervalMs) {
      lastRun = t;
      fn(...args);
    }
  };
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const debounced: string[] = [];
const search = debounce((q: string) => debounced.push(q), 100, clock);

search("a");
search("ab");
search("abc");
clock.advance(50);
expect(debounced).toEqual([]);
clock.advance(60);
expect(debounced).toEqual(["abc"]);

search("next");
clock.advance(100);
expect(debounced).toEqual(["abc", "next"]);

const clock2 = new ManualClock();
const throttled: number[] = [];
const render = throttle((n: number) => throttled.push(n), 100, clock2);

render(1);
render(2);
render(3);
expect(throttled).toEqual([1]);
clock2.advance(100);
render(4);
expect(throttled).toEqual([1, 4]);

pass("02-debounce-throttle (solution)");
