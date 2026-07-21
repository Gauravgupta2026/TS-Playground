/** SOLUTION — Phase 13 · 06. */
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

class Tracer {
  private readonly list: Span[] = [];
  private readonly stack: number[] = [];
  private nextId = 1;

  constructor(private readonly now: Now) {}

  start(name: string, attributes: Record<string, unknown> = {}): number {
    const id = this.nextId++;
    const parentId = this.stack.length ? this.stack[this.stack.length - 1]! : null;
    this.list.push({ id, name, attributes: { ...attributes }, startMs: this.now(), endMs: -1, parentId });
    this.stack.push(id);
    return id;
  }

  setAttr(id: number, key: string, value: unknown): void {
    const span = this.list.find((s) => s.id === id);
    if (span) span.attributes[key] = value;
  }

  end(id: number): void {
    const span = this.list.find((s) => s.id === id);
    if (span) span.endMs = this.now();
    const i = this.stack.lastIndexOf(id);
    if (i >= 0) this.stack.splice(i, 1);
  }

  spans(): Span[] {
    return this.list.map((s) => ({ ...s, attributes: { ...s.attributes } }));
  }
}

type Prices = Record<string, { input: number; output: number }>;

function tracedClient(inner: ModelClient, tracer: Tracer, prices: Prices): ModelClient {
  return {
    messages: {
      async create(params) {
        const id = tracer.start("gen_ai.chat", { "gen_ai.request.model": params.model });
        const response = await inner.messages.create(params);
        tracer.setAttr(id, "gen_ai.usage.input_tokens", response.usage.input_tokens);
        tracer.setAttr(id, "gen_ai.usage.output_tokens", response.usage.output_tokens);
        tracer.setAttr(id, "gen_ai.response.finish_reasons", response.stop_reason ? [response.stop_reason] : []);
        const price = prices[params.model as string];
        const cost = price
          ? response.usage.input_tokens * price.input + response.usage.output_tokens * price.output
          : 0;
        tracer.setAttr(id, "gen_ai.usage.cost", cost);
        tracer.end(id);
        return response;
      },
    },
  };
}

function traceSummary(
  tracer: Tracer
): { totalInputTokens: number; totalOutputTokens: number; totalCost: number; spanCount: number } {
  const spans = tracer.spans();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;
  for (const s of spans) {
    totalInputTokens += (s.attributes["gen_ai.usage.input_tokens"] as number) ?? 0;
    totalOutputTokens += (s.attributes["gen_ai.usage.output_tokens"] as number) ?? 0;
    totalCost += (s.attributes["gen_ai.usage.cost"] as number) ?? 0;
  }
  return { totalInputTokens, totalOutputTokens, totalCost, spanCount: spans.length };
}

// ── The spec ────────────────────────────────────────────────────────────────
const clock = new ManualClock();
const tracer = new Tracer(clock.now);
const prices: Prices = { "claude-haiku-4-5": { input: 1, output: 5 } };

const latent: ModelClient = {
  messages: {
    async create() {
      clock.advance(50);
      return fakeMessage("hi", { inputTokens: 100, outputTokens: 20 });
    },
  },
};
const traced = tracedClient(latent, tracer, prices);

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

expect(chat.attributes["gen_ai.request.model"]).toBe("claude-haiku-4-5");
expect(chat.attributes["gen_ai.usage.input_tokens"]).toBe(100);
expect(chat.attributes["gen_ai.usage.output_tokens"]).toBe(20);
expect(chat.attributes["gen_ai.response.finish_reasons"]).toEqual(["end_turn"]);
expect(chat.endMs - chat.startMs).toBe(50);
expect(tool.endMs - tool.startMs).toBe(10);
expect(chat.parentId).toBe(rootSpan.id);
expect(tool.parentId).toBe(rootSpan.id);
expect(rootSpan.parentId).toBe(null);

expect(traceSummary(tracer)).toEqual({
  totalInputTokens: 100,
  totalOutputTokens: 20,
  totalCost: 200,
  spanCount: 3,
});

pass("06-observability (solution)");
