/**
 * Phase 1 · Exercise 02 — Functions and closures
 *
 * Run me with:  npm run ts phases/01-js-foundations/02-functions-and-closures.ts
 *
 * Closures are THE concept of this file. Every agent loop, rate limiter and
 * React hook you'll ever write is a closure wearing a costume.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the missing return
//
// Classic silent bug: an arrow function with a { } body needs an explicit
// `return`. This one doesn't have it, so it returns undefined. Fix it —
// either add `return`, or drop the braces for an implicit return.
// ─────────────────────────────────────────────────────────────────────────────
const double = (n: number) => {
  n * 2;
};

expect(double(21)).toBe(42);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — default parameters
//
// `greet("GG")` should fall back to "en". Add a default parameter instead of
// the || dance (defaults only kick in for undefined — same semantics as ??,
// built into the signature).
// ─────────────────────────────────────────────────────────────────────────────
function greet(name: string, lang: string): string {
  const greetings: Record<string, string> = { en: "Hello", hi: "Namaste" };
  return `${greetings[lang]} ${name}`;
}

// @ts-ignore -- this call is the spec: it must work with ONE argument (fix greet's signature)
expect(greet("GG")).toBe("Hello GG");
expect(greet("GG", "hi")).toBe("Namaste GG");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — write your first closure
//
// Implement makeCounter so that each call to the RETURNED function increments
// and returns a private count. The count must live inside makeCounter's scope
// — no module-level variables. Two independent counters must not share state.
// ─────────────────────────────────────────────────────────────────────────────
function makeCounter(): () => number {
  // IMPLEMENT: declare a count here, return a function that closes over it
  return () => 0;
}

const counterA = makeCounter();
const counterB = makeCounter();
expect(counterA()).toBe(1);
expect(counterA()).toBe(2);
expect(counterA()).toBe(3);
expect(counterB()).toBe(1); // independent state — a fresh closure per call

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — closures capture variables, not values
//
// This is the bug that made `let` famous. With `var`, all three scheduled
// functions close over the SAME loop variable, which is 3 by the time they
// run. Change `var` to `let` — `let` creates a fresh binding per iteration.
// ─────────────────────────────────────────────────────────────────────────────
const captured: number[] = [];
const fns: Array<() => void> = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => captured.push(i));
}
fns.forEach((fn) => fn()); // runs AFTER the loop finished

expect(captured).toEqual([0, 1, 2]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5 — a practical closure: once()
//
// Implement once(fn): returns a wrapped function that calls fn the FIRST time
// only; later calls return the first result without calling fn again.
// This is a real utility (init routines, "connect once" logic). You need TWO
// pieces of private state: whether it ran, and the cached result.
// ─────────────────────────────────────────────────────────────────────────────
function once<T>(fn: () => T): () => T {
  // IMPLEMENT me. (The <T> just means "works for any return type" — Phase 4
  // explains generics properly; here, read it as "T = whatever fn returns".)
  return fn;
}

let launchCount = 0;
const launch = once(() => {
  launchCount += 1;
  return `launched #${launchCount}`;
});

expect(launch()).toBe("launched #1");
expect(launch()).toBe("launched #1"); // cached — fn not called again
expect(launch()).toBe("launched #1");
expect(launchCount).toBe(1);

pass("02-functions-and-closures");
