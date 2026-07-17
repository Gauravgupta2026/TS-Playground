/**
 * Tiny runtime assertion helper for exercises.
 *
 * Usage:
 *   import { expect, pass } from "../../helpers/assert";
 *   expect(add(2, 3)).toBe(5);
 *   pass("01-values-and-variables");   // call at the end of the file
 *
 * The API deliberately mirrors vitest's expect() — the muscle memory you
 * build here transfers directly to real test suites in Phase 5.
 */
import { isDeepStrictEqual, inspect } from "node:util";

let checkCount = 0;

class CheckFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckFailure";
  }
}

function show(value: unknown): string {
  return inspect(value, { depth: 4, colors: false, compact: true });
}

export function expect(actual: unknown) {
  checkCount += 1;
  const n = checkCount;
  return {
    /** Strict equality (===). Use for primitives. */
    toBe(expected: unknown): void {
      if (actual !== expected) {
        throw new CheckFailure(
          `check #${n} failed:\n  expected: ${show(expected)}\n  received: ${show(actual)}`
        );
      }
    },
    /** Deep structural equality. Use for objects and arrays. */
    toEqual(expected: unknown): void {
      if (!isDeepStrictEqual(actual, expected)) {
        throw new CheckFailure(
          `check #${n} failed (deep equality):\n  expected: ${show(expected)}\n  received: ${show(actual)}`
        );
      }
    },
    /** Asserts the value (which must be a function) throws when called. */
    toThrow(messageIncludes?: string): void {
      if (typeof actual !== "function") {
        throw new CheckFailure(`check #${n}: expect(...).toThrow() needs a function, got ${show(actual)}`);
      }
      let threw = false;
      let thrown: unknown;
      try {
        actual();
      } catch (err) {
        threw = true;
        thrown = err;
      }
      if (!threw) {
        throw new CheckFailure(`check #${n} failed: expected the function to throw, but it did not`);
      }
      if (messageIncludes !== undefined) {
        const msg = thrown instanceof Error ? thrown.message : String(thrown);
        if (!msg.includes(messageIncludes)) {
          throw new CheckFailure(
            `check #${n} failed: thrown message ${show(msg)} does not include ${show(messageIncludes)}`
          );
        }
      }
    },
  };
}

/** Call once at the very end of an exercise file. Prints a success banner. */
export function pass(exerciseName: string): void {
  console.log(`\n✅ ${exerciseName}: all ${checkCount} checks passed. Tick it off in PROGRESS.md.`);
}
