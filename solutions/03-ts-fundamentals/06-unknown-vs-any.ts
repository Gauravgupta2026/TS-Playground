/** SOLUTION — Phase 3 · 06. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — unknown forces the proof any let us skip.
function shout(value: unknown): string {
  if (typeof value === "string") return value.toUpperCase();
  return String(value);
}
expect(shout("hello")).toBe("HELLO");
expect(shout(42)).toBe("42");

// EXERCISE 2 — contain the any at its source with an unknown return type.
function parseConfig(raw: string): unknown {
  return JSON.parse(raw);
}
const config = parseConfig('{"retries": 3}');
// @ts-expect-error -- property access on unproven data must not compile
const naive: number = config.retries * 2;

// EXERCISE 3 — a type predicate teaches the compiler a new narrowing move.
type RetryConfig = { retries: number };

function isRetryConfig(value: unknown): value is RetryConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "retries" in value &&
    typeof (value as Record<string, unknown>).retries === "number"
  );
}

function safeRetries(raw: string): number {
  const parsed: unknown = JSON.parse(raw);
  if (isRetryConfig(parsed)) {
    return parsed.retries;
  }
  return 0;
}
expect(safeRetries('{"retries": 3}')).toBe(3);
expect(safeRetries('{"retries": "three"}')).toBe(0);
expect(safeRetries('"just a string"')).toBe(0);
expect(safeRetries("null")).toBe(0);

// EXERCISE 4 — anything can be thrown, so narrow before reading .message.
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
try {
  throw new Error("model call failed");
} catch (err) {
  expect(errorMessage(err)).toBe("model call failed");
}
expect(errorMessage("raw string thrown")).toBe("raw string thrown");
expect(errorMessage(404)).toBe("404");

pass("06-unknown-vs-any (solution)");
