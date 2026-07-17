/**
 * Phase 3 · CHECKPOINT — Type the messy module
 *
 * Both must pass:
 *   npm run ts    phases/03-ts-fundamentals/checkpoint-type-the-module.ts
 *   npm run check phases/03-ts-fundamentals/checkpoint-type-the-module.ts
 *
 * Below is a working-but-untyped "order processing" module, straight out of
 * a JS codebase mid-migration (every param is implicitly any — strict mode
 * hates it, and so should you). YOUR JOB: types only.
 *
 *   1. Delete the four @ts-ignore lines (they're masking implicit-any errors).
 *   2. Define proper types: OrderStatus as a literal union; Order and
 *      OrderItem as object types; make Order.id readonly.
 *   3. Annotate every function boundary. DON'T change any logic — if a
 *      runtime check fails, you changed behavior, not just types.
 *   4. The @ts-expect-error lines at the bottom are the negative spec:
 *      each must be a REAL error once your types are in place.
 */
import { expect, pass } from "../../helpers/assert";

// ── Define your types here ──────────────────────────────────────────────────
// type OrderStatus = ...
// type OrderItem = ...
// type Order = ...

// ── The untyped module (add types, keep logic) ──────────────────────────────

// @ts-ignore
function createOrder(id, items) {
  return { id, items, status: "pending" };
}

// @ts-ignore
function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.priceInr * item.quantity, 0);
}

// @ts-ignore
function transition(order, nextStatus) {
  const allowed = {
    pending: ["paid", "cancelled"],
    paid: ["shipped", "refunded"],
    shipped: [],
    cancelled: [],
    refunded: [],
  };
  if (!allowed[order.status].includes(nextStatus)) {
    throw new Error(`cannot go from ${order.status} to ${nextStatus}`);
  }
  return { ...order, status: nextStatus };
}

// @ts-ignore
function describeOrder(order) {
  const itemCount = order.items.reduce((n, item) => n + item.quantity, 0);
  return `order ${order.id}: ${itemCount} items, ₹${orderTotal(order)}, ${order.status}`;
}

// ── Positive spec: unchanged behavior ───────────────────────────────────────
const order = createOrder("ord-1", [
  { name: "mechanical keyboard", priceInr: 4500, quantity: 1 },
  { name: "usb-c cable", priceInr: 300, quantity: 2 },
]);

expect(orderTotal(order)).toBe(5100);
expect(order.status).toBe("pending");

const paid = transition(order, "paid");
expect(paid.status).toBe("paid");
expect(order.status).toBe("pending"); // transition must not mutate

const shipped = transition(paid, "shipped");
expect(describeOrder(shipped)).toBe("order ord-1: 3 items, ₹5100, shipped");

let blocked = false;
try {
  transition(order, "shipped"); // pending → shipped is not allowed
} catch {
  blocked = true;
}
expect(blocked).toBe(true);

// ── Negative spec: these must all be COMPILE errors when you're done ────────
// (While the module is untyped, they compile fine → "unused" directives →
//  check fails. That's your starting error.)

try {
  // @ts-expect-error -- status must be the literal union, not any string
  transition(order, "teleported");
} catch {
  // expected at runtime too — the type system just catches it earlier
}

// @ts-expect-error -- items need priceInr and quantity
createOrder("ord-2", [{ name: "mystery item" }]);

// @ts-expect-error -- id is readonly
order.id = "ord-999";

pass("checkpoint-type-the-module — Phase 3 complete! Generics next.");
