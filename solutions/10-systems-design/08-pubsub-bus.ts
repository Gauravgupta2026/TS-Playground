/** SOLUTION — Phase 10 · 08. */
import type { Expect, Equal } from "../../helpers/type-assert";
import { expect, pass } from "../../helpers/assert";

type EventMap = Record<string, unknown>;

class TypedEmitter<Events extends EventMap> {
  // One handler set per event. `any` would defeat the point; we store the
  // erased handler shape and re-narrow at the typed on/emit boundary.
  private readonly handlers = new Map<keyof Events, Set<(payload: never) => void>>();

  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as (payload: never) => void);
    return () => this.off(event, handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Copy before iterating so a handler that unsubscribes mid-emit is safe.
    for (const handler of [...set]) (handler as (payload: Events[K]) => void)(payload);
  }

  off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    this.handlers.get(event)?.delete(handler as (payload: never) => void);
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
type AgentEvents = {
  token: string;
  toolCall: { name: string; input: unknown };
  done: { tokens: number };
};

const bus = new TypedEmitter<AgentEvents>();

const tokens: string[] = [];
const unsub = bus.on("token", (t) => tokens.push(t));
bus.emit("token", "he");
bus.emit("token", "llo");
expect(tokens).toEqual(["he", "llo"]);

unsub();
bus.emit("token", "dropped");
expect(tokens).toEqual(["he", "llo"]);

let sum = 0;
bus.on("done", (d) => (sum += d.tokens));
bus.on("done", (d) => (sum += d.tokens * 10));
bus.emit("done", { tokens: 3 });
expect(sum).toBe(33);

bus.on("toolCall", (call) => {
  type _payloadIsTyped = Expect<Equal<typeof call, { name: string; input: unknown }>>;
  expect(call.name).toBe("search");
});
bus.emit("toolCall", { name: "search", input: { q: "rag" } });

function _typeErrors(): void {
  // @ts-expect-error token's payload is a string, not a number
  bus.emit("token", 42);
  // @ts-expect-error no such event
  bus.on("nope", () => {});
}

pass("08-pubsub-bus (solution)");
