/** SOLUTION — Phase 1 · 01. Read it, close it, rewrite the fix from memory. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — `let` because the binding is genuinely reassigned.
let score = 0;
score = score + 10;
expect(score).toBe(10);

// EXERCISE 2 — convert first, then strict-compare. No coercion surprises.
function typedFive(input: string): boolean {
  return Number(input) === 5;
}
expect(typedFive("5")).toBe(true);
expect(typedFive("05")).toBe(true);
expect(typedFive("")).toBe(false);
expect(typedFive("five")).toBe(false);

// EXERCISE 3 — the falsy six (plus -0 and 0n, excluded here by the spec).
const falsyValues: unknown[] = [false, 0, "", null, undefined, NaN];
expect(falsyValues.length).toBe(6);
expect(falsyValues.every((v) => !v)).toBe(true);
expect(new Set(falsyValues.map((v) => String(v))).size).toBe(6);

// EXERCISE 4 — ?? only treats null/undefined as "missing", so the user's
// deliberate 0 survives. fontSize keeps || because 0 is an invalid size there.
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_LINE_NUMBERS = 1;
function loadSettings(saved: { fontSize?: number; lineNumbers?: number }) {
  return {
    fontSize: saved.fontSize || DEFAULT_FONT_SIZE,
    lineNumbers: saved.lineNumbers ?? DEFAULT_LINE_NUMBERS,
  };
}
expect(loadSettings({}).fontSize).toBe(DEFAULT_FONT_SIZE);
expect(loadSettings({ fontSize: 0 }).fontSize).toBe(DEFAULT_FONT_SIZE);
expect(loadSettings({ lineNumbers: 0 }).lineNumbers).toBe(0);
expect(loadSettings({}).lineNumbers).toBe(DEFAULT_LINE_NUMBERS);

// EXERCISE 5 — one template literal; expressions allowed inside ${}.
function buildGreeting(name: string, unread: number): string {
  return `Hi ${name}, you have ${unread + 1} messages`;
}
expect(buildGreeting("GG", 4)).toBe("Hi GG, you have 5 messages");

pass("01-values-and-variables (solution)");
