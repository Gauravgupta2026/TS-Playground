/** SOLUTION — Phase 2 · 04. */
import { expect, pass } from "../../helpers/assert";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function download(name: string): Promise<string> {
  await delay(10);
  if (name.includes("corrupt")) throw new Error(`failed: ${name}`);
  return `contents-of-${name}`;
}

// EXERCISE 1 — map to promises (all start now), then await them all.
async function downloadAll(names: string[]): Promise<string[]> {
  return Promise.all(names.map((name) => download(name)));
}
expect(await downloadAll(["a.txt", "b.txt", "c.txt"])).toEqual([
  "contents-of-a.txt",
  "contents-of-b.txt",
  "contents-of-c.txt",
]);
let batchFailed = false;
try {
  await downloadAll(["a.txt", "corrupt.txt"]);
} catch {
  batchFailed = true;
}
expect(batchFailed).toBe(true);

// EXERCISE 2 — allSettled never rejects; results are index-aligned with the
// input, which is how we recover the failing NAME (reason only has a message).
async function downloadReport(names: string[]): Promise<{ ok: string[]; failed: string[] }> {
  const results = await Promise.allSettled(names.map((name) => download(name)));
  const ok: string[] = [];
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") ok.push(result.value);
    else failed.push(names[i]!);
  });
  return { ok, failed };
}
expect(await downloadReport(["a.txt", "corrupt-1.txt", "b.txt", "corrupt-2.txt"])).toEqual({
  ok: ["contents-of-a.txt", "contents-of-b.txt"],
  failed: ["corrupt-1.txt", "corrupt-2.txt"],
});

// EXERCISE 3 — race the work against a rejecting timer.
async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timed out")), ms)
  );
  return Promise.race([work, timer]);
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

pass("04-promise-combinators (solution)");
