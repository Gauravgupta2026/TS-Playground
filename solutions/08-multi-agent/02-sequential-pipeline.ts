/** SOLUTION — Phase 8 · 02. */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// EXERCISE 1 — the handoff IS the API contract between agents.
const ResearchHandoffSchema = z.object({
  topic: z.string().min(1),
  keyFacts: z.array(z.string()).min(1).max(5),
  confidence: z.enum(["high", "medium", "low"]),
});
type ResearchHandoff = z.infer<typeof ResearchHandoffSchema>;

expect(
  ResearchHandoffSchema.safeParse({ topic: "UPI", keyFacts: ["NPCI runs it"], confidence: "high" }).success
).toBe(true);
expect(ResearchHandoffSchema.safeParse({ topic: "UPI", keyFacts: [], confidence: "high" }).success).toBe(false);
expect(ResearchHandoffSchema.safeParse({ topic: "", keyFacts: ["x"], confidence: "high" }).success).toBe(false);
expect(ResearchHandoffSchema.safeParse({ topic: "UPI", keyFacts: ["x"], confidence: "certain" }).success).toBe(false);

// shared text extraction:
function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

const RESEARCHER_PROMPT =
  'You are a researcher. Respond ONLY with JSON: {"topic": "...", "keyFacts": ["..."], "confidence": "high|medium|low"}';

function stripFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```[a-z]*\s*\n?/, "").replace(/\n?```$/, "");
  return text.trim();
}

// EXERCISE 2 — the stage reports; the pipeline decides policy.
async function runResearcher(client: ModelClient, topic: string): Promise<Result<ResearchHandoff, string>> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 500,
    system: RESEARCHER_PROMPT,
    messages: [{ role: "user", content: `Research this topic: ${topic}` }],
  });
  let json: unknown;
  try {
    json = JSON.parse(stripFences(extractText(response)));
  } catch {
    return { ok: false, error: "not json" };
  }
  const parsed = ResearchHandoffSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid shape" };
  return { ok: true, value: parsed.data };
}

const goodResearch = makeScriptedClient([
  fakeMessage('{"topic": "UPI", "keyFacts": ["NPCI operates UPI", "Settlement is batched"], "confidence": "high"}'),
]);
const handoff = await runResearcher(goodResearch.client, "UPI");
expect(handoff.ok).toBe(true);
if (handoff.ok) expect(handoff.value.keyFacts.length).toBe(2);

const proseResearch = makeScriptedClient([fakeMessage("UPI is fascinating! Here are my thoughts…")]);
expect((await runResearcher(proseResearch.client, "UPI")).ok).toBe(false);

// EXERCISE 3 — the writer sees the contract, nothing else.
async function runWriter(client: ModelClient, handoff2: ResearchHandoff): Promise<string> {
  const facts = handoff2.keyFacts.map((fact) => `- ${fact}`).join("\n");
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    system: "You are a writer.",
    messages: [
      { role: "user", content: `Write a two-sentence summary about ${handoff2.topic}. Facts:\n${facts}` },
    ],
  });
  return extractText(response);
}

const writerClient = makeScriptedClient([fakeMessage("UPI moves money instantly; NPCI settles in batches.")]);
if (handoff.ok) {
  expect(await runWriter(writerClient.client, handoff.value)).toBe(
    "UPI moves money instantly; NPCI settles in batches."
  );
  const sent = JSON.stringify(writerClient.requests[0]!.messages);
  expect(sent.includes("NPCI operates UPI")).toBe(true);
}

// EXERCISE 4 — compose; failure stops the line.
async function runPipeline(
  researcherClient: ModelClient,
  writerClient2: ModelClient,
  topic: string
): Promise<Result<string, string>> {
  const research = await runResearcher(researcherClient, topic);
  if (!research.ok) return { ok: false, error: `research failed: ${research.error}` };
  const draft = await runWriter(writerClient2, research.value);
  return { ok: true, value: draft };
}

const r2 = makeScriptedClient([
  fakeMessage('{"topic": "RAG", "keyFacts": ["Retrieval grounds answers"], "confidence": "medium"}'),
]);
const w2 = makeScriptedClient([fakeMessage("RAG grounds model answers in retrieved documents.")]);
const piped = await runPipeline(r2.client, w2.client, "RAG");
expect(piped.ok).toBe(true);
if (piped.ok) expect(piped.value).toBe("RAG grounds model answers in retrieved documents.");

const rBad = makeScriptedClient([fakeMessage("no json, just vibes")]);
const wNever = makeScriptedClient([fakeMessage("should never be called")]);
const failed = await runPipeline(rBad.client, wNever.client, "RAG");
expect(failed.ok).toBe(false);
if (!failed.ok) expect(failed.error.startsWith("research failed:")).toBe(true);
expect(wNever.requests.length).toBe(0);

pass("02-sequential-pipeline (solution)");
