/**
 * Phase 4 · CHECKPOINT — A fully type-safe event emitter
 *
 * Both must pass:
 *   npm run ts    phases/04-generics-and-types/checkpoint-event-emitter.ts
 *   npm run check phases/04-generics-and-types/checkpoint-event-emitter.ts
 *
 * THE GOAL: an emitter where the EVENT NAME determines the PAYLOAD TYPE.
 *   emit("tool:done", { output: "…" })   ✓ compiles
 *   emit("tool:done", { wrong: true })   ✗ compile error
 *   on("typo:event", …)                  ✗ compile error
 *
 * This is typed message passing — the exact mechanism you'll use between
 * agents in Phase 8. Everything you need: generics over an event-map type,
 * K extends keyof T, indexed access T[K], Record, and closures for storage.
 *
 * SPEC:
 *   createEmitter<Events>() returns { on, off, emit }
 *     on(name, handler)   — register; handler receives Events[name]
 *     off(name, handler)  — remove ONE previously registered handler
 *     emit(name, payload) — call all handlers for name, in registration
 *                           order; returns how many handlers ran
 *   Handlers for one event must not affect another event's handlers.
 *
 * Storage hint: a Record mapping event name → array of handlers. Inside the
 * implementation you'll need one controlled type assertion — see the
 * solution's note about WHY that's acceptable at this one spot.
 */
import { expect, pass } from "../../helpers/assert";

// The event map for our little agent pipeline: name → payload type.
type PipelineEvents = {
  "task:start": { taskId: string };
  "tool:done": { output: string; tookMs: number };
  "task:finish": { taskId: string; success: boolean };
};

type Handler<P> = (payload: P) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  // IMPLEMENT storage + the three methods, fully typed.
  return {
    on: (name: string, handler: (payload: unknown) => void): void => {
      // IMPLEMENT
    },
    off: (name: string, handler: (payload: unknown) => void): void => {
      // IMPLEMENT
    },
    emit: (name: string, payload: unknown): number => {
      // IMPLEMENT
      return 0;
    },
  };
}

// ── The spec ────────────────────────────────────────────────────────────────
const emitter = createEmitter<PipelineEvents>();

const seen: string[] = [];
const onStart = (payload: { taskId: string }) => seen.push(`start:${payload.taskId}`);
const onDone = (payload: { output: string; tookMs: number }) => seen.push(`done:${payload.output}`);

emitter.on("task:start", onStart);
emitter.on("tool:done", onDone);
emitter.on("tool:done", (payload) => seen.push(`ms:${payload.tookMs}`)); // payload must be INFERRED here

expect(emitter.emit("task:start", { taskId: "t1" })).toBe(1);
expect(emitter.emit("tool:done", { output: "42", tookMs: 7 })).toBe(2);
expect(seen).toEqual(["start:t1", "done:42", "ms:7"]);

// off removes exactly one handler
emitter.off("tool:done", onDone);
expect(emitter.emit("tool:done", { output: "x", tookMs: 1 })).toBe(1);
expect(seen[seen.length - 1]).toBe("ms:1");

// events don't leak into each other
expect(emitter.emit("task:finish", { taskId: "t1", success: true })).toBe(0);

// emitting an event nobody registered is fine
expect(emitter.emit("task:start", { taskId: "t2" })).toBe(1);

// ── Negative spec: the types must enforce the contract ──────────────────────
// @ts-expect-error -- unknown event names must be rejected
emitter.on("typo:event", () => {});
// @ts-expect-error -- wrong payload shape for tool:done must be rejected
emitter.emit("tool:done", { wrong: true });
// @ts-expect-error -- payload fields must match the event's type exactly
emitter.emit("task:start", { taskId: 123 });

pass("checkpoint-event-emitter — Phase 4 complete! Real-world TS next.");
