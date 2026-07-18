/**
 * The four agents — YOU IMPLEMENT (Phase 6 loop + Phase 8 patterns).
 *
 * SHARED RULES (every function):
 *  - budget.exhausted BEFORE a call → err("budget exhausted"), no call made
 *  - budget.record(response.usage) after EVERY call
 *  - model output crossing back = boundary → validate with the schema
 *    from types.ts; strip markdown fences first
 *  - models/prompts come from types.ts (CREW_DEFAULTS, *_PROMPT) — tests
 *    pin them
 *
 * SPEC:
 *  runPlanner(client, budget, question) → Result<Plan, string>
 *    one call: PLANNER_PROMPT system, user = question, plannerModel,
 *    max_tokens 500. Invalid JSON/shape → err("plan invalid").
 *
 *  runResearcher(client, budget, store, subQuestion) → Result<Findings, string>
 *    the Phase 6 tool loop with SEARCH_TOOL:
 *      user turn: `Research: ${subQuestion}`
 *      stop_reason "tool_use" → validate input (SearchInput), retrieve
 *      CREW_DEFAULTS.topK chunks, tool_result = formatChunks(...) —
 *      invalid input → is_error tool_result; append assistant turn +
 *      ONE user turn with all results; loop (≤ 3 iterations)
 *      other stop → parse text as Findings → ok, or err("findings invalid")
 *      loop exhausted → err("researcher exceeded iterations")
 *
 *  runWriter(client, budget, question, findings, revision?) → Result<string, string>
 *    WRITER_PROMPT system, writerModel, max_tokens 1000. User message:
 *      `Question: ${question}\n\nFindings:\n` + per finding:
 *      `- ${fact} [${source}]` (one line per keyFact)
 *    revision present → append:
 *      `\n\nYour previous draft:\n${previousDraft}\n\nCritic feedback:\n${feedback}\nRevise the draft.`
 *    → ok(text).
 *
 *  runCritic(client, budget, draft, findings) → Result<Critique, string>
 *    CRITIC_PROMPT system, criticModel, max_tokens 500. User message:
 *      `Draft:\n${draft}\n\nFindings:\n` + the same fact lines
 *    reply exactly "APPROVED" (trimmed) → { approved: true }
 *    anything else → { approved: false, feedback: <the text> }
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { TokenBudget } from "./budget";
import type { NotesStore } from "./rag";
import type { Critique, Findings, ModelClient, Plan, Result } from "./types";

export async function runPlanner(
  client: ModelClient,
  budget: TokenBudget,
  question: string
): Promise<Result<Plan, string>> {
  return { ok: false, error: "IMPLEMENT" };
}

export async function runResearcher(
  client: ModelClient,
  budget: TokenBudget,
  store: NotesStore,
  subQuestion: string
): Promise<Result<Findings, string>> {
  return { ok: false, error: "IMPLEMENT" };
}

export async function runWriter(
  client: ModelClient,
  budget: TokenBudget,
  question: string,
  findings: Findings[],
  revision?: { previousDraft: string; feedback: string }
): Promise<Result<string, string>> {
  return { ok: false, error: "IMPLEMENT" };
}

export async function runCritic(
  client: ModelClient,
  budget: TokenBudget,
  draft: string,
  findings: Findings[]
): Promise<Result<Critique, string>> {
  return { ok: false, error: "IMPLEMENT" };
}
