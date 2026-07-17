/** SOLUTION — Phase 4 · 05. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

type Agent = { name: string; systemPrompt: string; maxTurns: number };

// EXERCISE 1 — Partial's actual definition.
type MyPartial<T> = { [K in keyof T]?: T[K] };
type _e1 = Expect<Equal<MyPartial<Agent>, Partial<Agent>>>;

// EXERCISE 2
type Nullable<T> = { [K in keyof T]: T[K] | null };
type _e2 = Expect<
  Equal<Nullable<Agent>, { name: string | null; systemPrompt: string | null; maxTurns: number | null }>
>;

// EXERCISE 3 — infer pattern-matches the element type out.
type ElementOf<T> = T extends (infer E)[] ? E : never;
type _e3a = Expect<Equal<ElementOf<string[]>, string>>;
type _e3b = Expect<Equal<ElementOf<{ id: number }[]>, { id: number }>>;
type _e3c = Expect<Equal<ElementOf<number>, never>>;

// EXERCISE 4 — one level of unwrap; non-promises pass through.
type MyAwaited<T> = T extends Promise<infer V> ? V : T;
type _e4a = Expect<Equal<MyAwaited<Promise<string>>, string>>;
type _e4b = Expect<Equal<MyAwaited<Promise<{ tokens: number }>>, { tokens: number }>>;
type _e4c = Expect<Equal<MyAwaited<boolean>, boolean>>;

// EXERCISE 5 — everything composed: constraint + mapped + ReturnType + MyAwaited.
const handlers = {
  listDocs: async () => [{ id: 1 }],
  countTokens: () => 42,
};

type ApiShape<T extends Record<string, (...args: never[]) => unknown>> = {
  [K in keyof T]: MyAwaited<ReturnType<T[K]>>;
};

type _e5 = Expect<Equal<ApiShape<typeof handlers>, { listDocs: { id: number }[]; countTokens: number }>>;

expect(handlers.countTokens()).toBe(42);
pass("05-mapped-and-conditional (solution)");
