# Phase 8 — Multi-Agent Systems

**Quick review from Phase 7** (60 seconds): why does chunking quality cap
RAG quality? What does recall@k measure? Why normalize embeddings? Fuzzy →
skim `07-rag-pipeline/LESSON.md`.

---

CrewAI, AutoGen, LangGraph — the multi-agent frameworks look mystical from
outside. From inside they're three small ideas composed: **an agent is a
configured loop** (Phase 6), **agents pass typed messages** (Phase 4's
event emitter thinking), and **an orchestration pattern decides who runs
when** (plain control flow). You'll build all three in TypeScript, then map
them to the frameworks by name.

| File | Concept |
|---|---|
| `01-agent-anatomy.ts` | agent = role + prompt + tools + memory, as a class |
| `02-sequential-pipeline.ts` | typed handoffs down a chain |
| `03-orchestrator-worker.ts` | a router agent delegating to specialists |
| `04-guardrails.ts` | budgets, stop conditions, escalation |
| `checkpoint-researcher-writer.ts` | a working two-agent pipeline |

All exercises run on scripted clients — deterministic, offline, free.

---

## 1. What an agent actually is

```
Agent = role (system prompt) + model + tools + memory (its own history)
```

That's it — a *configuration* around the Phase 6 loop. "Researcher" and
"Critic" are the same class with different system prompts and tools. The
system prompt sets behavior and output format; the tool list bounds
capability; the memory is private conversation state. When CrewAI says
`Agent(role=…, goal=…, backstory=…)`, it is string-templating those fields
into a system prompt. That's the whole trick.

## 2. Why multiple agents at all?

One model call with a mega-prompt ("research this, then draft, then
self-critique…") degrades: instructions compete, context bloats,
and you can't measure or retry stages independently. Splitting into
focused agents buys you:

- **Focus** — each prompt does ONE job well (prompt quality scales inversely
  with prompt ambition).
- **Independent testability** — eval the researcher separately from the
  writer; retry just the failed stage.
- **Different tools/models per role** — the router can be Haiku-cheap while
  the writer is Sonnet-good; the researcher gets retrieval tools the writer
  never needs.

The cost: latency, tokens, and coordination bugs. **One agent that works
beats five that almost work** — reach for multi-agent when a single prompt
demonstrably degrades, not because it demos well.

## 3. Typed handoffs — the load-bearing decision

Agents talk via model-generated text. If agent B consumes agent A's prose
directly, you've built a game of telephone: format drift in A silently
corrupts B. The fix is the same boundary principle as ever — **inter-agent
messages are structured output**: A produces JSON matching a Zod schema
(Phase 6's validate + retry), and only the parsed, typed value crosses to
B. A handoff type like:

```ts
type ResearchHandoff = { summary: string; keyFacts: string[]; sources: string[] };
```

is the API contract between agents — versionable, testable, and the single
best predictor of whether a multi-agent system survives contact with
production.

## 4. Orchestration patterns

Three shapes cover ~90% of real systems:

- **Sequential pipeline** — A → B → C, each consuming the previous typed
  handoff. Fixed order, simplest to debug. (CrewAI's `Process.sequential`,
  your checkpoint.)
- **Orchestrator-worker** — a router agent CLASSIFIES the task and
  dispatches to a specialist; specialists don't know about each other.
  The router prompt is a classification problem → structured output
  (`{ worker: "refunds" }`), validated, then plain code dispatches. (This
  is also how "supervisor" modes in AutoGen/LangGraph work.)
- **Loop with critic** — generator produces, critic reviews against
  criteria, generator revises; repeat until approved or budget exhausted.
  This is the revision loop in your capstone.

Also real but out of scope to build today: debate (N agents argue, judge
picks), and swarm/handoff style (any agent can transfer control — OpenAI's
Agents SDK pattern).

## 5. Shared state vs private memory

Each agent keeps its own conversation history (private working memory).
What they SHARE should be explicit and typed — a scratchpad object the
orchestrator owns and passes into each stage. Letting every agent read
every other agent's full transcript couples them (and burns tokens);
sharing a typed summary is the multi-agent version of "validate at
boundaries, trust internal code".

## 6. Guardrails

Autonomy compounds costs. Every serious system has, at minimum:

- **Turn caps** per agent AND per system run (your Phase 6 iteration guard,
  now at two levels).
- **Token/cost budget** — accumulate usage across all calls; hard-stop when
  exceeded.
- **Stop conditions** — explicit success predicates ("critic approved",
  "schema valid"), not "the model stopped asking for tools".
- **Escalation** — when budget or attempts run out, return a typed failure
  a human can act on (`Result`, of course), never a silent best-effort.

## 7. The industry map (name-drop fluently)

| Framework | Language | Its core idea in your terms |
|---|---|---|
| **CrewAI** | Python | role-config agents + sequential/hierarchical process = files 01+02+03 |
| **AutoGen** | Python | agents as conversation participants; group-chat orchestration |
| **LangGraph / LangGraph.js** | Both | the orchestration graph made explicit: nodes = agents, edges = handoffs, state = your scratchpad |
| **OpenAI Agents SDK** | Both | handoffs-as-tool-calls, guardrails built in |
| **Vercel AI SDK** | TS | the model-call layer (their `generateObject` = your Phase 6 file 05) |
| **Mastra** | TS | TS-native agents + workflows + evals, batteries included |
| **Claude Agent SDK** | TS | the Phase 6 loop productized: tools, memory, permissions |

None of them will be magic after this phase: you'll be choosing convenience,
not capability.

## Common mistakes this phase's exercises are built around

1. Prose handoffs between agents (drift → silent corruption).
2. One mega-agent doing five jobs badly instead of two doing one well.
3. Routers that "explain their reasoning" instead of emitting a parseable decision.
4. No per-run budget — a retry loop inside a retry loop is a bill.
5. Sharing full transcripts between agents instead of typed summaries.
