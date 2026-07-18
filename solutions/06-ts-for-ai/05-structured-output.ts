/** SOLUTION — Phase 6 · 05. */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const FlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
type Flashcard = z.infer<typeof FlashcardSchema>;

// EXERCISE 1 — tolerate the fences the model adds anyway.
function stripFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\s*\n?/, "").replace(/\n?```$/, "");
  }
  return text.trim();
}

expect(stripFences('{"a": 1}')).toBe('{"a": 1}');
expect(stripFences('```json\n{"a": 1}\n```')).toBe('{"a": 1}');
expect(stripFences('```\n{"a": 1}\n```')).toBe('{"a": 1}');
expect(stripFences('  {"a": 1}  ')).toBe('{"a": 1}');

// EXERCISE 2 — parse failures and shape failures are both just err values.
function parseFlashcard(raw: string): Result<Flashcard, string> {
  let json: unknown;
  try {
    json = JSON.parse(stripFences(raw));
  } catch {
    return { ok: false, error: "invalid json" };
  }
  const parsed = FlashcardSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid shape" };
  }
  return { ok: true, value: parsed.data };
}

const valid = parseFlashcard('{"question": "What is RAG?", "answer": "Retrieval-augmented generation", "difficulty": "easy"}');
expect(valid.ok).toBe(true);
if (valid.ok) expect(valid.value.difficulty).toBe("easy");
expect(parseFlashcard("{not json").ok).toBe(false);
expect(parseFlashcard('{"question": "Q", "answer": "A", "difficulty": "impossible"}').ok).toBe(false);

// EXERCISE 3 — the validation error becomes the retry prompt.
const PROMPT = (topic: string) =>
  `Create one flashcard about ${topic}. Respond with ONLY a JSON object: ` +
  `{"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}`;

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

async function generateFlashcard(
  client: ModelClient,
  topic: string,
  maxAttempts: number
): Promise<Result<Flashcard, string>> {
  const history: Anthropic.MessageParam[] = [{ role: "user", content: PROMPT(topic) }];
  let lastError = "no attempts made";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response;
    try {
      response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 500,
        messages: history,
      });
    } catch {
      lastError = "model call failed";
      continue;
    }
    const text = extractText(response);
    const parsed = parseFlashcard(text);
    if (parsed.ok) return parsed;
    lastError = parsed.error;
    history.push({ role: "assistant", content: response.content });
    history.push({
      role: "user",
      content: `Your response failed validation: ${parsed.error}. Respond with ONLY the corrected JSON.`,
    });
  }
  return { ok: false, error: lastError };
}

const flaky = makeScriptedClient([
  fakeMessage("Sure! Here is your flashcard about embeddings: it's a vector!"),
  fakeMessage('```json\n{"question": "What is an embedding?", "answer": "A vector encoding meaning", "difficulty": "medium"}\n```'),
]);
const card = await generateFlashcard(flaky.client, "embeddings", 3);
expect(card.ok).toBe(true);
if (card.ok) expect(card.value.question).toBe("What is an embedding?");
const retryText = JSON.stringify(flaky.requests[1]!.messages);
expect(retryText.includes("failed validation")).toBe(true);

const hopeless = makeScriptedClient([fakeMessage("nope"), fakeMessage("still nope")]);
const gaveUp = await generateFlashcard(hopeless.client, "anything", 2);
expect(gaveUp.ok).toBe(false);

pass("05-structured-output (solution)");
