/** SOLUTION — Phase 10 · 05. */
import { recordingSleep } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

type RetryOptions<T> = {
  maxAttempts: number;
  baseMs: number;
  factor: number;
  sleep: (ms: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
  jitter?: (delayMs: number) => number;
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function retry<T>(fn: () => Promise<T>, opts: RetryOptions<T>): Promise<Result<T, string>> {
  const jitter = opts.jitter ?? ((d) => d);
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return { ok: true, value: await fn() };
    } catch (error) {
      const isLast = attempt === opts.maxAttempts - 1;
      const retryable = opts.shouldRetry ? opts.shouldRetry(error) : true;
      if (isLast || !retryable) return { ok: false, error: message(error) };
      const backoff = opts.baseMs * opts.factor ** attempt;
      await opts.sleep(jitter(backoff));
    }
  }
  // Unreachable (maxAttempts >= 1), but keeps the function total.
  return { ok: false, error: "no attempts made" };
}

// ── The spec ────────────────────────────────────────────────────────────────
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
expect(delays).toEqual([100, 200]);

const { sleep: s2, delays: d2 } = recordingSleep();
const always = async (): Promise<string> => {
  throw new Error("still overloaded");
};
const r2 = await retry(always, { maxAttempts: 3, baseMs: 50, factor: 2, sleep: s2 });
expect(r2.ok).toBe(false);
if (!r2.ok) expect(r2.error).toBe("still overloaded");
expect(d2).toEqual([50, 100]);

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
expect(fatalCalls).toBe(1);
expect(d3).toEqual([]);

const { sleep: s4, delays: d4 } = recordingSleep();
let jitterCalls = 0;
const flaky2 = async (): Promise<string> => {
  jitterCalls += 1;
  if (jitterCalls < 2) throw new Error("blip");
  return "ok";
};
await retry(flaky2, { maxAttempts: 3, baseMs: 100, factor: 2, sleep: s4, jitter: (d) => d / 2 });
expect(d4).toEqual([50]);

pass("05-retry-backoff (solution)");
