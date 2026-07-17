/**
 * Phase 2 · Exercise 05 — fetch (real network!)
 *
 * Run me with:  npm run ts phases/02-async-js/05-fetch.ts
 *
 * This file hits https://jsonplaceholder.typicode.com — a free fake-data API
 * built for exactly this kind of practice. You need internet.
 *
 * The two rules of fetch:
 *   1. It only rejects on NETWORK failure. HTTP 404/500 fulfill normally —
 *      you must check response.ok yourself.
 *   2. The body is a second await: await response.json().
 */
import { expect, pass } from "../../helpers/assert";

const API = "https://jsonplaceholder.typicode.com";

// Node types response.json() as `unknown` — "could be anything", which is
// honest: the network can send anything. For now we ASSERT the shape with
// `as Todo` (a promise to the compiler, unchecked at runtime). Phase 5
// replaces this leap of faith with Zod, which actually verifies it.
type Todo = { userId: number; id: number; title: string; completed: boolean };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — fetch one resource
//
// Implement getTodoTitle: GET `${API}/todos/${id}`, parse the JSON body, and
// return its `title` property. Parse with:
//   const todo = (await response.json()) as Todo;
// ─────────────────────────────────────────────────────────────────────────────
async function getTodoTitle(id: number): Promise<string> {
  return ""; // IMPLEMENT: fetch → (await response.json()) as Todo → .title
}

expect(await getTodoTitle(1)).toBe("delectus aut autem");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — check response.ok
//
// /todos/999999 returns HTTP 404 — and fetch happily fulfills. Implement
// getTodoTitleSafe: same as above, but throw Error(`HTTP ${status}`) when
// !response.ok, BEFORE trying to parse the body.
// ─────────────────────────────────────────────────────────────────────────────
async function getTodoTitleSafe(id: number): Promise<string> {
  return ""; // IMPLEMENT with the response.ok check
}

expect(await getTodoTitleSafe(2)).toBe("quis ut nam facilis et officia qui");

let saw404 = false;
try {
  await getTodoTitleSafe(999999);
} catch (err) {
  saw404 = err instanceof Error && err.message === "HTTP 404";
}
expect(saw404).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — POST with a JSON body
//
// Implement createPost: POST to `${API}/posts` with a JSON body.
// Three things a JSON POST needs:
//   method: "POST"
//   headers: { "Content-Type": "application/json" }
//   body: JSON.stringify({ title, userId })
// The API echoes your resource back with an assigned id (101). Cast the
// parsed body with `as { id: number; title: string }`.
// ─────────────────────────────────────────────────────────────────────────────
async function createPost(title: string, userId: number): Promise<{ id: number; title: string }> {
  return { id: 0, title: "" }; // IMPLEMENT
}

const created = await createPost("learning fetch", 7);
expect(created.id).toBe(101);
expect(created.title).toBe("learning fetch");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — concurrent fetches
//
// Fetch todos 1..5 CONCURRENTLY (Promise.all, not await-in-a-loop) and
// return how many are completed. Body has a boolean `completed` field.
// ─────────────────────────────────────────────────────────────────────────────
async function countCompleted(ids: number[]): Promise<number> {
  return -1; // IMPLEMENT: Promise.all over ids, then count completed === true
}

expect(await countCompleted([1, 2, 3, 4, 5])).toBe(1); // only #4 is completed

pass("05-fetch");
