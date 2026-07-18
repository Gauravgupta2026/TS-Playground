/** SOLUTION — Phase 6 · checkpoint. The agent loop, complete. */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, fakeToolUse, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

function safeCalculate(expression: string): number {
  if (!/^[\d\s+\-*/().]+$/.test(expression)) throw new Error("unsupported characters");
  return new Function(`"use strict"; return (${expression});`)() as number;
}

const NOTES: Record<string, string> = {
  budget: "Monthly budget: ₹22900 total, ₹5000 food.",
  goals: "Ship the capstone by end of month.",
};

// ── 1. Tools ────────────────────────────────────────────────────────────────
const calculateTool: Anthropic.Tool = {
  name: "calculate",
  description: "Evaluate an arithmetic expression like '2 * (3 + 4)'.",
  input_schema: {
    type: "object",
    properties: { expression: { type: "string", description: "Arithmetic expression" } },
    required: ["expression"],
  },
};
const readNoteTool: Anthropic.Tool = {
  name: "read_note",
  description: "Read one of the user's saved notes by name.",
  input_schema: {
    type: "object",
    properties: { name: { type: "string", description: "The note's name" } },
    required: ["name"],
  },
};

const CalculateInput = z.object({ expression: z.string() });
const ReadNoteInput = z.object({ name: z.string() });

// ── 2. The loop ─────────────────────────────────────────────────────────────
type AgentResult = { text: string; transcript: string[]; iterations: number };
type ToolOutput = { isError: boolean; content: string };

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function runTool(block: Anthropic.ToolUseBlock): ToolOutput {
  switch (block.name) {
    case "calculate": {
      const parsed = CalculateInput.safeParse(block.input);
      if (!parsed.success) return { isError: true, content: parsed.error.issues[0]?.message ?? "invalid input" };
      try {
        return { isError: false, content: String(safeCalculate(parsed.data.expression)) };
      } catch (thrown) {
        return { isError: true, content: thrown instanceof Error ? thrown.message : String(thrown) };
      }
    }
    case "read_note": {
      const parsed = ReadNoteInput.safeParse(block.input);
      if (!parsed.success) return { isError: true, content: parsed.error.issues[0]?.message ?? "invalid input" };
      const note = NOTES[parsed.data.name];
      if (note === undefined) return { isError: true, content: `no note named ${parsed.data.name}` };
      return { isError: false, content: note };
    }
    default:
      return { isError: true, content: `unknown tool: ${block.name}` };
  }
}

const DEFAULT_MAX_ITERATIONS = 5;

async function runAgent(
  client: ModelClient,
  task: string,
  options: { maxIterations?: number } = {}
): Promise<AgentResult> {
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const history: Anthropic.MessageParam[] = [{ role: "user", content: task }];
  const transcript: string[] = [];

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system: "You are a personal assistant. Use tools when they help.",
      messages: history,
      tools: [calculateTool, readNoteTool],
    });

    if (response.stop_reason !== "tool_use") {
      return { text: extractText(response), transcript, iterations: iteration };
    }

    const toolBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    const resultBlocks: Anthropic.ToolResultBlockParam[] = toolBlocks.map((block) => {
      const output = runTool(block);
      transcript.push(`${block.name}(${JSON.stringify(block.input)}) -> ${output.content}`);
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: output.content,
        is_error: output.isError,
      };
    });

    history.push({ role: "assistant", content: response.content });
    history.push({ role: "user", content: resultBlocks });
  }

  return { text: "[agent exceeded iteration budget]", transcript, iterations: maxIterations };
}

// ── The spec ────────────────────────────────────────────────────────────────
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
expect(scripted.requests[2]!.messages.length).toBe(5);
expect(scripted.requests[0]!.tools?.length).toBe(2);

const missingNote = makeScriptedClient([
  fakeMessage([fakeToolUse("t1", "read_note", { name: "diary" })], { stopReason: "tool_use" }),
  fakeMessage("You have no diary note."),
]);
const recovered = await runAgent(missingNote.client, "Read my diary");
expect(recovered.text).toBe("You have no diary note.");
const errResult = (missingNote.requests[1]!.messages[2]!.content as Anthropic.ToolResultBlockParam[])[0]!;
expect(errResult.is_error).toBe(true);
expect(errResult.content).toBe("no note named diary");

const badInput = makeScriptedClient([
  fakeMessage([fakeToolUse("t1", "calculate", { expr: "2+2" })], { stopReason: "tool_use" }),
  fakeMessage("Let me try again with the right format."),
]);
expect((await runAgent(badInput.client, "calc")).text).toBe("Let me try again with the right format.");

const runaway = makeScriptedClient(
  Array.from({ length: 10 }, (_, i) =>
    fakeMessage([fakeToolUse(`t${i}`, "calculate", { expression: "1 + 1" })], { stopReason: "tool_use" })
  )
);
const capped = await runAgent(runaway.client, "loop forever", { maxIterations: 3 });
expect(capped.text).toBe("[agent exceeded iteration budget]");
expect(capped.iterations).toBe(3);

pass("checkpoint-cli-agent (solution)");
