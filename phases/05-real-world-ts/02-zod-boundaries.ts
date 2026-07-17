/**
 * Phase 5 · Exercise 02 — Zod at the boundaries
 *
 * Both must pass:
 *   npm run ts    phases/05-real-world-ts/02-zod-boundaries.ts
 *   npm run check phases/05-real-world-ts/02-zod-boundaries.ts
 *
 * The boundary principle: validate external data, trust internal code.
 * Zod = one schema that is BOTH the runtime validator and (via z.infer)
 * the static type. No drift, ever.
 */
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — your first schema
//
// Model a webhook payload:
//   event: exactly "payment.completed" (z.literal)
//   amountInr: positive integer (z.number().int().positive())
//   upiId: string containing "@" (z.string().includes("@"))
//   note: optional string (.optional())
// ─────────────────────────────────────────────────────────────────────────────
const WebhookSchema = z.object({
  event: z.string(), // TIGHTEN to a literal
  amountInr: z.number(), // TIGHTEN: int + positive
  upiId: z.string(), // TIGHTEN: must include "@"
  // ADD optional note
});

expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 500, upiId: "gg@upi" }).success).toBe(true);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 500, upiId: "gg@upi", note: "chai" }).success).toBe(true);
// each of these must FAIL validation:
expect(WebhookSchema.safeParse({ event: "payment.failed", amountInr: 500, upiId: "gg@upi" }).success).toBe(false);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: -5, upiId: "gg@upi" }).success).toBe(false);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 12.5, upiId: "gg@upi" }).success).toBe(false);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 500, upiId: "no-at-sign" }).success).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — z.infer: the type comes FROM the schema
//
// Derive the static type. The Equal assertion below describes exactly what
// it should be once exercise 1 is done (note is optional!).
// ─────────────────────────────────────────────────────────────────────────────
type Webhook = unknown; // REPLACE with z.infer<typeof WebhookSchema>

type _e2 = Expect<
  Equal<Webhook, { event: "payment.completed"; amountInr: number; upiId: string; note?: string }>
>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — safeParse is a discriminated union (you know this pattern!)
//
// Implement processWebhook: parse `raw` with WebhookSchema.safeParse.
//   success → "received ₹<amount> from <upiId>"
//   failure → "invalid: <first issue's message>"
// (result.error.issues[0]?.message ?? "unknown" for the message)
// ─────────────────────────────────────────────────────────────────────────────
function processWebhook(raw: unknown): string {
  return ""; // IMPLEMENT
}

expect(processWebhook({ event: "payment.completed", amountInr: 750, upiId: "gg@upi" })).toBe(
  "received ₹750 from gg@upi"
);
expect(processWebhook("not even an object").startsWith("invalid:")).toBe(true);
expect(processWebhook(null).startsWith("invalid:")).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — coercion and defaults: taming query strings
//
// URL query params arrive as strings ("page=2") or are missing entirely.
// Build QuerySchema so that:
//   page:  number, coerced from string, integer ≥ 1, DEFAULT 1
//   limit: number, coerced, integer 1..100, DEFAULT 20
//   sort:  enum "asc" | "desc", DEFAULT "asc"
// z.coerce.number() does the string→number step; .default(x) fills gaps.
// ─────────────────────────────────────────────────────────────────────────────
const QuerySchema = z.object({
  page: z.number(), // FIX: coerce + int + min + default
  limit: z.number(), // FIX
  sort: z.string(), // FIX: enum + default
});

expect(QuerySchema.parse({ page: "2", limit: "50", sort: "desc" })).toEqual({ page: 2, limit: 50, sort: "desc" });
expect(QuerySchema.parse({})).toEqual({ page: 1, limit: 20, sort: "asc" });
expect(QuerySchema.safeParse({ page: "0" }).success).toBe(false); // below min
expect(QuerySchema.safeParse({ limit: "500" }).success).toBe(false); // above max
expect(QuerySchema.safeParse({ sort: "sideways" }).success).toBe(false);

pass("02-zod-boundaries");
