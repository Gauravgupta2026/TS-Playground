/**
 * Phase 10 · Exercise 08 — Typed pub/sub event bus
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/10-systems-design/08-pubsub-bus.ts
 *   npm run check phases/10-systems-design/08-pubsub-bus.ts
 *
 * An event bus decouples producers from consumers: an agent emits `token`,
 * `tool_call`, `done`; loggers and UIs subscribe without the agent knowing
 * they exist. It's the backbone of tracing/observability in agent frameworks.
 * Node's built-in EventEmitter is UNtyped — here you make each event's payload
 * type-safe with a mapped `Record<EventName, Payload>`.
 */
import type { Expect, Equal } from "../../helpers/type-assert";
import { expect, pass } from "../../helpers/assert";

type EventMap = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — TypedEmitter<Events>
//
//   on<K>(event, handler): registers handler for `event`; RETURNS an
//     unsubscribe function that removes exactly that handler.
//   emit<K>(event, payload): calls every handler registered for `event`,
//     in registration order, with the typed payload.
//   off<K>(event, handler): removes that handler.
//
// The generics must make emit("x", wrongType) and on("unknownEvent", …) fail
// to COMPILE — that's the whole value over an untyped emitter.
// ─────────────────────────────────────────────────────────────────────────────
class TypedEmitter<Events extends EventMap> {
  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    return () => {}; // IMPLEMENT (register, return an unsubscribe)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // IMPLEMENT
  }

  off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    // IMPLEMENT
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

unsub(); // remove the handler
bus.emit("token", "dropped");
expect(tokens).toEqual(["he", "llo"]); // no longer receiving

// multiple handlers, in registration order:
let sum = 0;
bus.on("done", (d) => (sum += d.tokens));
bus.on("done", (d) => (sum += d.tokens * 10));
bus.emit("done", { tokens: 3 });
expect(sum).toBe(33); // 3 + 30

// the payload arrives correctly typed (compile-time proof):
bus.on("toolCall", (call) => {
  type _payloadIsTyped = Expect<Equal<typeof call, { name: string; input: unknown }>>;
  expect(call.name).toBe("search");
});
bus.emit("toolCall", { name: "search", input: { q: "rag" } });

// negative space: these must NOT compile (never called at runtime).
function _typeErrors(): void {
  // @ts-expect-error token's payload is a string, not a number
  bus.emit("token", 42);
  // @ts-expect-error no such event
  bus.on("nope", () => {});
}

pass("08-pubsub-bus");
