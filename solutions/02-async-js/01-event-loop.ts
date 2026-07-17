/** SOLUTION — Phase 2 · 01. The predictions, with reasoning. */
import { expect, pass } from "../../helpers/assert";

const flushMacrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 5));

// EXERCISE 1 — sync (A, D) → microtask (C) → macrotask (B).
const log1: string[] = [];
log1.push("A");
setTimeout(() => log1.push("B"), 0);
Promise.resolve().then(() => log1.push("C"));
log1.push("D");
const prediction1: string[] = ["A", "D", "C", "B"];

// EXERCISE 2 — sync first; then the microtask queue drains COMPLETELY
// (then-1 queues then-2 behind itself); only then the timer macrotask.
const log2: string[] = [];
setTimeout(() => log2.push("timer"), 0);
Promise.resolve()
  .then(() => log2.push("then-1"))
  .then(() => log2.push("then-2"));
log2.push("sync");
const prediction2: string[] = ["sync", "then-1", "then-2", "timer"];

// EXERCISE 3 — calling an async fn runs it synchronously UP TO the first
// await; the rest resumes as a microtask after the caller's sync code ends.
const log3: string[] = [];
async function task(): Promise<void> {
  log3.push("inside-before-await");
  await Promise.resolve();
  log3.push("inside-after-await");
}
log3.push("start");
void task();
log3.push("end");
const prediction3: string[] = ["start", "inside-before-await", "end", "inside-after-await"];

await flushMacrotasks();
expect(prediction1).toEqual(log1);
expect(prediction2).toEqual(log2);
expect(prediction3).toEqual(log3);

pass("01-event-loop (solution)");
