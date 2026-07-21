/**
 * Phase 11 · CHECKPOINT — a sharded embedding-cache cluster
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/11-distributed/checkpoint-distributed-cache.ts
 *   npm run check phases/11-distributed/checkpoint-distributed-cache.ts
 *
 * Assemble the phase (and Phase 10's cache) into the thing a real RAG system
 * runs in production: an embedding cache spread across nodes. A consistent-hash
 * ring routes each key to a node; each node keeps its own LRU+TTL cache; a
 * shared budget caps expensive compute (embedding) calls; and identical
 * concurrent requests dedup to one computation.
 *
 * The primitives are GIVEN (your 01/04/05 + Phase 10's LRU). You implement
 * ONLY DistributedCache — the composition.
 */
import { ManualClock, realTick, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// ── GIVEN primitives (correct — do not edit) ────────────────────────────────
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

class HashRing {
  private ring: Array<{ point: number; node: string }> = [];
  constructor(private vnodes: number) {}
  add(node: string): void {
    for (let i = 0; i < this.vnodes; i++) this.ring.push({ point: hash(`${node}#${i}`), node });
    this.ring.sort((a, b) => a.point - b.point);
  }
  get(key: string): string {
    if (this.ring.length === 0) throw new Error("empty ring");
    const h = hash(key);
    for (const p of this.ring) if (p.point >= h) return p.node;
    return this.ring[0]!.node;
  }
}

class LruCache<K, V> {
  private store = new Map<K, { value: V; expiresAt: number }>();
  constructor(private cap: number, private ttlMs: number, private now: Now) {}
  set(key: K, value: V): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    if (this.store.size > this.cap) this.store.delete(this.store.keys().next().value as K);
  }
  get(key: K): V | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (this.now() > e.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, e);
    return e.value;
  }
}

class SharedStore {
  private counts = new Map<string, number>();
  incr(key: string): number {
    const n = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, n);
    return n;
  }
}

class DistributedRateLimiter {
  constructor(private limit: number, private windowMs: number, private store: SharedStore, private now: Now) {}
  allow(clientId: string): boolean {
    const windowStart = Math.floor(this.now() / this.windowMs) * this.windowMs;
    return this.store.incr(`${clientId}:${windowStart}`) <= this.limit;
  }
}

class IdempotencyStore {
  private entries = new Map<string, { status: "inflight"; promise: Promise<unknown> } | { status: "settled"; value: unknown; expiresAt: number }>();
  constructor(private ttlMs: number, private now: Now) {}
  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.status === "inflight") return existing.promise as Promise<T>;
      if (this.now() <= existing.expiresAt) return existing.value as T;
      this.entries.delete(key);
    }
    const promise = fn();
    this.entries.set(key, { status: "inflight", promise });
    try {
      const value = await promise;
      this.entries.set(key, { status: "settled", value, expiresAt: this.now() + this.ttlMs });
      return value;
    } catch (e) {
      this.entries.delete(key);
      throw e;
    }
  }
}

// ── The checkpoint ──────────────────────────────────────────────────────────
type CacheOpts = {
  vnodes: number;
  cacheCap: number;
  cacheTtlMs: number;
  computeLimit: number;
  rateWindowMs: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — DistributedCache<V>
//
// constructor(nodeIds, opts, now): build a HashRing (opts.vnodes) over the
//   node ids; give EACH node its own LruCache(cacheCap, cacheTtlMs, now); wire
//   one IdempotencyStore(cacheTtlMs) and one DistributedRateLimiter(
//   computeLimit, rateWindowMs) over a shared store.
//
// ownerOf(key): the node the ring routes `key` to.
// addNode(id): add it to the ring AND give it a fresh LruCache.
// get(key, compute):
//   node = ownerOf(key); cache = that node's LruCache.
//   cache HIT  → stats.hits++, return the cached value.
//   cache MISS → if the rate limiter rejects "compute" → throw
//                Error("compute rate limited"). Otherwise compute the value
//                idempotently (dedup concurrent identical keys) — counting each
//                ACTUAL computation in stats.computes — store it on the node's
//                cache, and return it.
// ─────────────────────────────────────────────────────────────────────────────
class DistributedCache<V> {
  readonly stats = { hits: 0, computes: 0 };

  constructor(nodeIds: string[], opts: CacheOpts, now: Now) {
    // IMPLEMENT
  }

  ownerOf(key: string): string {
    return ""; // IMPLEMENT
  }

  addNode(id: string): void {
    // IMPLEMENT
  }

  async get(key: string, compute: () => Promise<V>): Promise<V> {
    return compute(); // IMPLEMENT (this stub ignores the cache, dedup and limit)
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const opts: CacheOpts = { vnodes: 50, cacheCap: 100, cacheTtlMs: 60_000, computeLimit: 100, rateWindowMs: 1000 };

// (A) compute once, then serve from the node's cache.
const cache = new DistributedCache<string>(["n1", "n2", "n3"], opts, clock.now);
const v1 = await cache.get("doc-1", async () => "emb-1");
const v2 = await cache.get("doc-1", async () => "emb-2"); // must NOT recompute
expect(v1).toBe("emb-1");
expect(v2).toBe("emb-1"); // served from cache, so the 2nd compute never ran
expect(cache.stats.computes).toBe(1);
expect(cache.stats.hits).toBe(1);

// (B) in-flight dedup: concurrent identical keys share ONE computation.
let gateResolve!: (v: string) => void;
const gate = new Promise<string>((res) => (gateResolve = res));
let slowCalls = 0;
const slow = () => {
  slowCalls += 1;
  return gate;
};
const p1 = cache.get("job-x", slow);
const p2 = cache.get("job-x", slow);
await realTick();
expect(slowCalls).toBe(1);
gateResolve("E");
expect(await p1).toBe("E");
expect(await p2).toBe("E");
expect(slowCalls).toBe(1);

// (C) elastic routing: adding a node only remaps a minority of keys, all TO it.
const keys = Array.from({ length: 200 }, (_, i) => `k-${i}`);
const owners = new Map(keys.map((k) => [k, cache.ownerOf(k)]));
cache.addNode("n4");
let moved = 0;
for (const k of keys) {
  const now = cache.ownerOf(k);
  if (now !== owners.get(k)) {
    expect(now).toBe("n4");
    moved += 1;
  }
}
expect(moved > 0 && moved < keys.length / 2).toBe(true);

// (D) global compute budget: a small limit caps expensive (embedding) calls.
const clock2 = new ManualClock();
const capped = new DistributedCache<string>(["a", "b"], { ...opts, computeLimit: 2 }, clock2.now);
await capped.get("m1", async () => "e1"); // compute 1
await capped.get("m2", async () => "e2"); // compute 2
let err = "";
try {
  await capped.get("m3", async () => "e3"); // over the budget
} catch (e) {
  err = msg(e);
}
expect(err).toBe("compute rate limited");

pass("checkpoint-distributed-cache — Phase 11 complete! You've built the systems layer.");
