/**
 * Phase 4 · Exercise 05 — Mapped and conditional types
 *
 * Type-check is the main event here:
 *   npm run check phases/04-generics-and-types/05-mapped-and-conditional.ts
 * (npm run ts still needs to pass — it mostly just prints the banner.)
 *
 * Goal: READ these fluently and write the simple ones. This is how Partial,
 * ReturnType and friends are actually built — after this file, utility
 * types stop being magic.
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

type Agent = { name: string; systemPrompt: string; maxTurns: number };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — build MyPartial (yes, the real Partial)
//
// A mapped type loops over keys:  { [K in keyof T]: T[K] }  is an identity
// copy. Add `?` after the bracket to make every property optional.
// ─────────────────────────────────────────────────────────────────────────────
type MyPartial<T> = { [K in keyof T]: T[K] }; // ADD the ?

type _e1 = Expect<Equal<MyPartial<Agent>, Partial<Agent>>>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — build Nullable<T>
//
// Same shape, different tweak: every property keeps its type but also
// allows null:  T[K] | null.
// ─────────────────────────────────────────────────────────────────────────────
type Nullable<T> = { [K in keyof T]: T[K] }; // ADD | null to the value

type _e2 = Expect<
  Equal<Nullable<Agent>, { name: string | null; systemPrompt: string | null; maxTurns: number | null }>
>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — conditional types: if/else for types
//
// Write ElementOf<T>: if T is an array type, give its element type;
// otherwise never.  T extends (infer E)[] ? E : never
// `infer E` pattern-matches the element type out of the array.
// ─────────────────────────────────────────────────────────────────────────────
type ElementOf<T> = never; // REPLACE with the conditional

type _e3a = Expect<Equal<ElementOf<string[]>, string>>;
type _e3b = Expect<Equal<ElementOf<{ id: number }[]>, { id: number }>>;
type _e3c = Expect<Equal<ElementOf<number>, never>>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — build MyAwaited (simplified)
//
// Unwrap ONE level of Promise: Promise<string> → string; non-promises pass
// through unchanged.  T extends Promise<infer V> ? V : T
// ─────────────────────────────────────────────────────────────────────────────
type MyAwaited<T> = T; // REPLACE with the conditional

type _e4a = Expect<Equal<MyAwaited<Promise<string>>, string>>;
type _e4b = Expect<Equal<MyAwaited<Promise<{ tokens: number }>>, { tokens: number }>>;
type _e4c = Expect<Equal<MyAwaited<boolean>, boolean>>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5 — a practical composition: ApiShape
//
// Given a record of handler functions, derive a record of their RESOLVED
// return types — this is how tRPC-style frameworks type their clients:
//   type ApiShape<T> = { [K in keyof T]: MyAwaited<ReturnType<T[K]>> }
// You'll need a constraint on T for ReturnType to be legal:
//   T extends Record<string, (...args: never[]) => unknown>
// ─────────────────────────────────────────────────────────────────────────────
const handlers = {
  listDocs: async () => [{ id: 1 }],
  countTokens: () => 42,
};

type ApiShape<T> = never; // REPLACE (constraint + mapped + MyAwaited + ReturnType)

type _e5 = Expect<Equal<ApiShape<typeof handlers>, { listDocs: { id: number }[]; countTokens: number }>>;

expect(handlers.countTokens()).toBe(42);
pass("05-mapped-and-conditional");
