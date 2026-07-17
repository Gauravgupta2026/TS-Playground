/** SOLUTION — Phase 5 · 04. */
import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

const workDir = await mkdtemp(join(tmpdir(), "ts-playground-sol-"));

// EXERCISE 1 — join() for paths, utf-8 for reads.
async function saveNote(dir: string, name: string, content: string): Promise<void> {
  await writeFile(join(dir, `${name}.md`), content);
}

async function readNote(dir: string, name: string): Promise<string> {
  return readFile(join(dir, `${name}.md`), "utf-8");
}

await saveNote(workDir, "rag-ideas", "# RAG\nchunk small, cite always");
expect(await readNote(workDir, "rag-ideas")).toBe("# RAG\nchunk small, cite always");

// EXERCISE 2 — filter by extname, strip with basename's second arg.
async function listNotes(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  return files
    .filter((f) => extname(f) === ".md")
    .map((f) => basename(f, ".md"))
    .sort();
}

await saveNote(workDir, "agents", "# Agents");
await writeFile(join(workDir, "not-a-note.txt"), "ignore me");
expect(await listNotes(workDir)).toEqual(["agents", "rag-ideas"]);

// EXERCISE 3 — file contents are external input: validate on the way in.
const TasksSchema = z.array(z.object({ title: z.string(), done: z.boolean() }));
type Tasks = z.infer<typeof TasksSchema>;

async function saveTasks(dir: string, tasks: Tasks): Promise<void> {
  await writeFile(join(dir, "tasks.json"), JSON.stringify(tasks, null, 2));
}

async function loadTasks(dir: string): Promise<Tasks> {
  const raw = await readFile(join(dir, "tasks.json"), "utf-8");
  const result = TasksSchema.safeParse(JSON.parse(raw));
  return result.success ? result.data : [];
}

await saveTasks(workDir, [{ title: "finish phase 5", done: false }]);
expect(await loadTasks(workDir)).toEqual([{ title: "finish phase 5", done: false }]);
await writeFile(join(workDir, "tasks.json"), '[{"title": 42, "done": "maybe"}]');
expect(await loadTasks(workDir)).toEqual([]);

// EXERCISE 4 — argv[0]=node, argv[1]=script; real args start at 2.
function parseArgs(argv: string[]): { command: string; flags: string[] } {
  const command = argv[2] ?? "help";
  const flags = argv
    .slice(3)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => arg.slice(2));
  return { command, flags };
}

expect(parseArgs(["node", "cli.ts", "ingest", "--verbose", "--dry-run"])).toEqual({
  command: "ingest",
  flags: ["verbose", "dry-run"],
});
expect(parseArgs(["node", "cli.ts"])).toEqual({ command: "help", flags: [] });

await rm(workDir, { recursive: true, force: true });
pass("04-node-essentials (solution)");
