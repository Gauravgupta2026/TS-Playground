/**
 * Phase 3 · Exercise 02 — Typing functions
 *
 * Both must pass:
 *   npm run ts    phases/03-ts-fundamentals/02-functions.ts
 *   npm run check phases/03-ts-fundamentals/02-functions.ts
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — optional parameters
//
// `slugify` should accept an optional maxLength. Add it as an OPTIONAL param
// (?), and handle the undefined case in the body (slice only when given).
// Note the resulting param type is `number | undefined` — the `?` is just
// sugar for that union plus "may be omitted".
// ─────────────────────────────────────────────────────────────────────────────
function slugify(title: string): string {
  const slug = title.toLowerCase().replaceAll(" ", "-");
  return slug; // then: slice to maxLength when provided (no trailing dash needed)
}

expect(slugify("Learn TypeScript Fast")).toBe("learn-typescript-fast");
// @ts-ignore -- this call is the spec: it must accept a second argument. Fix slugify, then delete this directive.
expect(slugify("Learn TypeScript Fast", 10)).toBe("learn-type");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — function types for callbacks
//
// `retryUntil` takes a predicate callback. Its param is currently typed in
// the laziest legal way — a bare `Function` — which checks NOTHING (wrong
// args, wrong return, all fine at the call site... until runtime).
// Replace `Function` with a precise function type:  (attempt: number) => boolean
//
// The @ts-expect-error line below is your spec, inverted: it REQUIRES the
// line under it to be a compile error. While the param is `Function`, the
// wrong callback compiles fine → the directive is "unused" → check FAILS.
// Fix the param type and the wrong callback is rejected → check passes.
// ─────────────────────────────────────────────────────────────────────────────
function retryUntil(shouldStop: Function, maxAttempts: number): number {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (shouldStop(attempt)) return attempt;
  }
  return maxAttempts;
}

expect(retryUntil((attempt: number) => attempt === 3, 10)).toBe(3);
// @ts-expect-error -- a callback with the wrong parameter type must be rejected
retryUntil((name: string) => name === "done", 5);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — typing async functions
//
// An async function's return annotation is always Promise<...>. This one
// has a bug: `name` is assigned the raw id (a number), not a formatted
// string. Step 1: annotate the return type as Promise<{ id: number; name:
// string }> — watch the error appear ON THE RETURN STATEMENT, exactly where
// the bug lives. Step 2: fix the body (`user-${id}`).
// ─────────────────────────────────────────────────────────────────────────────
async function fetchUser(id: number) {
  return { id, name: id };
}

type _e3 = Expect<Equal<ReturnType<typeof fetchUser>, Promise<{ id: number; name: string }>>>;
expect((await fetchUser(7)).name).toBe("user-7");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — void vs return values
//
// `logEach` maps over items and RETURNS the results — but it's annotated
// `void`, so the return value is thrown away and the check below can't even
// compile. Decide what this function actually is: if callers need the
// results, the annotation is wrong. Fix the annotation (string[]).
// ─────────────────────────────────────────────────────────────────────────────
function logEach(items: string[]): void {
  return items.map((item) => `[log] ${item}`);
}

// @ts-ignore -- remove after fixing logEach's return type
expect(logEach(["a", "b"])).toEqual(["[log] a", "[log] b"]);

pass("02-functions");
