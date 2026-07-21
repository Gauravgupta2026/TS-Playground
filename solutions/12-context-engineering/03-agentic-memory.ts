/** SOLUTION — Phase 12 · 03. */
import { expect, pass } from "../../helpers/assert";

type Note = { id: string; text: string; tags: string[]; seq: number };

class MemoryStore {
  private readonly notes = new Map<string, Note>();
  private seq = 0;

  remember(note: { id: string; text: string; tags: string[] }): void {
    this.notes.set(note.id, { ...note, seq: this.seq++ });
  }

  read(id: string): Note | undefined {
    return this.notes.get(id);
  }

  recall(tag: string): Note[] {
    return [...this.notes.values()]
      .filter((n) => n.tags.includes(tag))
      .sort((a, b) => b.seq - a.seq);
  }

  forget(id: string): void {
    this.notes.delete(id);
  }

  get size(): number {
    return this.notes.size;
  }

  pack(budgetTokens: number): string {
    const recent = [...this.notes.values()].sort((a, b) => b.seq - a.seq);
    let remaining = budgetTokens;
    let out = "";
    for (const note of recent) {
      const line = `${note.text}\n`;
      const cost = Math.ceil(line.length / 4);
      if (cost > remaining) break;
      out += line;
      remaining -= cost;
    }
    return out;
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const mem = new MemoryStore();
mem.remember({ id: "1", text: "User prefers strict TS", tags: ["pref"] });
mem.remember({ id: "2", text: "Deadline is Friday", tags: ["fact", "deadline"] });
mem.remember({ id: "3", text: "API base url is /v2", tags: ["fact"] });

expect(mem.size).toBe(3);
expect(mem.read("1")!.text).toBe("User prefers strict TS");
expect(mem.recall("fact").map((n) => n.id)).toEqual(["3", "2"]);

expect(mem.recall("pref").map((n) => n.id)).toEqual(["1"]);

mem.forget("2");
expect(mem.recall("deadline")).toEqual([]);
expect(mem.size).toBe(2);

const packed = mem.pack(5);
expect(packed.includes("/v2")).toBe(true);
expect(packed.includes("strict TS")).toBe(false);

const packedAll = mem.pack(100);
expect(packedAll).toBe("API base url is /v2\nUser prefers strict TS\n");

pass("03-agentic-memory (solution)");
