/**
 * Phase 1 · Exercise 05 — Destructuring, spread, rest
 *
 * Run me with:  npm run ts phases/01-js-foundations/05-destructuring-spread.ts
 *
 * The copy-with-override pattern ({ ...obj, key: value }) is the backbone of
 * immutable updates in every modern JS codebase. This file also makes you
 * feel the "shallow copy" trap once, so you never fall for it in production.
 */
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — object destructuring with defaults and renaming
//
// Pull `name` and `role` out of the user object in ONE destructuring
// statement: rename `name` to `userName`, and give `role` a default of
// "student". Syntax: const { name: userName, role = "student" } = user;
// ─────────────────────────────────────────────────────────────────────────────
const user: { name: string; role?: string } = { name: "GG" };

// REPLACE these two lines with one destructuring statement
const userName = "";
const role = "";

expect(userName).toBe("GG");
expect(role).toBe("student");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — array destructuring with rest
//
// Split a ranked list into the winner and the rest, in one statement.
// ─────────────────────────────────────────────────────────────────────────────
const ranking = ["typescript", "python", "swift", "go"];

// REPLACE these two lines with: const [winner, ...runnersUp] = ranking;
const winner = "";
const runnersUp: string[] = [];

expect(winner).toBe("typescript");
expect(runnersUp).toEqual(["python", "swift", "go"]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — copy-with-override
//
// Implement withStatus: returns a NEW object identical to `task` but with its
// `status` replaced. One line: spread then override. Key order matters —
// later keys win, so the override must come AFTER the spread.
// ─────────────────────────────────────────────────────────────────────────────
type Task = { id: number; title: string; status: string };

function withStatus(task: Task, status: string): Task {
  return task; // IMPLEMENT: return { ...task, status }
}

const todo: Task = { id: 1, title: "learn TS", status: "open" };
const done = withStatus(todo, "done");
expect(done).toEqual({ id: 1, title: "learn TS", status: "done" });
expect(todo.status).toBe("open"); // original untouched

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — shallow means SHALLOW
//
// cloneProfile spreads the top level, but `prefs` is a nested object — the
// spread copies its REFERENCE, so mutating clone.prefs also mutates the
// original. Fix the clone so prefs is copied too:
//   { ...profile, prefs: { ...profile.prefs } }
// ─────────────────────────────────────────────────────────────────────────────
type Profile = { name: string; prefs: { theme: string; fontSize: number } };

function cloneProfile(profile: Profile): Profile {
  return { ...profile }; // BUG: prefs is still shared
}

const profileA: Profile = { name: "GG", prefs: { theme: "dark", fontSize: 14 } };
const profileB = cloneProfile(profileA);
profileB.prefs.theme = "light";

expect(profileB.prefs.theme).toBe("light");
expect(profileA.prefs.theme).toBe("dark"); // must NOT have changed

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5 — rest parameters
//
// Implement mean(...) so it accepts ANY number of numeric arguments:
// mean(1, 2, 3). Use a rest parameter (...values: number[]) and reduce.
// Return 0 for no arguments (guard against dividing by zero).
// ─────────────────────────────────────────────────────────────────────────────
function mean(): number {
  // CHANGE the signature to use a rest parameter, then implement
  return 0;
}

// @ts-ignore -- these calls are the spec; fix mean's signature to accept them
expect(mean(2, 4, 6)).toBe(4);
// @ts-ignore
expect(mean(10)).toBe(10);
expect(mean()).toBe(0);

pass("05-destructuring-spread");
