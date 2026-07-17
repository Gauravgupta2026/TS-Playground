/** SOLUTION — Phase 1 · checkpoint. Read it, close it, rewrite from memory. */
import { expect, pass } from "../../helpers/assert";

type TaskItem = {
  id: number;
  title: string;
  done: boolean;
  tags: string[];
};

// A closure holding the private counter.
function makeIdGenerator(): () => number {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
}

// Spread to append without mutating.
function addTask(tasks: TaskItem[], title: string, tags: string[], nextId: () => number): TaskItem[] {
  return [...tasks, { id: nextId(), title, done: false, tags }];
}

// map + copy-with-override for the matching task only.
function toggleTask(tasks: TaskItem[], id: number): TaskItem[] {
  return tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

function openTasksByTag(tasks: TaskItem[], tag: string): TaskItem[] {
  return tasks.filter((t) => !t.done && t.tags.includes(tag));
}

function summarize(tasks: TaskItem[]): string {
  const doneCount = tasks.filter((t) => t.done).length;
  return `${doneCount}/${tasks.length} done`;
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
expect(before[0]!.done).toBe(false);
expect(before === tasks).toBe(false);

tasks = toggleTask(tasks, 2);
tasks = toggleTask(tasks, 2);

expect(openTasksByTag(tasks, "ai").map((t) => t.title)).toEqual(["build RAG demo"]);
expect(openTasksByTag(tasks, "course")).toEqual([]);
expect(summarize(tasks)).toBe("1/3 done");
expect(summarize([])).toBe("0/0 done");

pass("checkpoint-task-list (solution)");
