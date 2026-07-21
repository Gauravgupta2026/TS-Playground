/**
 * Phase 11 · Exercise 04 — Distributed rate limiting
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/11-distributed/04-distributed-rate-limit.ts
 *   npm run check phases/11-distributed/04-distributed-rate-limit.ts
 *
 * A Phase 10 token bucket lives inside ONE process — ten instances each
 * "allowing 50/min" blow a 50/min key wide open. To bound TOTAL spend, the
 * counter must live in SHARED state every instance reads and writes. Here a
 * fixed-window counter over a shared store (Redis INCR, simulated). The
 * load-bearing word is `atomic`: read-modify-write from two nodes would lose
 * updates — so the store increments in one step.
 */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

/** GIVEN — an atomic shared counter store (stands in for Redis INCR/EXPIRE). */
class SharedStore {
  private readonly counts = new Map<string, number>();
  /** Atomically increment and return the new value (one indivisible step). */
  incr(key: string): number {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — DistributedRateLimiter
//
// constructor(limit, windowMs, store, now). Every instance shares ONE store.
// allow(clientId):
//   windowStart = floor(now() / windowMs) * windowMs
//   key         = `${clientId}:${windowStart}`
//   count       = store.incr(key)   // atomic — never read-then-write
//   return count <= limit
// The window key changes when time crosses a windowMs boundary, so a fresh
// window starts the count over.
// ─────────────────────────────────────────────────────────────────────────────
class DistributedRateLimiter {
  constructor(limit: number, windowMs: number, store: SharedStore, now: Now) {
    // IMPLEMENT
  }

  allow(clientId: string): boolean {
    return true; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const store = new SharedStore(); // the ONE shared backend

// two independent limiter instances = two app nodes sharing the store.
const nodeA = new DistributedRateLimiter(3, 1000, store, clock.now);
const nodeB = new DistributedRateLimiter(3, 1000, store, clock.now);

// the limit of 3 is GLOBAL across both nodes, not 3-per-node.
expect(nodeA.allow("acme")).toBe(true); // 1
expect(nodeB.allow("acme")).toBe(true); // 2 (different node, same budget)
expect(nodeA.allow("acme")).toBe(true); // 3
expect(nodeB.allow("acme")).toBe(false); // 4 → over the shared limit

// a different client has its own budget.
expect(nodeA.allow("globex")).toBe(true);

// crossing the window boundary resets the count.
clock.advance(1000); // new window
expect(nodeA.allow("acme")).toBe(true);
expect(nodeB.allow("acme")).toBe(true);
expect(nodeA.allow("acme")).toBe(true);
expect(nodeB.allow("acme")).toBe(false); // limit again, in the new window

pass("04-distributed-rate-limit");
