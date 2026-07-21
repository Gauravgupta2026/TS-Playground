/** SOLUTION — Phase 10 · 06. */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
type BreakerState = "closed" | "open" | "half-open";

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: Now;
  private currentState: BreakerState = "closed";
  private failures = 0;
  private openedAt = 0;

  constructor(opts: { failureThreshold: number; cooldownMs: number; now: Now }) {
    this.failureThreshold = opts.failureThreshold;
    this.cooldownMs = opts.cooldownMs;
    this.now = opts.now;
  }

  async call<T>(fn: () => Promise<T>): Promise<Result<T, string>> {
    if (this.currentState === "open") {
      if (this.now() - this.openedAt >= this.cooldownMs) {
        this.currentState = "half-open"; // this call is the trial
      } else {
        return { ok: false, error: "circuit open" };
      }
    }

    try {
      const value = await fn();
      this.failures = 0;
      this.currentState = "closed";
      return { ok: true, value };
    } catch (error) {
      if (this.currentState === "half-open") {
        this.trip();
      } else {
        this.failures += 1;
        if (this.failures >= this.failureThreshold) this.trip();
      }
      return { ok: false, error: message(error) };
    }
  }

  private trip(): void {
    this.currentState = "open";
    this.openedAt = this.now();
  }

  get state(): BreakerState {
    return this.currentState;
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

let r = await cb.call(dep);
expect(r.ok).toBe(false);
expect(cb.state).toBe("closed");
r = await cb.call(dep);
expect(cb.state).toBe("open");

const callsBefore = fnCalls;
r = await cb.call(dep);
if (!r.ok) expect(r.error).toBe("circuit open");
expect(fnCalls).toBe(callsBefore);

clock.advance(1001);
healthy = true;
r = await cb.call(dep);
expect(r.ok).toBe(true);
expect(cb.state).toBe("closed");

healthy = false;
await cb.call(dep);
await cb.call(dep);
expect(cb.state).toBe("open");
clock.advance(1001);
r = await cb.call(dep);
expect(r.ok).toBe(false);
expect(cb.state).toBe("open");

pass("06-circuit-breaker (solution)");
