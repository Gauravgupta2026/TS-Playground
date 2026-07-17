/** SOLUTION — Phase 3 · 02. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — `?` makes the param number | undefined inside the body.
function slugify(title: string, maxLength?: number): string {
  const slug = title.toLowerCase().replaceAll(" ", "-");
  if (maxLength !== undefined) return slug.slice(0, maxLength);
  return slug;
}
expect(slugify("Learn TypeScript Fast")).toBe("learn-typescript-fast");
expect(slugify("Learn TypeScript Fast", 10)).toBe("learn-type");

// EXERCISE 2 — a precise function type checks args AND return at call sites.
function retryUntil(shouldStop: (attempt: number) => boolean, maxAttempts: number): number {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (shouldStop(attempt)) return attempt;
  }
  return maxAttempts;
}
expect(retryUntil((attempt: number) => attempt === 3, 10)).toBe(3);
// @ts-expect-error -- a callback with the wrong parameter type must be rejected
retryUntil((name: string) => name === "done", 5);

// EXERCISE 3 — the return annotation localized the bug to the return statement.
async function fetchUser(id: number): Promise<{ id: number; name: string }> {
  return { id, name: `user-${id}` };
}
type _e3 = Expect<Equal<ReturnType<typeof fetchUser>, Promise<{ id: number; name: string }>>>;
expect((await fetchUser(7)).name).toBe("user-7");

// EXERCISE 4 — it returns values, so it isn't void.
function logEach(items: string[]): string[] {
  return items.map((item) => `[log] ${item}`);
}
expect(logEach(["a", "b"])).toEqual(["[log] a", "[log] b"]);

pass("02-functions (solution)");
