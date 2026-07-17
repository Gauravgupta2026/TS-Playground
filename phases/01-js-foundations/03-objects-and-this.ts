/**
 * Phase 1 · Exercise 03 — Objects, references, and `this`
 *
 * Run me with:  npm run ts phases/01-js-foundations/03-objects-and-this.ts
 *
 * Two big ideas: (1) objects are passed by reference — assignment never
 * copies; (2) `this` is decided by HOW a function is called, not where it
 * was written.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — reference vs copy
//
// applyDiscount is supposed to return a DISCOUNTED COPY and leave the
// original untouched. It currently mutates the original (same reference!).
// Fix it with spread: { ...product, price: ... }.
// ─────────────────────────────────────────────────────────────────────────────
type Product = { name: string; price: number };

function applyDiscount(product: Product, percent: number): Product {
  // BUG: this mutates the caller's object
  product.price = product.price * (1 - percent / 100);
  return product;
}

const original = { name: "keyboard", price: 100 };
const discounted = applyDiscount(original, 20);
expect(discounted.price).toBe(80);
expect(original.price).toBe(100); // original must be untouched

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — methods and `this`
//
// Complete the `describe` method so it uses `this` to reach the object's own
// properties. NOTE: it must be a regular method (shorthand syntax `describe()
// { ... }`), NOT an arrow function — arrows don't get their own `this`.
// ─────────────────────────────────────────────────────────────────────────────
const wallet = {
  owner: "GG",
  balanceInr: 2500,
  describe(): string {
    // IMPLEMENT using this.owner and this.balanceInr
    return "";
  },
};

expect(wallet.describe()).toBe("GG has ₹2500");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — losing `this`
//
// Detaching a method from its object loses `this`. The fix here: wrap the
// call in an arrow function so the method is still called THROUGH the object
// (spend => wallet2.spend(amount)). (.bind() also works — try both.)
// ─────────────────────────────────────────────────────────────────────────────
const wallet2 = {
  balanceInr: 1000,
  spend(amount: number): number {
    this.balanceInr -= amount;
    return this.balanceInr;
  },
};

// BUG: detached method — `this` will be undefined inside spend
const spend = wallet2.spend;

function checkout(pay: (amount: number) => number): number {
  return pay(300);
}

expect(checkout(spend)).toBe(700);
expect(wallet2.balanceInr).toBe(700);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — computed keys and Object.entries
//
// Implement invert: { a: "x", b: "y" }  →  { x: "a", y: "b" }.
// Tools you need: Object.entries(obj) gives [key, value] pairs; obj[someVar]
// writes a computed key. A for…of over entries is the cleanest shape.
// ─────────────────────────────────────────────────────────────────────────────
function invert(obj: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  // IMPLEMENT me
  return result;
}

expect(invert({ a: "x", b: "y" })).toEqual({ x: "a", y: "b" });
expect(invert({})).toEqual({});

pass("03-objects-and-this");
