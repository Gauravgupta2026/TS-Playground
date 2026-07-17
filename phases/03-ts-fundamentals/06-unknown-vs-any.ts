/**
 * Phase 3 · Exercise 06 — unknown vs any
 *
 * Both must pass:
 *   npm run ts    phases/03-ts-fundamentals/06-unknown-vs-any.ts
 *   npm run check phases/03-ts-fundamentals/06-unknown-vs-any.ts
 *
 * `any` turns the type checker OFF for a value — and it spreads: everything
 * an `any` touches becomes unchecked too. `unknown` is the honest version:
 * "no idea what this is — prove it before using it." This file makes you
 * feel the difference, then makes you write the proof.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — watch any disable the compiler
//
// This code has an obvious bug — calling .toUpperCase() on a number — and
// the compiler says NOTHING, because the value came in as `any`.
// Change the parameter type from any to unknown. Now the compiler rejects
// the unproven call. Then fix the body: only uppercase when
// typeof value === "string"; otherwise String(value).
// ─────────────────────────────────────────────────────────────────────────────
function shout(value: any): string {
  return value.toUpperCase(); // compiles today; crashes on numbers at runtime
}

expect(shout("hello")).toBe("HELLO");
expect(shout(42)).toBe("42"); // crashes until you fix the body

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — JSON.parse returns any: contain it immediately
//
// JSON.parse is the #1 source of `any` leaks in real codebases. parseConfig
// currently returns the raw parse result — `any` — so the WRONG usage below
// compiles without complaint.
// Fix: give parseConfig the return type `unknown`. The bad line then stops
// compiling — the @ts-expect-error above it is your spec (it FAILS the check
// while the return type is any, because the directive would be "unused").
// ─────────────────────────────────────────────────────────────────────────────
function parseConfig(raw: string) {
  return JSON.parse(raw);
}

const config = parseConfig('{"retries": 3}');
// @ts-expect-error -- property access on unproven data must not compile
const naive: number = config.retries * 2;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — now write the proof: a type guard function
//
// A "type predicate" function — `value is RetryConfig` — teaches the
// compiler a new narrowing move. Implement isRetryConfig: value must be a
// non-null object with a numeric `retries` property.
// Checks you need: typeof value === "object", value !== null,
// "retries" in value, typeof (value as Record<string, unknown>).retries === "number".
// ─────────────────────────────────────────────────────────────────────────────
type RetryConfig = { retries: number };

function isRetryConfig(value: unknown): value is RetryConfig {
  return false; // IMPLEMENT the checks
}

function safeRetries(raw: string): number {
  const parsed: unknown = JSON.parse(raw);
  if (isRetryConfig(parsed)) {
    return parsed.retries; // narrowed! the guard proved the shape
  }
  return 0;
}

expect(safeRetries('{"retries": 3}')).toBe(3);
expect(safeRetries('{"retries": "three"}')).toBe(0); // wrong type inside
expect(safeRetries('"just a string"')).toBe(0); // not even an object
expect(safeRetries("null")).toBe(0); // null is typeof "object"! guard must survive it

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — catch blocks give you unknown
//
// Since TS 4.4 (with strict settings), the error in `catch (err)` is
// `unknown` — because ANYTHING can be thrown. Implement errorMessage:
// if err is an Error instance → its .message; otherwise → String(err).
// ─────────────────────────────────────────────────────────────────────────────
function errorMessage(err: unknown): string {
  return ""; // IMPLEMENT with instanceof narrowing
}

try {
  throw new Error("model call failed");
} catch (err) {
  expect(errorMessage(err)).toBe("model call failed");
}
expect(errorMessage("raw string thrown")).toBe("raw string thrown");
expect(errorMessage(404)).toBe("404");

pass("06-unknown-vs-any");
