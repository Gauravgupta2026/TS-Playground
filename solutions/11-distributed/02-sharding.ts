/** SOLUTION — Phase 11 · 02. */
import { expect, pass } from "../../helpers/assert";

function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function moduloShard(key: string, numShards: number): number {
  return hash(key) % numShards;
}

class ShardedStore<V> {
  private readonly shards: Array<Map<string, V>>;

  constructor(private readonly numShards: number) {
    this.shards = Array.from({ length: numShards }, () => new Map<string, V>());
  }

  set(key: string, value: V): void {
    this.shards[moduloShard(key, this.numShards)]!.set(key, value);
  }

  get(key: string): V | undefined {
    return this.shards[moduloShard(key, this.numShards)]!.get(key);
  }

  shardSizes(): number[] {
    return this.shards.map((s) => s.size);
  }
}

function countRemapped(keys: string[], oldN: number, newN: number): number {
  let moved = 0;
  for (const key of keys) {
    if (moduloShard(key, oldN) !== moduloShard(key, newN)) moved += 1;
  }
  return moved;
}

// ── The spec ────────────────────────────────────────────────────────────────
expect(moduloShard("key-1", 4)).toBe(hash("key-1") % 4);
expect(moduloShard("key-1", 4) < 4).toBe(true);

const store = new ShardedStore<number>(4);
store.set("alpha", 1);
store.set("beta", 2);
expect(store.get("alpha")).toBe(1);
expect(store.get("beta")).toBe(2);
expect(store.get("missing")).toBe(undefined);

for (let i = 0; i < 400; i++) store.set(`k${i}`, i);
const sizes = store.shardSizes();
expect(sizes.length).toBe(4);
expect(sizes.every((s) => s > 0)).toBe(true);

const keys = Array.from({ length: 500 }, (_, i) => `doc-${i}`);
const remapped = countRemapped(keys, 4, 5);
expect(remapped > keys.length * 0.6).toBe(true);

pass("02-sharding (solution)");
