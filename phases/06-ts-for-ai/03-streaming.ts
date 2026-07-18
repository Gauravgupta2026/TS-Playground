/**
 * Phase 6 · Exercise 03 — Streaming
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/06-ts-for-ai/03-streaming.ts
 *   npm run check phases/06-ts-for-ai/03-streaming.ts
 *
 * Streams are async iterables of TYPED EVENTS — a discriminated union, so
 * consuming one is Phase 3 narrowing inside a for-await loop. The event
 * names below are the real SDK's names; we use a trimmed local union so
 * you can see the whole shape on one screen.
 */
import { expect, pass } from "../../helpers/assert";

// The trimmed event union (real streams have a few more member types):
type StreamEvent =
  | { type: "message_start"; usage: { input_tokens: number } }
  | { type: "content_block_delta"; delta: { type: "text_delta"; text: string } }
  | { type: "message_delta"; stop_reason: "end_turn" | "max_tokens" }
  | { type: "message_stop" };

/** A fake stream: yields events with tiny delays, like a network would. */
async function* fakeStream(text: string, stopReason: "end_turn" | "max_tokens"): AsyncGenerator<StreamEvent> {
  yield { type: "message_start", usage: { input_tokens: 42 } };
  for (const word of text.split(" ")) {
    await new Promise((r) => setTimeout(r, 2));
    yield { type: "content_block_delta", delta: { type: "text_delta", text: word + " " } };
  }
  yield { type: "message_delta", stop_reason: stopReason };
  yield { type: "message_stop" };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — fold a stream into a final result
//
// Implement collectStream: for-await over the events and build:
//   { text, inputTokens, stopReason, chunks }
// text: all text_delta texts joined (trim the trailing space at the end);
// chunks: how many text deltas arrived. Narrow on event.type — the compiler
// won't let you touch .delta on a message_start, which is the whole point.
// ─────────────────────────────────────────────────────────────────────────────
async function collectStream(stream: AsyncIterable<StreamEvent>): Promise<{
  text: string;
  inputTokens: number;
  stopReason: string;
  chunks: number;
}> {
  return { text: "", inputTokens: 0, stopReason: "", chunks: 0 }; // IMPLEMENT
}

const result = await collectStream(fakeStream("typed streams are just narrowing", "end_turn"));
expect(result.text).toBe("typed streams are just narrowing");
expect(result.chunks).toBe(5);
expect(result.inputTokens).toBe(42);
expect(result.stopReason).toBe("end_turn");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — live progress via callback
//
// UIs need tokens AS THEY ARRIVE, not at the end. Implement streamWithProgress:
// same fold, but call onDelta(deltaText) for every text chunk as it passes.
// (In a real CLI that callback is process.stdout.write — you'll wire that
// up in the checkpoint.)
// ─────────────────────────────────────────────────────────────────────────────
async function streamWithProgress(
  stream: AsyncIterable<StreamEvent>,
  onDelta: (text: string) => void
): Promise<string> {
  return ""; // IMPLEMENT
}

const arrived: string[] = [];
const finalText = await streamWithProgress(fakeStream("a b c", "end_turn"), (t) => arrived.push(t));
expect(arrived).toEqual(["a ", "b ", "c "]); // each chunk seen live
expect(finalText).toBe("a b c");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — detect truncation from the stream
//
// max_tokens truncation arrives in the message_delta event. Implement
// wasTruncated using collectStream.
// ─────────────────────────────────────────────────────────────────────────────
async function wasTruncated(stream: AsyncIterable<StreamEvent>): Promise<boolean> {
  return false; // IMPLEMENT
}

expect(await wasTruncated(fakeStream("short and complete", "end_turn"))).toBe(false);
expect(await wasTruncated(fakeStream("this answer got cut off at", "max_tokens"))).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// GOING LIVE: the real thing is nearly identical —
//   const stream = client.messages.stream({ model, max_tokens, messages });
//   for await (const event of stream) { …same narrowing… }
// (the SDK also offers stream.on("text", cb) and await stream.finalMessage(),
// which are conveniences built on exactly what you just wrote)
// ─────────────────────────────────────────────────────────────────────────────

pass("03-streaming");
