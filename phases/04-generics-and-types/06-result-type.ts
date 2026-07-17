/**
 * Phase 4 · Exercise 06 — Result<T, E>: errors as values
 *
 * Both must pass:
 *   npm run ts    phases/04-generics-and-types/06-result-type.ts
 *   npm run check phases/04-generics-and-types/06-result-type.ts
 *
 * You will use this exact pattern in Phases 6-8 and the capstone: model
 * calls fail, tools fail, retrieval fails — and `Result` puts that failure
 * IN THE TYPE, where the compiler forces every caller to deal with it.
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — define Result
//
// A discriminated union (Phase 3) with generics (this phase):
//   ok arm:    { ok: true; value: T }
//   error arm: { ok: false; error: E }    with E defaulting to Error
// ─────────────────────────────────────────────────────────────────────────────
type Result<T, E = Error> = never; // REPLACE with the union

// Constructor helpers — implement both (tiny, but you'll use them constantly).
function ok<T>(value: T): Result<T, never> {
  return { ok: true, value } as never; // FIX the return (drop the cast)
}
function err<E>(error: E): Result<never, E> {
  return { ok: false, error } as never; // FIX the return (drop the cast)
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — a function that returns Result instead of throwing
//
// parsePositiveInt: "42" → ok(42); "abc" → err("not a number");
// "-5" → err("must be positive"). Error type is string here.
// ─────────────────────────────────────────────────────────────────────────────
function parsePositiveInt(raw: string): Result<number, string> {
  return err("IMPLEMENT me");
}

const good = parsePositiveInt("42");
expect(good.ok).toBe(true);
if (good.ok) {
  // Inside this branch the compiler KNOWS there's a value — that's the
  // discriminated union narrowing doing the work.
  expect(good.value).toBe(42);
  type _e2 = Expect<Equal<typeof good.value, number>>;
}

const bad = parsePositiveInt("abc");
expect(bad.ok).toBe(false);
if (!bad.ok) expect(bad.error).toBe("not a number");

const negative = parsePositiveInt("-5");
if (!negative.ok) expect(negative.error).toBe("must be positive");

// The compiler FORCES the check — you cannot touch .value without proving ok:
// @ts-expect-error -- accessing value without narrowing must not compile
parsePositiveInt("7").value;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — mapResult: transform the success arm, pass errors through
//
//   mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
// If ok → apply fn to the value. If not → return the error arm unchanged.
// ─────────────────────────────────────────────────────────────────────────────
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result as never; // IMPLEMENT (and drop the cast)
}

const doubled = mapResult(parsePositiveInt("21"), (n) => n * 2);
if (doubled.ok) expect(doubled.value).toBe(42);
const stillBad = mapResult(parsePositiveInt("abc"), (n) => n * 2);
expect(stillBad.ok).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — wrap a throwing function once, safely forever
//
// tryCatch: runs fn; catches anything thrown; normalizes non-Error throws
// with `new Error(String(thrown))`. This is the bridge between
// exception-world (JSON.parse, SDKs) and Result-world (your code).
// ─────────────────────────────────────────────────────────────────────────────
function tryCatch<T>(fn: () => T): Result<T, Error> {
  return err(new Error("IMPLEMENT me"));
}

const parsed = tryCatch(() => JSON.parse('{"a": 1}') as { a: number });
if (parsed.ok) expect(parsed.value).toEqual({ a: 1 });
expect(parsed.ok).toBe(true);

const exploded = tryCatch(() => JSON.parse("{nope") as { a: number });
expect(exploded.ok).toBe(false);
if (!exploded.ok) expect(exploded.error instanceof Error).toBe(true);

pass("06-result-type");
