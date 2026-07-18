# Phase 9 — Readiness Check

This phase is a gate, not a lesson. Four drills, **no guiding comments** —
just specs and failing checks, like a normal day at work. All four green
(`npm run ts` + `npm run check`) is your ticket to the capstone.

Rules of engagement:

- No peeking at earlier files while attempting a drill. Attempt first,
  reference after — that gap between "recognize" and "reproduce" is
  exactly what this phase measures.
- Stuck > 20 minutes on one drill: stop, revisit the phase files listed
  below, then RE-ATTEMPT from scratch (don't resume a half-broken buffer).
- Solutions exist (`solutions/09-readiness-check/`) but using one on a
  drill means redoing that drill from zero tomorrow. House rule; honor
  system.

## Skills-trace: what each drill proves, and where to close gaps

| Drill | Proves you can… | Capstone stage it unlocks | If it won't fall, revisit |
|---|---|---|---|
| `drill-types.ts` | write generics, constraints, mapped/conditional types, discriminated unions cold | every typed interface in `capstone/src/types.ts` | Phase 3: 04, 05 · Phase 4: all |
| `drill-async.ts` | orchestrate concurrent async work with closures and bounded parallelism | batched embedding + parallel agent fan-out | Phase 1: 02 · Phase 2: 02, 03, 04 |
| `drill-boundary.ts` | turn hostile external data into typed values with Zod + Result | every model-output boundary in the capstone | Phase 4: 06 · Phase 5: 02 · Phase 6: 05 |
| `drill-agent.ts` | build a tool-use agent loop from a bare spec | the Researcher agent (RAG-as-a-tool) | Phase 6: 04, checkpoint · Phase 8: 01 |

## Scoring yourself honestly

- **All four on the first sitting** — start the capstone today.
- **Three, with one revisit** — normal. Close the gap, then start.
- **Two or fewer** — the phases went too fast; that's information, not
  failure. Spend a day re-doing the checkpoints of the weak phases (from
  scratch — delete your old solutions), then re-run the drills.

The capstone assumes every one of these skills without comment. A gap here
costs an hour; the same gap mid-capstone costs an evening and morale.
