/**
 * Dry-run scripted clients. PROVIDED — this is the demo scenario the tests
 * run against. Reading it tells you the exact call order your crew must
 * make; that's intentional (the script IS the choreography spec).
 *
 * Scenario for the question "How do I keep a RAG system honest?":
 *   planner    → 2 sub-questions
 *   researcher → per sub-question: 1 tool_use (search_notes) + 1 findings JSON  (4 calls)
 *   writer     → draft v1
 *   critic     → feedback (missing citation)
 *   writer     → draft v2 (revised)
 *   critic     → APPROVED
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { CrewClients, ModelClient } from "./types";

export const DEMO_QUESTION = "How do I keep a RAG system honest?";

function msg(
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
      input_tokens: options.inputTokens ?? 100,
      output_tokens: options.outputTokens ?? 50,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: null,
    },
  };
}

function toolUse(id: string, input: unknown): Anthropic.ToolUseBlock {
  return { type: "tool_use", id, name: "search_notes", input };
}

export function scripted(script: Anthropic.Message[]): {
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
          if (!next) throw new Error(`script exhausted after ${call} calls — check your call order`);
          call += 1;
          return next;
        },
      },
    },
  };
}

export const DRAFT_V1 =
  "Ground every answer in retrieved chunks [rag-engineering.md]. Reject uncited answers, and make the model admit ignorance when sources are silent.";

export const DRAFT_V2 =
  "Ground every answer in retrieved chunks [rag-engineering.md]. Reject uncited answers as ungrounded [rag-engineering.md], " +
  "and measure faithfulness so every claim resolves to a retrieved chunk [evals.md].";

export function makeDryRunClients(): { clients: CrewClients; requests: Record<keyof CrewClients, Anthropic.MessageCreateParamsNonStreaming[]> } {
  const planner = scripted([
    msg('{"subQuestions": ["How do citations keep RAG answers grounded?", "How is answer faithfulness measured?"]}', {
      inputTokens: 80,
      outputTokens: 30,
    }),
  ]);

  const researcher = scripted([
    // sub-question 1
    msg([toolUse("s1", { query: "citations grounding RAG answers" })], { stopReason: "tool_use" }),
    msg(
      '{"subQuestion": "How do citations keep RAG answers grounded?", "summary": "Citations trace claims to chunks; uncited answers are rejected.", ' +
        '"keyFacts": [{"fact": "Citations let every claim be traced back to a source chunk", "source": "rag-engineering.md"}, ' +
        '{"fact": "An answer without citations should be treated as ungrounded", "source": "rag-engineering.md"}]}'
    ),
    // sub-question 2
    msg([toolUse("s2", { query: "measuring answer faithfulness evals" })], { stopReason: "tool_use" }),
    msg(
      '{"subQuestion": "How is answer faithfulness measured?", "summary": "Faithfulness checks that cited chunks support each claim.", ' +
        '"keyFacts": [{"fact": "Faithfulness checks confirm each claim carries a citation resolving to a retrieved chunk", "source": "evals.md"}]}'
    ),
  ]);

  const writer = scripted([msg(DRAFT_V1), msg(DRAFT_V2)]);

  const critic = scripted([
    msg("The faithfulness claim is missing its citation — cite evals.md for the measurement fact."),
    msg("APPROVED"),
  ]);

  return {
    clients: { planner: planner.client, researcher: researcher.client, writer: writer.client, critic: critic.client },
    requests: {
      planner: planner.requests,
      researcher: researcher.requests,
      writer: writer.requests,
      critic: critic.requests,
    },
  };
}
