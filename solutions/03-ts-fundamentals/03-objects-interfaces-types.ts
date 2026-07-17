/** SOLUTION — Phase 3 · 03. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — optional with ?, immutable with readonly.
type UserProfile = {
  readonly id: number;
  handle: string;
  followers: number;
  bio?: string;
};

const gg: UserProfile = {
  id: 101,
  handle: "@gaurav",
  followers: 1024,
};

const handleLength: number = gg.handle.length;
expect(handleLength).toBe(7);

// @ts-expect-error -- id is readonly; assignment must not compile
gg.id = 999;
// @ts-expect-error -- typo'd property must not exist on the type
gg.folowers = 5;

// EXERCISE 2 — a DraftPost IS a Post structurally; Post-typed param takes both.
interface Post {
  title: string;
  body: string;
}
interface DraftPost extends Post {
  lastEditedAt: number;
}

function makePreview(post: Post): string {
  return `${post.title}: ${post.body}`;
}

const published: Post = { title: "Why unions beat enums", body: "Because…" };
const draft: DraftPost = { title: "RAG notes", body: "Chunking is…", lastEditedAt: 1720000000 };
expect(makePreview(published)).toBe("Why unions beat enums: Because…");
expect(makePreview(draft)).toBe("RAG notes: Chunking is…");

// EXERCISE 3 — excess property checking caught the casing typo.
type Settings = { darkMode: boolean; fontSize: number };
const settings: Settings = {
  darkMode: true,
  fontSize: 14,
};
expect(settings.darkMode).toBe(true);

// EXERCISE 4 — unions, function types and tuples: type-alias-only territory.
type Id = string | number;
type Formatter = (value: Id) => string;
type Pair = [Id, Formatter];

const idA: Id = 42;
const idB: Id = "abc-123";
const fmt: Formatter = (value) => `id:${String(value)}`;
const pair: Pair = [idA, fmt];
expect(pair[1](pair[0])).toBe("id:42");
expect(fmt(idB)).toBe("id:abc-123");

pass("03-objects-interfaces-types (solution)");
