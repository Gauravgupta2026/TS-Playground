/** SOLUTION — Phase 12 · CHECKPOINT. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

const estimate = (text: string): number => Math.ceil(text.length / 4);
const PLANNER_PROMPT = 'You plan research. Reply ONLY with a JSON array of subtask strings.';
const WRITER_PROMPT = "You synthesize findings into a final answer.";

function textOf(message: Anthropic.Message): string {
  return message.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
}

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

class MemoryStore {
  private notes = new Map<string, { id: string; text: string; seq: number }>();
  private seq = 0;
  remember(id: string, text: string): void { this.notes.set(id, { id, text, seq: this.seq++ }); }
  all(): Array<{ id: string; text: string }> { return [...this.notes.values()].sort((a, b) => b.seq - a.seq); }
}

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

type ResearchResult = {
  answer: string;
  findings: string[];
  subagentTokens: number[];
  contextTokens: number;
  droppedFindings: string[];
};

async function runResearch(
  clients: { planner: ModelClient; researchers: ModelClient[]; writer: ModelClient },
  question: string,
  opts: { contextBudget: number }
): Promise<ResearchResult> {
  // 1. PLAN
  const planResponse = await clients.planner.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 500,
    system: PLANNER_PROMPT,
    messages: [{ role: "user", content: question }],
  });
  const subtasks = JSON.parse(textOf(planResponse)) as string[];

  // 2. RESEARCH — each subtask in an isolated subagent; store summaries in memory.
  const memory = new MemoryStore();
  const subagentTokens: number[] = [];
  for (let i = 0; i < subtasks.length; i++) {
    const { summary, internalTokens } = await runSubagent(clients.researchers[i]!, subtasks[i]!);
    memory.remember(`sub-${i}`, summary);
    subagentTokens.push(internalTokens);
  }

  // 3. ASSEMBLE — budgeted context: pinned question + findings by priority.
  const blocks: Block[] = [{ id: "question", content: question, priority: 0, pinned: true }];
  subtasks.forEach((_, i) => {
    const note = memory.all().find((n) => n.id === `sub-${i}`)!;
    blocks.push({ id: `sub-${i}`, content: note.text, priority: subtasks.length - i });
  });
  const assembled = assembleContext(blocks, opts.contextBudget);

  // 4. WRITE
  const writeResponse = await clients.writer.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1000,
    system: WRITER_PROMPT,
    messages: [{ role: "user", content: assembled.blocks.map((b) => b.content).join("\n\n") }],
  });

  return {
    answer: textOf(writeResponse),
    findings: memory.all().map((n) => n.text),
    subagentTokens,
    contextTokens: assembled.tokens,
    droppedFindings: assembled.droppedIds,
  };
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

expect(result.findings.length).toBe(2);
expect(result.subagentTokens).toEqual([255, 135]);
expect(result.answer.includes("Hardening plan")).toBe(true);
expect(result.contextTokens > 0).toBe(true);
expect(result.droppedFindings).toEqual([]);

const writerSaw = JSON.stringify(writer.requests[0]!.messages);
expect(writerSaw.includes("missing await")).toBe(true);
expect(writerSaw.includes("per API key")).toBe(true);
expect(writerSaw.includes("exploring the codebase")).toBe(false);
expect(writer.requests[0]!.system).toBe(WRITER_PROMPT);

pass("checkpoint-research-harness (solution)");
