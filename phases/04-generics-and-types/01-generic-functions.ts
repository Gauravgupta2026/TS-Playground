/**
 * Phase 4 · Exercise 01 — Generic functions
 *
 * Both must pass:
 *   npm run ts    phases/04-generics-and-types/01-generic-functions.ts
 *   npm run check phases/04-generics-and-types/01-generic-functions.ts
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — from unknown to generic
//
// `last` works for any array, but it's typed with unknown — so the caller
// gets unknown back: the type was destroyed on the way through. Make it
// generic —  function last<T>(items: T[]): T | undefined  — and the Equal
// assertion below starts passing: inference recovers number | undefined.
// ─────────────────────────────────────────────────────────────────────────────
function last(items: unknown[]): unknown {
  return items[items.length - 1];
}

const lastScore = last([70, 85, 92]);
type _e1 = Expect<Equal<typeof lastScore, number | undefined>>;
expect(lastScore).toBe(92);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — the type parameter LINKS input and output
//
// Implement `pair`: takes two values OF THE SAME TYPE T, returns [T, T].
// The mixed-type call below must stay a compile error (that's the point of
// sharing one T — both args must agree).
// ─────────────────────────────────────────────────────────────────────────────
function pair(a: unknown, b: unknown): [unknown, unknown] {
  // CHANGE to <T>(a: T, b: T): [T, T]
  return [a, b];
}

const strings = pair("query", "context");
type _e2 = Expect<Equal<typeof strings, [string, string]>>;
expect(strings).toEqual(["query", "context"]);

// @ts-expect-error -- mixing types in one pair must not compile once T links them
pair("hello", 42);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — generics with callbacks: mapNotNull
//
// Implement mapNotNull: applies fn to each item and keeps only non-null
// results. TWO type parameters: T (input) and R (output).
//   mapNotNull<T, R>(items: T[], fn: (item: T) => R | null): R[]
// ─────────────────────────────────────────────────────────────────────────────
function mapNotNull(items: unknown[], fn: (item: unknown) => unknown): unknown[] {
  // RETYPE generically, then implement (map + filter, or a loop)
  return [];
}

const lengths = mapNotNull(["rag", "", "agents", ""], (s) => (s.length > 0 ? s.length : null));
type _e3 = Expect<Equal<typeof lengths, number[]>>;
expect(lengths).toEqual([3, 6]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — read a real-world generic signature
//
// No implementation — decode what inference produced. Fill in the Expect
// types. (This is the skill that makes SDK/library signatures readable.)
// ─────────────────────────────────────────────────────────────────────────────
async function tryBoth<A, B>(a: () => Promise<A>, b: () => Promise<B>): Promise<[A, B]> {
  return Promise.all([a(), b()]);
}

const both = await tryBoth(
  async () => "embeddings ready",
  async () => 1536
);

type _e4 = Expect<Equal<typeof both, unknown>>; // REPLACE unknown with the tuple type
expect(both).toEqual(["embeddings ready", 1536]);

pass("01-generic-functions");
