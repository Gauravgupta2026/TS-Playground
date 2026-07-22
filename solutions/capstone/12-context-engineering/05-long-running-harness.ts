/** SOLUTION — Phase 12 · 05. */
import { expect, pass } from "../../helpers/assert";

type Status = "todo" | "passing" | "failing";
type Feature = { id: string; description: string; status: Status };

class Harness {
  private state: Feature[];

  constructor(features: Feature[]) {
    this.state = features.map((f) => ({ ...f })); // deep-enough copy of the flat records
  }

  get features(): Feature[] {
    return this.state.map((f) => ({ ...f }));
  }

  nextFeature(): Feature | null {
    return this.state.find((f) => f.status !== "passing") ?? null;
  }

  markResult(id: string, passed: boolean): void {
    const feature = this.state.find((f) => f.id === id);
    if (feature) feature.status = passed ? "passing" : "failing";
  }

  progress(): { passing: number; total: number } {
    return { passing: this.state.filter((f) => f.status === "passing").length, total: this.state.length };
  }

  snapshot(): string {
    return JSON.stringify(this.state);
  }

  restore(snap: string): void {
    this.state = JSON.parse(snap) as Feature[];
  }
}

async function runHarness(
  worker: (feature: Feature) => Promise<{ passed: boolean }>,
  harness: Harness,
  opts: { maxSteps: number }
): Promise<{ done: boolean; recovered: boolean; progress: { passing: number; total: number } }> {
  for (let step = 0; step < opts.maxSteps; step++) {
    const { passing, total } = harness.progress();
    if (passing === total) return { done: true, recovered: false, progress: harness.progress() };

    const feature = harness.nextFeature();
    if (!feature) return { done: true, recovered: false, progress: harness.progress() };

    const checkpoint = harness.snapshot(); // verification-first: save known-good before touching anything
    try {
      const { passed } = await worker(feature);
      harness.markResult(feature.id, passed);
    } catch {
      harness.restore(checkpoint); // roll back rather than dig deeper
      return { done: false, recovered: true, progress: harness.progress() };
    }
  }
  return { done: false, recovered: false, progress: harness.progress() };
}

// ── The spec ────────────────────────────────────────────────────────────────
const makeFeatures = (): Feature[] => [
  { id: "f1", description: "parse config", status: "todo" },
  { id: "f2", description: "validate input", status: "todo" },
  { id: "f3", description: "write output", status: "todo" },
];

const h = new Harness(makeFeatures());
expect(h.progress()).toEqual({ passing: 0, total: 3 });
expect(h.nextFeature()!.id).toBe("f1");
h.markResult("f1", true);
expect(h.nextFeature()!.id).toBe("f2");
expect(h.progress()).toEqual({ passing: 1, total: 3 });

const snap = h.snapshot();
h.markResult("f2", true);
expect(h.progress().passing).toBe(2);
h.restore(snap);
expect(h.progress().passing).toBe(1);

const good = new Harness(makeFeatures());
const passing = await runHarness(async () => ({ passed: true }), good, { maxSteps: 10 });
expect(passing.done).toBe(true);
expect(passing.recovered).toBe(false);
expect(passing.progress).toEqual({ passing: 3, total: 3 });

const risky = new Harness(makeFeatures());
const crashOnThird = async (f: Feature): Promise<{ passed: boolean }> => {
  if (f.id === "f3") throw new Error("worker crashed");
  return { passed: true };
};
const recovered = await runHarness(crashOnThird, risky, { maxSteps: 10 });
expect(recovered.done).toBe(false);
expect(recovered.recovered).toBe(true);
expect(recovered.progress).toEqual({ passing: 2, total: 3 });
expect(risky.features.find((f) => f.id === "f3")!.status).toBe("todo");

pass("05-long-running-harness (solution)");
