/**
 * Phase 2 · CHECKPOINT — fetchWithRetry
 *
 * Run me with:  npm run ts phases/02-async-js/checkpoint-fetch-retry.ts
 *
 * Build a production-grade retry wrapper. The checks use a FAKE fetch (so
 * they're deterministic — no real network, no flaky test), but your function
 * must accept any fetch-shaped function, so it would work with the real one.
 *
 * SPEC — fetchWithRetry(url, options):
 *   - Calls fetchLike(url). If the response is ok → return it.
 *   - If the response status is 5xx OR fetchLike throws (network error):
 *     that attempt FAILED. Wait, then retry — up to `maxAttempts` total
 *     attempts. The wait doubles each time, starting at `baseDelayMs`
 *     (exponential backoff: 100, 200, 400, …).
 *   - 4xx responses are NOT transient: return the response immediately,
 *     no retry (a 404 will never become a 200 by asking again).
 *   - If all attempts fail: throw Error(`gave up after ${maxAttempts} attempts`).
 *
 * Tools from this phase: async/await, try/catch, the delay() idiom, loops
 * over attempts (a plain for-loop is fine here).
 */
import { expect, pass } from "../../helpers/assert";

// A minimal fetch-shaped type — just what we need (real Response also fits it).
type FetchResponse = { ok: boolean; status: number };
type FetchLike = (url: string) => Promise<FetchResponse>;

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  fetchLike: FetchLike;
};

async function fetchWithRetry(url: string, options: RetryOptions): Promise<FetchResponse> {
  // IMPLEMENT me
  return options.fetchLike(url);
}

// ── Fake servers for the spec ───────────────────────────────────────────────
/** Fails with 500 exactly `failures` times, then succeeds. Counts calls. */
function flakyServer(failures: number): { fetchLike: FetchLike; calls: () => number } {
  let count = 0;
  return {
    fetchLike: async () => {
      count += 1;
      if (count <= failures) return { ok: false, status: 500 };
      return { ok: true, status: 200 };
    },
    calls: () => count,
  };
}

// ── The spec ────────────────────────────────────────────────────────────────
// 1. Immediate success: exactly one call, no retries.
const healthy = flakyServer(0);
const r1 = await fetchWithRetry("/data", { maxAttempts: 3, baseDelayMs: 1, fetchLike: healthy.fetchLike });
expect(r1.status).toBe(200);
expect(healthy.calls()).toBe(1);

// 2. Two 500s then success: three calls total, succeeds.
const flaky = flakyServer(2);
const r2 = await fetchWithRetry("/data", { maxAttempts: 4, baseDelayMs: 1, fetchLike: flaky.fetchLike });
expect(r2.ok).toBe(true);
expect(flaky.calls()).toBe(3);

// 3. Permanent 500s: gives up after maxAttempts with the right error.
const dead = flakyServer(Infinity);
let gaveUp = "";
try {
  await fetchWithRetry("/data", { maxAttempts: 3, baseDelayMs: 1, fetchLike: dead.fetchLike });
} catch (err) {
  gaveUp = err instanceof Error ? err.message : "";
}
expect(gaveUp).toBe("gave up after 3 attempts");
expect(dead.calls()).toBe(3);

// 4. 404 is not transient: returned immediately, exactly one call.
let notFoundCalls = 0;
const notFound: FetchLike = async () => {
  notFoundCalls += 1;
  return { ok: false, status: 404 };
};
const r4 = await fetchWithRetry("/missing", { maxAttempts: 5, baseDelayMs: 1, fetchLike: notFound });
expect(r4.status).toBe(404);
expect(notFoundCalls).toBe(1);

// 5. Thrown network errors also count as failed attempts.
let netCalls = 0;
const netThenOk: FetchLike = async () => {
  netCalls += 1;
  if (netCalls === 1) throw new Error("ECONNRESET");
  return { ok: true, status: 200 };
};
const r5 = await fetchWithRetry("/net", { maxAttempts: 2, baseDelayMs: 1, fetchLike: netThenOk });
expect(r5.ok).toBe(true);
expect(netCalls).toBe(2);

// 6. Backoff actually waits, and doubles: with baseDelayMs=30 and two
// failures, total waiting is ≥ 30 + 60 = 90ms.
const slowFlaky = flakyServer(2);
const tStart = Date.now();
await fetchWithRetry("/data", { maxAttempts: 3, baseDelayMs: 30, fetchLike: slowFlaky.fetchLike });
expect(Date.now() - tStart >= 85).toBe(true);

pass("checkpoint-fetch-retry — Phase 2 complete! Phase 3 turns on the type system.");
