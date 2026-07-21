/**
 * Phase 10 · Exercise 04 — LRU + TTL cache
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/04-lru-ttl-cache.ts
 *   npm run check phases/10-systems-design/04-lru-ttl-cache.ts
 *
 * Identical prompt → identical embedding. A cache turns the second call into
 * a free lookup — often the biggest cost win in an LLM app. Bound it two ways:
 * LRU eviction bounds MEMORY, TTL bounds STALENESS.
 *
 * Key insight: a JS Map preserves insertion order, so `delete`+`set` on access
 * moves a key to "most recently used", and the FIRST key is always the LRU
 * victim. Lean on that instead of tracking timestamps for recency.
 */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — LruCache<K, V>
//
// constructor(capacity, ttlMs, now)
//   set(key, value): store with expiry = now() + ttlMs. If the key exists,
//     overwrite (and refresh recency). If size exceeds capacity, evict the
//     least-recently-used entry (the oldest key in the Map).
//   get(key): if missing OR expired → return undefined (and delete if expired).
//     If present and fresh → refresh recency (move to newest) and return value.
//   get size(): count of currently-stored entries.
// ─────────────────────────────────────────────────────────────────────────────
class LruCache<K, V> {
  constructor(capacity: number, ttlMs: number, now: Now) {
    // IMPLEMENT
  }

  set(key: K, value: V): void {
    // IMPLEMENT
  }

  get(key: K): V | undefined {
    return undefined; // IMPLEMENT
  }

  get size(): number {
    return -1; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const cache = new LruCache<string, number>(2, 1000, clock.now);

cache.set("a", 1);
cache.set("b", 2);
expect(cache.get("a")).toBe(1); // touch "a" → now most-recent, "b" is LRU
cache.set("c", 3); // capacity 2 → evict "b"
expect(cache.get("b")).toBe(undefined);
expect(cache.get("a")).toBe(1);
expect(cache.get("c")).toBe(3);
expect(cache.size).toBe(2);

// overwrite updates the value, not the count:
const clock2 = new ManualClock();
const c2 = new LruCache<string, number>(2, 10_000, clock2.now);
c2.set("x", 1);
c2.set("x", 99);
expect(c2.get("x")).toBe(99);
expect(c2.size).toBe(1);

// TTL expiry (lazy, on read):
const clock3 = new ManualClock();
const c3 = new LruCache<string, string>(5, 1000, clock3.now);
c3.set("k", "v");
clock3.advance(999);
expect(c3.get("k")).toBe("v"); // still fresh
clock3.advance(2);
expect(c3.get("k")).toBe(undefined); // expired at 1001 > 1000
expect(c3.size).toBe(0); // and removed

pass("04-lru-ttl-cache");
