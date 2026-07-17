/**
 * Phase 5 · Exercise 01 — tsconfig demystified
 *
 * Both must pass:
 *   npm run ts    phases/05-real-world-ts/01-tsconfig-demystified.ts
 *   npm run check phases/05-real-world-ts/01-tsconfig-demystified.ts
 *
 * Before this file: open this repo's tsconfig.json and read it top to
 * bottom against section 1 of the LESSON. Every exercise here demonstrates
 * a strictness flag protecting (or not protecting) you.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — strictNullChecks in action
//
// find() returns T | undefined — under strictNullChecks you MUST handle the
// undefined arm before using the value. Fix the function: return
// "model not found" when lookup misses. (Without strictNullChecks this
// compiles silently and crashes at runtime — that's the world you're NOT in.)
// ─────────────────────────────────────────────────────────────────────────────
type ModelInfo = { id: string; contextWindow: number };

const KNOWN_MODELS: ModelInfo[] = [
  { id: "claude-sonnet-5", contextWindow: 200000 },
  { id: "claude-haiku-4-5", contextWindow: 200000 },
];

function describeModel(id: string): string {
  const found = KNOWN_MODELS.find((m) => m.id === id);
  return `${found.id}: ${found.contextWindow} tokens`; // BUG: found may be undefined
}

expect(describeModel("claude-sonnet-5")).toBe("claude-sonnet-5: 200000 tokens");
expect(describeModel("gpt-9000")).toBe("model not found");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — what noUncheckedIndexedAccess WOULD catch
//
// This repo keeps that flag OFF, so `words[0]` is typed string (a small
// lie — the array could be empty, making it undefined at runtime).
// firstWord("") crashes today. Make it honest WITHOUT the flag: use .at(0)
// — which is ALWAYS typed `string | undefined` — and handle the miss with
// ?? "(none)".
// ─────────────────────────────────────────────────────────────────────────────
function firstWord(sentence: string): string {
  const words = sentence.split(" ").filter((w) => w.length > 0);
  return words[0].toUpperCase(); // typed string, actually undefined for ""
}

expect(firstWord("hello world")).toBe("HELLO");
expect(firstWord("")).toBe("(none)");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — noImplicitAny (part of strict)
//
// Unannotated params default to `any` — strict mode makes that an ERROR
// instead of a silent hole. Someone "fixed" it here with explicit any,
// which is worse (it LOOKS deliberate). Replace the anys with real types:
// items is { priceInr: number }[], and taxRate is number.
// ─────────────────────────────────────────────────────────────────────────────
function invoiceTotal(items: any, taxRate: any): number {
  const subtotal = items.reduce((sum: number, item: any) => sum + item.priceInr, 0);
  return Math.round(subtotal * (1 + taxRate));
}

expect(invoiceTotal([{ priceInr: 1000 }, { priceInr: 500 }], 0.18)).toBe(1770);

// After your fix, this nonsense call must be a compile error. (It lives in
// a never-called function: types are checked either way, but the crash it
// would cause never runs. A common trick for "negative" type tests.)
function _negativeSpec(): void {
  // @ts-expect-error -- a bare number is not an items array
  invoiceTotal(42, 0.18);
}

pass("01-tsconfig-demystified");
