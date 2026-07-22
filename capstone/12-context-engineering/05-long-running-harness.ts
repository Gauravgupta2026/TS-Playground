/**
 * Phase 12 · Exercise 05 — The long-running harness
 *
 * Both must pass (no API key needed):
 *   npm run ts    capstone/12-context-engineering/05-long-running-harness.ts
 *   npm run check capstone/12-context-engineering/05-long-running-harness.ts
 *
 * Long tasks span many sessions, each with a fresh window. The HARNESS is the
 * scaffolding that survives that: externalized state (features with pass/fail),
 * one unit of work at a time, and — critically — checkpoint + recovery, so a
 * crash reverts to the last known-good state instead of corrupting everything.
 * The worker here is a stand-in; in production it's an agent (or you).
 */
import { expect, pass } from "../../helpers/assert";

type Status = "todo" | "passing" | "failing";
type Feature = { id: string; description: string; status: Status };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — Harness (externalized, checkpointable state)
//
//   constructor(features): store a COPY (never alias the caller's array).
//   features: a copy of the current feature list.
//   nextFeature(): the first feature whose status is not "passing", or null.
//   markResult(id, passed): set that feature's status to "passing"/"failing".
//   progress(): { passing, total }.
//   snapshot(): a JSON string of the current state (a checkpoint).
//   restore(snap): replace state from a snapshot string.
// ─────────────────────────────────────────────────────────────────────────────
class Harness {
  constructor(features: Feature[]) {
    // IMPLEMENT
  }

  get features(): Feature[] {
    return []; // IMPLEMENT (return a copy)
  }

  nextFeature(): Feature | null {
    return null; // IMPLEMENT
  }

  markResult(id: string, passed: boolean): void {
    // IMPLEMENT
  }

  progress(): { passing: number; total: number } {
    return { passing: -1, total: -1 }; // IMPLEMENT
  }

  snapshot(): string {
    return ""; // IMPLEMENT
  }

  restore(snap: string): void {
    // IMPLEMENT
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — runHarness(worker, harness, opts)
//
//   Loop up to opts.maxSteps:
//     - if every feature is passing → stop, done = true.
//     - f = nextFeature(); if null → stop, done = true.
//     - snapshot() BEFORE the work (checkpoint).
//     - try: markResult(f.id, (await worker(f)).passed).
//       catch: restore(the snapshot), set recovered = true, STOP.
//   Return { done, recovered, progress: harness.progress() }.
// ─────────────────────────────────────────────────────────────────────────────
async function runHarness(
  worker: (feature: Feature) => Promise<{ passed: boolean }>,
  harness: Harness,
  opts: { maxSteps: number }
): Promise<{ done: boolean; recovered: boolean; progress: { passing: number; total: number } }> {
  return { done: false, recovered: false, progress: harness.progress() }; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const makeFeatures = (): Feature[] => [
  { id: "f1", description: "parse config", status: "todo" },
  { id: "f2", description: "validate input", status: "todo" },
  { id: "f3", description: "write output", status: "todo" },
];

// unit checks on the state machine:
const h = new Harness(makeFeatures());
expect(h.progress()).toEqual({ passing: 0, total: 3 });
expect(h.nextFeature()!.id).toBe("f1");
h.markResult("f1", true);
expect(h.nextFeature()!.id).toBe("f2"); // f1 passing → skip it
expect(h.progress()).toEqual({ passing: 1, total: 3 });

// snapshot/restore is a real checkpoint:
const snap = h.snapshot();
h.markResult("f2", true);
expect(h.progress().passing).toBe(2);
h.restore(snap);
expect(h.progress().passing).toBe(1); // rolled back to the checkpoint

// happy path: a worker that passes each feature drives the harness to done.
const good = new Harness(makeFeatures());
const passing = await runHarness(async () => ({ passed: true }), good, { maxSteps: 10 });
expect(passing.done).toBe(true);
expect(passing.recovered).toBe(false);
expect(passing.progress).toEqual({ passing: 3, total: 3 });

// recovery: a worker that crashes on f3 rolls back to the last good checkpoint.
const risky = new Harness(makeFeatures());
const crashOnThird = async (f: Feature): Promise<{ passed: boolean }> => {
  if (f.id === "f3") throw new Error("worker crashed");
  return { passed: true };
};
const recovered = await runHarness(crashOnThird, risky, { maxSteps: 10 });
expect(recovered.done).toBe(false);
expect(recovered.recovered).toBe(true);
expect(recovered.progress).toEqual({ passing: 2, total: 3 }); // f1,f2 preserved; f3 not corrupted
expect(risky.features.find((f) => f.id === "f3")!.status).toBe("todo");

pass("05-long-running-harness");
