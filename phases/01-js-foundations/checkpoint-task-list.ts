/**
 * Phase 1 · CHECKPOINT — Build a task list
 *
 * Run me with:  npm run ts phases/01-js-foundations/checkpoint-task-list.ts
 *
 * No hand-holding here. You get a spec (the checks below) and empty
 * functions. Rules of the checkpoint:
 *   - Every function must be PURE where the checks demand it: return new
 *     arrays/objects, never mutate the input.
 *   - Use the tools from this phase: map/filter/reduce/find, spread,
 *     destructuring, closures. No loops needed anywhere (allowed, though).
 *   - Stuck > 15 min? solutions/ has the answer — read, close, rewrite.
 */
import { expect, pass } from "../../helpers/assert";

type TaskItem = {
  id: number;
  title: string;
  done: boolean;
  tags: string[];
};

// makeIdGenerator: returns a function producing 1, 2, 3, ... (a closure).
function makeIdGenerator(): () => number {
  return () => 0; // IMPLEMENT
}

// addTask: returns a NEW array with the new task appended (not mutated).
// The new task starts not-done. Use the provided id generator for its id.
function addTask(tasks: TaskItem[], title: string, tags: string[], nextId: () => number): TaskItem[] {
  return tasks; // IMPLEMENT
}

// toggleTask: returns a NEW array where the task with the given id has its
// `done` flipped. Untouched tasks may be the same object; the ARRAY must be new.
function toggleTask(tasks: TaskItem[], id: number): TaskItem[] {
  return tasks; // IMPLEMENT
}

// openTasksByTag: all not-done tasks carrying the given tag.
function openTasksByTag(tasks: TaskItem[], tag: string): TaskItem[] {
  return tasks; // IMPLEMENT
}

// summarize: "2/3 done" style string, using a reduce or filter for the count.
function summarize(tasks: TaskItem[]): string {
  return ""; // IMPLEMENT
}

// ── The spec ────────────────────────────────────────────────────────────────
const nextId = makeIdGenerator();

let tasks: TaskItem[] = [];
tasks = addTask(tasks, "read Phase 1 lesson", ["course"], nextId);
tasks = addTask(tasks, "build RAG demo", ["ai", "portfolio"], nextId);
tasks = addTask(tasks, "apply to APM roles", ["career"], nextId);

expect(tasks.length).toBe(3);
expect(tasks[0]).toEqual({ id: 1, title: "read Phase 1 lesson", done: false, tags: ["course"] });
expect(tasks[1]!.id).toBe(2);
expect(tasks[2]!.id).toBe(3);

const before = tasks;
tasks = toggleTask(tasks, 1);
expect(tasks[0]!.done).toBe(true);
expect(before[0]!.done).toBe(false); // input array's task untouched (no mutation)
expect(before === tasks).toBe(false); // new array identity

tasks = toggleTask(tasks, 2);
tasks = toggleTask(tasks, 2); // toggled twice → back to open

expect(openTasksByTag(tasks, "ai").map((t) => t.title)).toEqual(["build RAG demo"]);
expect(openTasksByTag(tasks, "course")).toEqual([]);
expect(summarize(tasks)).toBe("1/3 done");
expect(summarize([])).toBe("0/0 done");

pass("checkpoint-task-list — Phase 1 complete! Open phases/02-async-js/LESSON.md");
