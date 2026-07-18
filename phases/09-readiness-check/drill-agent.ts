/**
 * Phase 9 · DRILL — Agent
 *
 * Gate: npm run ts + npm run check, both green. No guidance below this line.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, fakeToolUse, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// SPEC — a dictionary agent with ONE tool.
//
// Tool "define_word": input { word: string } (JSON Schema for the model,
// Zod for you). Behavior: DICTIONARY lookup; unknown word → tool_result
// with is_error true, content `unknown word: <word>`.
//
// runDictionaryAgent(client, question, maxIterations = 4):
//   - system prompt: exactly SYSTEM (below); tools: [defineTool]
//   - loop the tool-use protocol (assistant turn verbatim + one user turn
//     with ALL tool_results of that response, order preserved)
//   - non-tool_use stop → return the response text
//   - iteration budget exhausted → return "[gave up]"
//
// The scripted spec checks history bookkeeping precisely — get the two-turn
// append right.

const DICTIONARY: Record<string, string> = {
  ephemeral: "lasting a very short time",
  idempotent: "unchanged when applied twice",
};

const SYSTEM = "You are a dictionary assistant. Use the define_word tool for definitions.";

const defineTool: Anthropic.Tool = {
  name: "define_word",
  description: "Look up a word's definition.",
  input_schema: { type: "object", properties: {}, required: [] }, // complete me
};

const DefineInput = z.object({ word: z.string() });

async function runDictionaryAgent(
  client: ModelClient,
  question: string,
  maxIterations: number = 4
): Promise<string> {
  return "IMPLEMENT";
}

// ── The spec ────────────────────────────────────────────────────────────────
const happy = makeScriptedClient([
  fakeMessage([fakeToolUse("d1", "define_word", { word: "ephemeral" })], { stopReason: "tool_use" }),
  fakeMessage('Ephemeral means "lasting a very short time".'),
]);
expect(await runDictionaryAgent(happy.client, "What does ephemeral mean?")).toBe(
  'Ephemeral means "lasting a very short time".'
);
expect(happy.requests[0]!.system).toBe(SYSTEM);
expect(happy.requests[0]!.tools?.[0]?.name).toBe("define_word");
expect(happy.requests[1]!.messages.length).toBe(3);
const resultBlock = (happy.requests[1]!.messages[2]!.content as Anthropic.ToolResultBlockParam[])[0]!;
expect(resultBlock.tool_use_id).toBe("d1");
expect(resultBlock.content).toBe("lasting a very short time");

// unknown word → is_error, agent recovers:
const unknownWord = makeScriptedClient([
  fakeMessage([fakeToolUse("d1", "define_word", { word: "vibecoding" })], { stopReason: "tool_use" }),
  fakeMessage("That word isn't in my dictionary."),
]);
expect(await runDictionaryAgent(unknownWord.client, "define vibecoding")).toBe(
  "That word isn't in my dictionary."
);
const errBlock = (unknownWord.requests[1]!.messages[2]!.content as Anthropic.ToolResultBlockParam[])[0]!;
expect(errBlock.is_error).toBe(true);
expect(errBlock.content).toBe("unknown word: vibecoding");

// two tool calls in ONE response → ONE user turn with BOTH results:
const doubleCall = makeScriptedClient([
  fakeMessage(
    [
      fakeToolUse("d1", "define_word", { word: "ephemeral" }),
      fakeToolUse("d2", "define_word", { word: "idempotent" }),
    ],
    { stopReason: "tool_use" }
  ),
  fakeMessage("Both defined."),
]);
expect(await runDictionaryAgent(doubleCall.client, "define both")).toBe("Both defined.");
const bothResults = doubleCall.requests[1]!.messages[2]!.content as Anthropic.ToolResultBlockParam[];
expect(bothResults.length).toBe(2);
expect(bothResults[1]!.tool_use_id).toBe("d2");

// budget:
const forever = makeScriptedClient(
  Array.from({ length: 6 }, (_, i) =>
    fakeMessage([fakeToolUse(`d${i}`, "define_word", { word: "ephemeral" })], { stopReason: "tool_use" })
  )
);
expect(await runDictionaryAgent(forever.client, "loop", 2)).toBe("[gave up]");

pass("drill-agent — 4/4. Gate open: capstone/ awaits.");
