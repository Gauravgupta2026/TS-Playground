/**
 * Phase 8 · Exercise 03 — Orchestrator-worker: a router and its specialists
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/08-multi-agent/03-orchestrator-worker.ts
 *   npm run check phases/08-multi-agent/03-orchestrator-worker.ts
 *
 * A cheap router model CLASSIFIES the request; plain TypeScript dispatches
 * to the right specialist. The router never answers, specialists never
 * route. (This is CrewAI's hierarchical process / LangGraph's supervisor
 * node, in ~60 lines.)
 */
import { z } from "zod";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// The worker registry — adding a worker means extending this union + map.
const WORKERS = ["refunds", "technical", "smalltalk"] as const;
type WorkerName = (typeof WORKERS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the routing decision is structured output
//
// Define RouteSchema: { worker: enum of WORKERS, reason: string }.
// z.enum accepts the readonly tuple WORKERS directly.
// ─────────────────────────────────────────────────────────────────────────────
const RouteSchema = z.object({}); // IMPLEMENT

expect(RouteSchema.safeParse({ worker: "refunds", reason: "mentions money back" }).success).toBe(true);
expect(RouteSchema.safeParse({ worker: "billing", reason: "?" }).success).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — the router
//
// Implement route(): one model call with ROUTER_PROMPT as system and the
// user message; parse+validate the reply (fences may appear — strip them);
// invalid → err("unroutable"). Router prompts must demand ONLY the JSON —
// "explain then answer" routers are unparseable routers.
// ─────────────────────────────────────────────────────────────────────────────
const ROUTER_PROMPT =
  `Classify the user message. Respond ONLY with JSON: ` +
  `{"worker": "refunds|technical|smalltalk", "reason": "..."}`;

function stripFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```[a-z]*\s*\n?/, "").replace(/\n?```$/, "");
  return text.trim();
}

async function route(client: ModelClient, userMessage: string): Promise<Result<z.infer<typeof RouteSchema>, string>> {
  return { ok: false, error: "IMPLEMENT me" };
}

const routerOk = makeScriptedClient([fakeMessage('{"worker": "refunds", "reason": "asks for money back"}')]);
const decision = await route(routerOk.client, "I want my money back!");
expect(decision.ok).toBe(true);
if (decision.ok) expect(decision.value.worker).toBe("refunds");
expect(routerOk.requests[0]!.system).toBe(ROUTER_PROMPT);

const routerBad = makeScriptedClient([fakeMessage("Hmm, tricky one. Maybe refunds? Or billing?")]);
expect((await route(routerBad.client, "?")).ok).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — dispatch
//
// The specialists (simple functions here — each would be an Agent in prod):
// Implement dispatch(): route, then call the matching worker with the
// message; unroutable → the fallback text below. Use a Record<WorkerName,
// (msg: string) => string> — Phase 4's Record making the dispatch total:
// add a worker to the union and the compiler demands its handler here.
// ─────────────────────────────────────────────────────────────────────────────
const UNROUTABLE_REPLY = "Sorry, I couldn't understand that request.";

const workers: Record<WorkerName, (message: string) => string> = {
  refunds: (m) => `[refunds] Processing refund request: "${m}"`,
  technical: (m) => `[technical] Debugging: "${m}"`,
  smalltalk: (m) => `[smalltalk] 👋 ${m}`,
};

async function dispatch(routerClient: ModelClient, userMessage: string): Promise<string> {
  return ""; // IMPLEMENT
}

const r1 = makeScriptedClient([fakeMessage('{"worker": "technical", "reason": "bug report"}')]);
expect(await dispatch(r1.client, "The app crashes on login")).toBe('[technical] Debugging: "The app crashes on login"');

const r2 = makeScriptedClient([fakeMessage("no idea")]);
expect(await dispatch(r2.client, "…")).toBe(UNROUTABLE_REPLY);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — measure your router (evals, again)
//
// Routers are classifiers, so they get classifier evals. Implement
// routerAccuracy: fraction of labeled cases where the (scripted) router
// picks the expected worker. (In production this suite runs on every
// router-prompt change — a Phase 6 eval with a Phase 8 subject.)
// ─────────────────────────────────────────────────────────────────────────────
type LabeledRoute = { message: string; expected: WorkerName };

async function routerAccuracy(client: ModelClient, cases: LabeledRoute[]): Promise<number> {
  return -1; // IMPLEMENT (sequential loop is fine — scripted clients are ordered)
}

const evalClient = makeScriptedClient([
  fakeMessage('{"worker": "refunds", "reason": "r"}'), // correct
  fakeMessage('{"worker": "smalltalk", "reason": "r"}'), // correct
  fakeMessage('{"worker": "refunds", "reason": "r"}'), // WRONG (expected technical)
  fakeMessage("gibberish"), // unroutable counts as wrong
]);

const accuracy = await routerAccuracy(evalClient.client, [
  { message: "refund please", expected: "refunds" },
  { message: "hi!", expected: "smalltalk" },
  { message: "stack trace attached", expected: "technical" },
  { message: "???", expected: "smalltalk" },
]);
expect(accuracy).toBe(0.5);

pass("03-orchestrator-worker");
