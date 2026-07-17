/** SOLUTION — Phase 2 · 02. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — the canonical setTimeout promisification.
function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
const t0 = Date.now();
await delay(50);
expect(Date.now() - t0 >= 45).toBe(true);

// EXERCISE 2 — error-first callback → promise: reject on err, resolve on data.
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
  return new Promise<string>((resolve, reject) => {
    legacyReadConfig(name, (err, data) => {
      if (err) reject(err);
      else resolve(data ?? "");
    });
  });
}

expect(await readConfig("app")).toBe("mode=dark");
let rejected = false;
try {
  await readConfig("missing");
} catch {
  rejected = true;
}
expect(rejected).toBe(true);

// EXERCISE 3 — the middle link must RETURN, or the next link gets undefined.
const chained = await Promise.resolve(3)
  .then((n) => n + 2)
  .then((n) => {
    const squared = n * n;
    return squared;
  })
  .then((n) => n);
expect(chained).toBe(25);

// EXERCISE 4 — first settle wins; later resolve/reject calls are ignored.
const settledOnce = new Promise<string>((resolve, reject) => {
  resolve("first");
  resolve("second");
  reject(new Error("too late"));
});
const prediction: string = "first";
expect(prediction).toBe(await settledOnce);

pass("02-promises (solution)");
