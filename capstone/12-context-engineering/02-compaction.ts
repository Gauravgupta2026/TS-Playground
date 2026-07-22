/**
 * Phase 12 · Exercise 02 — Compaction & tool-result clearing
 *
 * Both must pass (no API key needed):
 *   npm run ts    capstone/12-context-engineering/02-compaction.ts
 *   npm run check capstone/12-context-engineering/02-compaction.ts
 *
 * When history nears the window limit, don't truncate blindly — SUMMARIZE the
 * old turns and reinitialize from the summary (compaction), and CLEAR stale raw
 * tool results (a 5k-token file dump you'll never re-read). Keep recent turns
 * verbatim; keep decisions and open threads; drop the noise.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

const SUMMARY_PROMPT =
  "You compress conversations. Preserve decisions, facts, and open threads; drop resolved chatter. Maximize recall first.";

/** GIVEN — pull the plain text out of a message (text + tool blocks). */
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

/** GIVEN — token estimate over a whole history. */
function estimateHistoryTokens(history: Anthropic.MessageParam[]): number {
  return history.reduce((sum, m) => sum + Math.ceil(extractText(m).length / 4), 0);
}

/** GIVEN — render older turns into a transcript for the summarizer. */
function renderTranscript(history: Anthropic.MessageParam[]): string {
  return history.map((m) => `${m.role}: ${extractText(m)}`).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — clearOldToolResults(history, keepLastN)
//
// Return a NEW history where every tool_result block in messages OLDER than the
// last `keepLastN` messages has its content replaced with "[cleared]". Recent
// messages (and all non-tool_result content) are untouched. Don't mutate input.
// ─────────────────────────────────────────────────────────────────────────────
function clearOldToolResults(
  history: Anthropic.MessageParam[],
  keepLastN: number
): Anthropic.MessageParam[] {
  return history; // IMPLEMENT
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — compact(client, history, opts)
//
//   opts: { thresholdTokens, keepRecent }
//   - If estimateHistoryTokens(history) <= thresholdTokens → return history
//     UNCHANGED (nothing to do yet).
//   - Otherwise split into older = all but the last `keepRecent`, and recent =
//     the last `keepRecent`. Ask the client to summarize the older turns
//     (system = SUMMARY_PROMPT; user message = renderTranscript(older)). Return
//     [ { role:"user", content:`[Summary of earlier conversation]\n${summary}` },
//       ...recent ]  — recent turns kept VERBATIM.
// ─────────────────────────────────────────────────────────────────────────────
async function compact(
  client: ModelClient,
  history: Anthropic.MessageParam[],
  opts: { thresholdTokens: number; keepRecent: number }
): Promise<Anthropic.MessageParam[]> {
  return history; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
// tool-result clearing: keep the last 1 message intact, clear older tool results.
const withTools: Anthropic.MessageParam[] = [
  { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "read", input: { path: "a" } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "HUGE FILE DUMP ..." }] },
  { role: "assistant", content: [{ type: "tool_use", id: "t2", name: "read", input: { path: "b" } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "t2", content: "recent result, keep me" }] },
];
const cleared = clearOldToolResults(withTools, 1);
expect(extractText(cleared[1]!)).toBe("[cleared]"); // old dump gone
expect(extractText(cleared[3]!)).toBe("recent result, keep me"); // last one intact
expect(extractText(withTools[1]!)).toBe("HUGE FILE DUMP ..."); // original not mutated

// compaction: a long history gets summarized down, recent turns preserved.
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

expect(compacted.length).toBe(3); // 1 summary + 2 recent
expect(extractText(compacted[0]!).includes("[Summary of earlier conversation]")).toBe(true);
expect(extractText(compacted[0]!).includes("finalize the schema")).toBe(true);
expect(compacted[1]).toEqual({ role: "user", content: "the most recent question" }); // verbatim
expect(compacted[2]).toEqual({ role: "assistant", content: "the most recent answer" });
expect(estimateHistoryTokens(compacted) < before).toBe(true); // actually smaller
// the summarizer saw the OLDER turns, not the recent ones:
expect(JSON.stringify(summarizer.requests[0]!.messages).includes("question number 0")).toBe(true);
expect(summarizer.requests[0]!.system).toBe(SUMMARY_PROMPT);

// below threshold → untouched:
const shortHistory: Anthropic.MessageParam[] = [{ role: "user", content: "hi" }];
const noop = await compact(summarizer.client, shortHistory, { thresholdTokens: 100, keepRecent: 2 });
expect(noop).toEqual(shortHistory);

pass("02-compaction");
