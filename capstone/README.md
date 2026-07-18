# Capstone — Research Crew

A RAG-powered multi-agent research CLI. Ask a question about your document
folder; a crew of four agents answers it with citations:

```
                    ┌─ search_notes tool ─ RAG (your Phase 7 pipeline)
                    │
question → PLANNER → RESEARCHER (per sub-question) → WRITER → CRITIC
             │                                          ▲        │
             └── sub-questions (typed)                  └─ revise ┘  (≤ 2 rounds)
```

Everything you built in Phases 1–9 is used here, unassisted. This folder is
**portfolio-grade real project shape**: `src/` modules, `tests/`, a CLI, a
dry-run mode. When it works, put it on GitHub.

## Status: you build it

Provided (read them first — they are the contract):

| File | Role |
|---|---|
| `src/types.ts` | every schema and type: the inter-agent contracts |
| `src/budget.ts` | the shared `TokenBudget` (your Phase 8 guardrail) |
| `src/fake.ts` | scripted clients for `--dry-run` (the demo scenario) |
| `src/cli.ts` | argument parsing + wiring — works the moment `crew.ts` does |
| `tests/crew.test.ts` | the executable spec — your definition of done |

You implement (specs in each file's header comment):

| File | What goes in it | You built it in |
|---|---|---|
| `src/rag.ts` | chunk → embed → store → retrieve | Phase 7 |
| `src/agents.ts` | the four agent functions | Phases 6 & 8 |
| `src/crew.ts` | the orchestration: plan → research → write → critic loop | Phase 8 |

## Working on it

```bash
npm test capstone/tests/crew.test.ts    # the spec — red until you're done
npm run ts capstone/src/cli.ts -- "How do I keep a RAG system honest?" --dry-run
npm run check capstone/src/crew.ts      # types must be clean, as always
```

Dry-run needs no API key (embeddings are local; model calls are scripted).
Live mode:

```bash
# .env needs ANTHROPIC_API_KEY (copy .env.example at repo root)
npm run ts capstone/src/cli.ts -- "What does NPCI actually operate?"
npm run ts capstone/src/cli.ts -- "your question" --docs path/to/your/notes
```

## Rules

- `npm run check` clean on every file. No `any`.
- Model output is boundary data — every crossing validates (you know this).
- The reference implementation is in `solutions/capstone/` under the usual
  15-minute rule. To diff a finished reference against the tests: back up
  your `src/`, copy the solution files in, run the tests, restore yours.

## Eval it (after it works)

`tests/crew.test.ts` ends with a faithfulness eval on the dry-run output —
every claim in the draft must carry a citation that resolves to a real
retrieved chunk. When you go live, extend it: 5 questions about your own
notes, `recallAtK` + `isGrounded` from Phase 7. That eval sheet is what you
show in an interview when they ask "how do you know your agent works?"
