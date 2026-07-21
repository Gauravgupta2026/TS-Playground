/**
 * Phase 10 · Exercise 01 — Rate limiting: token bucket + sliding window
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/01-rate-limiter.ts
 *   npm run check phases/10-systems-design/01-rate-limiter.ts
 *
 * You call a model API capped at N requests/sec. A rate limiter is the valve
 * that keeps you under the 429 line. You'll build the two classics — and note
 * that NEITHER runs a background timer: they read an injected clock and do
 * arithmetic. That "lazy" style is what makes them testable (and efficient).
 */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — Token bucket
//
// A bucket holds up to `capacity` tokens, starts FULL, and refills at
// `refillPerSec` tokens/second. tryRemove(count) refills lazily first
// (add `elapsedSeconds * refillPerSec`, capped at capacity), then removes
// `count` if available (return true) or refuses (return false).
//
// Lazy refill = compute tokens from elapsed time on each call; do NOT use a
// setInterval. Track a `lastRefill` timestamp from the injected clock.
// ─────────────────────────────────────────────────────────────────────────────
class TokenBucket {
  constructor(capacity: number, refillPerSec: number, now: Now) {
    // IMPLEMENT (start full)
  }

  tryRemove(count = 1): boolean {
    return false; // IMPLEMENT
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — Sliding-window log
//
// allow() keeps the timestamps of recent allowed requests, drops any older
// than `windowMs`, and allows a new one only if fewer than `maxRequests`
// remain in the window (then records `now`).
// ─────────────────────────────────────────────────────────────────────────────
class SlidingWindowLimiter {
  constructor(maxRequests: number, windowMs: number, now: Now) {
    // IMPLEMENT
  }

  allow(): boolean {
    return false; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const bucket = new TokenBucket(3, 1, clock.now); // cap 3, refill 1/sec

expect(bucket.tryRemove()).toBe(true); // 3 → 2
expect(bucket.tryRemove()).toBe(true); // 2 → 1
expect(bucket.tryRemove()).toBe(true); // 1 → 0
expect(bucket.tryRemove()).toBe(false); // empty

clock.advance(2000); // +2s → +2 tokens
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(false);

// refill is CAPPED at capacity — idle time doesn't buy unlimited burst:
clock.advance(100_000);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(false); // capped at 3, not 100

// removing more than one at a time:
const clockB = new ManualClock();
const burst = new TokenBucket(5, 1, clockB.now);
expect(burst.tryRemove(5)).toBe(true);
expect(burst.tryRemove(1)).toBe(false);

// sliding window: 2 requests per 1000ms
const clockC = new ManualClock();
const sw = new SlidingWindowLimiter(2, 1000, clockC.now);
expect(sw.allow()).toBe(true);
expect(sw.allow()).toBe(true);
expect(sw.allow()).toBe(false); // 2 already in window
clockC.advance(1001); // both fall out
expect(sw.allow()).toBe(true);

pass("01-rate-limiter");
