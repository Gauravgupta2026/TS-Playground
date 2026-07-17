/** SOLUTION — Phase 2 · 05. Needs internet (jsonplaceholder.typicode.com). */
import { expect, pass } from "../../helpers/assert";

const API = "https://jsonplaceholder.typicode.com";

// json() returns `unknown`; we assert the shape with `as`. Unchecked at
// runtime — Phase 5's Zod replaces this leap of faith with real validation.
type Todo = { userId: number; id: number; title: string; completed: boolean };

// EXERCISE 1 — two awaits: one for headers, one for the body.
async function getTodoTitle(id: number): Promise<string> {
  const response = await fetch(`${API}/todos/${id}`);
  const todo = (await response.json()) as Todo;
  return todo.title;
}
expect(await getTodoTitle(1)).toBe("delectus aut autem");

// EXERCISE 2 — fetch fulfills on 404; response.ok is OUR job to check.
async function getTodoTitleSafe(id: number): Promise<string> {
  const response = await fetch(`${API}/todos/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const todo = (await response.json()) as Todo;
  return todo.title;
}
expect(await getTodoTitleSafe(2)).toBe("quis ut nam facilis et officia qui");
let saw404 = false;
try {
  await getTodoTitleSafe(999999);
} catch (err) {
  saw404 = err instanceof Error && err.message === "HTTP 404";
}
expect(saw404).toBe(true);

// EXERCISE 3 — method + content-type header + stringified body.
async function createPost(title: string, userId: number): Promise<{ id: number; title: string }> {
  const response = await fetch(`${API}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, userId }),
  });
  return (await response.json()) as { id: number; title: string };
}
const created = await createPost("learning fetch", 7);
expect(created.id).toBe(101);
expect(created.title).toBe("learning fetch");

// EXERCISE 4 — all five requests in flight at once.
async function countCompleted(ids: number[]): Promise<number> {
  const todos = await Promise.all(
    ids.map(async (id) => {
      const response = await fetch(`${API}/todos/${id}`);
      return (await response.json()) as Todo;
    })
  );
  return todos.filter((t) => t.completed === true).length;
}
expect(await countCompleted([1, 2, 3, 4, 5])).toBe(1);

pass("05-fetch (solution)");
