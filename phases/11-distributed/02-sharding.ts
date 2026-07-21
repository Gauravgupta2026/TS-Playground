/**
 * Phase 11 · Exercise 02 — Sharding, and the `% N` trap
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/11-distributed/02-sharding.ts
 *   npm run check phases/11-distributed/02-sharding.ts
 *
 * Partition a corpus across shards, and MEASURE why `hash % N` doesn't scale:
 * resizing the shard count reshuffles almost everything. That measurement is
 * the whole reason consistent hashing (file 01) exists.
 */
import { expect, pass } from "../../helpers/assert";

/** GIVEN — deterministic 32-bit FNV-1a hash. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — modulo shard router
//
// moduloShard(key, numShards): which shard index [0, numShards) owns `key`.
// ─────────────────────────────────────────────────────────────────────────────
function moduloShard(key: string, numShards: number): number {
  return -1; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — ShardedStore<V>
//
// A key/value store split across `numShards` independent shards, routed by
// moduloShard. set/get route to the owning shard; shardSizes() returns the
// entry count per shard (to inspect balance).
// ─────────────────────────────────────────────────────────────────────────────
class ShardedStore<V> {
  constructor(numShards: number) {
    // IMPLEMENT
  }

  set(key: string, value: V): void {
    // IMPLEMENT
  }

  get(key: string): V | undefined {
    return undefined; // IMPLEMENT
  }

  shardSizes(): number[] {
    return []; // IMPLEMENT
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — measure the resize damage
//
// countRemapped(keys, oldN, newN): how many keys change shard when the count
// goes oldN → newN under modulo routing. This number is the point of the
// exercise: it's most of them.
// ─────────────────────────────────────────────────────────────────────────────
function countRemapped(keys: string[], oldN: number, newN: number): number {
  return 0; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
// routing is deterministic and in range:
expect(moduloShard("key-1", 4)).toBe(hash("key-1") % 4);
expect(moduloShard("key-1", 4) < 4).toBe(true);

// store routes reads to the same shard as writes:
const store = new ShardedStore<number>(4);
store.set("alpha", 1);
store.set("beta", 2);
expect(store.get("alpha")).toBe(1);
expect(store.get("beta")).toBe(2);
expect(store.get("missing")).toBe(undefined);

// distribution: 400 keys over 4 shards, none should be empty.
for (let i = 0; i < 400; i++) store.set(`k${i}`, i);
const sizes = store.shardSizes();
expect(sizes.length).toBe(4);
expect(sizes.every((s) => s > 0)).toBe(true);

// THE trap: 4 → 5 shards reshuffles the large majority of keys.
const keys = Array.from({ length: 500 }, (_, i) => `doc-${i}`);
const remapped = countRemapped(keys, 4, 5);
expect(remapped > keys.length * 0.6).toBe(true); // most keys move — modulo does NOT scale

// (contrast: file 01's ring moved < half when going 3 → 4 nodes, and only TO
//  the new node. That's the difference between "elastic" and "resize = outage".)

pass("02-sharding");
