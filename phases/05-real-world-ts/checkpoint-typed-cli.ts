/**
 * Phase 5 · CHECKPOINT — A typed CLI: fetch → validate → transform → save
 *
 * Both must pass (needs internet):
 *   npm run ts    phases/05-real-world-ts/checkpoint-typed-cli.ts
 *   npm run check phases/05-real-world-ts/checkpoint-typed-cli.ts
 *
 * Build a small data pipeline against https://jsonplaceholder.typicode.com/users
 * — everything from this phase composed: fetch (Phase 2), Zod boundary,
 * derived types, fs, and a Result (Phase 4) instead of thrown errors.
 *
 * SPEC:
 *  1. UserSchema — validate ONLY what we consume (ignore extra fields;
 *     that's Zod's default behavior — a real-world virtue: APIs add fields):
 *       id: positive int; name: non-empty string; email: string with "@";
 *       company: object with name: non-empty string
 *  2. fetchUsers(fetchLike) → Result<User[], string>
 *       - fetchLike(URL) as in Phase 2's checkpoint (injectable for testing)
 *       - !response.ok            → err(`HTTP ${status}`)
 *       - body not an array or any user invalid → err("invalid payload")
 *       - otherwise               → ok(users)
 *       (z.array(UserSchema).safeParse does the heavy lifting)
 *  3. buildReport(users) → { count, domains } where domains maps each email
 *     domain (after the "@", lowercased) to how many users have it, sorted
 *     keys.
 *  4. saveReport(dir, report) → writes report.json (pretty-printed, 2-space)
 *     and returns the full path.
 */
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// 1. IMPLEMENT the schema
const UserSchema = z.object({});
type User = z.infer<typeof UserSchema>;

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

// 2. IMPLEMENT
async function fetchUsers(fetchLike: FetchLike): Promise<Result<User[], string>> {
  return { ok: false, error: "IMPLEMENT me" };
}

// 3. IMPLEMENT
function buildReport(users: User[]): { count: number; domains: Record<string, number> } {
  return { count: 0, domains: {} };
}

// 4. IMPLEMENT
async function saveReport(dir: string, report: { count: number; domains: Record<string, number> }): Promise<string> {
  return ""; // IMPLEMENT: write report.json into dir, return the path
}

// ── The spec, against the real API ──────────────────────────────────────────
const live = await fetchUsers((url) => fetch(url));
expect(live.ok).toBe(true);
if (live.ok) {
  expect(live.value.length).toBe(10);
  const report = buildReport(live.value);
  expect(report.count).toBe(10);
  // jsonplaceholder's ten users span exactly these domains:
  expect(Object.keys(report.domains).length >= 9).toBe(true);

  const dir = await mkdtemp(join(tmpdir(), "ts-cli-"));
  const path = await saveReport(dir, report);
  const written = JSON.parse(await readFile(path, "utf-8")) as { count: number };
  expect(written.count).toBe(10);
}

// ── And against hostile fakes (no network, deterministic) ──────────────────
const failing: FetchLike = async () => ({ ok: false, status: 503, json: async () => ({}) });
const failed = await fetchUsers(failing);
expect(failed.ok).toBe(false);
if (!failed.ok) expect(failed.error).toBe("HTTP 503");

const garbage: FetchLike = async () => ({ ok: true, status: 200, json: async () => [{ id: "not-a-number" }] });
const invalid = await fetchUsers(garbage);
expect(invalid.ok).toBe(false);
if (!invalid.ok) expect(invalid.error).toBe("invalid payload");

const empty: FetchLike = async () => ({ ok: true, status: 200, json: async () => [] });
const none = await fetchUsers(empty);
expect(none.ok).toBe(true);
if (none.ok) expect(buildReport(none.value)).toEqual({ count: 0, domains: {} });

pass("checkpoint-typed-cli — Phase 5 complete! Next stop: AI engineering.");
