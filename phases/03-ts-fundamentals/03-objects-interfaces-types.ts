/**
 * Phase 3 · Exercise 03 — Object types, interface vs type
 *
 * Both must pass:
 *   npm run ts    phases/03-ts-fundamentals/03-objects-interfaces-types.ts
 *   npm run check phases/03-ts-fundamentals/03-objects-interfaces-types.ts
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — write the type from the data
//
// Model this API payload as a `type`. Requirements:
//   - bio is OPTIONAL (some users have none)
//   - id is READONLY (reassigning it below must stay a compile error)
// Replace the placeholder `unknown` with a proper object type.
// ─────────────────────────────────────────────────────────────────────────────
type UserProfile = unknown; // REPLACE with { readonly id: …; handle: …; followers: …; bio?: … }

const gg: UserProfile = {
  id: 101,
  handle: "@gaurav",
  followers: 1024,
  // note: no bio — must still typecheck, because bio is optional
};

// Positive spec: with a real type, these just work (they error while
// UserProfile is still `unknown` — that's your broken state).
const handleLength: number = gg.handle.length;
expect(handleLength).toBe(7);

// Negative spec: these two must REMAIN errors after your fix (readonly +
// no typo'd property). @ts-expect-error demands an error on the next line.
// @ts-expect-error -- id is readonly; assignment must not compile
gg.id = 999;
// @ts-expect-error -- typo'd property must not exist on the type
gg.folowers = 5;

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — interface + extends
//
// Define `interface Post` (title: string, body: string) and
// `interface DraftPost extends Post` adding lastEditedAt: number.
// Then fix makePreview so it accepts EITHER — hint: a DraftPost IS a Post
// structurally, so typing the param as Post accepts both.
// ─────────────────────────────────────────────────────────────────────────────
interface Post {
  // IMPLEMENT
}
interface DraftPost extends Post {
  // IMPLEMENT
}

function makePreview(post: { title: string }): string {
  // CHANGE the param type to Post and use body too
  return post.title;
}

const published: Post = { title: "Why unions beat enums", body: "Because…" };
const draft: DraftPost = { title: "RAG notes", body: "Chunking is…", lastEditedAt: 1720000000 };

expect(makePreview(published)).toBe("Why unions beat enums: Because…");
expect(makePreview(draft)).toBe("RAG notes: Chunking is…");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — excess property checking
//
// Structural typing says "extra properties are fine" — EXCEPT for object
// literals assigned directly, which get checked exactly (it catches typos).
// The literal below has a typo'd property. Fix the typo (the field should
// be `darkMode`), and the error disappears.
// ─────────────────────────────────────────────────────────────────────────────
type Settings = { darkMode: boolean; fontSize: number };

const settings: Settings = {
  darkmode: true, // BUG: wrong casing — excess property error. Fix to darkMode.
  fontSize: 14,
};

expect(settings.darkMode).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — type can alias what interface can't
//
// Create three aliases that interfaces cannot express:
//   type Id       = string OR number (union)
//   type Formatter = a function type: (value: Id) => string
//   type Pair      = a tuple: [Id, Formatter]
// Replace the `never`s.
// ─────────────────────────────────────────────────────────────────────────────
type Id = never; // REPLACE
type Formatter = never; // REPLACE
type Pair = never; // REPLACE

const idA: Id = 42;
const idB: Id = "abc-123";
const fmt: Formatter = (value) => `id:${String(value)}`;
const pair: Pair = [idA, fmt];

expect(pair[1](pair[0])).toBe("id:42");
expect(fmt(idB)).toBe("id:abc-123");

pass("03-objects-interfaces-types");
