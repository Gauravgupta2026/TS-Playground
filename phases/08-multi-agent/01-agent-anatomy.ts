/**
 * Phase 8 · Exercise 01 — Agent anatomy
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/08-multi-agent/01-agent-anatomy.ts
 *   npm run check phases/08-multi-agent/01-agent-anatomy.ts
 *
 * Agent = role (system prompt) + model + tools + private memory.
 * You'll build the Agent class every later file (and the capstone) uses.
 * It's a thin, typed wrapper around the Phase 6 loop — which is the point:
 * there is no other magic to find.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the spec type
//
// Define AgentSpec: name (string), systemPrompt (string), model (the
// literal union "claude-sonnet-5" | "claude-haiku-4-5" — different roles,
// different price points), maxTurns (number, DEFAULTED to 4 by the class).
// ─────────────────────────────────────────────────────────────────────────────
type AgentSpec = {
  // IMPLEMENT (maxTurns optional — the class applies the default)
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — the Agent class
//
// Implement Agent:
//   constructor(spec, client)
//   async send(text): adds a user turn to the PRIVATE history, calls the
//     model (spec.model, spec.systemPrompt, full history, max_tokens 1000),
//     appends the assistant turn, returns the response text.
//   get turnCount(): number of times send() completed.
//   Throw Error(`${name} exceeded ${maxTurns} turns`) when send() is called
//     beyond maxTurns — the first guardrail, built in from day one.
// Two agents must NEVER share history (the "memory is private" rule).
//
// SUBTLE TRAP (you may hit it — it's worth hitting): pass a COPY of the
// history into create() ([...this.history]), not the live array. The
// scripted client RECORDS each request; if you pass the array itself, the
// recording mutates as you push later turns, and the history-length checks
// below fail mysteriously. Phase 1's reference-vs-copy lesson, striking in
// production shape.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_MAX_TURNS = 4;

class Agent {
  constructor(spec: AgentSpec, client: ModelClient) {
    // IMPLEMENT
  }

  async send(text: string): Promise<string> {
    return ""; // IMPLEMENT
  }

  get turnCount(): number {
    return -1; // IMPLEMENT
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

// each agent sends ITS OWN system prompt and model:
expect(researcherClient.requests[0]!.system).toBe("You research. Reply with one fact.");
expect(researcherClient.requests[0]!.model).toBe("claude-haiku-4-5");
// private memory: researcher's second call carries ITS 3-turn history…
expect(researcherClient.requests[1]!.messages.length).toBe(3);

// …and the writer's history is untouched by any of it:
expect(await writer.send("Summarize: UPI settlement")).toBe("UPI: instant for users, batched for banks.");
expect(writerClient.requests[0]!.messages.length).toBe(1);
expect(writerClient.requests[0]!.model).toBe("claude-sonnet-5");

// the turn guardrail:
let guarded = "";
try {
  await writer.send("one more?"); // writer.maxTurns is 1
} catch (thrown) {
  guarded = thrown instanceof Error ? thrown.message : "";
}
expect(guarded).toBe("writer exceeded 1 turns");

// and the default applies when maxTurns is omitted:
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

pass("01-agent-anatomy");
