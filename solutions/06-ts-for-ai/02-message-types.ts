/** SOLUTION — Phase 6 · 02. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — blocks pass through verbatim; flattening to a string would
// destroy tool_use blocks.
class Conversation {
  private history: Anthropic.MessageParam[] = [];

  addUser(text: string): void {
    this.history.push({ role: "user", content: text });
  }

  addAssistant(msg: Anthropic.Message): void {
    this.history.push({ role: "assistant", content: msg.content });
  }

  get messages(): Anthropic.MessageParam[] {
    return this.history;
  }
}

const convo = new Conversation();
convo.addUser("What is a token?");
convo.addAssistant(fakeMessage("Roughly ¾ of a word."));
convo.addUser("And a context window?");
expect(convo.messages.length).toBe(3);
expect(convo.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
expect(Array.isArray(convo.messages[1]!.content)).toBe(true);

// EXERCISE 2
function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

async function chat(client: ModelClient, convo2: Conversation, userText: string): Promise<string> {
  convo2.addUser(userText);
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    system: "You are a helpful tutor.",
    messages: convo2.messages,
  });
  convo2.addAssistant(response);
  return extractText(response);
}

const scripted = makeScriptedClient([
  fakeMessage("An embedding is a vector representing meaning."),
  fakeMessage("They are compared with cosine similarity."),
]);
const tutorConvo = new Conversation();
expect(await chat(scripted.client, tutorConvo, "What is an embedding?")).toBe(
  "An embedding is a vector representing meaning."
);
expect(await chat(scripted.client, tutorConvo, "How are they compared?")).toBe(
  "They are compared with cosine similarity."
);
expect(scripted.requests[1]!.messages.length).toBe(4);
expect(scripted.requests[1]!.system).toBe("You are a helpful tutor.");

// EXERCISE 3
function totalUsage(responses: Anthropic.Message[]): { input: number; output: number } {
  return responses.reduce(
    (acc, msg) => ({
      input: acc.input + msg.usage.input_tokens,
      output: acc.output + msg.usage.output_tokens,
    }),
    { input: 0, output: 0 }
  );
}

const turns = [
  fakeMessage("a", { inputTokens: 12, outputTokens: 40 }),
  fakeMessage("b", { inputTokens: 60, outputTokens: 35 }),
  fakeMessage("c", { inputTokens: 104, outputTokens: 20 }),
];
expect(totalUsage(turns)).toEqual({ input: 176, output: 95 });
expect(totalUsage([])).toEqual({ input: 0, output: 0 });

pass("02-message-types (solution)");
