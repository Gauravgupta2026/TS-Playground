# Phase 6 — TypeScript for AI Engineering

**Quick review from Phase 5** (60 seconds): why validate at boundaries and
trust internal code? What does `z.infer` buy you? What's `safeParse`'s
return shape? Fuzzy → skim `05-real-world-ts/LESSON.md`.

---

Everything you've learned converges here. Model APIs are the ultimate
boundary: expensive, slow, and **non-deterministic** — the same prompt can
return different shapes of output. That's precisely where types + validation
earn their keep, and why serious AI engineering teams run TypeScript in
production.

| File | Concept |
|---|---|
| `01-first-api-call.ts` | request params, response `Message`, extracting text |
| `02-message-types.ts` | conversation history, roles, system prompts, usage |
| `03-streaming.ts` | consuming typed stream events |
| `04-tool-use.ts` | tool schemas, dispatching `tool_use`, tool results |
| `05-structured-output.ts` | JSON out of models, validate + retry |
| `06-evals.ts` | a minimal eval harness |
| `checkpoint-cli-agent.ts` | the full agent loop |

**No API key needed for any exercise.** Every file runs against a typed fake
client — deterministic, free, offline. The types are the REAL SDK's types,
so everything transfers 1:1. Files with a live section tell you how to run
them for real once you've set `ANTHROPIC_API_KEY` in `.env` (copy
`.env.example`, get a key at console.anthropic.com).

---

## 1. The Messages API in one page

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();   // reads ANTHROPIC_API_KEY from env

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  system: "You are a concise assistant.",     // top-level, NOT a message
  messages: [{ role: "user", content: "Say hi in five words." }],
});
```

The request type (`MessageCreateParams`) will teach you the API through
autocomplete alone. The response (`Message`) looks like:

```ts
{
  id: "msg_…",
  role: "assistant",
  content: [ { type: "text", text: "Hi there, five words done." } ],
  stop_reason: "end_turn",     // or "tool_use" | "max_tokens" | …
  usage: { input_tokens: 21, output_tokens: 9, … }
}
```

**`content` is an array of blocks, not a string** — a discriminated union on
`type` (`"text" | "tool_use" | "thinking" | …`). Extracting text is Phase 3
narrowing:

```ts
const text = response.content
  .filter((block): block is Anthropic.TextBlock => block.type === "text")
  .map((block) => block.text)
  .join("");
```

Watch `stop_reason` — code that ignores it silently truncates responses
(`"max_tokens"`) or drops tool calls (`"tool_use"`).

## 2. Conversations are arrays you own

The API is **stateless**: there is no session on the server. "Conversation
memory" = you sending the whole history every call — user and assistant
turns alternating in one `MessageParam[]` that you append to. This is why
context management is an engineering topic at all: YOU hold the context.
Two consequences worth internalizing now: tokens (cost) grow with history
length, and anything you don't re-send, the model has never seen.

## 3. Streaming

Waiting 20 seconds for a full response is bad UX; streaming yields tokens
as they generate. The SDK gives you an async iterable of **typed events** —
a discriminated union again:

```ts
const stream = client.messages.stream({ … });
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

Key event types: `message_start` (usage info), `content_block_start`,
`content_block_delta` (the tokens — deltas nest their own union:
`text_delta`, `input_json_delta`), `message_delta` (stop_reason arrives),
`message_stop`. The exercise has you fold an event stream into a final
message — which is exactly what the SDK's `.finalMessage()` does for you.

## 4. Tool use — the mechanism under every agent

You describe functions to the model; the model *asks* you to call them; you
run the real code and return results. The loop:

1. Send messages + `tools` (name, description, `input_schema` as JSON Schema).
2. Response arrives with `stop_reason: "tool_use"` and a `tool_use` block:
   `{ id, name, input }`.
3. **`input` is typed `unknown`** — the model produced it, so it crosses a
   boundary → Zod-validate before running anything. (Feel how all the
   phases stack up here?)
4. Run the tool. Append TWO messages: the assistant's turn (its content
   blocks, verbatim), then a user turn containing
   `{ type: "tool_result", tool_use_id, content }`.
5. Call the API again. Repeat until `stop_reason` isn't `"tool_use"`.

That while-loop **is** an agent. Everything else — multi-agent systems,
CrewAI, LangGraph, Claude Code itself — is architecture layered on top of
this exact loop. You build it in `04-tool-use.ts` + the checkpoint, and
never again wonder what an "agent framework" secretly does.

## 5. Structured output

You often want JSON, not prose. Reliable recipe:

1. Ask for exactly JSON in the prompt ("Respond with ONLY a JSON object:
   {…example…}").
2. Strip markdown fences the model may add anyway (```json … ```).
3. `JSON.parse` inside a tryCatch → `safeParse` with a Zod schema.
4. On failure: **retry, feeding the validation error back** ("Your last
   response failed validation: <issues>. Respond with corrected JSON
   only.") — one retry fixes most failures.

Cap retries; return `Result`, not a throw. Non-determinism means this path
WILL be exercised in production — it's a normal case.

## 6. Evals — tests for non-deterministic systems

A unit test asserts one exact answer; model outputs vary. An **eval** runs N
cases through your pipeline and *grades* each output — exact match where
determinism is expected, contains/regex for facts-in-prose, numeric
tolerance for scores, LLM-as-judge for open-ended quality (that last one is
a rabbit hole; know it exists). The output is a scorecard: pass rate now,
compared against pass rate before your change. Evals are to AI engineering
what CI is to software — the thing that makes iteration safe. Your
`06-evals.ts` harness is small but structurally identical to the real ones
(Braintrust, promptfoo, Anthropic's own).

## Cost intuition (worth 60 seconds)

Tokens ≈ ¾ of a word. You pay per input token (the WHOLE history, every
call) and per output token. A 10-turn conversation re-sends turn 1 ten
times. This is why: histories get summarized/truncated, prompts get cached,
and `max_tokens` exists. Sonnet-class models are ~10× Haiku-class pricing;
picking the smallest model that passes your evals is real engineering.

## Common mistakes this phase's exercises are built around

1. Treating `content` as a string instead of narrowing blocks.
2. Ignoring `stop_reason`, silently dropping tool calls or truncations.
3. Trusting tool `input` / model JSON without validation.
4. Forgetting to append the assistant turn before the `tool_result` turn.
5. Agent loops with no max-iteration guard (infinite loops cost real money).
