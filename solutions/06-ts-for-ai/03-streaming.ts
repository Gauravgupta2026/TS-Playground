/** SOLUTION — Phase 6 · 03. */
import { expect, pass } from "../../helpers/assert";

type StreamEvent =
  | { type: "message_start"; usage: { input_tokens: number } }
  | { type: "content_block_delta"; delta: { type: "text_delta"; text: string } }
  | { type: "message_delta"; stop_reason: "end_turn" | "max_tokens" }
  | { type: "message_stop" };

async function* fakeStream(text: string, stopReason: "end_turn" | "max_tokens"): AsyncGenerator<StreamEvent> {
  yield { type: "message_start", usage: { input_tokens: 42 } };
  for (const word of text.split(" ")) {
    await new Promise((r) => setTimeout(r, 2));
    yield { type: "content_block_delta", delta: { type: "text_delta", text: word + " " } };
  }
  yield { type: "message_delta", stop_reason: stopReason };
  yield { type: "message_stop" };
}

// EXERCISE 1 — narrowing per event type; the switch shape scales to the
// full event set.
async function collectStream(stream: AsyncIterable<StreamEvent>): Promise<{
  text: string;
  inputTokens: number;
  stopReason: string;
  chunks: number;
}> {
  let text = "";
  let inputTokens = 0;
  let stopReason = "";
  let chunks = 0;
  for await (const event of stream) {
    switch (event.type) {
      case "message_start":
        inputTokens = event.usage.input_tokens;
        break;
      case "content_block_delta":
        text += event.delta.text;
        chunks += 1;
        break;
      case "message_delta":
        stopReason = event.stop_reason;
        break;
      case "message_stop":
        break;
    }
  }
  return { text: text.trimEnd(), inputTokens, stopReason, chunks };
}

const result = await collectStream(fakeStream("typed streams are just narrowing", "end_turn"));
expect(result.text).toBe("typed streams are just narrowing");
expect(result.chunks).toBe(5);
expect(result.inputTokens).toBe(42);
expect(result.stopReason).toBe("end_turn");

// EXERCISE 2 — same fold, plus a side-channel for live tokens.
async function streamWithProgress(
  stream: AsyncIterable<StreamEvent>,
  onDelta: (text: string) => void
): Promise<string> {
  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      onDelta(event.delta.text);
      text += event.delta.text;
    }
  }
  return text.trimEnd();
}

const arrived: string[] = [];
const finalText = await streamWithProgress(fakeStream("a b c", "end_turn"), (t) => arrived.push(t));
expect(arrived).toEqual(["a ", "b ", "c "]);
expect(finalText).toBe("a b c");

// EXERCISE 3
async function wasTruncated(stream: AsyncIterable<StreamEvent>): Promise<boolean> {
  const { stopReason } = await collectStream(stream);
  return stopReason === "max_tokens";
}

expect(await wasTruncated(fakeStream("short and complete", "end_turn"))).toBe(false);
expect(await wasTruncated(fakeStream("this answer got cut off at", "max_tokens"))).toBe(true);

pass("03-streaming (solution)");
