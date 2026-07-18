/** SOLUTION — Phase 9 · drill-agent. */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, fakeToolUse, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

const DICTIONARY: Record<string, string> = {
  ephemeral: "lasting a very short time",
  idempotent: "unchanged when applied twice",
};

const SYSTEM = "You are a dictionary assistant. Use the define_word tool for definitions.";

const defineTool: Anthropic.Tool = {
  name: "define_word",
  description: "Look up a word's definition.",
  input_schema: {
    type: "object",
    properties: { word: { type: "string", description: "The word to define" } },
    required: ["word"],
  },
};

const DefineInput = z.object({ word: z.string() });

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function runDefineTool(block: Anthropic.ToolUseBlock): { isError: boolean; content: string } {
  const parsed = DefineInput.safeParse(block.input);
  if (!parsed.success) return { isError: true, content: parsed.error.issues[0]?.message ?? "invalid input" };
  const definition = DICTIONARY[parsed.data.word];
  if (definition === undefined) return { isError: true, content: `unknown word: ${parsed.data.word}` };
  return { isError: false, content: definition };
}

async function runDictionaryAgent(
  client: ModelClient,
  question: string,
  maxIterations: number = 4
): Promise<string> {
  const history: Anthropic.MessageParam[] = [{ role: "user", content: question }];

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      system: SYSTEM,
      messages: [...history],
      tools: [defineTool],
    });
    if (response.stop_reason !== "tool_use") return extractText(response);

    const toolBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    const results: Anthropic.ToolResultBlockParam[] = toolBlocks.map((block) => {
      const output = runDefineTool(block);
      return { type: "tool_result", tool_use_id: block.id, content: output.content, is_error: output.isError };
    });
    history.push({ role: "assistant", content: response.content });
    history.push({ role: "user", content: results });
  }
  return "[gave up]";
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

const forever = makeScriptedClient(
  Array.from({ length: 6 }, (_, i) =>
    fakeMessage([fakeToolUse(`d${i}`, "define_word", { word: "ephemeral" })], { stopReason: "tool_use" })
  )
);
expect(await runDictionaryAgent(forever.client, "loop", 2)).toBe("[gave up]");

pass("drill-agent (solution)");
