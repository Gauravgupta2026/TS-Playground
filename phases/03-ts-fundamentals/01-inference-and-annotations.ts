/**
 * Phase 3 · Exercise 01 — Inference and annotations
 *
 * NEW WORKFLOW — two commands, both must pass:
 *   npm run ts    phases/03-ts-fundamentals/01-inference-and-annotations.ts
 *   npm run check phases/03-ts-fundamentals/01-inference-and-annotations.ts
 *
 * `check` is the TypeScript compiler. From now on, compiler errors are the
 * exercise. Read them slowly — TS errors state the problem precisely once
 * you learn their dialect: "Type 'X' is not assignable to type 'Y'" means a
 * value shaped like X arrived where only Y is allowed.
 *
 * Meet the type-level assertions we'll use from here on:
 *   type _check = Expect<Equal<A, B>>;
 * compiles ONLY if A and B are exactly the same type. A failing one is a
 * compile error — the type checker is now your test runner.
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — read what inference already knows
//
// No code to change — fill in the three `Expect<Equal<...>>` right-hand
// sides with the type TS inferred. Hover the variables in your editor to
// see. Note the difference between `let` (widened) and `const` (literal)!
// ─────────────────────────────────────────────────────────────────────────────
let sessionCount = 42;
const appName = "ts-playground";
let scores = [98, 87, 91];

type _e1a = Expect<Equal<typeof sessionCount, unknown>>; // REPLACE unknown
type _e1b = Expect<Equal<typeof appName, unknown>>; // REPLACE unknown (careful: const!)
type _e1c = Expect<Equal<typeof scores, unknown>>; // REPLACE unknown

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — the annotation that's a lie
//
// Someone annotated this wrong and then "fixed" the error with `as`. Delete
// the lie (both the wrong annotation and the `as`) and give `port` its
// correct type — or no annotation at all; inference gets it right.
// ─────────────────────────────────────────────────────────────────────────────
const port: string = 3000 as unknown as string;

expect(typeof port).toBe("number"); // runtime doesn't lie, even when `as` does

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — annotate the boundary
//
// House style: annotate function params + return, infer locals. This
// function has neither — TS infers `any` for the params (implicit any is an
// ERROR under strict mode; run `check` and read it). Add proper types.
// It formats a price in paise into rupees: formatPrice(129900) → "₹1299.00"
// ─────────────────────────────────────────────────────────────────────────────
// @ts-ignore -- remove this line, then fix the signature properly
function formatPrice(paise, currencySymbol) {
  const rupees = paise / 100;
  return `${currencySymbol}${rupees.toFixed(2)}`;
}

expect(formatPrice(129900, "₹")).toBe("₹1299.00");
type _e3 = Expect<Equal<ReturnType<typeof formatPrice>, string>>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — return annotations catch bugs AT THE SOURCE
//
// This function claims to return a number but a code path returns a string.
// Without the annotation, the bug would flow downstream and explode at the
// call site. With it, the error is HERE. Fix the buggy path (parse it with
// Number()), keep the annotation.
// ─────────────────────────────────────────────────────────────────────────────
function parseScore(raw: string | number): number {
  if (typeof raw === "number") return raw;
  return raw; // BUG: returns the string unparsed
}

expect(parseScore(91)).toBe(91);
expect(parseScore("87")).toBe(87);

pass("01-inference-and-annotations");
