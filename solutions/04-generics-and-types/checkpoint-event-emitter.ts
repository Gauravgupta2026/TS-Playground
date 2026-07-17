/** SOLUTION — Phase 4 · checkpoint. */
import { expect, pass } from "../../helpers/assert";

type PipelineEvents = {
  "task:start": { taskId: string };
  "tool:done": { output: string; tookMs: number };
  "task:finish": { taskId: string; success: boolean };
};

type Handler<P> = (payload: P) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  // Storage: event name → handlers. A mapped type keeps each bucket typed to
  // ITS event's payload. Partial because buckets are created lazily.
  const handlers: Partial<{ [K in keyof Events]: Handler<Events[K]>[] }> = {};

  return {
    on<K extends keyof Events>(name: K, handler: Handler<Events[K]>): void {
      // The ??= here is the one place we help the compiler: reading a
      // Partial slot gives `possibly undefined`, so initialize on first use.
      (handlers[name] ??= []).push(handler);
    },
    off<K extends keyof Events>(name: K, handler: Handler<Events[K]>): void {
      const bucket = handlers[name];
      if (!bucket) return;
      const index = bucket.indexOf(handler);
      if (index !== -1) bucket.splice(index, 1);
    },
    emit<K extends keyof Events>(name: K, payload: Events[K]): number {
      const bucket = handlers[name];
      if (!bucket) return 0;
      // Copy before iterating so a handler that unsubscribes mid-emit
      // doesn't shift the array under us.
      for (const handler of [...bucket]) handler(payload);
      return bucket.length;
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
emitter.on("tool:done", (payload) => seen.push(`ms:${payload.tookMs}`));

expect(emitter.emit("task:start", { taskId: "t1" })).toBe(1);
expect(emitter.emit("tool:done", { output: "42", tookMs: 7 })).toBe(2);
expect(seen).toEqual(["start:t1", "done:42", "ms:7"]);

emitter.off("tool:done", onDone);
expect(emitter.emit("tool:done", { output: "x", tookMs: 1 })).toBe(1);
expect(seen[seen.length - 1]).toBe("ms:1");

expect(emitter.emit("task:finish", { taskId: "t1", success: true })).toBe(0);
expect(emitter.emit("task:start", { taskId: "t2" })).toBe(1);

// ── Negative spec ───────────────────────────────────────────────────────────
// @ts-expect-error -- unknown event names must be rejected
emitter.on("typo:event", () => {});
// @ts-expect-error -- wrong payload shape for tool:done must be rejected
emitter.emit("tool:done", { wrong: true });
// @ts-expect-error -- payload fields must match the event's type exactly
emitter.emit("task:start", { taskId: 123 });

pass("checkpoint-event-emitter (solution)");
