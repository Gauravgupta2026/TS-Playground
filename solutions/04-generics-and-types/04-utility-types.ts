/** SOLUTION — Phase 4 · 04. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

type Article = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  publishedAt: number | null;
};

// EXERCISE 1 — derived: always in sync with Article, id excluded by construction.
type ArticleUpdate = Partial<Omit<Article, "id">>;

function applyUpdate(article: Article, update: ArticleUpdate): Article {
  return { ...article, ...update };
}
const draft: Article = { id: 1, title: "RAG", body: "…", tags: [], publishedAt: null };
const tagged = applyUpdate(draft, { tags: ["ai", "ts"] });
expect(tagged.tags).toEqual(["ai", "ts"]);
// @ts-expect-error -- id must not be updatable
applyUpdate(draft, { id: 99 });

// EXERCISE 2
type ArticleCard = Pick<Article, "id" | "title">;
const card: ArticleCard = { id: 1, title: "RAG" };
type _e2 = Expect<Equal<ArticleCard, { id: number; title: string }>>;
expect(card.id).toBe(1);

// EXERCISE 3 — Record makes the key set CLOSED and COMPLETE: a missing
// status is a compile error, which is how the bug was caught.
type Status = "draft" | "review" | "published";

const statusLabels: Record<Status, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published",
};

function labelFor(status: Status): string {
  return statusLabels[status];
}
expect(labelFor("published")).toBe("Published");

// EXERCISE 4 — the function's return shape IS the type; [number] takes one element.
async function searchArticles(query: string) {
  return [{ articleId: 1, score: 0.92, snippet: `…${query}…` }];
}

type SearchHit = Awaited<ReturnType<typeof searchArticles>>[number];

const hit: SearchHit = (await searchArticles("rag"))[0]!;
type _e4 = Expect<Equal<SearchHit, { articleId: number; score: number; snippet: string }>>;
expect(hit.articleId).toBe(1);

pass("04-utility-types (solution)");
