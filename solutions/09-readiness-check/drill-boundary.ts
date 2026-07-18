/** SOLUTION — Phase 9 · drill-boundary. */
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// 1.
const TransactionSchema = z.object({
  id: z.string().startsWith("txn_"),
  amount: z.coerce.number().positive(),
  currency: z
    .string()
    .transform((s) => s.toLowerCase())
    .pipe(z.enum(["inr", "usd"])),
  status: z.enum(["created", "settled", "failed"]),
  tags: z.array(z.string()).default([]),
  meta: z.object({ upi: z.string().optional() }).optional(),
});
type Transaction = z.infer<typeof TransactionSchema>;

// 2. Validate per-row so the error can name the row.
function parseTransactions(raw: string): Result<Transaction[], string> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid json" };
  }
  if (!Array.isArray(json)) return { ok: false, error: "expected array" };

  const transactions: Transaction[] = [];
  for (let i = 0; i < json.length; i++) {
    const parsed = TransactionSchema.safeParse(json[i]);
    if (!parsed.success) {
      return { ok: false, error: `row ${i}: ${parsed.error.issues[0]?.message ?? "invalid"}` };
    }
    transactions.push(parsed.data);
  }
  return { ok: true, value: transactions };
}

// 3.
function settledTotal(transactions: Transaction[]): number {
  return transactions.filter((t) => t.status === "settled").reduce((sum, t) => sum + t.amount, 0);
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
  expect(parsed.value[0]!.amount).toBe(450.5);
  expect(parsed.value[0]!.currency).toBe("inr");
  expect(parsed.value[1]!.tags).toEqual([]);
  expect(settledTotal(parsed.value)).toBe(550);
}

expect(parseTransactions("{oops").ok).toBe(false);
const notArray = parseTransactions('{"transactions": []}');
if (!notArray.ok) expect(notArray.error).toBe("expected array");

const badRow = parseTransactions(
  JSON.stringify([
    { id: "txn_1", amount: "10", currency: "inr", status: "settled" },
    { id: "payment_2", amount: "10", currency: "inr", status: "settled" },
  ])
);
expect(badRow.ok).toBe(false);
if (!badRow.ok) expect(badRow.error.startsWith("row 1:")).toBe(true);

const negativeAmount = parseTransactions(
  JSON.stringify([{ id: "txn_9", amount: "-5", currency: "inr", status: "created" }])
);
expect(negativeAmount.ok).toBe(false);

pass("drill-boundary (solution)");
