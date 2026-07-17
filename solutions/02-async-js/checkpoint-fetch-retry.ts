/** SOLUTION — Phase 2 · checkpoint. */
import { expect, pass } from "../../helpers/assert";

type FetchResponse = { ok: boolean; status: number };
type FetchLike = (url: string) => Promise<FetchResponse>;

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  fetchLike: FetchLike;
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const SERVER_ERROR_MIN = 500;

async function fetchWithRetry(url: string, options: RetryOptions): Promise<FetchResponse> {
  const { maxAttempts, baseDelayMs, fetchLike } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchLike(url);
      if (response.ok) return response;
      // 4xx: the request itself is wrong — retrying can't fix it.
      if (response.status < SERVER_ERROR_MIN) return response;
      // 5xx: transient — fall through to retry.
    } catch {
      // network error: transient — fall through to retry.
    }
    const isLastAttempt = attempt === maxAttempts;
    if (!isLastAttempt) {
      // exponential backoff: base, base*2, base*4, …
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(`gave up after ${options.maxAttempts} attempts`);
}

// ── Fake servers ────────────────────────────────────────────────────────────
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
const healthy = flakyServer(0);
const r1 = await fetchWithRetry("/data", { maxAttempts: 3, baseDelayMs: 1, fetchLike: healthy.fetchLike });
expect(r1.status).toBe(200);
expect(healthy.calls()).toBe(1);

const flaky = flakyServer(2);
const r2 = await fetchWithRetry("/data", { maxAttempts: 4, baseDelayMs: 1, fetchLike: flaky.fetchLike });
expect(r2.ok).toBe(true);
expect(flaky.calls()).toBe(3);

const dead = flakyServer(Infinity);
let gaveUp = "";
try {
  await fetchWithRetry("/data", { maxAttempts: 3, baseDelayMs: 1, fetchLike: dead.fetchLike });
} catch (err) {
  gaveUp = err instanceof Error ? err.message : "";
}
expect(gaveUp).toBe("gave up after 3 attempts");
expect(dead.calls()).toBe(3);

let notFoundCalls = 0;
const notFound: FetchLike = async () => {
  notFoundCalls += 1;
  return { ok: false, status: 404 };
};
const r4 = await fetchWithRetry("/missing", { maxAttempts: 5, baseDelayMs: 1, fetchLike: notFound });
expect(r4.status).toBe(404);
expect(notFoundCalls).toBe(1);

let netCalls = 0;
const netThenOk: FetchLike = async () => {
  netCalls += 1;
  if (netCalls === 1) throw new Error("ECONNRESET");
  return { ok: true, status: 200 };
};
const r5 = await fetchWithRetry("/net", { maxAttempts: 2, baseDelayMs: 1, fetchLike: netThenOk });
expect(r5.ok).toBe(true);
expect(netCalls).toBe(2);

const slowFlaky = flakyServer(2);
const tStart = Date.now();
await fetchWithRetry("/data", { maxAttempts: 3, baseDelayMs: 30, fetchLike: slowFlaky.fetchLike });
expect(Date.now() - tStart >= 85).toBe(true);

pass("checkpoint-fetch-retry (solution)");
