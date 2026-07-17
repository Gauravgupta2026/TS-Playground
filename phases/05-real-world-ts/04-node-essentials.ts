/**
 * Phase 5 · Exercise 04 — Node essentials: fs, path, JSON files
 *
 * Both must pass:
 *   npm run ts    phases/05-real-world-ts/04-node-essentials.ts
 *   npm run check phases/05-real-world-ts/04-node-essentials.ts
 *
 * Everything here happens in a throwaway temp directory — safe to run
 * repeatedly.
 */
import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

const workDir = await mkdtemp(join(tmpdir(), "ts-playground-"));

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — write and read a text file
//
// Implement both functions with node:fs/promises (await, no *Sync):
//   saveNote(dir, name, content) → writes `${name}.md` inside dir (use join!)
//   readNote(dir, name)          → reads it back as a string ("utf-8")
// ─────────────────────────────────────────────────────────────────────────────
async function saveNote(dir: string, name: string, content: string): Promise<void> {
  // IMPLEMENT
}

async function readNote(dir: string, name: string): Promise<string> {
  return ""; // IMPLEMENT
}

await saveNote(workDir, "rag-ideas", "# RAG\nchunk small, cite always");
expect(await readNote(workDir, "rag-ideas")).toBe("# RAG\nchunk small, cite always");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — list files by extension
//
// Implement listNotes: return the names (WITHOUT extension) of all .md
// files in dir, sorted. Tools: readdir(dir), extname(f), basename(f, ".md").
// ─────────────────────────────────────────────────────────────────────────────
async function listNotes(dir: string): Promise<string[]> {
  return []; // IMPLEMENT
}

await saveNote(workDir, "agents", "# Agents");
await writeFile(join(workDir, "not-a-note.txt"), "ignore me");
expect(await listNotes(workDir)).toEqual(["agents", "rag-ideas"]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the JSON round-trip, with the boundary guarded
//
// A file is EXTERNAL data — validate on the way in.
//   saveTasks: JSON.stringify(tasks, null, 2) → tasks.json in dir
//   loadTasks: read the file, JSON.parse, validate with TasksSchema
//              (safeParse) — return [] if the file is invalid/corrupted.
// ─────────────────────────────────────────────────────────────────────────────
const TasksSchema = z.array(z.object({ title: z.string(), done: z.boolean() }));
type Tasks = z.infer<typeof TasksSchema>;

async function saveTasks(dir: string, tasks: Tasks): Promise<void> {
  // IMPLEMENT
}

async function loadTasks(dir: string): Promise<Tasks> {
  return []; // IMPLEMENT (readFile → JSON.parse → safeParse)
}

await saveTasks(workDir, [{ title: "finish phase 5", done: false }]);
expect(await loadTasks(workDir)).toEqual([{ title: "finish phase 5", done: false }]);

// corruption survival: someone edited tasks.json by hand, badly
await writeFile(join(workDir, "tasks.json"), '[{"title": 42, "done": "maybe"}]');
expect(await loadTasks(workDir)).toEqual([]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — process.argv
//
// CLI args live in process.argv starting at INDEX 2. Implement parseArgs:
// given argv, return { command, flags } where command is argv[2] ?? "help",
// and flags is every later entry that starts with "--" (stripped of the --).
// ─────────────────────────────────────────────────────────────────────────────
function parseArgs(argv: string[]): { command: string; flags: string[] } {
  return { command: "", flags: [] }; // IMPLEMENT
}

expect(parseArgs(["node", "cli.ts", "ingest", "--verbose", "--dry-run"])).toEqual({
  command: "ingest",
  flags: ["verbose", "dry-run"],
});
expect(parseArgs(["node", "cli.ts"])).toEqual({ command: "help", flags: [] });

await rm(workDir, { recursive: true, force: true });
pass("04-node-essentials");
