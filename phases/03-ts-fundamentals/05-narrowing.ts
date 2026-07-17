/**
 * Phase 3 · Exercise 05 — Narrowing and discriminated unions
 *
 * Both must pass:
 *   npm run ts    phases/03-ts-fundamentals/05-narrowing.ts
 *   npm run check phases/03-ts-fundamentals/05-narrowing.ts
 *
 * This file teaches THE pattern of typed AI engineering: the Anthropic SDK
 * types model responses as discriminated unions (content blocks with
 * type: "text" | "tool_use"), and you'll narrow them in Phase 6 exactly
 * like you narrow here.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — typeof narrowing
//
// Implement describe: numbers → fixed to 1 decimal ("3.5"), strings →
// uppercased, booleans → "yes"/"no". The compiler will only let you call
// each method AFTER you've narrowed with typeof.
// ─────────────────────────────────────────────────────────────────────────────
function describe(value: string | number | boolean): string {
  return ""; // IMPLEMENT with typeof checks
}

expect(describe(3.5)).toBe("3.5");
expect(describe("loud")).toBe("LOUD");
expect(describe(true)).toBe("yes");
expect(describe(false)).toBe("no");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — truthiness narrowing has a trap
//
// labelCount returns "no items" when count is missing, else "N items".
// The current truthiness check `if (!count)` also swallows 0 — but 0 is a
// real count! Fix the check to test for undefined specifically.
// ─────────────────────────────────────────────────────────────────────────────
function labelCount(count?: number): string {
  if (!count) return "no items";
  return `${count} items`;
}

expect(labelCount()).toBe("no items");
expect(labelCount(3)).toBe("3 items");
expect(labelCount(0)).toBe("0 items"); // ← the trap

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the `in` guard
//
// Two API result shapes, no shared discriminant. Use the `in` operator to
// tell them apart: "data" in result narrows to the success shape.
// ─────────────────────────────────────────────────────────────────────────────
type ApiSuccess = { data: string[] };
type ApiFailure = { error: string; retryable: boolean };

function summarizeResult(result: ApiSuccess | ApiFailure): string {
  return ""; // IMPLEMENT: "3 rows" for success, "error: <msg>" for failure
}

expect(summarizeResult({ data: ["a", "b", "c"] })).toBe("3 rows");
expect(summarizeResult({ error: "rate limited", retryable: true })).toBe("error: rate limited");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — discriminated union + exhaustiveness
//
// A payment event union with a `kind` discriminant. Implement handle() with
// a switch on event.kind. THEN: the union just grew — someone added
// "refund" — and the default branch's `never` trick turns that into a
// compile error until you handle it. That error is the feature: every
// unhandled variant surfaces at compile time, not in production.
//
// amountFor: succeeded → amountInr; failed → 0; refund → -amountInr.
// ─────────────────────────────────────────────────────────────────────────────
type PaymentEvent =
  | { kind: "succeeded"; amountInr: number }
  | { kind: "failed"; reason: string }
  | { kind: "refund"; amountInr: number };

function amountFor(event: PaymentEvent): number {
  switch (event.kind) {
    case "succeeded":
      return event.amountInr;
    case "failed":
      return 0;
    default: {
      // Exhaustiveness check: `event` must be `never` here — i.e. every
      // variant handled above. "refund" reaches this line, so `event` is
      // NOT never, and this assignment fails to compile. Add a case for it.
      const unhandled: never = event;
      throw new Error(`unhandled event: ${JSON.stringify(unhandled)}`);
    }
  }
}

expect(amountFor({ kind: "succeeded", amountInr: 500 })).toBe(500);
expect(amountFor({ kind: "failed", reason: "card declined" })).toBe(0);
expect(amountFor({ kind: "refund", amountInr: 200 })).toBe(-200);

pass("05-narrowing");
