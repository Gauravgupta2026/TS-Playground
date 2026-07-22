/** SOLUTION — Phase 12 · 02. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

const SUMMARY_PROMPT =
  "You compress conversations. Preserve decisions, facts, and open threads; drop resolved chatter. Maximize recall first.";

function extractText(message: Anthropic.MessageParam): string {
  if (typeof message.content === "string") return message.content;
  return message.content
    .map((block) => {
      if (block.type === "text") return block.text;
      if (block.type === "tool_use") return JSON.stringify(block.input);
      if (block.type === "tool_result") return typeof block.content === "string" ? block.content : "";
      return "";
    })
    .join(" ");
}

function estimateHistoryTokens(history: Anthropic.MessageParam[]): number {
  return history.reduce((sum, m) => sum + Math.ceil(extractText(m).length / 4), 0);
}

function renderTranscript(history: Anthropic.MessageParam[]): string {
  return history.map((m) => `${m.role}: ${extractText(m)}`).join("\n");
}

// EXERCISE 1 — clear stale tool results without mutating the input.
function clearOldToolResults(
  history: Anthropic.MessageParam[],
  keepLastN: number
): Anthropic.MessageParam[] {
  const cutoff = history.length - keepLastN;
  return history.map((message, i) => {
    if (i >= cutoff || typeof message.content === "string") return message;
    const content = message.content.map((block) =>
      block.type === "tool_result" ? { ...block, content: "[cleared]" } : block
    );
    return { ...message, content };
  });
}

// EXERCISE 2 — summarize the old, keep the recent verbatim.
async function compact(
  client: ModelClient,
  history: Anthropic.MessageParam[],
  opts: { thresholdTokens: number; keepRecent: number }
): Promise<Anthropic.MessageParam[]> {
  if (estimateHistoryTokens(history) <= opts.thresholdTokens) return history;

  const older = history.slice(0, history.length - opts.keepRecent);
  const recent = history.slice(history.length - opts.keepRecent);

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1000,
    system: SUMMARY_PROMPT,
    messages: [{ role: "user", content: renderTranscript(older) }],
  });
  const summary = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return [{ role: "user", content: `[Summary of earlier conversation]\n${summary}` }, ...recent];
}

// ── The spec ────────────────────────────────────────────────────────────────
const withTools: Anthropic.MessageParam[] = [
  { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "read", input: { path: "a" } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "HUGE FILE DUMP ..." }] },
  { role: "assistant", content: [{ type: "tool_use", id: "t2", name: "read", input: { path: "b" } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "t2", content: "recent result, keep me" }] },
];
const cleared = clearOldToolResults(withTools, 1);
expect(extractText(cleared[1]!)).toBe("[cleared]");
expect(extractText(cleared[3]!)).toBe("recent result, keep me");
expect(extractText(withTools[1]!)).toBe("HUGE FILE DUMP ...");

const long: Anthropic.MessageParam[] = [];
for (let i = 0; i < 10; i++) {
  long.push({ role: "user", content: `question number ${i} with a fair amount of padding text here` });
  long.push({ role: "assistant", content: `answer number ${i} with an equally long padded response text` });
}
long.push({ role: "user", content: "the most recent question" });
long.push({ role: "assistant", content: "the most recent answer" });

const summarizer = makeScriptedClient([
  fakeMessage("Decisions: used strict TS. Open threads: finalize the schema."),
]);
const before = estimateHistoryTokens(long);
const compacted = await compact(summarizer.client, long, { thresholdTokens: 100, keepRecent: 2 });

expect(compacted.length).toBe(3);
expect(extractText(compacted[0]!).includes("[Summary of earlier conversation]")).toBe(true);
expect(extractText(compacted[0]!).includes("finalize the schema")).toBe(true);
expect(compacted[1]).toEqual({ role: "user", content: "the most recent question" });
expect(compacted[2]).toEqual({ role: "assistant", content: "the most recent answer" });
expect(estimateHistoryTokens(compacted) < before).toBe(true);
expect(JSON.stringify(summarizer.requests[0]!.messages).includes("question number 0")).toBe(true);
expect(summarizer.requests[0]!.system).toBe(SUMMARY_PROMPT);

const shortHistory: Anthropic.MessageParam[] = [{ role: "user", content: "hi" }];
const noop = await compact(summarizer.client, shortHistory, { thresholdTokens: 100, keepRecent: 2 });
expect(noop).toEqual(shortHistory);

pass("02-compaction (solution)");
