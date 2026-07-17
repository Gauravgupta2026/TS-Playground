/** SOLUTION — Phase 3 · 05. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — each branch sees a narrowed type.
function describe(value: string | number | boolean): string {
  if (typeof value === "number") return value.toFixed(1);
  if (typeof value === "string") return value.toUpperCase();
  return value ? "yes" : "no";
}
expect(describe(3.5)).toBe("3.5");
expect(describe("loud")).toBe("LOUD");
expect(describe(true)).toBe("yes");
expect(describe(false)).toBe("no");

// EXERCISE 2 — test for undefined explicitly; !count also swallows 0.
function labelCount(count?: number): string {
  if (count === undefined) return "no items";
  return `${count} items`;
}
expect(labelCount()).toBe("no items");
expect(labelCount(3)).toBe("3 items");
expect(labelCount(0)).toBe("0 items");

// EXERCISE 3 — `in` narrows by property existence.
type ApiSuccess = { data: string[] };
type ApiFailure = { error: string; retryable: boolean };

function summarizeResult(result: ApiSuccess | ApiFailure): string {
  if ("data" in result) return `${result.data.length} rows`;
  return `error: ${result.error}`;
}
expect(summarizeResult({ data: ["a", "b", "c"] })).toBe("3 rows");
expect(summarizeResult({ error: "rate limited", retryable: true })).toBe("error: rate limited");

// EXERCISE 4 — handle every variant; the never default keeps it that way.
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
    case "refund":
      return -event.amountInr;
    default: {
      const unhandled: never = event;
      throw new Error(`unhandled event: ${JSON.stringify(unhandled)}`);
    }
  }
}
expect(amountFor({ kind: "succeeded", amountInr: 500 })).toBe(500);
expect(amountFor({ kind: "failed", reason: "card declined" })).toBe(0);
expect(amountFor({ kind: "refund", amountInr: 200 })).toBe(-200);

pass("05-narrowing (solution)");
