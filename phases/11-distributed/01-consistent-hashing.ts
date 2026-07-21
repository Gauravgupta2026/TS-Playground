/**
 * Phase 11 · Exercise 01 — Consistent hashing
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/11-distributed/01-consistent-hashing.ts
 *   npm run check phases/11-distributed/01-consistent-hashing.ts
 *
 * Route keys to nodes so that ADDING or REMOVING a node remaps only ~1/N of
 * keys — not all of them. This is how a vector index / embedding cache shards
 * across machines and still scales elastically. `hash` is GIVEN (deterministic
 * FNV-1a); the ring is yours.
 */
import { expect, pass } from "../../helpers/assert";

/** GIVEN — deterministic 32-bit FNV-1a hash. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — HashRing
//
// constructor(vnodes): each physical node is placed at `vnodes` points on the
//   ring, at hash(`${node}#${i}`) for i in [0, vnodes).
// add(node) / remove(node): insert / delete that node's ring points, keeping a
//   list of points sorted ascending by hash.
// get(key): the owner of `key` is the FIRST ring point clockwise from
//   hash(key) — i.e. the smallest point >= hash(key), wrapping to the first
//   point if none is larger. Empty ring → throw Error("empty ring").
// ─────────────────────────────────────────────────────────────────────────────
class HashRing {
  constructor(vnodes: number) {
    // IMPLEMENT
  }

  add(node: string): void {
    // IMPLEMENT
  }

  remove(node: string): void {
    // IMPLEMENT
  }

  get(key: string): string {
    return ""; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const ring = new HashRing(50);
ring.add("node-a");
ring.add("node-b");
ring.add("node-c");

// deterministic and stable: same key → same node every time.
const keys = Array.from({ length: 200 }, (_, i) => `key-${i}`);
const before = new Map(keys.map((k) => [k, ring.get(k)]));
for (const k of keys) expect(ring.get(k)).toBe(before.get(k)); // repeatable

// every node owns at least one key (virtual nodes spread the load).
const owners = new Set(before.values());
expect(owners.has("node-a")).toBe(true);
expect(owners.has("node-b")).toBe(true);
expect(owners.has("node-c")).toBe(true);

// THE property: removing a node only remaps keys that lived on THAT node.
ring.remove("node-c");
let movedFromC = 0;
for (const k of keys) {
  const now = ring.get(k);
  if (before.get(k) === "node-c") {
    movedFromC += 1; // these HAD to move
    expect(now === "node-a" || now === "node-b").toBe(true);
  } else {
    expect(now).toBe(before.get(k)); // everyone else stayed put
  }
}
expect(movedFromC > 0).toBe(true); // node-c really did own some keys

// adding a node back only steals a minority of keys.
const afterRemoval = new Map(keys.map((k) => [k, ring.get(k)]));
ring.add("node-d");
let movedToD = 0;
for (const k of keys) {
  const now = ring.get(k);
  if (now !== afterRemoval.get(k)) {
    expect(now).toBe("node-d"); // the only place a key can move TO is the new node
    movedToD += 1;
  }
}
expect(movedToD < keys.length / 2).toBe(true); // NOT a full reshuffle

// empty ring throws:
const empty = new HashRing(10);
expect(() => empty.get("x")).toThrow("empty ring");

pass("01-consistent-hashing");
