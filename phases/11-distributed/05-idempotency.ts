/**
 * Phase 11 · Exercise 05 — Idempotency keys & dedup
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/11-distributed/05-idempotency.ts
 *   npm run check phases/11-distributed/05-idempotency.ts
 *
 * Networks retry. Your Phase 10 retry loop, an at-least-once queue, a client
 * timeout — all can deliver the SAME request twice. If the effect isn't
 * idempotent, twice means double-charged / double-generated. The fix: a key
 * per logical operation; run the effect ONCE per key, cache the result, and on
 * any repeat return the cached result WITHOUT re-running. (This is how Stripe's
 * idempotency keys work.) Two subtleties: in-flight dedup and TTL expiry.
 */
import { ManualClock, realTick, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — IdempotencyStore
//
// constructor(ttlMs, now)
// run(key, fn): Promise<T>
//   - a SETTLED, unexpired result for `key` exists → return it, DON'T call fn.
//   - an IN-FLIGHT execution for `key` exists → return that SAME promise
//     (concurrent duplicates share one run — do NOT start a second fn).
//   - otherwise → call fn() ONCE, remember the in-flight promise immediately
//     (before awaiting), and on resolution store the value with
//     expiresAt = now() + ttlMs. On rejection, forget the key so it can retry.
// ─────────────────────────────────────────────────────────────────────────────
class IdempotencyStore {
  constructor(ttlMs: number, now: Now) {
    // IMPLEMENT
  }

  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return fn(); // IMPLEMENT (this stub runs fn EVERY time — wrong)
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const store = new IdempotencyStore(1000, clock.now);

// same key → fn runs once; the repeat is served from cache.
let charges = 0;
const charge = async () => {
  charges += 1;
  return { id: charges };
};
const r1 = await store.run("pay-42", charge);
const r2 = await store.run("pay-42", charge);
expect(r1).toEqual({ id: 1 });
expect(r2).toEqual({ id: 1 }); // identical result…
expect(charges).toBe(1); // …and the effect ran ONCE

// different key → independent.
await store.run("pay-99", charge);
expect(charges).toBe(2);

// in-flight dedup: two concurrent calls with the same key share ONE execution.
let gateResolve!: (v: string) => void;
const gate = new Promise<string>((res) => (gateResolve = res));
let slowCalls = 0;
const slow = () => {
  slowCalls += 1;
  return gate; // stays pending until we release it
};
const p1 = store.run("job-7", slow);
const p2 = store.run("job-7", slow); // must NOT start a second execution
await realTick();
expect(slowCalls).toBe(1); // only one run in flight
gateResolve("finished");
expect(await p1).toBe("finished");
expect(await p2).toBe("finished");
expect(slowCalls).toBe(1);

// TTL: after expiry, the key runs again.
clock.advance(1001);
const r3 = await store.run("pay-42", charge);
expect(charges).toBe(3); // expired → recomputed
expect(r3).toEqual({ id: 3 });

pass("05-idempotency");
