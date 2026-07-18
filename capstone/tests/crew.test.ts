/**
 * The executable spec for the Research Crew.
 * Run: npm test capstone/tests/crew.test.ts
 *
 * Red until you implement src/rag.ts, src/agents.ts, src/crew.ts.
 * Uses REAL local embeddings (cached model) + scripted model clients.
 */
import { describe, it, expect } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NotesStore, buildStore, retrieve, formatChunks } from "../src/rag";
import { runCrew } from "../src/crew";
import { makeDryRunClients, DEMO_QUESTION, DRAFT_V2 } from "../src/fake";
import { PLANNER_PROMPT, RESEARCHER_PROMPT, WRITER_PROMPT, CRITIC_PROMPT } from "../src/types";

const DOCS = join(dirname(fileURLToPath(import.meta.url)), "../docs");

describe("rag: NotesStore", () => {
  it("ranks by similarity, descending, and respects k", () => {
    const store = new NotesStore();
    store.add("a", [1, 0], { source: "a.md", index: 0, text: "A" });
    store.add("b", [0, 1], { source: "b.md", index: 0, text: "B" });
    store.add("c", [0.8, 0.6], { source: "c.md", index: 0, text: "C" });
    const hits = store.topK([1, 0], 2);
    expect(hits.map((h) => h.id)).toEqual(["a", "c"]);
    expect(hits[0]!.score).toBeCloseTo(1);
  });

  it("replaces on duplicate id (re-ingest safety)", () => {
    const store = new NotesStore();
    store.add("x", [1, 0], { source: "x.md", index: 0, text: "old" });
    store.add("x", [0, 1], { source: "x.md", index: 0, text: "new" });
    expect(store.size).toBe(1);
    expect(store.topK([0, 1], 1)[0]!.metadata.text).toBe("new");
  });
});

describe("rag: formatChunks", () => {
  it("numbers chunks with sources", () => {
    expect(
      formatChunks([
        { id: "a#0", score: 0.9, metadata: { source: "a.md", index: 0, text: "Alpha." } },
        { id: "b#1", score: 0.5, metadata: { source: "b.md", index: 1, text: "Beta." } },
      ])
    ).toBe("[1] (a.md) Alpha.\n[2] (b.md) Beta.");
  });

  it("handles empty retrieval honestly", () => {
    expect(formatChunks([])).toBe("NO SOURCES FOUND");
  });
});

describe("rag: real retrieval over capstone docs", () => {
  it("ingests all four docs", async () => {
    const store = await buildStore(DOCS);
    expect(store.size).toBeGreaterThanOrEqual(4);
  });

  it("finds the right doc for a topical query", async () => {
    const store = await buildStore(DOCS);
    const hits = await retrieve(store, "How do citations keep model answers grounded and honest?", 3);
    expect(hits).toHaveLength(3);
    expect(hits[0]!.metadata.source).toBe("rag-engineering.md");
  }, 60_000);
});

describe("crew: dry-run end to end", () => {
  it("plans, researches, writes, survives critique, and reports honestly", async () => {
    const { clients, requests } = makeDryRunClients();
    const result = await runCrew(clients, DOCS, DEMO_QUESTION);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const crew = result.value;

    // the final draft is the REVISED one — the critic loop really ran:
    expect(crew.draft).toBe(DRAFT_V2);
    expect(crew.rounds).toBe(2);
    expect(crew.plan.subQuestions).toHaveLength(2);
    expect(crew.findings).toHaveLength(2);
    // exact token accounting across all 9 calls:
    expect(crew.tokensSpent).toBe(1310);

    // every role ran under its pinned prompt:
    expect(requests.planner[0]!.system).toBe(PLANNER_PROMPT);
    expect(requests.researcher[0]!.system).toBe(RESEARCHER_PROMPT);
    expect(requests.writer[0]!.system).toBe(WRITER_PROMPT);
    expect(requests.critic[0]!.system).toBe(CRITIC_PROMPT);

    // the researcher was armed with the search tool…
    expect(requests.researcher[0]!.tools?.[0]?.name).toBe("search_notes");
    // …and its tool_result carried REAL retrieved chunks (live embeddings):
    const toolResultTurn = JSON.stringify(requests.researcher[1]!.messages);
    expect(toolResultTurn).toContain("rag-engineering.md");

    // the revision request carried the critic's feedback to the writer:
    const revisionRequest = JSON.stringify(requests.writer[1]!.messages);
    expect(revisionRequest).toContain("missing its citation");
    expect(revisionRequest).toContain("Revise the draft");

    // researcher facts crossed to the writer as typed findings:
    const writerBrief = JSON.stringify(requests.writer[0]!.messages);
    expect(writerBrief).toContain("Citations let every claim be traced back to a source chunk");
  }, 120_000);

  it("faithfulness: every citation in the draft resolves to a findings source", async () => {
    const { clients } = makeDryRunClients();
    const result = await runCrew(clients, DOCS, DEMO_QUESTION);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const knownSources = new Set(result.value.findings.flatMap((f) => f.keyFacts.map((k) => k.source)));
    const cited = [...result.value.draft.matchAll(/\[([\w.-]+\.md)\]/g)].map((m) => m[1]!);
    expect(cited.length).toBeGreaterThan(0);
    for (const source of cited) {
      expect(knownSources.has(source)).toBe(true);
    }
  }, 120_000);

  it("stops before spending when the budget is already too small", async () => {
    const { clients } = makeDryRunClients();
    const result = await runCrew(clients, DOCS, DEMO_QUESTION, { maxTokens: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("budget exhausted");
  }, 120_000);
});
