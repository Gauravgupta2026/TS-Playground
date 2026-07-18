/** SOLUTION — Phase 8 · checkpoint. */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const RESEARCHER_PROMPT =
  'You are a researcher. Respond ONLY with JSON: {"topic": "...", "keyFacts": ["..."], "confidence": "high|medium|low"}';
const WRITER_PROMPT = "You are a writer. Produce a crisp two-sentence summary from the given facts.";

const ResearchHandoffSchema = z.object({
  topic: z.string().min(1),
  keyFacts: z.array(z.string()).min(1).max(5),
  confidence: z.enum(["high", "medium", "low"]),
});
type ResearchHandoff = z.infer<typeof ResearchHandoffSchema>;

const DEFAULT_RESEARCH_ATTEMPTS = 2;

class TokenBudget {
  private readonly maxTokens: number;
  private total = 0;
  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
  }
  record(usage: Anthropic.Usage): void {
    this.total += usage.input_tokens + usage.output_tokens;
  }
  get spent(): number {
    return this.total;
  }
  get exhausted(): boolean {
    return this.total >= this.maxTokens;
  }
}

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

function parseHandoff(raw: string): Result<ResearchHandoff, string> {
  let json: unknown;
  try {
    json = JSON.parse(stripFences(raw));
  } catch {
    return { ok: false, error: "not json" };
  }
  const parsed = ResearchHandoffSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid shape" };
  return { ok: true, value: parsed.data };
}

type PipelineOutput = { draft: string; handoff: ResearchHandoff; tokensSpent: number };

async function runResearchPipeline(
  researcherClient: ModelClient,
  writerClient: ModelClient,
  topic: string,
  opts: { maxResearchAttempts?: number; budget: TokenBudget }
): Promise<Result<PipelineOutput, string>> {
  const { budget } = opts;
  const maxAttempts = opts.maxResearchAttempts ?? DEFAULT_RESEARCH_ATTEMPTS;

  // 1. RESEARCH with structured-output retry.
  const history: Anthropic.MessageParam[] = [{ role: "user", content: `Research this topic: ${topic}` }];
  let handoff: ResearchHandoff | null = null;

  for (let attempt = 1; attempt <= maxAttempts && handoff === null; attempt++) {
    if (budget.exhausted) return { ok: false, error: "budget exhausted" };
    const response = await researcherClient.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: RESEARCHER_PROMPT,
      messages: history,
    });
    budget.record(response.usage);
    const parsed = parseHandoff(extractText(response));
    if (parsed.ok) {
      handoff = parsed.value;
    } else {
      history.push({ role: "assistant", content: response.content });
      history.push({
        role: "user",
        content: `Your response failed validation: ${parsed.error}. Respond with ONLY the corrected JSON.`,
      });
    }
  }
  if (handoff === null) return { ok: false, error: "research failed" };

  // 2. WRITE from the typed handoff.
  if (budget.exhausted) return { ok: false, error: "budget exhausted" };
  const facts = handoff.keyFacts.map((fact) => `- ${fact}`).join("\n");
  const writeResponse = await writerClient.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    system: WRITER_PROMPT,
    messages: [{ role: "user", content: `Write a short summary about ${topic}.\nFacts:\n${facts}` }],
  });
  budget.record(writeResponse.usage);

  return { ok: true, value: { draft: extractText(writeResponse), handoff, tokensSpent: budget.spent } };
}

// ── The spec ────────────────────────────────────────────────────────────────
const researcher = makeScriptedClient([
  fakeMessage("Let me think about credit scoring…", { inputTokens: 20, outputTokens: 10 }),
  fakeMessage(
    '{"topic": "credit scoring", "keyFacts": ["Bureaus track repayment history", "Alternative data is rising"], "confidence": "medium"}',
    { inputTokens: 45, outputTokens: 40 }
  ),
]);
const writer = makeScriptedClient([
  fakeMessage("Credit scores rest on repayment history; alternative data is expanding access.", {
    inputTokens: 60,
    outputTokens: 30,
  }),
]);

const budget = new TokenBudget(1000);
const result = await runResearchPipeline(researcher.client, writer.client, "credit scoring", { budget });

expect(result.ok).toBe(true);
if (result.ok) {
  expect(result.value.draft).toBe(
    "Credit scores rest on repayment history; alternative data is expanding access."
  );
  expect(result.value.handoff.keyFacts.length).toBe(2);
  expect(result.value.tokensSpent).toBe(205);
}
expect(JSON.stringify(researcher.requests[1]!.messages).includes("failed validation")).toBe(true);
expect(researcher.requests[0]!.system).toBe(RESEARCHER_PROMPT);
expect(writer.requests[0]!.system).toBe(WRITER_PROMPT);
expect(JSON.stringify(writer.requests[0]!.messages).includes("Bureaus track repayment history")).toBe(true);

const stubborn = makeScriptedClient([fakeMessage("nope"), fakeMessage("still nope")]);
const neverWriter = makeScriptedClient([fakeMessage("unreachable")]);
const failed = await runResearchPipeline(stubborn.client, neverWriter.client, "x", {
  budget: new TokenBudget(1000),
});
expect(failed.ok).toBe(false);
if (!failed.ok) expect(failed.error).toBe("research failed");
expect(neverWriter.requests.length).toBe(0);

const spent = new TokenBudget(10);
spent.record(fakeMessage("x", { inputTokens: 50, outputTokens: 50 }).usage);
const untouchedResearcher = makeScriptedClient([fakeMessage("unreachable")]);
const broke = await runResearchPipeline(untouchedResearcher.client, neverWriter.client, "x", { budget: spent });
expect(broke.ok).toBe(false);
if (!broke.ok) expect(broke.error).toBe("budget exhausted");
expect(untouchedResearcher.requests.length).toBe(0);

pass("checkpoint-researcher-writer (solution)");
