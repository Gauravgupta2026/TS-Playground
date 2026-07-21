/** SOLUTION — Phase 10 · 03. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — round-robin.
function roundRobin<T>(backends: T[]): () => T {
  let i = 0;
  return () => {
    const chosen = backends[i % backends.length]!;
    i += 1;
    return chosen;
  };
}

// EXERCISE 2 — weighted round-robin via sequence expansion.
function weightedRoundRobin<T>(entries: Array<{ value: T; weight: number }>): () => T {
  const sequence: T[] = [];
  for (const { value, weight } of entries) {
    for (let k = 0; k < weight; k++) sequence.push(value);
  }
  return roundRobin(sequence);
}

// EXERCISE 3 — least-connections.
class LeastConnections<T> {
  private readonly counts: number[];

  constructor(private readonly backends: T[]) {
    this.counts = backends.map(() => 0);
  }

  acquire(): { backend: T; release: () => void } {
    let min = 0;
    for (let i = 1; i < this.counts.length; i++) {
      if (this.counts[i]! < this.counts[min]!) min = i;
    }
    this.counts[min]! += 1;
    let released = false;
    return {
      backend: this.backends[min]!,
      release: () => {
        if (released) return; // idempotent — don't double-decrement
        released = true;
        this.counts[min]! -= 1;
      },
    };
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
expect(picks.filter((p) => p === "big").length).toBe(4);
expect(picks.filter((p) => p === "small").length).toBe(2);

const lb = new LeastConnections(["n1", "n2"]);
const a = lb.acquire();
const b = lb.acquire();
const c = lb.acquire();
expect([a.backend, b.backend, c.backend]).toEqual(["n1", "n2", "n1"]);
a.release();
const d = lb.acquire();
expect(d.backend).toBe("n1");

pass("03-load-balancer (solution)");
