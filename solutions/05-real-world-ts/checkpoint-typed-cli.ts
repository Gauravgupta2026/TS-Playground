/** SOLUTION — Phase 5 · checkpoint. Needs internet for the live section. */
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// 1. Validate only what we consume; Zod strips unknown fields by default,
// so API additions never break us.
const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().includes("@"),
  company: z.object({ name: z.string().min(1) }),
});
type User = z.infer<typeof UserSchema>;

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

// 2. Every failure mode is a value, not an exception.
async function fetchUsers(fetchLike: FetchLike): Promise<Result<User[], string>> {
  const response = await fetchLike(USERS_URL);
  if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
  const parsed = z.array(UserSchema).safeParse(await response.json());
  if (!parsed.success) return { ok: false, error: "invalid payload" };
  return { ok: true, value: parsed.data };
}

// 3. The group-by reduce from Phase 1, typed.
function buildReport(users: User[]): { count: number; domains: Record<string, number> } {
  const domains = users.reduce<Record<string, number>>((acc, user) => {
    const domain = (user.email.split("@")[1] ?? "unknown").toLowerCase();
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {});
  const sorted = Object.fromEntries(Object.entries(domains).sort(([a], [b]) => a.localeCompare(b)));
  return { count: users.length, domains: sorted };
}

// 4.
async function saveReport(dir: string, report: { count: number; domains: Record<string, number> }): Promise<string> {
  const path = join(dir, "report.json");
  await writeFile(path, JSON.stringify(report, null, 2));
  return path;
}

// ── The spec, against the real API ──────────────────────────────────────────
const live = await fetchUsers((url) => fetch(url));
expect(live.ok).toBe(true);
if (live.ok) {
  expect(live.value.length).toBe(10);
  const report = buildReport(live.value);
  expect(report.count).toBe(10);
  expect(Object.keys(report.domains).length >= 9).toBe(true);

  const dir = await mkdtemp(join(tmpdir(), "ts-cli-sol-"));
  const path = await saveReport(dir, report);
  const written = JSON.parse(await readFile(path, "utf-8")) as { count: number };
  expect(written.count).toBe(10);
}

// ── Hostile fakes ───────────────────────────────────────────────────────────
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

pass("checkpoint-typed-cli (solution)");
