/**
 * Phase 6 · Exercise 04 — Tool use: the mechanism under every agent
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/06-ts-for-ai/04-tool-use.ts
 *   npm run check phases/06-ts-for-ai/04-tool-use.ts
 *
 * The flow: you DESCRIBE a function → the model ASKS you to call it
 * (stop_reason "tool_use") → you validate its input, RUN the real code,
 * send back a tool_result → the model continues. Master this file and
 * agent frameworks stop being magic.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, fakeToolUse, makeScriptedClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — describe a tool
//
// Two artifacts per tool, and they MUST agree:
//   1. the Anthropic.Tool description (JSON Schema) — what the MODEL sees
//   2. a Zod schema — how YOU validate what the model sends back
// Define both for a currency converter: input { amountInr: number,
// toCurrency: "usd" | "eur" }. JSON Schema enum syntax:
//   { type: "string", enum: ["usd", "eur"] }
// ─────────────────────────────────────────────────────────────────────────────
const convertTool: Anthropic.Tool = {
  name: "convert_currency",
  description: "Convert an INR amount to USD or EUR at today's rate.",
  input_schema: {
    type: "object",
    properties: {
      // FILL IN amountInr and toCurrency
    },
    required: [], // FILL IN
  },
};

const ConvertInput = z.object({
  amountInr: z.number(), // keep in lockstep with the JSON Schema above
  toCurrency: z.string(), // TIGHTEN to the enum
});
type ConvertInput = z.infer<typeof ConvertInput>;

expect((convertTool.input_schema.properties as Record<string, unknown>).amountInr !== undefined).toBe(true);
expect(convertTool.input_schema.required).toEqual(["amountInr", "toCurrency"]);
expect(ConvertInput.safeParse({ amountInr: 100, toCurrency: "usd" }).success).toBe(true);
expect(ConvertInput.safeParse({ amountInr: 100, toCurrency: "inr" }).success).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — find the tool call in a response
//
// Implement findToolUse: return the FIRST tool_use block, or null.
// Same narrowing muscle as extractText — different arm of the union.
// ─────────────────────────────────────────────────────────────────────────────
function findToolUse(msg: Anthropic.Message): Anthropic.ToolUseBlock | null {
  return null; // IMPLEMENT
}

const wantsTool = fakeMessage(
  [
    { type: "text", text: "I'll convert that for you.", citations: null },
    fakeToolUse("toolu_1", "convert_currency", { amountInr: 8300, toCurrency: "usd" }),
  ],
  { stopReason: "tool_use" }
);
expect(findToolUse(wantsTool)?.name).toBe("convert_currency");
expect(findToolUse(fakeMessage("no tools here"))).toBe(null);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — run the tool SAFELY
//
// block.input is `unknown` — the model wrote it, so it crosses a boundary.
// Implement runConvertTool:
//   1. Validate block.input with ConvertInput.safeParse.
//      Invalid → { isError: true, content: <first issue message> }.
//      (Yes, you report errors BACK to the model — it reads them and
//      retries. Error messages are UX for models now.)
//   2. Valid → convert with RATES, format to 2 decimals: "99.60 usd"
// ─────────────────────────────────────────────────────────────────────────────
const RATES = { usd: 0.012, eur: 0.011 } as const;

function runConvertTool(block: Anthropic.ToolUseBlock): { isError: boolean; content: string } {
  return { isError: true, content: "IMPLEMENT me" };
}

const goodCall = fakeToolUse("toolu_1", "convert_currency", { amountInr: 8300, toCurrency: "usd" });
expect(runConvertTool(goodCall)).toEqual({ isError: false, content: "99.60 usd" });

const badCall = fakeToolUse("toolu_2", "convert_currency", { amountInr: "lots", toCurrency: "usd" });
expect(runConvertTool(badCall).isError).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — close the loop: build the tool_result turn
//
// After running a tool you append TWO turns to history:
//   { role: "assistant", content: response.content }        ← verbatim!
//   { role: "user", content: [{ type: "tool_result",
//       tool_use_id: <the block's id>, content: <output>,
//       is_error: <true only on failure> }] }
// Implement toolResultTurns for a response + tool output.
// ─────────────────────────────────────────────────────────────────────────────
function toolResultTurns(
  response: Anthropic.Message,
  toolUseId: string,
  output: { isError: boolean; content: string }
): Anthropic.MessageParam[] {
  return []; // IMPLEMENT — returns exactly two MessageParams
}

const turns = toolResultTurns(wantsTool, "toolu_1", { isError: false, content: "99.60 usd" });
expect(turns.length).toBe(2);
expect(turns[0]!.role).toBe("assistant");
expect(turns[1]!.role).toBe("user");
const resultBlock = (turns[1]!.content as Anthropic.ToolResultBlockParam[])[0]!;
expect(resultBlock.type).toBe("tool_result");
expect(resultBlock.tool_use_id).toBe("toolu_1");
expect(resultBlock.content).toBe("99.60 usd");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5 — one full round-trip
//
// Wire it together against a scripted model: ask → model requests the tool
// → you run it → send the result → model answers. Implement askWithTool.
// Loop shape (the checkpoint generalizes this to a while-loop):
//   1. create() with tools: [convertTool]
//   2. if stop_reason === "tool_use": find the block, run it, append the
//      two turns, create() again
//   3. return the final text
// ─────────────────────────────────────────────────────────────────────────────
async function askWithTool(
  client: { messages: { create(p: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> } },
  question: string
): Promise<string> {
  return ""; // IMPLEMENT
}

const scripted = makeScriptedClient([
  wantsTool, // model: "run convert_currency for me"
  fakeMessage("₹8300 is about $99.60."), // model, after seeing the result
]);

expect(await askWithTool(scripted.client, "What is ₹8300 in dollars?")).toBe("₹8300 is about $99.60.");
// The second request must contain: original question + assistant turn + tool result
expect(scripted.requests[1]!.messages.length).toBe(3);
expect(scripted.requests[0]!.tools?.[0]?.name).toBe("convert_currency");

pass("04-tool-use");
