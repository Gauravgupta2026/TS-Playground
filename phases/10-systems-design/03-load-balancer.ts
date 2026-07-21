/**
 * Phase 10 · Exercise 03 — Load balancing
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/03-load-balancer.ts
 *   npm run check phases/10-systems-design/03-load-balancer.ts
 *
 * One API key has one limit. Spread calls across several keys / regions /
 * replicas. Three strategies, increasing in smarts.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — round-robin
//
// Return a picker that cycles through `backends` in order, wrapping around.
// ─────────────────────────────────────────────────────────────────────────────
function roundRobin<T>(backends: T[]): () => T {
  return () => backends[0]!; // IMPLEMENT (must cycle, not always return the first)
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — weighted round-robin
//
// Backends carry weights. Over a full cycle, a weight-2 backend should be
// picked twice as often as a weight-1 one. Simplest correct approach: expand
// into a sequence by weight (e.g. [big, big, small]) and round-robin that.
// ─────────────────────────────────────────────────────────────────────────────
function weightedRoundRobin<T>(entries: Array<{ value: T; weight: number }>): () => T {
  return () => entries[0]!.value; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — least-connections
//
// acquire() returns the backend with the FEWEST in-flight requests (ties →
// earliest in the list), incrementing its in-flight count. The returned
// release() decrements it. This adapts to backends that are momentarily slow.
// ─────────────────────────────────────────────────────────────────────────────
class LeastConnections<T> {
  constructor(backends: T[]) {
    // IMPLEMENT
  }

  acquire(): { backend: T; release: () => void } {
    return { backend: undefined as T, release: () => {} }; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const rr = roundRobin(["a", "b", "c"]);
expect([rr(), rr(), rr(), rr()]).toEqual(["a", "b", "c", "a"]);

const wrr = weightedRoundRobin([
  { value: "big", weight: 2 },
  { value: "small", weight: 1 },
]);
const picks = Array.from({ length: 6 }, () => wrr());
expect(picks.filter((p) => p === "big").length).toBe(4); // 2/3 of 6
expect(picks.filter((p) => p === "small").length).toBe(2);

const lb = new LeastConnections(["n1", "n2"]);
const a = lb.acquire(); // both 0 → n1
const b = lb.acquire(); // n1=1, n2=0 → n2
const c = lb.acquire(); // 1,1 tie → n1
expect([a.backend, b.backend, c.backend]).toEqual(["n1", "n2", "n1"]);
a.release(); // n1: 2 → 1
const d = lb.acquire(); // n1=1, n2=1 tie → n1
expect(d.backend).toBe("n1");

pass("03-load-balancer");
