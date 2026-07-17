/** SOLUTION — Phase 3 · 01. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — let widens to number; const string stays the LITERAL type.
let sessionCount = 42;
const appName = "ts-playground";
let scores = [98, 87, 91];

type _e1a = Expect<Equal<typeof sessionCount, number>>;
type _e1b = Expect<Equal<typeof appName, "ts-playground">>;
type _e1c = Expect<Equal<typeof scores, number[]>>;

// EXERCISE 2 — no annotation needed; inference gets number.
const port = 3000;
expect(typeof port).toBe("number");

// EXERCISE 3 — boundary fully annotated, locals inferred.
function formatPrice(paise: number, currencySymbol: string): string {
  const rupees = paise / 100;
  return `${currencySymbol}${rupees.toFixed(2)}`;
}
expect(formatPrice(129900, "₹")).toBe("₹1299.00");
type _e3 = Expect<Equal<ReturnType<typeof formatPrice>, string>>;

// EXERCISE 4 — the annotation pinned the error to the buggy path.
function parseScore(raw: string | number): number {
  if (typeof raw === "number") return raw;
  return Number(raw);
}
expect(parseScore(91)).toBe(91);
expect(parseScore("87")).toBe(87);

pass("01-inference-and-annotations (solution)");
