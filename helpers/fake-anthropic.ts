/**
 * A deterministic stand-in for the Anthropic client, used by Phases 6–8.
 *
 * WHY: every exercise must be runnable offline, free, and reproducibly —
 * but with the REAL SDK types, so what you learn transfers 1:1 to live
 * calls. The fake implements the same `messages.create` surface and returns
 * genuine `Anthropic.Message` objects you script in advance.
 *
 * This "inject the client" pattern is also exactly how production code
 * makes model-calling logic testable — the fake is not a toy, it's the
 * industry testing pattern.
 */
import type Anthropic from "@anthropic-ai/sdk";

/** Build a real Anthropic.Message from content blocks (or a plain string). */
export function fakeMessage(
  content: string | Anthropic.ContentBlock[],
  options: { stopReason?: Anthropic.StopReason; inputTokens?: number; outputTokens?: number } = {}
): Anthropic.Message {
  const blocks: Anthropic.ContentBlock[] =
    typeof content === "string" ? [{ type: "text", text: content, citations: null }] : content;
  return {
    id: "msg_fake",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-5",
    content: blocks,
    stop_reason: options.stopReason ?? "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: options.inputTokens ?? 10,
      output_tokens: options.outputTokens ?? 25,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: null,
    },
  };
}

/** Shorthand for a tool_use content block. */
export function fakeToolUse(id: string, name: string, input: unknown): Anthropic.ToolUseBlock {
  return { type: "tool_use", id, name, input };
}

/** The slice of the client surface our exercises use. The real client fits it. */
export type ModelClient = {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
};

/**
 * A client that replays `script` in order, recording every request so your
 * checks can assert what was SENT (params.messages, tools, etc.).
 */
export function makeScriptedClient(script: Anthropic.Message[]): {
  client: ModelClient;
  requests: Anthropic.MessageCreateParamsNonStreaming[];
} {
  const requests: Anthropic.MessageCreateParamsNonStreaming[] = [];
  let call = 0;
  return {
    requests,
    client: {
      messages: {
        async create(params) {
          requests.push(params);
          const next = script[call];
          if (!next) throw new Error(`scripted client exhausted after ${call} calls`);
          call += 1;
          return next;
        },
      },
    },
  };
}
