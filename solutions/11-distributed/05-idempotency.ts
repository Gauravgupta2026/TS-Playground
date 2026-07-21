/** SOLUTION — Phase 11 · 05. */
import { ManualClock, realTick, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Entry<T> =
  | { status: "inflight"; promise: Promise<T> }
  | { status: "settled"; value: T; expiresAt: number };

class IdempotencyStore {
  private readonly entries = new Map<string, Entry<unknown>>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: Now
  ) {}

  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key) as Entry<T> | undefined;
    if (existing) {
      if (existing.status === "inflight") return existing.promise; // share the run
      if (this.now() <= existing.expiresAt) return existing.value; // cached, fresh
      this.entries.delete(key); // expired → fall through and recompute
    }

    // Register the in-flight promise BEFORE awaiting, so a concurrent call with
    // the same key finds it and joins instead of starting a second execution.
    const promise = fn();
    this.entries.set(key, { status: "inflight", promise });
    try {
      const value = await promise;
      this.entries.set(key, { status: "settled", value, expiresAt: this.now() + this.ttlMs });
      return value;
    } catch (error) {
      this.entries.delete(key); // don't cache failures — allow a genuine retry
      throw error;
    }
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const store = new IdempotencyStore(1000, clock.now);

let charges = 0;
const charge = async () => {
  charges += 1;
  return { id: charges };
};
const r1 = await store.run("pay-42", charge);
const r2 = await store.run("pay-42", charge);
expect(r1).toEqual({ id: 1 });
expect(r2).toEqual({ id: 1 });
expect(charges).toBe(1);

await store.run("pay-99", charge);
expect(charges).toBe(2);

let gateResolve!: (v: string) => void;
const gate = new Promise<string>((res) => (gateResolve = res));
let slowCalls = 0;
const slow = () => {
  slowCalls += 1;
  return gate;
};
const p1 = store.run("job-7", slow);
const p2 = store.run("job-7", slow);
await realTick();
expect(slowCalls).toBe(1);
gateResolve("finished");
expect(await p1).toBe("finished");
expect(await p2).toBe("finished");
expect(slowCalls).toBe(1);

clock.advance(1001);
const r3 = await store.run("pay-42", charge);
expect(charges).toBe(3);
expect(r3).toEqual({ id: 3 });

pass("05-idempotency (solution)");
