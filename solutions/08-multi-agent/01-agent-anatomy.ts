/** SOLUTION — Phase 8 · 01. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1
type AgentSpec = {
  name: string;
  systemPrompt: string;
  model: "claude-sonnet-5" | "claude-haiku-4-5";
  maxTurns?: number;
};

// EXERCISE 2 — a configured Phase 6 loop with private memory and a guard.
const DEFAULT_MAX_TURNS = 4;

class Agent {
  private readonly spec: AgentSpec;
  private readonly client: ModelClient;
  private readonly history: Anthropic.MessageParam[] = [];
  private turns = 0;

  constructor(spec: AgentSpec, client: ModelClient) {
    this.spec = spec;
    this.client = client;
  }

  async send(text: string): Promise<string> {
    const maxTurns = this.spec.maxTurns ?? DEFAULT_MAX_TURNS;
    if (this.turns >= maxTurns) {
      throw new Error(`${this.spec.name} exceeded ${maxTurns} turns`);
    }
    this.history.push({ role: "user", content: text });
    const response = await this.client.messages.create({
      model: this.spec.model,
      max_tokens: 1000,
      system: this.spec.systemPrompt,
      // A COPY, not the live array — anything that records the request
      // (fake clients, HTTP logs, retry queues) would otherwise see the
      // history mutate under it. Phase 1's reference lesson, in production.
      messages: [...this.history],
    });
    this.history.push({ role: "assistant", content: response.content });
    this.turns += 1;
    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  }

  get turnCount(): number {
    return this.turns;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const researcherClient = makeScriptedClient([
  fakeMessage("Fact: UPI settles between banks in batches."),
  fakeMessage("Fact: NPCI operates the UPI network."),
]);
const writerClient = makeScriptedClient([fakeMessage("UPI: instant for users, batched for banks.")]);

const researcher = new Agent(
  { name: "researcher", systemPrompt: "You research. Reply with one fact.", model: "claude-haiku-4-5" },
  researcherClient.client
);
const writer = new Agent(
  { name: "writer", systemPrompt: "You write crisp summaries.", model: "claude-sonnet-5", maxTurns: 1 },
  writerClient.client
);

expect(await researcher.send("Tell me about UPI settlement")).toBe(
  "Fact: UPI settles between banks in batches."
);
expect(await researcher.send("Who runs it?")).toBe("Fact: NPCI operates the UPI network.");
expect(researcher.turnCount).toBe(2);
expect(researcherClient.requests[0]!.system).toBe("You research. Reply with one fact.");
expect(researcherClient.requests[0]!.model).toBe("claude-haiku-4-5");
expect(researcherClient.requests[1]!.messages.length).toBe(3);

expect(await writer.send("Summarize: UPI settlement")).toBe("UPI: instant for users, batched for banks.");
expect(writerClient.requests[0]!.messages.length).toBe(1);
expect(writerClient.requests[0]!.model).toBe("claude-sonnet-5");

let guarded = "";
try {
  await writer.send("one more?");
} catch (thrown) {
  guarded = thrown instanceof Error ? thrown.message : "";
}
expect(guarded).toBe("writer exceeded 1 turns");

const defaultAgent = new Agent(
  { name: "d", systemPrompt: "x", model: "claude-haiku-4-5" },
  makeScriptedClient([fakeMessage("a"), fakeMessage("b"), fakeMessage("c"), fakeMessage("d")]).client
);
await defaultAgent.send("1");
await defaultAgent.send("2");
await defaultAgent.send("3");
await defaultAgent.send("4");
let defaultGuarded = false;
try {
  await defaultAgent.send("5");
} catch {
  defaultGuarded = true;
}
expect(defaultGuarded).toBe(true);

pass("01-agent-anatomy (solution)");
