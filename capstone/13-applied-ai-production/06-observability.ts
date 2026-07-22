/**
 * Phase 13 · Exercise 06 — Observability with OpenTelemetry GenAI spans
 *
 * Both must pass (no API key needed):
 *   npm run ts    capstone/13-applied-ai-production/06-observability.ts
 *   npm run check capstone/13-applied-ai-production/06-observability.ts
 *
 * A model call is a black box until you trace it. The industry standard is
 * OpenTelemetry's GenAI semantic conventions: wrap each call in a SPAN carrying
 * gen_ai.* attributes (model, input/output tokens, finish reason), nest tool
 * and agent spans into a tree, and derive latency + token-based cost from it.
 * Time is injected (ManualClock) so durations are deterministic.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, type ModelClient } from "../../helpers/fake-anthropic";
import { ManualClock, type Now } from "../../helpers/fake-time";
import { expect, pass } from "../../helpers/assert";

type Span = {
  id: number;
  name: string;
  attributes: Record<string, unknown>;
  startMs: number;
  endMs: number;
  parentId: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — Tracer
//
//   start(name, attributes?): open a span at now(); its parentId is the
//     currently-open span (a stack), or null at the root. Returns the span id.
//   setAttr(id, key, value): set/overwrite an attribute.
//   end(id): stamp endMs = now() and pop it from the open stack.
//   spans(): all spans recorded (copies).
// ─────────────────────────────────────────────────────────────────────────────
class Tracer {
  constructor(now: Now) {
    // IMPLEMENT
  }

  start(name: string, attributes: Record<string, unknown> = {}): number {
    return -1; // IMPLEMENT
  }

  setAttr(id: number, key: string, value: unknown): void {
    // IMPLEMENT
  }

  end(id: number): void {
    // IMPLEMENT
  }

  spans(): Span[] {
    return []; // IMPLEMENT
  }
}

type Prices = Record<string, { input: number; output: number }>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — tracedClient(inner, tracer, prices)
//
// Wrap a ModelClient so each create() opens a "gen_ai.chat" span, and after the
// call records these attributes (OTel GenAI convention names):
//   "gen_ai.request.model"          = params.model
//   "gen_ai.usage.input_tokens"     = response.usage.input_tokens
//   "gen_ai.usage.output_tokens"    = response.usage.output_tokens
//   "gen_ai.response.finish_reasons"= [response.stop_reason]  (or [] if null)
//   "gen_ai.usage.cost"             = input*prices[model].input + output*prices[model].output
// …then ends the span and returns the response.
// ─────────────────────────────────────────────────────────────────────────────
function tracedClient(inner: ModelClient, tracer: Tracer, prices: Prices): ModelClient {
  return inner; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — traceSummary(tracer)
//
// Aggregate over all spans: { totalInputTokens, totalOutputTokens, totalCost,
// spanCount } (missing attributes count as 0).
// ─────────────────────────────────────────────────────────────────────────────
function traceSummary(
  tracer: Tracer
): { totalInputTokens: number; totalOutputTokens: number; totalCost: number; spanCount: number } {
  return { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, spanCount: 0 }; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const tracer = new Tracer(clock.now);
const prices: Prices = { "claude-haiku-4-5": { input: 1, output: 5 } }; // cost units per token

// a client that "takes" 50ms per call (advances the injected clock):
const latent: ModelClient = {
  messages: {
    async create() {
      clock.advance(50);
      return fakeMessage("hi", { inputTokens: 100, outputTokens: 20 });
    },
  },
};
const traced = tracedClient(latent, tracer, prices);

// a small agent run: one model call, then one tool call — a 2-child trace tree.
const root = tracer.start("agent.run");
await traced.messages.create({ model: "claude-haiku-4-5", max_tokens: 100, messages: [{ role: "user", content: "x" }] });
const toolSpan = tracer.start("tool.execute", { "tool.name": "search" });
clock.advance(10);
tracer.end(toolSpan);
tracer.end(root);

const spans = tracer.spans();
const rootSpan = spans.find((s) => s.name === "agent.run")!;
const chat = spans.find((s) => s.name === "gen_ai.chat")!;
const tool = spans.find((s) => s.name === "tool.execute")!;

// GenAI attributes captured:
expect(chat.attributes["gen_ai.request.model"]).toBe("claude-haiku-4-5");
expect(chat.attributes["gen_ai.usage.input_tokens"]).toBe(100);
expect(chat.attributes["gen_ai.usage.output_tokens"]).toBe(20);
expect(chat.attributes["gen_ai.response.finish_reasons"]).toEqual(["end_turn"]);
// latency from the injected clock:
expect(chat.endMs - chat.startMs).toBe(50);
expect(tool.endMs - tool.startMs).toBe(10);
// the tree nests correctly under the agent run:
expect(chat.parentId).toBe(rootSpan.id);
expect(tool.parentId).toBe(rootSpan.id);
expect(rootSpan.parentId).toBe(null);

// aggregate view: cost = 100*1 + 20*5 = 200 units across 3 spans.
expect(traceSummary(tracer)).toEqual({
  totalInputTokens: 100,
  totalOutputTokens: 20,
  totalCost: 200,
  spanCount: 3,
});

pass("06-observability");
