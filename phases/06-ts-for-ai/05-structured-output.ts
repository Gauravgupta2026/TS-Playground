/**
 * Phase 6 · Exercise 05 — Structured output: validate + retry
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/06-ts-for-ai/05-structured-output.ts
 *   npm run check phases/06-ts-for-ai/05-structured-output.ts
 *
 * Models return prose by default; pipelines need JSON. The reliable recipe:
 * ask for JSON only → strip fences → parse → Zod-validate → on failure,
 * retry ONCE with the validation error fed back. Non-determinism makes the
 * failure path a NORMAL path — engineer it like one.
 */
import { z } from "zod";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// The shape we want from the model:
const FlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
type Flashcard = z.infer<typeof FlashcardSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — strip markdown fences
//
// Models often wrap JSON in ```json … ``` even when told not to. Implement
// stripFences: remove a leading ```json (or bare ```) line and a trailing
// ``` line if present; trim whitespace. Plain JSON passes through unchanged.
// ─────────────────────────────────────────────────────────────────────────────
function stripFences(raw: string): string {
  return raw; // IMPLEMENT
}

expect(stripFences('{"a": 1}')).toBe('{"a": 1}');
expect(stripFences('```json\n{"a": 1}\n```')).toBe('{"a": 1}');
expect(stripFences('```\n{"a": 1}\n```')).toBe('{"a": 1}');
expect(stripFences('  {"a": 1}  ')).toBe('{"a": 1}');

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — parse-and-validate as a Result
//
// Implement parseFlashcard: stripFences → JSON.parse (inside try/catch —
// malformed JSON must NOT throw out of this function) → safeParse.
//   ok(flashcard) | err("invalid json") | err(first zod issue message)
// ─────────────────────────────────────────────────────────────────────────────
function parseFlashcard(raw: string): Result<Flashcard, string> {
  return { ok: false, error: "IMPLEMENT me" };
}

const valid = parseFlashcard('{"question": "What is RAG?", "answer": "Retrieval-augmented generation", "difficulty": "easy"}');
expect(valid.ok).toBe(true);
if (valid.ok) expect(valid.value.difficulty).toBe("easy");

expect(parseFlashcard("{not json").ok).toBe(false);
const wrongShape = parseFlashcard('{"question": "Q", "answer": "A", "difficulty": "impossible"}');
expect(wrongShape.ok).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the retry loop with error feedback
//
// Implement generateFlashcard:
//   1. Ask the model (prompt provided below) for a flashcard about `topic`.
//   2. parseFlashcard the response text.
//   3. On failure: retry — appending the assistant's (bad) reply and a new
//      user message: `Your response failed validation: <error>. Respond
//      with ONLY the corrected JSON.` — up to maxAttempts total attempts.
//   4. Return the first success, or err with the last error.
// The scripted client below fails once, then succeeds — your loop must
// survive that, and the error-feedback message must actually be sent.
// ─────────────────────────────────────────────────────────────────────────────
const PROMPT = (topic: string) =>
  `Create one flashcard about ${topic}. Respond with ONLY a JSON object: ` +
  `{"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}`;

async function generateFlashcard(
  client: ModelClient,
  topic: string,
  maxAttempts: number
): Promise<Result<Flashcard, string>> {
  return { ok: false, error: "IMPLEMENT me" }; // IMPLEMENT the loop
}

const flaky = makeScriptedClient([
  fakeMessage("Sure! Here is your flashcard about embeddings: it's a vector!"), // not JSON!
  fakeMessage('```json\n{"question": "What is an embedding?", "answer": "A vector encoding meaning", "difficulty": "medium"}\n```'),
]);

const card = await generateFlashcard(flaky.client, "embeddings", 3);
expect(card.ok).toBe(true);
if (card.ok) expect(card.value.question).toBe("What is an embedding?");

// the retry actually told the model what went wrong:
const retryText = JSON.stringify(flaky.requests[1]!.messages);
expect(retryText.includes("failed validation")).toBe(true);

// and a model that never cooperates exhausts attempts:
const hopeless = makeScriptedClient([fakeMessage("nope"), fakeMessage("still nope")]);
const gaveUp = await generateFlashcard(hopeless.client, "anything", 2);
expect(gaveUp.ok).toBe(false);

pass("05-structured-output");
