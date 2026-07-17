/** SOLUTION — Phase 4 · 06. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — discriminated union + generics, E defaulting to Error.
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}
function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// EXERCISE 2 — failure is part of the signature now.
function parsePositiveInt(raw: string): Result<number, string> {
  const n = Number(raw);
  if (Number.isNaN(n) || !Number.isInteger(n)) return err("not a number");
  if (n < 0) return err("must be positive");
  return ok(n);
}

const good = parsePositiveInt("42");
expect(good.ok).toBe(true);
if (good.ok) {
  expect(good.value).toBe(42);
  type _e2 = Expect<Equal<typeof good.value, number>>;
}

const bad = parsePositiveInt("abc");
expect(bad.ok).toBe(false);
if (!bad.ok) expect(bad.error).toBe("not a number");

const negative = parsePositiveInt("-5");
if (!negative.ok) expect(negative.error).toBe("must be positive");

// @ts-expect-error -- accessing value without narrowing must not compile
parsePositiveInt("7").value;

// EXERCISE 3 — narrow, transform the ok arm, pass the error arm through.
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) return { ok: true, value: fn(result.value) };
  return result;
}

const doubled = mapResult(parsePositiveInt("21"), (n) => n * 2);
if (doubled.ok) expect(doubled.value).toBe(42);
const stillBad = mapResult(parsePositiveInt("abc"), (n) => n * 2);
expect(stillBad.ok).toBe(false);

// EXERCISE 4 — the exception→Result bridge; normalize non-Error throws.
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (thrown) {
    return err(thrown instanceof Error ? thrown : new Error(String(thrown)));
  }
}

const parsed = tryCatch(() => JSON.parse('{"a": 1}') as { a: number });
if (parsed.ok) expect(parsed.value).toEqual({ a: 1 });
expect(parsed.ok).toBe(true);

const exploded = tryCatch(() => JSON.parse("{nope") as { a: number });
expect(exploded.ok).toBe(false);
if (!exploded.ok) expect(exploded.error instanceof Error).toBe(true);

pass("06-result-type (solution)");
