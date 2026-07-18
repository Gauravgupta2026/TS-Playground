/** SOLUTION — Phase 8 · 03. */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const WORKERS = ["refunds", "technical", "smalltalk"] as const;
type WorkerName = (typeof WORKERS)[number];

// EXERCISE 1 — z.enum takes the readonly tuple directly.
const RouteSchema = z.object({
  worker: z.enum(WORKERS),
  reason: z.string(),
});

expect(RouteSchema.safeParse({ worker: "refunds", reason: "mentions money back" }).success).toBe(true);
expect(RouteSchema.safeParse({ worker: "billing", reason: "?" }).success).toBe(false);

const ROUTER_PROMPT =
  `Classify the user message. Respond ONLY with JSON: ` +
  `{"worker": "refunds|technical|smalltalk", "reason": "..."}`;

function stripFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```[a-z]*\s*\n?/, "").replace(/\n?```$/, "");
  return text.trim();
}

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

// EXERCISE 2 — classification as structured output.
async function route(client: ModelClient, userMessage: string): Promise<Result<z.infer<typeof RouteSchema>, string>> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5", // routing is a cheap-model job
    max_tokens: 200,
    system: ROUTER_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  let json: unknown;
  try {
    json = JSON.parse(stripFences(extractText(response)));
  } catch {
    return { ok: false, error: "unroutable" };
  }
  const parsed = RouteSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "unroutable" };
  return { ok: true, value: parsed.data };
}

const routerOk = makeScriptedClient([fakeMessage('{"worker": "refunds", "reason": "asks for money back"}')]);
const decision = await route(routerOk.client, "I want my money back!");
expect(decision.ok).toBe(true);
if (decision.ok) expect(decision.value.worker).toBe("refunds");
expect(routerOk.requests[0]!.system).toBe(ROUTER_PROMPT);

const routerBad = makeScriptedClient([fakeMessage("Hmm, tricky one. Maybe refunds? Or billing?")]);
expect((await route(routerBad.client, "?")).ok).toBe(false);

// EXERCISE 3 — Record makes the dispatch table total.
const UNROUTABLE_REPLY = "Sorry, I couldn't understand that request.";

const workers: Record<WorkerName, (message: string) => string> = {
  refunds: (m) => `[refunds] Processing refund request: "${m}"`,
  technical: (m) => `[technical] Debugging: "${m}"`,
  smalltalk: (m) => `[smalltalk] 👋 ${m}`,
};

async function dispatch(routerClient: ModelClient, userMessage: string): Promise<string> {
  const decision2 = await route(routerClient, userMessage);
  if (!decision2.ok) return UNROUTABLE_REPLY;
  return workers[decision2.value.worker](userMessage);
}

const r1 = makeScriptedClient([fakeMessage('{"worker": "technical", "reason": "bug report"}')]);
expect(await dispatch(r1.client, "The app crashes on login")).toBe('[technical] Debugging: "The app crashes on login"');
const r2 = makeScriptedClient([fakeMessage("no idea")]);
expect(await dispatch(r2.client, "…")).toBe(UNROUTABLE_REPLY);

// EXERCISE 4 — routers are classifiers; classifiers get accuracy suites.
type LabeledRoute = { message: string; expected: WorkerName };

async function routerAccuracy(client: ModelClient, cases: LabeledRoute[]): Promise<number> {
  if (cases.length === 0) return 0;
  let correct = 0;
  for (const c of cases) {
    const decision3 = await route(client, c.message);
    if (decision3.ok && decision3.value.worker === c.expected) correct += 1;
  }
  return correct / cases.length;
}

const evalClient = makeScriptedClient([
  fakeMessage('{"worker": "refunds", "reason": "r"}'),
  fakeMessage('{"worker": "smalltalk", "reason": "r"}'),
  fakeMessage('{"worker": "refunds", "reason": "r"}'),
  fakeMessage("gibberish"),
]);

const accuracy = await routerAccuracy(evalClient.client, [
  { message: "refund please", expected: "refunds" },
  { message: "hi!", expected: "smalltalk" },
  { message: "stack trace attached", expected: "technical" },
  { message: "???", expected: "smalltalk" },
]);
expect(accuracy).toBe(0.5);

pass("03-orchestrator-worker (solution)");
