/** SOLUTION — Phase 11 · 04. */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

class SharedStore {
  private readonly counts = new Map<string, number>();
  incr(key: string): number {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }
}

class DistributedRateLimiter {
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly store: SharedStore,
    private readonly now: Now
  ) {}

  allow(clientId: string): boolean {
    const windowStart = Math.floor(this.now() / this.windowMs) * this.windowMs;
    const key = `${clientId}:${windowStart}`;
    const count = this.store.incr(key); // atomic increment on the shared store
    return count <= this.limit;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const store = new SharedStore();

const nodeA = new DistributedRateLimiter(3, 1000, store, clock.now);
const nodeB = new DistributedRateLimiter(3, 1000, store, clock.now);

expect(nodeA.allow("acme")).toBe(true);
expect(nodeB.allow("acme")).toBe(true);
expect(nodeA.allow("acme")).toBe(true);
expect(nodeB.allow("acme")).toBe(false);

expect(nodeA.allow("globex")).toBe(true);

clock.advance(1000);
expect(nodeA.allow("acme")).toBe(true);
expect(nodeB.allow("acme")).toBe(true);
expect(nodeA.allow("acme")).toBe(true);
expect(nodeB.allow("acme")).toBe(false);

pass("04-distributed-rate-limit (solution)");
