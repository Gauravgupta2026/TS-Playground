/**
 * Phase 6 · CHECKPOINT — A typed CLI agent
 *
 * Both must pass (no API key needed for the checks):
 *   npm run ts    phases/06-ts-for-ai/checkpoint-cli-agent.ts
 *   npm run check phases/06-ts-for-ai/checkpoint-cli-agent.ts
 *
 * Build the real thing: an agent loop with TWO tools, validated inputs,
 * an iteration guard, and a transcript. The scripted client plays a
 * two-tool-call scenario; your loop must handle it exactly.
 *
 * SPEC — runAgent(client, task, options?):
 *   loop:
 *     1. create() with system prompt, full history, both tools
 *     2. stop_reason "tool_use" → for EVERY tool_use block in the response:
 *        validate input (each tool's Zod schema) and run it; invalid input
 *        or unknown tool name → tool_result with is_error: true and the
 *        error message. Append assistant turn + ONE user turn holding ALL
 *        tool_result blocks (order preserved). Record each call in
 *        `transcript` as "<name>(<JSON input>) -> <output>". Loop again.
 *     3. any other stop_reason → return { text, transcript, iterations }
 *   guard: at most options.maxIterations (default 5) API calls; hitting the
 *   cap returns text "[agent exceeded iteration budget]".
 *
 * TOOLS:
 *   calculate  { expression: string }  — evaluate +-*÷ arithmetic. Use the
 *     provided safeCalculate (never eval!). Result → String(value).
 *   read_note  { name: string }       — look up NOTES; missing note →
 *     is_error tool_result "no note named <name>".
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, fakeToolUse, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// ── Provided: a safe arithmetic evaluator (numbers, + - * / and spaces) ─────
function safeCalculate(expression: string): number {
  if (!/^[\d\s+\-*/().]+$/.test(expression)) throw new Error("unsupported characters");
  // Function constructor over a vetted charset — the standard eval-free trick.
  return new Function(`"use strict"; return (${expression});`)() as number;
}

const NOTES: Record<string, string> = {
  budget: "Monthly budget: ₹22900 total, ₹5000 food.",
  goals: "Ship the capstone by end of month.",
};

// ── 1. Define the tools (JSON Schema for the model, Zod for you) ────────────
const calculateTool: Anthropic.Tool = {
  name: "calculate",
  description: "Evaluate an arithmetic expression like '2 * (3 + 4)'.",
  input_schema: { type: "object", properties: {}, required: [] }, // FILL IN
};
const readNoteTool: Anthropic.Tool = {
  name: "read_note",
  description: "Read one of the user's saved notes by name.",
  input_schema: { type: "object", properties: {}, required: [] }, // FILL IN
};

const CalculateInput = z.object({ expression: z.string() });
const ReadNoteInput = z.object({ name: z.string() });

// ── 2. The loop ─────────────────────────────────────────────────────────────
type AgentResult = { text: string; transcript: string[]; iterations: number };

async function runAgent(
  client: ModelClient,
  task: string,
  options: { maxIterations?: number } = {}
): Promise<AgentResult> {
  return { text: "IMPLEMENT me", transcript: [], iterations: 0 };
}

// ── The spec: a scripted two-step tool scenario ─────────────────────────────
const scripted = makeScriptedClient([
  fakeMessage([fakeToolUse("t1", "read_note", { name: "budget" })], { stopReason: "tool_use" }),
  fakeMessage([fakeToolUse("t2", "calculate", { expression: "22900 - 5000" })], { stopReason: "tool_use" }),
  fakeMessage("After food, ₹17900 of your budget remains."),
]);

const result = await runAgent(scripted.client, "How much of my budget is left after food?");
expect(result.text).toBe("After food, ₹17900 of your budget remains.");
expect(result.iterations).toBe(3);
expect(result.transcript).toEqual([
  'read_note({"name":"budget"}) -> Monthly budget: ₹22900 total, ₹5000 food.',
  'calculate({"expression":"22900 - 5000"}) -> 17900',
]);

// history bookkeeping: final request = task + 2×(assistant + tool_result)
expect(scripted.requests[2]!.messages.length).toBe(5);
// both tools were offered on every call
expect(scripted.requests[0]!.tools?.length).toBe(2);

// ── error paths ─────────────────────────────────────────────────────────────
// unknown note → is_error result fed back, model recovers:
const missingNote = makeScriptedClient([
  fakeMessage([fakeToolUse("t1", "read_note", { name: "diary" })], { stopReason: "tool_use" }),
  fakeMessage("You have no diary note."),
]);
const recovered = await runAgent(missingNote.client, "Read my diary");
expect(recovered.text).toBe("You have no diary note.");
const errResult = (missingNote.requests[1]!.messages[2]!.content as Anthropic.ToolResultBlockParam[])[0]!;
expect(errResult.is_error).toBe(true);
expect(errResult.content).toBe("no note named diary");

// invalid tool input → is_error, not a crash:
const badInput = makeScriptedClient([
  fakeMessage([fakeToolUse("t1", "calculate", { expr: "2+2" })], { stopReason: "tool_use" }), // wrong key!
  fakeMessage("Let me try again with the right format."),
]);
expect((await runAgent(badInput.client, "calc")).text).toBe("Let me try again with the right format.");

// runaway model → iteration budget saves your wallet:
const runaway = makeScriptedClient(
  Array.from({ length: 10 }, (_, i) =>
    fakeMessage([fakeToolUse(`t${i}`, "calculate", { expression: "1 + 1" })], { stopReason: "tool_use" })
  )
);
const capped = await runAgent(runaway.client, "loop forever", { maxIterations: 3 });
expect(capped.text).toBe("[agent exceeded iteration budget]");
expect(capped.iterations).toBe(3);

// ─────────────────────────────────────────────────────────────────────────────
// GOING LIVE: swap the scripted client for the real one —
//   import Anthropic from "@anthropic-ai/sdk"; import "dotenv/config";
//   const real = new Anthropic();
//   const live = await runAgent(real, "What is 15% of 2400? Use the calculator.");
//   console.log(live.text, live.transcript);
// Same function. That's dependency injection paying out.
// ─────────────────────────────────────────────────────────────────────────────

pass("checkpoint-cli-agent — Phase 6 complete! You've built an agent. RAG next.");
