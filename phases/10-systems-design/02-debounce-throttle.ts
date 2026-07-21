/**
 * Phase 10 · Exercise 02 — Debounce and throttle
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/02-debounce-throttle.ts
 *   npm run check phases/10-systems-design/02-debounce-throttle.ts
 *
 * Two ways to fire less often — and they are OPPOSITES. Debounce waits for
 * the calls to stop; throttle fires at most once per interval. Both take the
 * ManualClock so timers fire only when you advance() it.
 */
import { ManualClock } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — debounce (trailing)
//
// Return a wrapped function. Each call CANCELS the pending timer and schedules
// a fresh one via clock.setTimeout; fn runs once, `waitMs` after the LAST
// call, with that last call's arguments. (Think: fire the search only after
// the user stops typing.)
// ─────────────────────────────────────────────────────────────────────────────
function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
  clock: ManualClock
): (...args: A) => void {
  return (..._args: A) => {
    // IMPLEMENT
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — throttle (leading)
//
// Return a wrapped function that runs fn IMMEDIATELY on the first call, then
// ignores calls until `intervalMs` has elapsed (per the clock), then allows
// the next one, and so on. (Think: sample a stream, don't replay all of it.)
// ─────────────────────────────────────────────────────────────────────────────
function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number,
  clock: ManualClock
): (...args: A) => void {
  return (..._args: A) => {
    // IMPLEMENT
  };
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const debounced: string[] = [];
const search = debounce((q: string) => debounced.push(q), 100, clock);

search("a");
search("ab");
search("abc"); // rapid typing — only the last should survive
clock.advance(50);
expect(debounced).toEqual([]); // still quiet-waiting
clock.advance(60); // now 110ms since last call
expect(debounced).toEqual(["abc"]);

search("next");
clock.advance(100);
expect(debounced).toEqual(["abc", "next"]);

const clock2 = new ManualClock();
const throttled: number[] = [];
const render = throttle((n: number) => throttled.push(n), 100, clock2);

render(1); // leading edge fires
render(2);
render(3); // within interval — dropped
expect(throttled).toEqual([1]);
clock2.advance(100);
render(4); // interval elapsed — fires
expect(throttled).toEqual([1, 4]);

pass("02-debounce-throttle");
