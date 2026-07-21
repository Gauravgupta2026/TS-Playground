/** SOLUTION — Phase 10 · 04. */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Entry<V> = { value: V; expiresAt: number };

class LruCache<K, V> {
  // Map iteration order = insertion order; we exploit it for recency.
  private readonly store = new Map<K, Entry<V>>();

  constructor(
    private readonly capacity: number,
    private readonly ttlMs: number,
    private readonly now: Now
  ) {}

  set(key: K, value: V): void {
    if (this.store.has(key)) this.store.delete(key); // reinsert → newest
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    if (this.store.size > this.capacity) {
      const lru = this.store.keys().next().value as K; // oldest key
      this.store.delete(lru);
    }
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) return undefined;
    if (this.now() > entry.expiresAt) {
      this.store.delete(key); // lazy expiry
      return undefined;
    }
    this.store.delete(key); // refresh recency: move to newest
    this.store.set(key, entry);
    return entry.value;
  }

  get size(): number {
    return this.store.size;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const cache = new LruCache<string, number>(2, 1000, clock.now);

cache.set("a", 1);
cache.set("b", 2);
expect(cache.get("a")).toBe(1);
cache.set("c", 3);
expect(cache.get("b")).toBe(undefined);
expect(cache.get("a")).toBe(1);
expect(cache.get("c")).toBe(3);
expect(cache.size).toBe(2);

const clock2 = new ManualClock();
const c2 = new LruCache<string, number>(2, 10_000, clock2.now);
c2.set("x", 1);
c2.set("x", 99);
expect(c2.get("x")).toBe(99);
expect(c2.size).toBe(1);

const clock3 = new ManualClock();
const c3 = new LruCache<string, string>(5, 1000, clock3.now);
c3.set("k", "v");
clock3.advance(999);
expect(c3.get("k")).toBe("v");
clock3.advance(2);
expect(c3.get("k")).toBe(undefined);
expect(c3.size).toBe(0);

pass("04-lru-ttl-cache (solution)");
