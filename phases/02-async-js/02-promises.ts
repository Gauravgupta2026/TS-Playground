/**
 * Phase 2 · Exercise 02 — Promises
 *
 * Run me with:  npm run ts phases/02-async-js/02-promises.ts
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the delay() idiom
//
// Implement delay(ms): a promise that fulfills (with nothing) after ms
// milliseconds. This is THE canonical promisification — wrapping setTimeout.
// Shape: new Promise<void>((resolve) => setTimeout(resolve, ms))
// ─────────────────────────────────────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return Promise.resolve(); // IMPLEMENT — currently resolves immediately!
}

const t0 = Date.now();
await delay(50);
const elapsed = Date.now() - t0;
expect(elapsed >= 45).toBe(true); // ~50ms must actually have passed

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — promisify a callback API
//
// `legacyReadConfig` is an old callback-style API (error-first callback, the
// Node classic). Wrap it in a promise: reject on err, resolve on data.
// You can't change legacyReadConfig — only wrap it.
// ─────────────────────────────────────────────────────────────────────────────
function legacyReadConfig(
  name: string,
  callback: (err: Error | null, data?: string) => void
): void {
  setTimeout(() => {
    if (name === "app") callback(null, "mode=dark");
    else callback(new Error(`no config named ${name}`));
  }, 10);
}

function readConfig(name: string): Promise<string> {
  // IMPLEMENT: new Promise((resolve, reject) => legacyReadConfig(name, (err, data) => ...))
  return Promise.resolve("");
}

expect(await readConfig("app")).toBe("mode=dark");
let rejected = false;
try {
  await readConfig("missing");
} catch {
  rejected = true;
}
expect(rejected).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — chains pass along RETURN values
//
// Each .then's return value feeds the next .then. This chain is supposed to
// end with 25, but one link forgets to return — so the next link gets
// undefined. Find it and fix it.
// ─────────────────────────────────────────────────────────────────────────────
const chained = await Promise.resolve(3)
  .then((n) => n + 2) // 5
  .then((n) => {
    const squared = n * n; // 25
  })
  .then((n) => n);

expect(chained).toBe(25);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — settled means settled
//
// A promise settles ONCE. Later resolve/reject calls are silently ignored.
// Predict what this promise fulfills with (no code to fix — fix the
// prediction).
// ─────────────────────────────────────────────────────────────────────────────
const settledOnce = new Promise<string>((resolve, reject) => {
  resolve("first");
  resolve("second");
  reject(new Error("too late"));
});

const prediction: string = ""; // YOUR PREDICTION of the fulfilled value
expect(prediction).toBe(await settledOnce);

pass("02-promises");
