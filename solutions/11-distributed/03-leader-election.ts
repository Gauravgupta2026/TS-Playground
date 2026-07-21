/** SOLUTION — Phase 11 · 03. */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

class Cluster {
  private readonly lastSeen = new Map<number, number>();

  constructor(
    nodeIds: number[],
    private readonly heartbeatTimeoutMs: number,
    private readonly now: Now
  ) {
    const t = now();
    for (const id of nodeIds) this.lastSeen.set(id, t); // all alive at t0
  }

  heartbeat(id: number): void {
    this.lastSeen.set(id, this.now());
  }

  isAlive(id: number): boolean {
    const seen = this.lastSeen.get(id);
    if (seen === undefined) return false;
    return this.now() - seen <= this.heartbeatTimeoutMs;
  }

  leader(): number | null {
    let leader: number | null = null;
    for (const id of this.lastSeen.keys()) {
      if (this.isAlive(id) && (leader === null || id > leader)) leader = id;
    }
    return leader;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const cluster = new Cluster([1, 2, 3], 1000, clock.now);

expect(cluster.leader()).toBe(3);
expect(cluster.isAlive(1)).toBe(true);

clock.advance(600);
cluster.heartbeat(1);
cluster.heartbeat(2);
clock.advance(600);
expect(cluster.isAlive(3)).toBe(false);
expect(cluster.leader()).toBe(2);

cluster.heartbeat(3);
expect(cluster.isAlive(3)).toBe(true);
expect(cluster.leader()).toBe(3);

clock.advance(2000);
expect(cluster.leader()).toBe(null);

pass("03-leader-election (solution)");
