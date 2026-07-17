/**
 * Phase 4 · Exercise 04 — Utility types
 *
 * Both must pass:
 *   npm run ts    phases/04-generics-and-types/04-utility-types.ts
 *   npm run check phases/04-generics-and-types/04-utility-types.ts
 *
 * Theme: DERIVE types from a source of truth, never duplicate them.
 * Duplicated types drift; derived types can't.
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// One source of truth for this whole file:
type Article = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  publishedAt: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — Partial + Omit: the update-payload pattern
//
// An update can change any field EXCEPT id. The hand-written version below
// already forgot `tags` (drift!). Derive it instead:
//   type ArticleUpdate = Partial<Omit<Article, "id">>;
// ─────────────────────────────────────────────────────────────────────────────
type ArticleUpdate = {
  title?: string;
  body?: string;
  publishedAt?: number | null;
}; // REPLACE with the derived version

function applyUpdate(article: Article, update: ArticleUpdate): Article {
  return { ...article, ...update };
}

const draft: Article = { id: 1, title: "RAG", body: "…", tags: [], publishedAt: null };
const tagged = applyUpdate(draft, { tags: ["ai", "ts"] }); // fails until derived
expect(tagged.tags).toEqual(["ai", "ts"]);

// @ts-expect-error -- id must not be updatable
applyUpdate(draft, { id: 99 });

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — Pick: the card/preview pattern
// A list view needs only id + title. Derive ArticleCard with Pick.
// ─────────────────────────────────────────────────────────────────────────────
type ArticleCard = unknown; // REPLACE with Pick<Article, ...>

const card: ArticleCard = { id: 1, title: "RAG" };
type _e2 = Expect<Equal<ArticleCard, { id: number; title: string }>>;
expect((card as { id: number }).id).toBe(1);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — Record: typed lookup tables
//
// Type this status→label map so that (a) every key must be a Status, and
// (b) adding a Status later forces you to add a label here (compile error
// otherwise). That's Record<Status, string> — and it's why Record beats
// index signatures for closed key sets.
// ─────────────────────────────────────────────────────────────────────────────
type Status = "draft" | "review" | "published";

const statusLabels = {
  draft: "Draft",
  review: "In review",
  // BUG: "published" is missing — Record<Status, string> will catch it
};

function labelFor(status: Status): string {
  return (statusLabels as Record<string, string>)[status] ?? "??"; // delete the cast + ?? after typing statusLabels properly
}

expect(labelFor("published")).toBe("Published");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — ReturnType + Awaited: extract instead of restate
//
// searchArticles' return shape is defined BY THE FUNCTION. Derive the
// element type instead of hand-writing it:
//   type SearchHit = Awaited<ReturnType<typeof searchArticles>>[number]
// ([number] indexes into the array type — "type of one element".)
// ─────────────────────────────────────────────────────────────────────────────
async function searchArticles(query: string) {
  return [{ articleId: 1, score: 0.92, snippet: `…${query}…` }];
}

type SearchHit = { articleId: number }; // REPLACE with the derived type

const hit: SearchHit = (await searchArticles("rag"))[0]!;
type _e4 = Expect<Equal<SearchHit, { articleId: number; score: number; snippet: string }>>;
expect(hit.articleId).toBe(1);

pass("04-utility-types");
