/**
 * Phase 3 · Exercise 04 — Unions and literal types
 *
 * Both must pass:
 *   npm run ts    phases/03-ts-fundamentals/04-unions-and-literals.ts
 *   npm run check phases/03-ts-fundamentals/04-unions-and-literals.ts
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — kill the stringly-typed state
//
// `status: string` accepts ANY string — including the typo below, which
// currently ships to production. Replace string with a literal union:
//   "queued" | "running" | "done" | "failed"
// The typo'd assignment then becomes a compile error — fix its spelling.
// ─────────────────────────────────────────────────────────────────────────────
type JobStatus = string; // REPLACE with a literal union

let jobStatus: JobStatus = "queued";
jobStatus = "runnning"; // typo! must become a compile error, then fix spelling

expect(jobStatus).toBe("running");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — unions only allow COMMON members before narrowing
//
// formatInput takes string | string[]. The current body calls .join on it
// directly — but string doesn't have .join, so it can't compile. Fix by
// checking Array.isArray first (that's narrowing — full treatment next file).
// ─────────────────────────────────────────────────────────────────────────────
function formatInput(input: string | string[]): string {
  return input.join(", "); // BUG: string has no .join
}

expect(formatInput("solo")).toBe("solo");
expect(formatInput(["a", "b", "c"])).toBe("a, b, c");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — literal widening and `as const`
//
// We want RETRY_CONFIG.mode to be the LITERAL type "exponential" (so it's
// assignable to Mode), but property values in a plain object literal widen
// to string. Add `as const` to the object — it freezes every property to
// its literal type (and makes them readonly).
// ─────────────────────────────────────────────────────────────────────────────
type Mode = "exponential" | "linear";

const RETRY_CONFIG = {
  mode: "exponential",
  maxAttempts: 3,
};

const chosenMode: Mode = RETRY_CONFIG.mode; // error until as const
type _e3 = Expect<Equal<typeof RETRY_CONFIG.maxAttempts, 3>>; // literal 3, not number

expect(chosenMode).toBe("exponential");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — union of literals as a function contract
//
// Implement `move`: takes a direction ("up" | "down" | "left" | "right")
// and a position, returns the new position. Type the direction param with
// the union — the invalid call at the bottom must NOT compile (it's marked
// @ts-expect-error: if your types are right, that line "errors correctly"
// and check passes; if you use plain string, the directive itself errors).
// ─────────────────────────────────────────────────────────────────────────────
type Position = { x: number; y: number };

function move(direction: string, from: Position): Position {
  // CHANGE the direction type, IMPLEMENT the four cases (a switch reads well)
  return from;
}

expect(move("up", { x: 0, y: 0 })).toEqual({ x: 0, y: -1 });
expect(move("down", { x: 0, y: 0 })).toEqual({ x: 0, y: 1 });
expect(move("left", { x: 5, y: 5 })).toEqual({ x: 4, y: 5 });
expect(move("right", { x: 5, y: 5 })).toEqual({ x: 6, y: 5 });

// @ts-expect-error -- "diagonal" must be rejected by the type system
move("diagonal", { x: 0, y: 0 });

pass("04-unions-and-literals");
