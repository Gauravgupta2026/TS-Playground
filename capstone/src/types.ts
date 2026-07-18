/**
 * The contracts of the crew. PROVIDED — read carefully; everything else is
 * typed against this file. Nothing here should need to change.
 */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/** The slice of the Anthropic client the crew uses (real client satisfies it). */
export type ModelClient = {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
};

/** One scripted/real client per role — different roles, different scripts. */
export type CrewClients = {
  planner: ModelClient;
  researcher: ModelClient;
  writer: ModelClient;
  critic: ModelClient;
};

// ── RAG types ───────────────────────────────────────────────────────────────

export type ChunkMeta = { source: string; index: number; text: string };
export type RetrievedChunk = { id: string; score: number; metadata: ChunkMeta };

// ── Inter-agent contracts (every boundary is a schema) ──────────────────────

/** Planner → crew: the question decomposed. */
export const PlanSchema = z.object({
  subQuestions: z.array(z.string().min(1)).min(1).max(3),
});
export type Plan = z.infer<typeof PlanSchema>;

/** Researcher → crew: findings for ONE sub-question, every fact sourced. */
export const FindingsSchema = z.object({
  subQuestion: z.string().min(1),
  summary: z.string().min(1),
  keyFacts: z
    .array(z.object({ fact: z.string().min(1), source: z.string().min(1) }))
    .min(1)
    .max(5),
});
export type Findings = z.infer<typeof FindingsSchema>;

/** Critic verdict: APPROVED, or feedback for the writer. */
export type Critique = { approved: true } | { approved: false; feedback: string };

/** The crew's final output. */
export type CrewResult = {
  draft: string;
  plan: Plan;
  findings: Findings[];
  rounds: number; // critic rounds consumed (1 = approved first try)
  tokensSpent: number;
};

// ── Prompts (versioned artifacts — tests pin them) ──────────────────────────

export const PLANNER_PROMPT =
  "You are a research planner. Decompose the user's question into 1-3 focused sub-questions. " +
  'Respond ONLY with JSON: {"subQuestions": ["..."]}';

export const RESEARCHER_PROMPT =
  "You are a researcher. Use the search_notes tool to find evidence, then respond ONLY with JSON: " +
  '{"subQuestion": "...", "summary": "...", "keyFacts": [{"fact": "...", "source": "file.md"}]}';

export const WRITER_PROMPT =
  "You are a writer. Compose a concise, well-structured answer from the findings. " +
  "Cite sources inline as [source.md] after each claim. Never invent facts.";

export const CRITIC_PROMPT =
  "You are a critic. Check the draft against the findings: every claim cited, no invented facts, " +
  'the question actually answered. Respond with exactly "APPROVED" or one paragraph of feedback.';

export const SEARCH_TOOL: Anthropic.Tool = {
  name: "search_notes",
  description: "Search the user's document collection. Returns the most relevant passages.",
  input_schema: {
    type: "object",
    properties: { query: { type: "string", description: "The search query" } },
    required: ["query"],
  },
};

export const SearchInput = z.object({ query: z.string().min(1) });

// ── Crew configuration ──────────────────────────────────────────────────────

export const CREW_DEFAULTS = {
  topK: 3,
  maxCriticRounds: 2,
  maxTokens: 50_000,
  plannerModel: "claude-haiku-4-5",
  researcherModel: "claude-sonnet-5",
  writerModel: "claude-sonnet-5",
  criticModel: "claude-sonnet-5",
} as const;
