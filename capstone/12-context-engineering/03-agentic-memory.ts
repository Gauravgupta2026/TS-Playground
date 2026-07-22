/**
 * Phase 12 · Exercise 03 — Agentic memory (structured note-taking)
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/12-context-engineering/03-agentic-memory.ts
 *   npm run check phases/12-context-engineering/03-agentic-memory.ts
 *
 * Compaction is lossy. For facts that must survive EXACTLY across context
 * resets, the agent writes notes to storage OUTSIDE the window and reloads them
 * later. The window is ephemeral; memory is durable. This is how an agent
 * remembers a decision from a session that has long since scrolled away.
 */
import { expect, pass } from "../../helpers/assert";

type Note = { id: string; text: string; tags: string[]; seq: number };

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — MemoryStore
//
//   remember({id, text, tags}): store the note, stamping a monotonically
//     increasing `seq` (0, 1, 2, …) so recency is recoverable. Same id → replace.
//   read(id): the note, or undefined.
//   recall(tag): all notes carrying `tag`, MOST RECENT FIRST (seq desc).
//   forget(id): remove it.
//   get size(): number of notes.
//   pack(budgetTokens): most-recent-first, join notes as `${text}\n`, including
//     as many as fit (a note costs ceil((text.length+1)/4) tokens); stop when the
//     next one wouldn't fit. Returns the packed string. This is what you'd splice
//     into a fresh context window after a reset.
// ─────────────────────────────────────────────────────────────────────────────
class MemoryStore {
  remember(note: { id: string; text: string; tags: string[] }): void {
    // IMPLEMENT
  }

  read(id: string): Note | undefined {
    return undefined; // IMPLEMENT
  }

  recall(tag: string): Note[] {
    return []; // IMPLEMENT
  }

  forget(id: string): void {
    // IMPLEMENT
  }

  get size(): number {
    return -1; // IMPLEMENT
  }

  pack(budgetTokens: number): string {
    return ""; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const mem = new MemoryStore();
mem.remember({ id: "1", text: "User prefers strict TS", tags: ["pref"] });
mem.remember({ id: "2", text: "Deadline is Friday", tags: ["fact", "deadline"] });
mem.remember({ id: "3", text: "API base url is /v2", tags: ["fact"] });

expect(mem.size).toBe(3);
expect(mem.read("1")!.text).toBe("User prefers strict TS");
expect(mem.recall("fact").map((n) => n.id)).toEqual(["3", "2"]); // most recent first

// simulate a context reset: the conversation window is gone, but the store is
// external — so recall STILL works. That's the whole point of agentic memory.
expect(mem.recall("pref").map((n) => n.id)).toEqual(["1"]);

mem.forget("2");
expect(mem.recall("deadline")).toEqual([]);
expect(mem.size).toBe(2);

// pack under a tight budget → only the most recent survivor fits.
// remaining notes (recent→old): "API base url is /v2" (5 tok), "User prefers strict TS" (6 tok).
const packed = mem.pack(5);
expect(packed.includes("/v2")).toBe(true);
expect(packed.includes("strict TS")).toBe(false);

// a generous budget packs both, recent first.
const packedAll = mem.pack(100);
expect(packedAll).toBe("API base url is /v2\nUser prefers strict TS\n");

pass("03-agentic-memory");
