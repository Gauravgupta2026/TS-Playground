/** SOLUTION — Phase 3 · 04. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — four strings exist for this type; typos are compile errors.
type JobStatus = "queued" | "running" | "done" | "failed";
let jobStatus: JobStatus = "queued";
jobStatus = "running";
expect(jobStatus).toBe("running");

// EXERCISE 2 — narrow before using array-only members.
function formatInput(input: string | string[]): string {
  if (Array.isArray(input)) return input.join(", ");
  return input;
}
expect(formatInput("solo")).toBe("solo");
expect(formatInput(["a", "b", "c"])).toBe("a, b, c");

// EXERCISE 3 — as const freezes every property to its literal type.
type Mode = "exponential" | "linear";
const RETRY_CONFIG = {
  mode: "exponential",
  maxAttempts: 3,
} as const;

const chosenMode: Mode = RETRY_CONFIG.mode;
type _e3 = Expect<Equal<typeof RETRY_CONFIG.maxAttempts, 3>>;
expect(chosenMode).toBe("exponential");

// EXERCISE 4 — the union IS the contract; invalid directions can't compile.
type Position = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

function move(direction: Direction, from: Position): Position {
  switch (direction) {
    case "up":
      return { ...from, y: from.y - 1 };
    case "down":
      return { ...from, y: from.y + 1 };
    case "left":
      return { ...from, x: from.x - 1 };
    case "right":
      return { ...from, x: from.x + 1 };
  }
}

expect(move("up", { x: 0, y: 0 })).toEqual({ x: 0, y: -1 });
expect(move("down", { x: 0, y: 0 })).toEqual({ x: 0, y: 1 });
expect(move("left", { x: 5, y: 5 })).toEqual({ x: 4, y: 5 });
expect(move("right", { x: 5, y: 5 })).toEqual({ x: 6, y: 5 });

// @ts-expect-error -- "diagonal" must be rejected by the type system
move("diagonal", { x: 0, y: 0 });

pass("04-unions-and-literals (solution)");
