/**
 * Phase 11 · Exercise 03 — Leader election via heartbeats
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/11-distributed/03-leader-election.ts
 *   npm run check phases/11-distributed/03-leader-election.ts
 *
 * Some jobs must run exactly once across a cluster (the planner, a compaction,
 * a cron). Elect ONE leader. Two ingredients: failure detection (a node silent
 * past a timeout is presumed dead) and a deterministic rule (highest live id
 * wins — the bully algorithm's core). Time is injected, so "dead" is testable.
 */
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — Cluster
//
// constructor(nodeIds, heartbeatTimeoutMs, now): every node is considered to
//   have heartbeat at construction time (all alive at t0).
// heartbeat(id): record now() as this node's last-seen time.
// isAlive(id): true iff now() - lastSeen(id) <= heartbeatTimeoutMs.
// leader(): the HIGHEST id that is currently alive, or null if none are.
// ─────────────────────────────────────────────────────────────────────────────
class Cluster {
  constructor(nodeIds: number[], heartbeatTimeoutMs: number, now: Now) {
    // IMPLEMENT
  }

  heartbeat(id: number): void {
    // IMPLEMENT
  }

  isAlive(id: number): boolean {
    return false; // IMPLEMENT
  }

  leader(): number | null {
    return null; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const cluster = new Cluster([1, 2, 3], 1000, clock.now); // timeout 1s

// at t0 everyone is alive → highest id leads.
expect(cluster.leader()).toBe(3);
expect(cluster.isAlive(1)).toBe(true);

// nodes 1 and 2 keep beating; node 3 goes silent.
clock.advance(600);
cluster.heartbeat(1);
cluster.heartbeat(2);
clock.advance(600); // now 1200: node 3 last beat at t0 → 1200 > 1000 → dead
expect(cluster.isAlive(3)).toBe(false);
expect(cluster.leader()).toBe(2); // failover to next-highest live node

// node 3 recovers (beats again) → reclaims leadership.
cluster.heartbeat(3);
expect(cluster.isAlive(3)).toBe(true);
expect(cluster.leader()).toBe(3);

// everyone goes silent past the timeout → no leader.
clock.advance(2000);
expect(cluster.leader()).toBe(null);

pass("03-leader-election");
