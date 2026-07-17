/** SOLUTION — Phase 5 · 02. */
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1
const WebhookSchema = z.object({
  event: z.literal("payment.completed"),
  amountInr: z.number().int().positive(),
  upiId: z.string().includes("@"),
  note: z.string().optional(),
});

expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 500, upiId: "gg@upi" }).success).toBe(true);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 500, upiId: "gg@upi", note: "chai" }).success).toBe(true);
expect(WebhookSchema.safeParse({ event: "payment.failed", amountInr: 500, upiId: "gg@upi" }).success).toBe(false);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: -5, upiId: "gg@upi" }).success).toBe(false);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 12.5, upiId: "gg@upi" }).success).toBe(false);
expect(WebhookSchema.safeParse({ event: "payment.completed", amountInr: 500, upiId: "no-at-sign" }).success).toBe(false);

// EXERCISE 2 — the type is a shadow of the schema; it cannot drift.
type Webhook = z.infer<typeof WebhookSchema>;
type _e2 = Expect<
  Equal<Webhook, { event: "payment.completed"; amountInr: number; upiId: string; note?: string }>
>;

// EXERCISE 3 — safeParse returns a discriminated union; narrow on .success.
function processWebhook(raw: unknown): string {
  const result = WebhookSchema.safeParse(raw);
  if (result.success) {
    return `received ₹${result.data.amountInr} from ${result.data.upiId}`;
  }
  return `invalid: ${result.error.issues[0]?.message ?? "unknown"}`;
}

expect(processWebhook({ event: "payment.completed", amountInr: 750, upiId: "gg@upi" })).toBe(
  "received ₹750 from gg@upi"
);
expect(processWebhook("not even an object").startsWith("invalid:")).toBe(true);
expect(processWebhook(null).startsWith("invalid:")).toBe(true);

// EXERCISE 4 — coerce handles the string→number step; defaults fill gaps.
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

expect(QuerySchema.parse({ page: "2", limit: "50", sort: "desc" })).toEqual({ page: 2, limit: 50, sort: "desc" });
expect(QuerySchema.parse({})).toEqual({ page: 1, limit: 20, sort: "asc" });
expect(QuerySchema.safeParse({ page: "0" }).success).toBe(false);
expect(QuerySchema.safeParse({ limit: "500" }).success).toBe(false);
expect(QuerySchema.safeParse({ sort: "sideways" }).success).toBe(false);

pass("02-zod-boundaries (solution)");
