/** SOLUTION — Phase 1 · 05. Read it, close it, rewrite the fix from memory. */
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — rename with `:`, default with `=`.
const user: { name: string; role?: string } = { name: "GG" };
const { name: userName, role = "student" } = user;
expect(userName).toBe("GG");
expect(role).toBe("student");

// EXERCISE 2
const ranking = ["typescript", "python", "swift", "go"];
const [winner, ...runnersUp] = ranking;
expect(winner).toBe("typescript");
expect(runnersUp).toEqual(["python", "swift", "go"]);

// EXERCISE 3 — spread then override; later keys win.
type Task = { id: number; title: string; status: string };
function withStatus(task: Task, status: string): Task {
  return { ...task, status };
}
const todo: Task = { id: 1, title: "learn TS", status: "open" };
const done = withStatus(todo, "done");
expect(done).toEqual({ id: 1, title: "learn TS", status: "done" });
expect(todo.status).toBe("open");

// EXERCISE 4 — nested objects need their own spread; top-level spread only
// copies references one level deep.
type Profile = { name: string; prefs: { theme: string; fontSize: number } };
function cloneProfile(profile: Profile): Profile {
  return { ...profile, prefs: { ...profile.prefs } };
}
const profileA: Profile = { name: "GG", prefs: { theme: "dark", fontSize: 14 } };
const profileB = cloneProfile(profileA);
profileB.prefs.theme = "light";
expect(profileB.prefs.theme).toBe("light");
expect(profileA.prefs.theme).toBe("dark");

// EXERCISE 5 — rest parameter gathers all args into a real array.
function mean(...values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}
expect(mean(2, 4, 6)).toBe(4);
expect(mean(10)).toBe(10);
expect(mean()).toBe(0);

pass("05-destructuring-spread (solution)");
