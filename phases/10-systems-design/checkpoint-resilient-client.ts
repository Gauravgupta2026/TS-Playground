/**
 * Phase 10 · CHECKPOINT — a ResilientModelClient
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/checkpoint-resilient-client.ts
 *   npm run check phases/10-systems-design/checkpoint-resilient-client.ts
 *
 * Assemble the phase. Wrap a ModelClient (Phase 6's injected client) in the
 * primitives you built, so every call is cached, rate-limited, retried,
 * breaker-protected, and concurrency-capped — the exact resilience layer real
 * LLM apps put in front of the API.
 *
 * The primitives below are GIVEN (your 01/04/05/06/07 solutions, compacted).
 * You implement ONLY createResilientClient — the composition. This is the
 * "assemble the pieces you own" checkpoint, same idea as the capstone.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { ManualClock, recordingSleep, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ── GIVEN: your primitives (correct — do not edit) ──────────────────────────
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  constructor(private cap: number, private rate: number, private now: Now) {
    this.tokens = cap;
    this.lastRefill = now();
  }
  tryRemove(count = 1): boolean {
    const t = this.now();
    this.tokens = Math.min(this.cap, this.tokens + ((t - this.lastRefill) / 1000) * this.rate);
    this.lastRefill = t;
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}

class LruCache<K, V> {
  private store = new Map<K, { value: V; expiresAt: number }>();
  constructor(private cap: number, private ttlMs: number, private now: Now) {}
  set(key: K, value: V): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    if (this.store.size > this.cap) this.store.delete(this.store.keys().next().value as K);
  }
  get(key: K): V | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (this.now() > e.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, e);
    return e.value;
  }
}

class Semaphore {
  private available: number;
  private waiters: Array<() => void> = [];
  constructor(permits: number) {
    this.available = permits;
  }
  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const grant = () => resolve(() => this.release());
      if (this.available > 0) {
        this.available -= 1;
        grant();
      } else this.waiters.push(grant);
    });
  }
  private release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.available += 1;
  }
}

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class CircuitBreaker {
  private currentState: "closed" | "open" | "half-open" = "closed";
  private failures = 0;
  private openedAt = 0;
  constructor(private threshold: number, private cooldownMs: number, private now: Now) {}
  async call<T>(fn: () => Promise<T>): Promise<Result<T, string>> {
    if (this.currentState === "open") {
      if (this.now() - this.openedAt >= this.cooldownMs) this.currentState = "half-open";
      else return { ok: false, error: "circuit open" };
    }
    try {
      const value = await fn();
      this.failures = 0;
      this.currentState = "closed";
      return { ok: true, value };
    } catch (e) {
      if (this.currentState === "half-open") this.trip();
      else if (++this.failures >= this.threshold) this.trip();
      return { ok: false, error: msg(e) };
    }
  }
  private trip(): void {
    this.currentState = "open";
    this.openedAt = this.now();
  }
}

type RetryOpts = { maxAttempts: number; baseMs: number; factor: number; sleep: (ms: number) => Promise<void> };
async function retry<T>(fn: () => Promise<T>, o: RetryOpts): Promise<Result<T, string>> {
  for (let attempt = 0; attempt < o.maxAttempts; attempt++) {
    try {
      return { ok: true, value: await fn() };
    } catch (e) {
      if (attempt === o.maxAttempts - 1) return { ok: false, error: msg(e) };
      await o.sleep(o.baseMs * o.factor ** attempt);
    }
  }
  return { ok: false, error: "no attempts" };
}

// ── The checkpoint ──────────────────────────────────────────────────────────
type Stats = { cacheHits: number; modelCalls: number; rateLimited: number };
type ResilientClient = ModelClient & { readonly stats: Stats };

type ResilientOptions = {
  bucket: TokenBucket;
  cache: LruCache<string, Anthropic.Message>;
  breaker: CircuitBreaker;
  semaphore: Semaphore;
  retry: RetryOpts;
};

/** A stable cache key for a request (same prompt → same key). */
function cacheKey(params: Anthropic.MessageCreateParamsNonStreaming): string {
  return JSON.stringify({ model: params.model, system: params.system, messages: params.messages });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — createResilientClient(inner, opts): ResilientClient
//
// Return a ModelClient whose messages.create(params) does, IN THIS ORDER:
//   1. Cache: if cacheKey(params) is cached → stats.cacheHits++, return it
//      (no rate-limit, no call).
//   2. Rate limit: if !bucket.tryRemove() → stats.rateLimited++, throw
//      Error("rate limited") (no call).
//   3. Concurrency: acquire a semaphore permit (release it in a finally).
//   4. Resilient call: breaker.call( retry( inner.messages.create(params) ) ).
//      Count each ACTUAL inner call in stats.modelCalls. If the breaker/retry
//      result is not ok → throw Error(result.error). On success → cache it and
//      return the Message.
// Expose the SAME stats object you mutate as `.stats`.
// ─────────────────────────────────────────────────────────────────────────────
function createResilientClient(inner: ModelClient, opts: ResilientOptions): ResilientClient {
  const stats: Stats = { cacheHits: 0, modelCalls: 0, rateLimited: 0 };
  return {
    stats,
    messages: {
      async create(_params) {
        throw new Error("IMPLEMENT createResilientClient");
      },
    },
  };
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const makeOpts = (over: Partial<ResilientOptions> = {}): ResilientOptions => ({
  bucket: new TokenBucket(100, 100, clock.now),
  cache: new LruCache<string, Anthropic.Message>(50, 60_000, clock.now),
  breaker: new CircuitBreaker(3, 1000, clock.now),
  semaphore: new Semaphore(4),
  retry: { maxAttempts: 3, baseMs: 100, factor: 2, sleep: recordingSleep().sleep },
  ...over,
});

const params: Anthropic.MessageCreateParamsNonStreaming = {
  model: "claude-haiku-4-5",
  max_tokens: 100,
  messages: [{ role: "user", content: "what is a token bucket?" }],
};

// (A) cache: identical request hits the model once, then serves from cache.
const scriptA = makeScriptedClient([fakeMessage("A bucket that refills over time.")]);
const clientA = createResilientClient(scriptA.client, makeOpts());
const first = await clientA.messages.create(params);
const second = await clientA.messages.create(params);
expect(first.content).toEqual(second.content);
expect(scriptA.requests.length).toBe(1); // inner called ONCE
expect(clientA.stats.modelCalls).toBe(1);
expect(clientA.stats.cacheHits).toBe(1);

// (B) rate limit: a capacity-1 bucket rejects the 2nd distinct request.
const scriptB = makeScriptedClient([fakeMessage("one"), fakeMessage("two")]);
const clientB = createResilientClient(scriptB.client, makeOpts({ bucket: new TokenBucket(1, 0, clock.now) }));
await clientB.messages.create({ ...params, messages: [{ role: "user", content: "q1" }] });
let rateErr = "";
try {
  await clientB.messages.create({ ...params, messages: [{ role: "user", content: "q2" }] });
} catch (e) {
  rateErr = msg(e);
}
expect(rateErr).toBe("rate limited");
expect(clientB.stats.rateLimited).toBe(1);

// (C) retry: inner fails once (529) then recovers — one backoff, then success.
const rec = recordingSleep();
let attemptsC = 0;
const flakyInner: ModelClient = {
  messages: {
    async create() {
      attemptsC += 1;
      if (attemptsC < 2) throw new Error("529 overloaded");
      return fakeMessage("recovered");
    },
  },
};
const clientC = createResilientClient(flakyInner, makeOpts({ retry: { maxAttempts: 3, baseMs: 100, factor: 2, sleep: rec.sleep } }));
const recovered = await clientC.messages.create(params);
expect((recovered.content[0] as Anthropic.TextBlock).text).toBe("recovered");
expect(clientC.stats.modelCalls).toBe(2); // failed once, then succeeded
expect(rec.delays).toEqual([100]); // one backoff

// (D) circuit breaker: a dead endpoint trips open, then rejects without calling.
let innerCallsD = 0;
const deadInner: ModelClient = {
  messages: {
    async create() {
      innerCallsD += 1;
      throw new Error("endpoint down");
    },
  },
};
const clientD = createResilientClient(
  deadInner,
  makeOpts({ breaker: new CircuitBreaker(2, 1000, clock.now), retry: { maxAttempts: 1, baseMs: 10, factor: 2, sleep: recordingSleep().sleep } })
);
for (let i = 0; i < 2; i++) {
  try {
    await clientD.messages.create({ ...params, messages: [{ role: "user", content: `d${i}` }] });
  } catch {
    /* expected: endpoint down */
  }
}
const callsBeforeOpen = innerCallsD;
let openErr = "";
try {
  await clientD.messages.create({ ...params, messages: [{ role: "user", content: "d3" }] });
} catch (e) {
  openErr = msg(e);
}
expect(openErr).toBe("circuit open");
expect(innerCallsD).toBe(callsBeforeOpen); // breaker rejected WITHOUT calling

pass("checkpoint-resilient-client — Phase 10 complete! Next: Phase 11 (distributed).");
