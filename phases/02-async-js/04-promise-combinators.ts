/**
 * Phase 2 · Exercise 04 — Promise combinators
 *
 * Run me with:  npm run ts phases/02-async-js/04-promise-combinators.ts
 */
import { expect, pass } from "../../helpers/assert";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Fake downloader: succeeds for most files, fails for anything "corrupt". */
async function download(name: string): Promise<string> {
  await delay(10);
  if (name.includes("corrupt")) throw new Error(`failed: ${name}`);
  return `contents-of-${name}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — Promise.all: all-or-nothing
// Download all three files concurrently and return their contents, in order.
// ─────────────────────────────────────────────────────────────────────────────
async function downloadAll(names: string[]): Promise<string[]> {
  return []; // IMPLEMENT with Promise.all + map
}

expect(await downloadAll(["a.txt", "b.txt", "c.txt"])).toEqual([
  "contents-of-a.txt",
  "contents-of-b.txt",
  "contents-of-c.txt",
]);

// …and confirm all() is fail-fast: one bad file rejects the whole batch.
let batchFailed = false;
try {
  await downloadAll(["a.txt", "corrupt.txt"]);
} catch {
  batchFailed = true;
}
expect(batchFailed).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — Promise.allSettled: try everything, report per item
//
// Implement downloadReport: attempts every file, never throws, and returns
// { ok: [...contents], failed: [...names] }.
// allSettled gives you { status: "fulfilled", value } | { status: "rejected",
// reason } per input, index-aligned with `names` — use that alignment to
// recover WHICH name failed.
// ─────────────────────────────────────────────────────────────────────────────
async function downloadReport(names: string[]): Promise<{ ok: string[]; failed: string[] }> {
  return { ok: [], failed: [] }; // IMPLEMENT with Promise.allSettled
}

expect(await downloadReport(["a.txt", "corrupt-1.txt", "b.txt", "corrupt-2.txt"])).toEqual({
  ok: ["contents-of-a.txt", "contents-of-b.txt"],
  failed: ["corrupt-1.txt", "corrupt-2.txt"],
});

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — Promise.race: the timeout idiom
//
// Implement withTimeout: resolves with `work`'s value if it settles within
// `ms`, otherwise rejects with Error("timed out"). Race the work against a
// timer promise that rejects after ms.
// ─────────────────────────────────────────────────────────────────────────────
async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return work; // IMPLEMENT with Promise.race
}

const fastWork = delay(10).then(() => "fast-done");
expect(await withTimeout(fastWork, 100)).toBe("fast-done");

const slowWork = delay(200).then(() => "slow-done");
let timedOut = false;
try {
  await withTimeout(slowWork, 30);
} catch (err) {
  timedOut = err instanceof Error && err.message === "timed out";
}
expect(timedOut).toBe(true);

pass("04-promise-combinators");
