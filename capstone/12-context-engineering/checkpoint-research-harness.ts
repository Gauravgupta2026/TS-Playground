/**
 * Phase 12 · CHECKPOINT — a long-running research agent
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/12-context-engineering/checkpoint-research-harness.ts
 *   npm run check phases/12-context-engineering/checkpoint-research-harness.ts
 *
 * Compose the phase: a lead that PLANS subtasks, runs each in an ISOLATED
 * subagent (returning only a condensed summary), writes findings to external
 * MEMORY, assembles a BUDGETED context from that memory, and synthesizes a
 * final answer. Isolation keeps the lead small; memory + budget keep the final
 * context high-signal. This is the shape of a real deep-research agent.
 *
 * The primitives are GIVEN (your 01/03/04 solutions). You implement runResearch.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

const estimate = (text: string): number => Math.ceil(text.length / 4);
const PLANNER_PROMPT = 'You plan research. Reply ONLY with a JSON array of subtask strings.';
const WRITER_PROMPT = "You synthesize findings into a final answer.";

function textOf(message: Anthropic.Message): string {
  return message.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
}

// ── GIVEN: budgeted assembly (from 01) ──────────────────────────────────────
type Block = { id: string; content: string; priority: number; pinned?: boolean };
function assembleContext(blocks: Block[], budgetTokens: number): { blocks: Block[]; tokens: number; droppedIds: string[] } {
  const pinned = blocks.filter((b) => b.pinned);
  const optional = blocks.filter((b) => !b.pinned);
  const base = pinned.reduce((s, b) => s + estimate(b.content), 0);
  if (base > budgetTokens) throw new Error("pinned content exceeds budget");
  const ranked = optional.map((b, i) => ({ b, i })).sort((x, y) => y.b.priority - x.b.priority || x.i - y.i).map((x) => x.b);
  let remaining = budgetTokens - base;
  const selected: Block[] = [];
  const ids = new Set<string>();
  for (const b of ranked) {
    const cost = estimate(b.content);
    if (cost <= remaining) { selected.push(b); ids.add(b.id); remaining -= cost; }
  }
  const chosen = [...pinned, ...selected];
  return { blocks: chosen, tokens: chosen.reduce((s, b) => s + estimate(b.content), 0), droppedIds: optional.filter((b) => !ids.has(b.id)).map((b) => b.id) };
}

// ── GIVEN: memory (from 03) ─────────────────────────────────────────────────
class MemoryStore {
  private notes = new Map<string, { id: string; text: string; seq: number }>();
  private seq = 0;
  remember(id: string, text: string): void { this.notes.set(id, { id, text, seq: this.seq++ }); }
  all(): Array<{ id: string; text: string }> { return [...this.notes.values()].sort((a, b) => b.seq - a.seq); }
}

// ── GIVEN: isolated subagent (from 04) ──────────────────────────────────────
async function runSubagent(client: ModelClient, task: string): Promise<{ summary: string; internalTokens: number }> {
  const history: Anthropic.MessageParam[] = [{ role: "user", content: task }];
  let internalTokens = 0;
  let lastText = "";
  for (let step = 0; step < 5; step++) {
    const res = await client.messages.create({ model: "claude-haiku-4-5", max_tokens: 1000, messages: [...history] });
    internalTokens += res.usage.output_tokens;
    lastText = textOf(res);
    history.push({ role: "assistant", content: res.content });
    if (lastText.startsWith("DONE:")) return { summary: lastText.slice(5).trim(), internalTokens };
    history.push({ role: "user", content: "continue" });
  }
  return { summary: lastText, internalTokens };
}

// ── The checkpoint ──────────────────────────────────────────────────────────
type ResearchResult = {
  answer: string;
  findings: string[];
  subagentTokens: number[];
  contextTokens: number;
  droppedFindings: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — runResearch(clients, question, opts)
//
//   clients: { planner, researchers: ModelClient[], writer }
//   opts:    { contextBudget: number }
//
//   1. PLAN: call planner (system PLANNER_PROMPT, user = question). Its text is
//      a JSON array of subtask strings — parse it.
//   2. RESEARCH: for subtask i, runSubagent(researchers[i], subtask). Store the
//      summary in memory as remember(`sub-${i}`, summary); collect internalTokens.
//   3. ASSEMBLE: build blocks = [ pinned question (priority 0),
//      each finding as { id:`sub-${i}`, content: summary, priority: N - i } ]
//      (earlier subtasks rank higher). assembleContext(blocks, contextBudget).
//   4. WRITE: writer (system WRITER_PROMPT, user = the assembled block contents
//      joined by "\n\n"). Its text is the answer.
//   5. Return { answer, findings: memory.all() texts, subagentTokens,
//      contextTokens: assembled.tokens, droppedFindings: assembled.droppedIds }.
// ─────────────────────────────────────────────────────────────────────────────
async function runResearch(
  clients: { planner: ModelClient; researchers: ModelClient[]; writer: ModelClient },
  question: string,
  opts: { contextBudget: number }
): Promise<ResearchResult> {
  return { answer: "", findings: [], subagentTokens: [], contextTokens: 0, droppedFindings: [] }; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const planner = makeScriptedClient([
  fakeMessage('["find the auth bug", "how are rate limits enforced?"]'),
]);
const researcherA = makeScriptedClient([
  fakeMessage("exploring the codebase and grepping for handlers...", { outputTokens: 120 }),
  fakeMessage("reading three suspicious files...", { outputTokens: 120 }),
  fakeMessage("DONE: The auth bug is a missing await in verifyToken.", { outputTokens: 15 }),
]);
const researcherB = makeScriptedClient([
  fakeMessage("searching the rate-limit config...", { outputTokens: 120 }),
  fakeMessage("DONE: Limits are enforced per API key, not per IP.", { outputTokens: 15 }),
]);
const writer = makeScriptedClient([
  fakeMessage("Hardening plan: add the missing await and document the per-key limits."),
]);

const result = await runResearch(
  { planner: planner.client, researchers: [researcherA.client, researcherB.client], writer: writer.client },
  "How do we harden the service?",
  { contextBudget: 1000 }
);

// the plan produced two isolated investigations, each stored in memory:
expect(result.findings.length).toBe(2);
expect(result.subagentTokens).toEqual([255, 135]); // real per-subagent spend

// the final answer came from the writer, over the assembled findings:
expect(result.answer.includes("Hardening plan")).toBe(true);
expect(result.contextTokens > 0).toBe(true);
expect(result.droppedFindings).toEqual([]); // budget was generous

// the writer synthesized from SUMMARIES, never the raw subagent exploration:
const writerSaw = JSON.stringify(writer.requests[0]!.messages);
expect(writerSaw.includes("missing await")).toBe(true);
expect(writerSaw.includes("per API key")).toBe(true);
expect(writerSaw.includes("exploring the codebase")).toBe(false);
expect(writer.requests[0]!.system).toBe(WRITER_PROMPT);

pass("checkpoint-research-harness — Phase 12 complete! Next: Phase 13 (applied AI in production).");
