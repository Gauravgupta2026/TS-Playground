# Phase 12 — Context Engineering & Agent Harnesses

**Quick review from the capstone / Phase 8** (60 seconds): what did the token
budget protect you from? Why does a subagent return a *summary* instead of its
raw transcript? This phase names and builds the techniques those instincts
were reaching for — the ones Anthropic's own agent teams say matter most.

---

> "Most developers have heard of prompt engineering. But to get the most out
> of AI agents, you need **context engineering**." — Anthropic Engineering

Prompt engineering asks *"what words do I write?"*. Context engineering asks
the bigger question: **"what is the smallest set of high-signal tokens that
makes the desired behavior most likely?"** An LLM has a finite **attention
budget** — every token you add dilutes the rest. As agents run for hundreds of
turns, managing that budget *is* the job. This phase builds the five levers
Anthropic uses, all offline and deterministic.

| File | Technique | The problem it solves |
|---|---|---|
| `01-context-budget.ts` | budgeted context assembly | fit the highest-signal blocks into a fixed window |
| `02-compaction.ts` | compaction + tool-result clearing | continue past the window limit without losing the thread |
| `03-agentic-memory.ts` | structured note-taking | persist knowledge OUTSIDE the window, across resets |
| `04-subagent-isolation.ts` | subagent context isolation | keep the lead agent's window small while exploring deeply |
| `05-long-running-harness.ts` | the harness | drive a multi-session task with state, checkpoints, recovery |
| `checkpoint-research-harness.ts` | **all of them** | a long-running research agent, composed |

Sources: [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
· [Harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents).

---

## 1. The attention budget (why this whole phase exists)

Context is a *scarce resource*, not a bucket you fill. Research on "context
rot" shows that as the token count climbs, the model's ability to accurately
recall any single fact degrades — more context can mean *worse* answers. So the
goal is never "add everything relevant"; it's **curate**. Every block competes
for attention: system prompt, tool definitions, few-shot examples, retrieved
docs, conversation history, memory. Good agents assign each a priority and
assemble under a hard token budget, keeping the essentials pinned and dropping
the marginal. File 01 builds exactly that assembler.

**System-prompt "altitude":** aim between two failure modes — brittle
hardcoded if/else logic, and vague "be helpful" hand-waving. Specific enough to
steer, general enough to generalize. Organize with clear sections
(`<instructions>`, `<background>`), start minimal on your best model, and add
only in response to observed failures.

## 2. Compaction — surviving the window limit

When history approaches the window, **compaction** summarizes it and
reinitializes a fresh window from that summary. The craft is in the summary
prompt: **maximize recall first** (capture every decision, bug, open thread),
*then* tighten precision. Keep architectural choices and unresolved threads;
drop resolved back-and-forth.

The lightest form is **tool-result clearing**: once a tool call is deep in
history, its raw result (a 5,000-token file dump) is rarely needed again —
replace it with a stub and reclaim the tokens, keeping the *fact that it ran*.
Anthropic shipped this as a platform feature; you build both in file 02.

## 3. Agentic memory — knowledge that outlives the window

Compaction is lossy. For facts that must survive *exactly*, the agent writes
**structured notes to storage outside the context window** (a `NOTES.md`, a
to-do list, a memory store) and reloads them later. This is how Claude plays
Pokémon across thousands of steps and many context resets, or how a coding
agent remembers a decision made yesterday. Memory is external and durable; the
window is ephemeral and small. File 03 builds a memory store that survives a
simulated reset.

## 4. Subagent isolation — the multiplier

A subagent explores in its **own** context window — tens of thousands of tokens
of searching, reading, tool calls — and returns only a **condensed 1,000–2,000
token summary** to the lead. The detailed context stays quarantined; the lead's
attention budget is spent on *synthesis*, not raw material. This is the single
biggest lever for complex research: parallel depth without drowning the
coordinator. File 04 measures the isolation directly — lead context stays tiny
while subagents burn thousands of tokens each.

## 5. The harness — driving a long-running task

Long tasks span many sessions, each with a fresh window. The **harness** is the
scaffolding that makes that survivable:

- **Externalized state** — a structured (JSON, not Markdown — agents corrupt
  Markdown state) list of features/subtasks with explicit `passing`/`failing`
  status. The single source of truth across sessions.
- **One unit of work at a time** — force focus; forbid "do everything now".
- **Verification-first** — each session begins by reading prior state and
  running the existing tests *before* new work, catching silent regressions.
- **Checkpoint + recovery** — snapshot known-good state (git commit); on a bad
  change, revert to the last checkpoint instead of digging deeper.

File 05 builds this as a deterministic state machine — the same shape whether
the "worker" is a model or a person.

---

## The industry map

| You built | The real thing |
|---|---|
| budgeted assembly | context-window managers in the Claude Agent SDK / LangGraph state |
| compaction + tool clearing | Claude Developer Platform context editing, LangChain trim/summarize |
| agentic memory | Claude's memory tool, MemGPT/Letta, `NOTES.md` conventions |
| subagent isolation | Claude Code subagents, orchestrator-worker in LangGraph/CrewAI |
| the harness | Claude Code's session loop, SWE-agent scaffolds, terminal-bench harnesses |

## Common mistakes this phase's exercises are built around

1. Treating context as a bucket to fill instead of a budget to spend.
2. Never compacting → the agent forgets the *start* of its own task.
3. Compaction that optimizes precision before recall → drops the one open bug.
4. Keeping raw tool results forever instead of clearing stale ones.
5. Storing durable facts only in the window (they die at the next reset).
6. Piping a subagent's full transcript to the lead — re-drowning the coordinator.
7. A harness with state in the window instead of externalized → no recovery.
