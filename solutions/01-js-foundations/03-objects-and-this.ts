/** SOLUTION — Phase 1 · 03. Read it, close it, rewrite the fix from memory. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — spread copies the top level; overriding price leaves the
// caller's object untouched.
type Product = { name: string; price: number };
function applyDiscount(product: Product, percent: number): Product {
  return { ...product, price: product.price * (1 - percent / 100) };
}
const original = { name: "keyboard", price: 100 };
const discounted = applyDiscount(original, 20);
expect(discounted.price).toBe(80);
expect(original.price).toBe(100);

// EXERCISE 2 — shorthand method syntax so `this` is bound at call time to
// the object the method is called on.
const wallet = {
  owner: "GG",
  balanceInr: 2500,
  describe(): string {
    return `${this.owner} has ₹${this.balanceInr}`;
  },
};
expect(wallet.describe()).toBe("GG has ₹2500");

// EXERCISE 3 — the arrow wrapper calls spend THROUGH wallet2, so `this`
// is wallet2 again. (wallet2.spend.bind(wallet2) is the other idiom.)
const wallet2 = {
  balanceInr: 1000,
  spend(amount: number): number {
    this.balanceInr -= amount;
    return this.balanceInr;
  },
};

const spend = (amount: number) => wallet2.spend(amount);

function checkout(pay: (amount: number) => number): number {
  return pay(300);
}
expect(checkout(spend)).toBe(700);
expect(wallet2.balanceInr).toBe(700);

// EXERCISE 4 — entries + computed key write.
function invert(obj: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[value] = key;
  }
  return result;
}
expect(invert({ a: "x", b: "y" })).toEqual({ x: "a", y: "b" });
expect(invert({})).toEqual({});

pass("03-objects-and-this (solution)");
