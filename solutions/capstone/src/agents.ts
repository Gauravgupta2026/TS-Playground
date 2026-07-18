/** SOLUTION — capstone agents.ts (drop-in for capstone/src/agents.ts). */
import type Anthropic from "@anthropic-ai/sdk";
import type { TokenBudget } from "./budget";
import { retrieve, formatChunks, type NotesStore } from "./rag";
import {
  CREW_DEFAULTS,
  CRITIC_PROMPT,
  FindingsSchema,
  PLANNER_PROMPT,
  PlanSchema,
  RESEARCHER_PROMPT,
  SEARCH_TOOL,
  SearchInput,
  WRITER_PROMPT,
  type Critique,
  type Findings,
  type ModelClient,
  type Plan,
  type Result,
} from "./types";

const MAX_RESEARCHER_ITERATIONS = 3;

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function stripFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```[a-z]*\s*\n?/, "").replace(/\n?```$/, "");
  return text.trim();
}

function parseJson(raw: string): Result<unknown, string> {
  try {
    return { ok: true, value: JSON.parse(stripFences(raw)) };
  } catch {
    return { ok: false, error: "not json" };
  }
}

function factLines(findings: Findings[]): string {
  return findings
    .flatMap((finding) => finding.keyFacts.map((k) => `- ${k.fact} [${k.source}]`))
    .join("\n");
}

export async function runPlanner(
  client: ModelClient,
  budget: TokenBudget,
  question: string
): Promise<Result<Plan, string>> {
  if (budget.exhausted) return { ok: false, error: "budget exhausted" };
  const response = await client.messages.create({
    model: CREW_DEFAULTS.plannerModel,
    max_tokens: 500,
    system: PLANNER_PROMPT,
    messages: [{ role: "user", content: question }],
  });
  budget.record(response.usage);
  const json = parseJson(extractText(response));
  if (!json.ok) return { ok: false, error: "plan invalid" };
  const parsed = PlanSchema.safeParse(json.value);
  if (!parsed.success) return { ok: false, error: "plan invalid" };
  return { ok: true, value: parsed.data };
}

export async function runResearcher(
  client: ModelClient,
  budget: TokenBudget,
  store: NotesStore,
  subQuestion: string
): Promise<Result<Findings, string>> {
  const history: Anthropic.MessageParam[] = [{ role: "user", content: `Research: ${subQuestion}` }];

  for (let iteration = 1; iteration <= MAX_RESEARCHER_ITERATIONS; iteration++) {
    if (budget.exhausted) return { ok: false, error: "budget exhausted" };
    const response = await client.messages.create({
      model: CREW_DEFAULTS.researcherModel,
      max_tokens: 1000,
      system: RESEARCHER_PROMPT,
      messages: [...history],
      tools: [SEARCH_TOOL],
    });
    budget.record(response.usage);

    if (response.stop_reason !== "tool_use") {
      const json = parseJson(extractText(response));
      if (!json.ok) return { ok: false, error: "findings invalid" };
      const parsed = FindingsSchema.safeParse(json.value);
      if (!parsed.success) return { ok: false, error: "findings invalid" };
      return { ok: true, value: parsed.data };
    }

    const toolBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolBlocks) {
      const input = SearchInput.safeParse(block.input);
      if (!input.success) {
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: input.error.issues[0]?.message ?? "invalid input",
          is_error: true,
        });
        continue;
      }
      const chunks = await retrieve(store, input.data.query, CREW_DEFAULTS.topK);
      results.push({ type: "tool_result", tool_use_id: block.id, content: formatChunks(chunks) });
    }
    history.push({ role: "assistant", content: response.content });
    history.push({ role: "user", content: results });
  }
  return { ok: false, error: "researcher exceeded iterations" };
}

export async function runWriter(
  client: ModelClient,
  budget: TokenBudget,
  question: string,
  findings: Findings[],
  revision?: { previousDraft: string; feedback: string }
): Promise<Result<string, string>> {
  if (budget.exhausted) return { ok: false, error: "budget exhausted" };
  let content = `Question: ${question}\n\nFindings:\n${factLines(findings)}`;
  if (revision) {
    content +=
      `\n\nYour previous draft:\n${revision.previousDraft}` +
      `\n\nCritic feedback:\n${revision.feedback}\nRevise the draft.`;
  }
  const response = await client.messages.create({
    model: CREW_DEFAULTS.writerModel,
    max_tokens: 1000,
    system: WRITER_PROMPT,
    messages: [{ role: "user", content }],
  });
  budget.record(response.usage);
  return { ok: true, value: extractText(response) };
}

export async function runCritic(
  client: ModelClient,
  budget: TokenBudget,
  draft: string,
  findings: Findings[]
): Promise<Result<Critique, string>> {
  if (budget.exhausted) return { ok: false, error: "budget exhausted" };
  const response = await client.messages.create({
    model: CREW_DEFAULTS.criticModel,
    max_tokens: 500,
    system: CRITIC_PROMPT,
    messages: [{ role: "user", content: `Draft:\n${draft}\n\nFindings:\n${factLines(findings)}` }],
  });
  budget.record(response.usage);
  const text = extractText(response).trim();
  if (text === "APPROVED") return { ok: true, value: { approved: true } };
  return { ok: true, value: { approved: false, feedback: text } };
}
