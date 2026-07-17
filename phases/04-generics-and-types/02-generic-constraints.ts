/**
 * Phase 4 · Exercise 02 — Constraints and generic types
 *
 * Both must pass:
 *   npm run ts    phases/04-generics-and-types/02-generic-constraints.ts
 *   npm run check phases/04-generics-and-types/02-generic-constraints.ts
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the missing constraint
//
// `longest` compares .length — but bare T doesn't promise a length, so the
// body can't compile. Add the constraint:  T extends { length: number }.
// The number call below must then be a REAL error (satisfying its directive).
// ─────────────────────────────────────────────────────────────────────────────
function longest<T>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

expect(longest("hello", "hi")).toBe("hello");
expect(longest([1, 2, 3], [4])).toEqual([1, 2, 3]);
// @ts-expect-error -- numbers have no length; must be rejected
longest(10, 20);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — keyof constraint: the most important signature in TS
//
// Implement `pluck`: extracts one property from every object in an array.
//   pluck<T, K extends keyof T>(items: T[], key: K): T[K][]
// The typo'd call below must stay a compile error.
// ─────────────────────────────────────────────────────────────────────────────
type Doc = { id: number; title: string; tokens: number };
const docs: Doc[] = [
  { id: 1, title: "intro to RAG", tokens: 480 },
  { id: 2, title: "agent loops", tokens: 720 },
];

function pluck(items: Doc[], key: string): unknown[] {
  // RETYPE with <T, K extends keyof T> — and the body barely changes
  return items.map((item) => (item as Record<string, unknown>)[key]);
}

const titles = pluck(docs, "title");
type _e2 = Expect<Equal<typeof titles, string[]>>;
expect(titles).toEqual(["intro to RAG", "agent loops"]);

// @ts-expect-error -- "titel" is not a key of Doc; must be rejected
pluck(docs, "titel");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — generic TYPES (not just functions)
//
// Define Page<T>: a generic pagination wrapper —
//   { items: T[]; page: number; hasMore: boolean }
// Then fix nextPage to be generic too: Page<T> in, Page<T> out.
// ─────────────────────────────────────────────────────────────────────────────
type Page = { items: unknown[]; page: number; hasMore: boolean }; // MAKE generic

function nextPage(current: Page, newItems: unknown[]): Page {
  // MAKE generic: <T>(current: Page<T>, newItems: T[]): Page<T>
  return { items: newItems, page: current.page + 1, hasMore: newItems.length > 0 };
}

const page1 = { items: ["doc-a", "doc-b"], page: 1, hasMore: true };
const page2 = nextPage(page1, ["doc-c"]);
type _e3 = Expect<Equal<(typeof page2)["items"], string[]>>;
expect(page2.page).toBe(2);
expect(page2.items).toEqual(["doc-c"]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — default type parameters
//
// ApiResponse wraps a payload; most endpoints return string messages, so
// make the payload type DEFAULT to string:  <T = string>.
// Both usages below must then compile: one names a type, one relies on the
// default.
// ─────────────────────────────────────────────────────────────────────────────
type ApiResponse<T> = { status: number; payload: T };

const typed: ApiResponse<{ userId: number }> = { status: 200, payload: { userId: 7 } };
// @ts-ignore -- must compile WITHOUT a type argument once the default exists; then delete this directive
const defaulted: ApiResponse = { status: 200, payload: "pong" };

type _e4 = Expect<Equal<(typeof defaulted)["payload"], string>>; // fails until the default exists
expect(typed.payload.userId).toBe(7);
expect(defaulted.payload).toBe("pong");

pass("02-generic-constraints");
