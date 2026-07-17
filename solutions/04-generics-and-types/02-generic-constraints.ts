/** SOLUTION — Phase 4 · 02. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — the constraint licenses .length in the body.
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
expect(longest("hello", "hi")).toBe("hello");
expect(longest([1, 2, 3], [4])).toEqual([1, 2, 3]);
// @ts-expect-error -- numbers have no length; must be rejected
longest(10, 20);

// EXERCISE 2 — K is proven to be a key of T, so item[key] is just… legal.
type Doc = { id: number; title: string; tokens: number };
const docs: Doc[] = [
  { id: 1, title: "intro to RAG", tokens: 480 },
  { id: 2, title: "agent loops", tokens: 720 },
];

function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
const titles = pluck(docs, "title");
type _e2 = Expect<Equal<typeof titles, string[]>>;
expect(titles).toEqual(["intro to RAG", "agent loops"]);
// @ts-expect-error -- "titel" is not a key of Doc; must be rejected
pluck(docs, "titel");

// EXERCISE 3 — generic type + generic function, sharing T.
type Page<T> = { items: T[]; page: number; hasMore: boolean };

function nextPage<T>(current: Page<T>, newItems: T[]): Page<T> {
  return { items: newItems, page: current.page + 1, hasMore: newItems.length > 0 };
}
const page1 = { items: ["doc-a", "doc-b"], page: 1, hasMore: true };
const page2 = nextPage(page1, ["doc-c"]);
type _e3 = Expect<Equal<(typeof page2)["items"], string[]>>;
expect(page2.page).toBe(2);
expect(page2.items).toEqual(["doc-c"]);

// EXERCISE 4 — `= string` makes the type argument optional.
type ApiResponse<T = string> = { status: number; payload: T };

const typed: ApiResponse<{ userId: number }> = { status: 200, payload: { userId: 7 } };
const defaulted: ApiResponse = { status: 200, payload: "pong" };
type _e4 = Expect<Equal<(typeof defaulted)["payload"], string>>;
expect(typed.payload.userId).toBe(7);
expect(defaulted.payload).toBe("pong");

pass("02-generic-constraints (solution)");
