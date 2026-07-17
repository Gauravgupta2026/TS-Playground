/**
 * Phase 1 · Exercise 01 — Values, variables, truthiness, equality
 *
 * GOAL: fix each EXERCISE block until every check passes, then see the ✅.
 * Run me with:  npm run ts phases/01-js-foundations/01-values-and-variables.ts
 *
 * The file fails on purpose. Read the error message it prints — it tells you
 * which check broke, what it expected, and what it got. That loop (run →
 * read error → fix → run) is the whole course.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — const vs let
//
// `const` prevents REASSIGNMENT of the binding. It does not freeze the value.
// The code below tries to track a score by reassigning… a const. tsx won't
// even run the file. Change the declaration so reassignment is allowed —
// this is the one legitimate use of `let`: a value that genuinely changes.
// ─────────────────────────────────────────────────────────────────────────────
const score = 0;
// The next line throws "TypeError: Assignment to constant variable" — run me
// and see. Fix the DECLARATION above, not this line.
// @ts-ignore -- lets the type-checker past the intentional bug; harmless to leave

score = score + 10;

expect(score).toBe(10);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — == coercion bug
//
// This function checks whether a user typed the number 5. It currently uses
// `==`, which coerces types: "5" == 5 is true, and so is "" == 0.
// Fix it to use strict equality — but note the input arrives as a STRING
// (like all form/CLI input does), so you must convert it first with Number().
// ─────────────────────────────────────────────────────────────────────────────
function typedFive(input: string): boolean {
  // FIX ME: use Number(input) and ===
  return input == 5 ? true : false;
}

expect(typedFive("5")).toBe(true);
expect(typedFive("05")).toBe(true); // Number("05") is 5
expect(typedFive("")).toBe(false); // "" == 0 == false-y coercion trap
expect(typedFive("five")).toBe(false); // Number("five") is NaN, NaN === 5 is false

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the falsy list
//
// Fill in this array with EVERY falsy value in JavaScript except -0 and 0n
// (six values). Order doesn't matter — the check sorts by String() form.
// Memorizing this list is genuinely worth it: truthiness checks appear in
// almost every `if` you'll ever read.
// ─────────────────────────────────────────────────────────────────────────────
const falsyValues: unknown[] = [
  false,
  // ADD the other five here
];

expect(falsyValues.length).toBe(6);
expect(falsyValues.every((v) => !v)).toBe(true);
expect(new Set(falsyValues.map((v) => String(v))).size).toBe(6); // all distinct

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — ?? vs ||
//
// A settings loader: users can set fontSize. 0 is NOT a valid font size, but
// lineNumbers: 0 (meaning "off") IS valid. The current code uses || for both,
// which stomps the legitimate 0. Fix ONLY the line that's wrong.
// Rule of thumb: use ?? when "missing" means null/undefined; use || only when
// you truly want to reject every falsy value.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_LINE_NUMBERS = 1;

function loadSettings(saved: { fontSize?: number; lineNumbers?: number }) {
  return {
    fontSize: saved.fontSize || DEFAULT_FONT_SIZE, // correct: 0 is invalid, reject it
    lineNumbers: saved.lineNumbers || DEFAULT_LINE_NUMBERS, // BUG: user's 0 gets stomped
  };
}

expect(loadSettings({}).fontSize).toBe(DEFAULT_FONT_SIZE);
expect(loadSettings({ fontSize: 0 }).fontSize).toBe(DEFAULT_FONT_SIZE);
expect(loadSettings({ lineNumbers: 0 }).lineNumbers).toBe(0); // 0 must survive
expect(loadSettings({}).lineNumbers).toBe(DEFAULT_LINE_NUMBERS);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5 — template literals
//
// Rewrite this string concatenation as ONE template literal (backticks, ${}).
// Same output, readable code. Template literals also allow expressions:
// `${count + 1}` — you'll need that here.
// ─────────────────────────────────────────────────────────────────────────────
function buildGreeting(name: string, unread: number): string {
  // REWRITE as a single template literal
  return "Hi " + name + ", you have " + (unread + 1) + " messages";
}

expect(buildGreeting("GG", 4)).toBe("Hi GG, you have 5 messages");

pass("01-values-and-variables");
