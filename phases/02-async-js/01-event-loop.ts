/**
 * Phase 2 · Exercise 01 — The event loop
 *
 * Run me with:  npm run ts phases/02-async-js/01-event-loop.ts
 *
 * You don't write async code in this file — you PREDICT it. Each exercise
 * runs code that logs letters into an array, and you fill in the order you
 * expect. If your prediction is wrong, the check shows you reality vs your
 * guess. Update your MENTAL MODEL first, then the array.
 *
 * The model (from LESSON.md):
 *   all sync code → ALL microtasks (.then / after-await) → one macrotask
 *   (setTimeout) → microtasks again → …
 */
import { expect, pass } from "../../helpers/assert";

const flushMacrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 5));

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — sync vs microtask vs macrotask
// Fill in `prediction1` with the order the letters get logged.
// ─────────────────────────────────────────────────────────────────────────────
const log1: string[] = [];

log1.push("A");
setTimeout(() => log1.push("B"), 0);
Promise.resolve().then(() => log1.push("C"));
log1.push("D");

const prediction1: string[] = []; // YOUR PREDICTION, e.g. ["A", "B", "C", "D"]

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — microtasks drain COMPLETELY before the next macrotask
// A .then chained on a .then is still a microtask — it queues right behind.
// ─────────────────────────────────────────────────────────────────────────────
const log2: string[] = [];

setTimeout(() => log2.push("timer"), 0);
Promise.resolve()
  .then(() => log2.push("then-1"))
  .then(() => log2.push("then-2"));
log2.push("sync");

const prediction2: string[] = []; // YOUR PREDICTION

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — await is a microtask boundary
// Everything BEFORE the first await runs synchronously when you call an async
// function. Everything AFTER the await is a microtask.
// ─────────────────────────────────────────────────────────────────────────────
const log3: string[] = [];

async function task(): Promise<void> {
  log3.push("inside-before-await");
  await Promise.resolve();
  log3.push("inside-after-await");
}

log3.push("start");
void task();
log3.push("end");

const prediction3: string[] = []; // YOUR PREDICTION (4 entries)

// ── checks (wait for all queues to flush, then compare) ─────────────────────
await flushMacrotasks();

expect(prediction1).toEqual(log1);
expect(prediction2).toEqual(log2);
expect(prediction3).toEqual(log3);

pass("01-event-loop");
