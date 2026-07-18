/**
 * Phase 8 · Exercise 02 — Sequential pipeline with typed handoffs
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/08-multi-agent/02-sequential-pipeline.ts
 *   npm run check phases/08-multi-agent/02-sequential-pipeline.ts
 *
 * The telephone-game fix: agents exchange STRUCTURED data, not prose.
 * Each stage's output is Zod-validated before the next stage sees it.
 */
import { z } from "zod";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — define the handoff contract
//
// The researcher hands the writer:
//   topic: non-empty string
//   keyFacts: 1..5 strings           (z.array(...).min(1).max(5))
//   confidence: "high" | "medium" | "low"
// Define the schema; derive the type.
// ─────────────────────────────────────────────────────────────────────────────
const ResearchHandoffSchema = z.object({}); // IMPLEMENT
type ResearchHandoff = z.infer<typeof ResearchHandoffSchema>;

expect(
  ResearchHandoffSchema.safeParse({ topic: "UPI", keyFacts: ["NPCI runs it"], confidence: "high" }).success
).toBe(true);
expect(ResearchHandoffSchema.safeParse({ topic: "UPI", keyFacts: [], confidence: "high" }).success).toBe(false);
expect(ResearchHandoffSchema.safeParse({ topic: "", keyFacts: ["x"], confidence: "high" }).success).toBe(false);
expect(ResearchHandoffSchema.safeParse({ topic: "UPI", keyFacts: ["x"], confidence: "certain" }).success).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — a structured-output stage
//
// Implement runResearcher: one model call (system prompt provided), then
// strip fences → JSON.parse → safeParse. NO retry this time — return
// err(<reason>) and let the PIPELINE decide policy (stages report,
// orchestrators decide; keeping policy out of stages is what makes them
// reusable).
// ─────────────────────────────────────────────────────────────────────────────
const RESEARCHER_PROMPT =
  'You are a researcher. Respond ONLY with JSON: {"topic": "...", "keyFacts": ["..."], "confidence": "high|medium|low"}';

function stripFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```[a-z]*\s*\n?/, "").replace(/\n?```$/, "");
  return text.trim();
}

async function runResearcher(client: ModelClient, topic: string): Promise<Result<ResearchHandoff, string>> {
  return { ok: false, error: "IMPLEMENT me" };
}

const goodResearch = makeScriptedClient([
  fakeMessage('{"topic": "UPI", "keyFacts": ["NPCI operates UPI", "Settlement is batched"], "confidence": "high"}'),
]);
const handoff = await runResearcher(goodResearch.client, "UPI");
expect(handoff.ok).toBe(true);
if (handoff.ok) expect(handoff.value.keyFacts.length).toBe(2);

const proseResearch = makeScriptedClient([fakeMessage("UPI is fascinating! Here are my thoughts…")]);
expect((await runResearcher(proseResearch.client, "UPI")).ok).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the writer consumes the TYPED handoff
//
// Implement runWriter: builds its user message FROM the validated handoff —
//   `Write a two-sentence summary about ${topic}. Facts:\n- fact1\n- fact2`
// and returns the model's text. Note what it does NOT see: the researcher's
// prose, history, or JSON quirks. Just the contract.
// ─────────────────────────────────────────────────────────────────────────────
async function runWriter(client: ModelClient, handoff2: ResearchHandoff): Promise<string> {
  return ""; // IMPLEMENT
}

const writerClient = makeScriptedClient([fakeMessage("UPI moves money instantly; NPCI settles in batches.")]);
if (handoff.ok) {
  expect(await runWriter(writerClient.client, handoff.value)).toBe(
    "UPI moves money instantly; NPCI settles in batches."
  );
  const sent = JSON.stringify(writerClient.requests[0]!.messages);
  expect(sent.includes("NPCI operates UPI")).toBe(true); // facts made it across
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — compose the pipeline
//
// Implement runPipeline: researcher → (ok?) → writer.
//   researcher fails → err("research failed: <reason>") — writer NEVER runs.
// Return ok(<writer text>).
// ─────────────────────────────────────────────────────────────────────────────
async function runPipeline(
  researcherClient: ModelClient,
  writerClient2: ModelClient,
  topic: string
): Promise<Result<string, string>> {
  return { ok: false, error: "IMPLEMENT me" };
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
expect(wNever.requests.length).toBe(0); // the writer really never ran

pass("02-sequential-pipeline");
