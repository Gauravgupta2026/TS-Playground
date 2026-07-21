/**
 * Phase 10 · Exercise 06 — Circuit breaker
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/06-circuit-breaker.ts
 *   npm run check phases/10-systems-design/06-circuit-breaker.ts
 *
 * Retries ride out a blip. When the model endpoint is genuinely DOWN, retrying
 * just piles on. A circuit breaker trips: after N failures it rejects fast
 * WITHOUT calling the dependency, then after a cooldown lets ONE trial through.
 *
 *   closed  --(failureThreshold consecutive fails)-->  open
 *   open    --(cooldown elapsed, next call)-->        half-open   (fast-reject until then)
 *   half-open --(trial succeeds)-->  closed           --(trial fails)-->  open
 */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
type BreakerState = "closed" | "open" | "half-open";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — CircuitBreaker
//
// constructor({ failureThreshold, cooldownMs, now })
// call(fn):
//   - state "open": if now() - openedAt >= cooldownMs → become "half-open"
//                   and let this call through as the trial; otherwise return
//                   err("circuit open") WITHOUT calling fn.
//   - run fn:
//       success → reset failures to 0, state "closed", return ok(value)
//       failure → if state was "half-open": reopen (openedAt = now()); else
//                 (closed) failures++, and if failures >= threshold, open
//                 (openedAt = now()). Either way return err(message).
// get state(): current BreakerState.
// ─────────────────────────────────────────────────────────────────────────────
class CircuitBreaker {
  constructor(opts: { failureThreshold: number; cooldownMs: number; now: Now }) {
    // IMPLEMENT
  }

  async call<T>(fn: () => Promise<T>): Promise<Result<T, string>> {
    return { ok: false, error: "IMPLEMENT" };
  }

  get state(): BreakerState {
    return "closed"; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
let healthy = false;
let fnCalls = 0;
const dep = async (): Promise<string> => {
  fnCalls += 1;
  if (!healthy) throw new Error("endpoint down");
  return "ok";
};
const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: clock.now });

let r = await cb.call(dep); // fail 1
expect(r.ok).toBe(false);
expect(cb.state).toBe("closed");
r = await cb.call(dep); // fail 2 → trips open
expect(cb.state).toBe("open");

const callsBefore = fnCalls;
r = await cb.call(dep); // OPEN → fast reject, dep NOT called
if (!r.ok) expect(r.error).toBe("circuit open");
expect(fnCalls).toBe(callsBefore);

clock.advance(1001); // cooldown elapses
healthy = true;
r = await cb.call(dep); // half-open trial succeeds → closed
expect(r.ok).toBe(true);
expect(cb.state).toBe("closed");

// trip again, then let a half-open trial FAIL → straight back to open:
healthy = false;
await cb.call(dep);
await cb.call(dep); // open
expect(cb.state).toBe("open");
clock.advance(1001);
r = await cb.call(dep); // half-open trial fails → open again
expect(r.ok).toBe(false);
expect(cb.state).toBe("open");

pass("06-circuit-breaker");
