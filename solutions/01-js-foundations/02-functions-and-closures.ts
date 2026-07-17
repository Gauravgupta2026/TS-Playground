/** SOLUTION — Phase 1 · 02. Read it, close it, rewrite the fix from memory. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — implicit return: no braces, the expression IS the return value.
const double = (n: number) => n * 2;
expect(double(21)).toBe(42);

// EXERCISE 2 — default parameter; kicks in only when the arg is undefined.
function greet(name: string, lang: string = "en"): string {
  const greetings: Record<string, string> = { en: "Hello", hi: "Namaste" };
  return `${greetings[lang]} ${name}`;
}
expect(greet("GG")).toBe("Hello GG");
expect(greet("GG", "hi")).toBe("Namaste GG");

// EXERCISE 3 — `count` lives in makeCounter's scope; the returned arrow
// closes over it. Each makeCounter() call creates a fresh, private count.
function makeCounter(): () => number {
  let count = 0;
  return () => {
    count += 1;
    return count;
  };
}
const counterA = makeCounter();
const counterB = makeCounter();
expect(counterA()).toBe(1);
expect(counterA()).toBe(2);
expect(counterA()).toBe(3);
expect(counterB()).toBe(1);

// EXERCISE 4 — `let` gives each loop iteration its own binding, so each
// closure captures a different i. `var` shares one function-scoped i (=3).
const captured: number[] = [];
const fns: Array<() => void> = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => captured.push(i));
}
fns.forEach((fn) => fn());
expect(captured).toEqual([0, 1, 2]);

// EXERCISE 5 — two pieces of private state in the closure: ran + cached.
// `as T` on cached is avoided by checking `ran` before returning.
function once<T>(fn: () => T): () => T {
  let ran = false;
  let cached: T;
  return () => {
    if (!ran) {
      cached = fn();
      ran = true;
    }
    return cached;
  };
}

let launchCount = 0;
const launch = once(() => {
  launchCount += 1;
  return `launched #${launchCount}`;
});
expect(launch()).toBe("launched #1");
expect(launch()).toBe("launched #1");
expect(launch()).toBe("launched #1");
expect(launchCount).toBe(1);

pass("02-functions-and-closures (solution)");
