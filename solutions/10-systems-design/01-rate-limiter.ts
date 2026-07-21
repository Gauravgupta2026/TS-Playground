/** SOLUTION — Phase 10 · 01. */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — lazy-refill token bucket.
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
    private readonly now: Now
  ) {
    this.tokens = capacity;
    this.lastRefill = now();
  }

  private refill(): void {
    const t = this.now();
    const elapsedSec = (t - this.lastRefill) / 1000;
    if (elapsedSec <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.lastRefill = t;
  }

  tryRemove(count = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}

// EXERCISE 2 — sliding-window log.
class SlidingWindowLimiter {
  private readonly timestamps: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly now: Now
  ) {}

  allow(): boolean {
    const t = this.now();
    const cutoff = t - this.windowMs;
    // Drop timestamps that have slid out of the window.
    while (this.timestamps.length > 0 && this.timestamps[0]! <= cutoff) {
      this.timestamps.shift();
    }
    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(t);
      return true;
    }
    return false;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const bucket = new TokenBucket(3, 1, clock.now);

expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(false);

clock.advance(2000);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(false);

clock.advance(100_000);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(true);
expect(bucket.tryRemove()).toBe(false);

const clockB = new ManualClock();
const burst = new TokenBucket(5, 1, clockB.now);
expect(burst.tryRemove(5)).toBe(true);
expect(burst.tryRemove(1)).toBe(false);

const clockC = new ManualClock();
const sw = new SlidingWindowLimiter(2, 1000, clockC.now);
expect(sw.allow()).toBe(true);
expect(sw.allow()).toBe(true);
expect(sw.allow()).toBe(false);
clockC.advance(1001);
expect(sw.allow()).toBe(true);

pass("01-rate-limiter (solution)");
