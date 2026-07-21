/** SOLUTION — Phase 11 · 01. */
import { expect, pass } from "../../helpers/assert";

function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

type RingPoint = { point: number; node: string };

class HashRing {
  // Sorted ascending by `point`. Small N of nodes → linear insert/search is fine.
  private ring: RingPoint[] = [];

  constructor(private readonly vnodes: number) {}

  add(node: string): void {
    for (let i = 0; i < this.vnodes; i++) {
      this.ring.push({ point: hash(`${node}#${i}`), node });
    }
    this.ring.sort((a, b) => a.point - b.point);
  }

  remove(node: string): void {
    this.ring = this.ring.filter((p) => p.node !== node);
  }

  get(key: string): string {
    if (this.ring.length === 0) throw new Error("empty ring");
    const h = hash(key);
    // First point clockwise (smallest point >= h); wrap to the first if none.
    for (const p of this.ring) {
      if (p.point >= h) return p.node;
    }
    return this.ring[0]!.node;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const ring = new HashRing(50);
ring.add("node-a");
ring.add("node-b");
ring.add("node-c");

const keys = Array.from({ length: 200 }, (_, i) => `key-${i}`);
const before = new Map(keys.map((k) => [k, ring.get(k)]));
for (const k of keys) expect(ring.get(k)).toBe(before.get(k));

const owners = new Set(before.values());
expect(owners.has("node-a")).toBe(true);
expect(owners.has("node-b")).toBe(true);
expect(owners.has("node-c")).toBe(true);

ring.remove("node-c");
let movedFromC = 0;
for (const k of keys) {
  const now = ring.get(k);
  if (before.get(k) === "node-c") {
    movedFromC += 1;
    expect(now === "node-a" || now === "node-b").toBe(true);
  } else {
    expect(now).toBe(before.get(k));
  }
}
expect(movedFromC > 0).toBe(true);

const afterRemoval = new Map(keys.map((k) => [k, ring.get(k)]));
ring.add("node-d");
let movedToD = 0;
for (const k of keys) {
  const now = ring.get(k);
  if (now !== afterRemoval.get(k)) {
    expect(now).toBe("node-d");
    movedToD += 1;
  }
}
expect(movedToD < keys.length / 2).toBe(true);

const empty = new HashRing(10);
expect(() => empty.get("x")).toThrow("empty ring");

pass("01-consistent-hashing (solution)");
