/** SOLUTION — Phase 6 · 04. */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, fakeToolUse, makeScriptedClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — JSON Schema for the model, Zod for us. Same contract twice
// (Phase 7 of your career: generate one from the other).
const convertTool: Anthropic.Tool = {
  name: "convert_currency",
  description: "Convert an INR amount to USD or EUR at today's rate.",
  input_schema: {
    type: "object",
    properties: {
      amountInr: { type: "number", description: "Amount in Indian rupees" },
      toCurrency: { type: "string", enum: ["usd", "eur"] },
    },
    required: ["amountInr", "toCurrency"],
  },
};

const ConvertInput = z.object({
  amountInr: z.number(),
  toCurrency: z.enum(["usd", "eur"]),
});
type ConvertInput = z.infer<typeof ConvertInput>;

expect((convertTool.input_schema.properties as Record<string, unknown>).amountInr !== undefined).toBe(true);
expect(convertTool.input_schema.required).toEqual(["amountInr", "toCurrency"]);
expect(ConvertInput.safeParse({ amountInr: 100, toCurrency: "usd" }).success).toBe(true);
expect(ConvertInput.safeParse({ amountInr: 100, toCurrency: "inr" }).success).toBe(false);

// EXERCISE 2
function findToolUse(msg: Anthropic.Message): Anthropic.ToolUseBlock | null {
  return msg.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use") ?? null;
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

// EXERCISE 3 — the model's input is boundary data; errors go BACK to the
// model as tool_results, because it can read them and retry.
const RATES = { usd: 0.012, eur: 0.011 } as const;

function runConvertTool(block: Anthropic.ToolUseBlock): { isError: boolean; content: string } {
  const parsed = ConvertInput.safeParse(block.input);
  if (!parsed.success) {
    return { isError: true, content: parsed.error.issues[0]?.message ?? "invalid input" };
  }
  const { amountInr, toCurrency } = parsed.data;
  const converted = amountInr * RATES[toCurrency];
  return { isError: false, content: `${converted.toFixed(2)} ${toCurrency}` };
}

const goodCall = fakeToolUse("toolu_1", "convert_currency", { amountInr: 8300, toCurrency: "usd" });
expect(runConvertTool(goodCall)).toEqual({ isError: false, content: "99.60 usd" });
const badCall = fakeToolUse("toolu_2", "convert_currency", { amountInr: "lots", toCurrency: "usd" });
expect(runConvertTool(badCall).isError).toBe(true);

// EXERCISE 4 — assistant turn first (verbatim blocks), then the result turn.
function toolResultTurns(
  response: Anthropic.Message,
  toolUseId: string,
  output: { isError: boolean; content: string }
): Anthropic.MessageParam[] {
  return [
    { role: "assistant", content: response.content },
    {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUseId,
          content: output.content,
          is_error: output.isError,
        },
      ],
    },
  ];
}

const turns = toolResultTurns(wantsTool, "toolu_1", { isError: false, content: "99.60 usd" });
expect(turns.length).toBe(2);
expect(turns[0]!.role).toBe("assistant");
expect(turns[1]!.role).toBe("user");
const resultBlock = (turns[1]!.content as Anthropic.ToolResultBlockParam[])[0]!;
expect(resultBlock.type).toBe("tool_result");
expect(resultBlock.tool_use_id).toBe("toolu_1");
expect(resultBlock.content).toBe("99.60 usd");

// EXERCISE 5 — one round-trip; the checkpoint turns this into a while-loop.
function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

async function askWithTool(
  client: { messages: { create(p: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> } },
  question: string
): Promise<string> {
  const history: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  const first = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    messages: history,
    tools: [convertTool],
  });
  if (first.stop_reason !== "tool_use") return extractText(first);

  const block = findToolUse(first);
  if (!block) return extractText(first);
  const output = runConvertTool(block);
  history.push(...toolResultTurns(first, block.id, output));

  const second = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    messages: history,
    tools: [convertTool],
  });
  return extractText(second);
}

const scripted = makeScriptedClient([wantsTool, fakeMessage("₹8300 is about $99.60.")]);
expect(await askWithTool(scripted.client, "What is ₹8300 in dollars?")).toBe("₹8300 is about $99.60.");
expect(scripted.requests[1]!.messages.length).toBe(3);
expect(scripted.requests[0]!.tools?.[0]?.name).toBe("convert_currency");

pass("04-tool-use (solution)");
