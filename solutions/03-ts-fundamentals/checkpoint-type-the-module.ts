/** SOLUTION — Phase 3 · checkpoint. Types only; logic untouched. */
import { expect, pass } from "../../helpers/assert";

// ── The types ───────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "paid" | "shipped" | "cancelled" | "refunded";

type OrderItem = {
  name: string;
  priceInr: number;
  quantity: number;
};

type Order = {
  readonly id: string;
  items: OrderItem[];
  status: OrderStatus;
};

// ── The module, typed ───────────────────────────────────────────────────────
function createOrder(id: string, items: OrderItem[]): Order {
  return { id, items, status: "pending" };
}

function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.priceInr * item.quantity, 0);
}

// Record<OrderStatus, OrderStatus[]> makes the transition table itself
// typo-proof — a nice bonus of the literal union.
function transition(order: Order, nextStatus: OrderStatus): Order {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
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

function describeOrder(order: Order): string {
  const itemCount = order.items.reduce((n: number, item) => n + item.quantity, 0);
  return `order ${order.id}: ${itemCount} items, ₹${orderTotal(order)}, ${order.status}`;
}

// ── Positive spec ───────────────────────────────────────────────────────────
const order = createOrder("ord-1", [
  { name: "mechanical keyboard", priceInr: 4500, quantity: 1 },
  { name: "usb-c cable", priceInr: 300, quantity: 2 },
]);

expect(orderTotal(order)).toBe(5100);
expect(order.status).toBe("pending");

const paid = transition(order, "paid");
expect(paid.status).toBe("paid");
expect(order.status).toBe("pending");

const shipped = transition(paid, "shipped");
expect(describeOrder(shipped)).toBe("order ord-1: 3 items, ₹5100, shipped");

let blocked = false;
try {
  transition(order, "shipped");
} catch {
  blocked = true;
}
expect(blocked).toBe(true);

// ── Negative spec ───────────────────────────────────────────────────────────
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

pass("checkpoint-type-the-module (solution)");
