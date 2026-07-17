# TS Playground — Applied TypeScript for AI Engineering

A self-paced, hands-on course. It starts at JavaScript foundations, builds to
serious TypeScript, and ends where the industry actually uses TS for AI:
agent loops, RAG pipelines, and multi-agent systems. The final capstone is a
portfolio-grade project — a RAG-powered multi-agent research CLI.

**The philosophy: mistakes are the curriculum.** Exercise files ship broken
or incomplete on purpose. You run them, read the error, fix the code, re-run.
Reading TypeScript compiler errors fluently is itself a core skill this
course trains.

## Setup (one time)

```bash
npm install
```

That's it until Phase 6. From Phase 6 onward you'll make live model calls:
copy `.env.example` to `.env` and add your `ANTHROPIC_API_KEY`. Phase 7's
embeddings run fully locally (a small model downloads on first run) — no key
needed for RAG.

## The daily loop

1. Open the phase's `LESSON.md`. Read it — it's the complete textbook chapter.
2. Open the first exercise file. The comments walk you through it.
3. Run it:
   ```bash
   npm run ts phases/01-js-foundations/01-values-and-variables.ts
   ```
4. It fails. Good. Read the error, fix the code, run again.
5. From Phase 3 onward, also type-check the file (runtime passing is not enough —
   the types must be right too):
   ```bash
   npm run check phases/03-ts-fundamentals/01-inference.ts
   ```
6. When everything passes, tick the file off in `PROGRESS.md` and move on.
7. Finish each phase with its `checkpoint-*` file — a build-from-scratch task
   with no hand-holding. **Don't start the next phase until the checkpoint passes.**

## Commands

| Command | What it does |
|---|---|
| `npm run ts <file>` | Run any exercise file directly (tsx, no build step) |
| `npm run check <file>` | Type-check one file in strict mode |
| `npm run check:all` | Type-check every non-solution file (unfinished exercises WILL fail — that's expected) |
| `npm test <file>` | Run a vitest test file (used from Phase 5 onward) |

## Rules

- **Stuck longer than ~15 minutes on one exercise?** Look at the matching file
  in `solutions/`. Read it, understand it, then close it and re-write the fix
  yourself from memory. Copy-paste teaches nothing.
- **`any` is banned.** If you feel the urge, the correct move is almost always
  `unknown` + narrowing. Phase 3 explains why.
- **Don't skip checkpoints.** They're where retention happens.
- **Phase 9 gates the capstone.** All four readiness drills must pass
  (`check` + tests) before you start `capstone/`. If a drill won't fall, its
  LESSON.md tells you exactly which phase files to revisit.

## Course map

| Phase | Folder | You'll be able to… |
|---|---|---|
| 1. JS Foundations | `phases/01-js-foundations/` | Write modern JS: closures, array methods, destructuring, modules |
| 2. Async JS | `phases/02-async-js/` | Reason about the event loop; use promises, `async/await`, `fetch`, retries |
| 3. TS Fundamentals | `phases/03-ts-fundamentals/` | Type real code: unions, narrowing, `interface` vs `type`, `unknown` vs `any` |
| 4. Generics & the Type System | `phases/04-generics-and-types/` | Write generic, reusable, type-safe abstractions; utility & mapped types |
| 5. Real-World TS | `phases/05-real-world-ts/` | Ship: tsconfig, Zod at boundaries, env config, Node APIs, vitest |
| 6. TS for AI | `phases/06-ts-for-ai/` | Typed Anthropic SDK calls, streaming, tool use, an agent loop, evals |
| 7. RAG from Scratch | `phases/07-rag-pipeline/` | Chunking, embeddings, vector search, cited retrieval — built by hand |
| 8. Multi-Agent Systems | `phases/08-multi-agent/` | CrewAI/AutoGen-style orchestration, implemented yourself in TS |
| 9. Readiness Check | `phases/09-readiness-check/` | Prove it: four unguided drills, no comments, just specs |
| Capstone | `capstone/` | A RAG-powered multi-agent research CLI — real project, portfolio-grade |

Track where you are in `PROGRESS.md`.
