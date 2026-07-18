/**
 * Phase 9 · DRILL — Boundary
 *
 * Gate: npm run ts + npm run check, both green. No guidance below this line.
 */
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// SPEC — a payments API returns transaction lists as messy JSON. Build:
//
// 1. TransactionSchema, accepting objects like:
//      { "id": "txn_1", "amount": "450.50", "currency": "inr",
//        "status": "settled", "tags": ["food"], "meta": { "upi": "a@ok" } }
//    Rules:
//      id: string starting with "txn_"        (.startsWith)
//      amount: arrives as a STRING → coerce to number, must be > 0
//      currency: "inr" | "usd" (lowercase them first: z.string()
//                .transform(s => s.toLowerCase()).pipe(z.enum([...])))
//      status: "created" | "settled" | "failed"
//      tags: array of strings, DEFAULT []
//      meta: optional object with optional upi string — unknown extra keys
//            inside meta must NOT fail parsing
//
// 2. parseTransactions(raw: string) → Result<Transaction[], string>
//      - invalid JSON            → err("invalid json")
//      - top level not an array  → err("expected array")
//      - ANY element invalid     → err(`row ${i}: ${first issue message}`)
//        (report the FIRST bad row's index)
//
// 3. settledTotal(transactions): sum of amount for status "settled" only.

const TransactionSchema = z.object({});
type Transaction = z.infer<typeof TransactionSchema>;

function parseTransactions(raw: string): Result<Transaction[], string> {
  return { ok: false, error: "IMPLEMENT" };
}

function settledTotal(transactions: Transaction[]): number {
  return -1;
}

// ── The spec ────────────────────────────────────────────────────────────────
const goodPayload = JSON.stringify([
  { id: "txn_1", amount: "450.50", currency: "INR", status: "settled", tags: ["food"] },
  { id: "txn_2", amount: "1200", currency: "usd", status: "created" },
  { id: "txn_3", amount: "99.5", currency: "inr", status: "settled", meta: { upi: "gg@ok", extra: 1 } },
]);

const parsed = parseTransactions(goodPayload);
expect(parsed.ok).toBe(true);
if (parsed.ok) {
  expect(parsed.value.length).toBe(3);
  expect(parsed.value[0]!.amount).toBe(450.5); // number now, not string
  expect(parsed.value[0]!.currency).toBe("inr"); // lowercased
  expect(parsed.value[1]!.tags).toEqual([]); // defaulted
  expect(settledTotal(parsed.value)).toBe(550);
}

expect(parseTransactions("{oops").ok).toBe(false);
const notArray = parseTransactions('{"transactions": []}');
if (!notArray.ok) expect(notArray.error).toBe("expected array");

const badRow = parseTransactions(
  JSON.stringify([
    { id: "txn_1", amount: "10", currency: "inr", status: "settled" },
    { id: "payment_2", amount: "10", currency: "inr", status: "settled" }, // bad id prefix
  ])
);
expect(badRow.ok).toBe(false);
if (!badRow.ok) expect(badRow.error.startsWith("row 1:")).toBe(true);

const negativeAmount = parseTransactions(
  JSON.stringify([{ id: "txn_9", amount: "-5", currency: "inr", status: "created" }])
);
expect(negativeAmount.ok).toBe(false);

pass("drill-boundary — 3/4 gates down.");
