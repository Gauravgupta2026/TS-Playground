/** SOLUTION — Phase 4 · 01. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — T links the array's element type to the return type.
function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}
const lastScore = last([70, 85, 92]);
type _e1 = Expect<Equal<typeof lastScore, number | undefined>>;
expect(lastScore).toBe(92);

// EXERCISE 2 — one shared T forces both args to agree.
function pair<T>(a: T, b: T): [T, T] {
  return [a, b];
}
const strings = pair("query", "context");
type _e2 = Expect<Equal<typeof strings, [string, string]>>;
expect(strings).toEqual(["query", "context"]);
// @ts-expect-error -- mixing types in one pair must not compile once T links them
pair("hello", 42);

// EXERCISE 3 — two type params: input T, output R. The null-filter needs a
// type predicate in the filter (r): r is R — or a loop, which needs nothing.
function mapNotNull<T, R>(items: T[], fn: (item: T) => R | null): R[] {
  const out: R[] = [];
  for (const item of items) {
    const mapped = fn(item);
    if (mapped !== null) out.push(mapped);
  }
  return out;
}
const lengths = mapNotNull(["rag", "", "agents", ""], (s) => (s.length > 0 ? s.length : null));
type _e3 = Expect<Equal<typeof lengths, number[]>>;
expect(lengths).toEqual([3, 6]);

// EXERCISE 4 — A = string, B = number, so the tuple is [string, number].
async function tryBoth<A, B>(a: () => Promise<A>, b: () => Promise<B>): Promise<[A, B]> {
  return Promise.all([a(), b()]);
}
const both = await tryBoth(
  async () => "embeddings ready",
  async () => 1536
);
type _e4 = Expect<Equal<typeof both, [string, number]>>;
expect(both).toEqual(["embeddings ready", 1536]);

pass("01-generic-functions (solution)");
