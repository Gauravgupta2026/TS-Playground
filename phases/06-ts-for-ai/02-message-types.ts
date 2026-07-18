/**
 * Phase 6 · Exercise 02 — Conversations, roles, and usage
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/06-ts-for-ai/02-message-types.ts
 *   npm run check phases/06-ts-for-ai/02-message-types.ts
 *
 * The API is stateless: "memory" is you re-sending the whole history each
 * call. This file builds the Conversation class you'll reuse mentally
 * forever (and literally in the checkpoint).
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — history is an alternating array you own
//
// Implement Conversation:
//   addUser(text)      — append { role: "user", content: text }
//   addAssistant(msg)  — append the assistant turn from a response Message:
//                        { role: "assistant", content: msg.content }
//                        (pass the BLOCKS through verbatim — never flatten
//                        to a string; tool_use blocks would be destroyed,
//                        which is precisely the bug in most homegrown chat
//                        wrappers)
//   get messages()     — the MessageParam[] to send
// ─────────────────────────────────────────────────────────────────────────────
class Conversation {
  private history: Anthropic.MessageParam[] = [];

  addUser(text: string): void {
    // IMPLEMENT
  }

  addAssistant(msg: Anthropic.Message): void {
    // IMPLEMENT
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
const assistantTurn = convo.messages[1]!;
expect(Array.isArray(assistantTurn.content)).toBe(true); // blocks, not a string!

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — a multi-turn chat against the (scripted) model
//
// Implement chat(): send the conversation with the given system prompt,
// append the assistant's reply to the history, and return the reply text.
// Reuse the narrowing you wrote in file 01 for text extraction.
// ─────────────────────────────────────────────────────────────────────────────
async function chat(client: ModelClient, convo2: Conversation, userText: string): Promise<string> {
  // IMPLEMENT:
  //  1. convo2.addUser(userText)
  //  2. client.messages.create({ model: "claude-sonnet-5", max_tokens: 500,
  //     system: "You are a helpful tutor.", messages: convo2.messages })
  //  3. convo2.addAssistant(response); return the text
  return "";
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

// The SECOND request must have carried the FULL history (3 prior turns + new):
expect(scripted.requests[1]!.messages.length).toBe(4);
expect(scripted.requests[1]!.system).toBe("You are a helpful tutor.");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — track usage (you pay for every token, every call)
//
// Implement totalUsage: sum input and output tokens across responses.
// Note how input tokens GROW each turn — the whole history is re-billed.
// ─────────────────────────────────────────────────────────────────────────────
function totalUsage(responses: Anthropic.Message[]): { input: number; output: number } {
  return { input: 0, output: 0 }; // IMPLEMENT with a reduce
}

const turns = [
  fakeMessage("a", { inputTokens: 12, outputTokens: 40 }),
  fakeMessage("b", { inputTokens: 60, outputTokens: 35 }), // history grew!
  fakeMessage("c", { inputTokens: 104, outputTokens: 20 }),
];
expect(totalUsage(turns)).toEqual({ input: 176, output: 95 });
expect(totalUsage([])).toEqual({ input: 0, output: 0 });

pass("02-message-types");
