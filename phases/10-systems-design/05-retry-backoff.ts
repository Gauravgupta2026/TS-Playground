/**
 * Phase 10 · Exercise 05 — Retry with exponential backoff + jitter
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/05-retry-backoff.ts
 *   npm run check phases/10-systems-design/05-retry-backoff.ts
 *
 * The model API returns 429 / 529-overloaded under load. Retry — but back off
 * exponentially (give it room) and add jitter (so a thousand clients don't
 * retry in lockstep). And NEVER retry a 400: it'll fail identically forever.
 *
 * `sleep` is injected so tests record delays instead of waiting. Same for
 * `jitter` — injected and defaulting to identity — so the exercise stays
 * deterministic while still teaching where randomness belongs.
 */
import { recordingSleep } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

type RetryOptions<T> = {
  maxAttempts: number;
  baseMs: number;
  factor: number;
  sleep: (ms: number) => Promise<void>;
  /** Return false to stop retrying this error immediately. Default: retry all. */
  shouldRetry?: (error: unknown) => boolean;
  /** Map a computed backoff to an actual delay (add jitter here). Default: identity. */
  jitter?: (delayMs: number) => number;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — retry(fn, opts)
//
// Try fn up to maxAttempts times.
//   success            → ok(value)
//   failure, and (last attempt OR shouldRetry(err) === false)
//                      → err(message)   [message = err.message, or String(err)]
//   failure, retryable → delay = baseMs * factor^(attemptIndex), passed through
//                        jitter, awaited via sleep; then try again.
// attemptIndex is 0 for the first backoff (before attempt 2), 1 for the next…
// so delays are base, base*factor, base*factor^2, …
// ─────────────────────────────────────────────────────────────────────────────
async function retry<T>(fn: () => Promise<T>, opts: RetryOptions<T>): Promise<Result<T, string>> {
  return { ok: false, error: "IMPLEMENT" };
}

// ── The spec ────────────────────────────────────────────────────────────────
// fails twice, succeeds on the 3rd attempt:
const { sleep, delays } = recordingSleep();
let calls = 0;
const flaky = async () => {
  calls += 1;
  if (calls < 3) throw new Error("overloaded");
  return "ok";
};
const r = await retry(flaky, { maxAttempts: 5, baseMs: 100, factor: 2, sleep });
expect(r.ok).toBe(true);
if (r.ok) expect(r.value).toBe("ok");
expect(calls).toBe(3);
expect(delays).toEqual([100, 200]); // slept before attempt 2 and attempt 3

// exhausts all attempts → typed failure carrying the last error message:
const { sleep: s2, delays: d2 } = recordingSleep();
const always = async (): Promise<string> => {
  throw new Error("still overloaded");
};
const r2 = await retry(always, { maxAttempts: 3, baseMs: 50, factor: 2, sleep: s2 });
expect(r2.ok).toBe(false);
if (!r2.ok) expect(r2.error).toBe("still overloaded");
expect(d2).toEqual([50, 100]); // 3 attempts → 2 backoffs

// non-retryable error short-circuits with NO retries and NO sleeps:
const { sleep: s3, delays: d3 } = recordingSleep();
let fatalCalls = 0;
const fatal = async (): Promise<string> => {
  fatalCalls += 1;
  throw new Error("400 bad request");
};
const r3 = await retry(fatal, {
  maxAttempts: 5,
  baseMs: 10,
  factor: 2,
  sleep: s3,
  shouldRetry: (e) => !(e instanceof Error && e.message.startsWith("400")),
});
expect(r3.ok).toBe(false);
expect(fatalCalls).toBe(1); // never retried
expect(d3).toEqual([]);

// jitter is applied to the computed backoff:
const { sleep: s4, delays: d4 } = recordingSleep();
let jitterCalls = 0;
const flaky2 = async (): Promise<string> => {
  jitterCalls += 1;
  if (jitterCalls < 2) throw new Error("blip");
  return "ok";
};
await retry(flaky2, { maxAttempts: 3, baseMs: 100, factor: 2, sleep: s4, jitter: (d) => d / 2 });
expect(d4).toEqual([50]); // 100 backoff, halved by jitter

pass("05-retry-backoff");
