/**
 * Phase 1 · Exercise 04 — Arrays and the big methods
 *
 * Run me with:  npm run ts phases/01-js-foundations/04-arrays-and-methods.ts
 *
 * map / filter / reduce / find / some are the daily vocabulary of real
 * codebases. The goal here is not just passing checks — it's reaching for
 * the RIGHT method without thinking.
 */
import { expect, pass } from "../../helpers/assert";

type Expense = { label: string; amountInr: number; category: string };

const expenses: Expense[] = [
  { label: "rent", amountInr: 15000, category: "housing" },
  { label: "groceries", amountInr: 3200, category: "food" },
  { label: "swiggy", amountInr: 1800, category: "food" },
  { label: "claude pro", amountInr: 1700, category: "tools" },
  { label: "gym", amountInr: 1200, category: "health" },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — map: transform each element
// Produce an array of just the labels, uppercased. One map call.
// ─────────────────────────────────────────────────────────────────────────────
const labels: string[] = []; // REPLACE [] with expenses.map(...)

expect(labels).toEqual(["RENT", "GROCERIES", "SWIGGY", "CLAUDE PRO", "GYM"]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — filter: keep some elements
// Everything that cost more than ₹1500, food only excluded… no wait — read
// the checks. THEY are the spec. (Reading checks/tests as the source of
// truth is a real-world skill; specs in prose lie, tests don't.)
// ─────────────────────────────────────────────────────────────────────────────
const bigNonFood: Expense[] = []; // REPLACE with one filter call

expect(bigNonFood.map((e) => e.label)).toEqual(["rent", "claude pro"]);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — reduce: boil down to one value
// Total spend, in rupees. Start the accumulator at 0.
// ─────────────────────────────────────────────────────────────────────────────
const totalInr: number = 0; // REPLACE with expenses.reduce(...)

expect(totalInr).toBe(22900);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — reduce into an object: group totals by category
// This is the pattern behind every "group by" you'll ever need.
// Accumulator starts as {}; for each expense, add its amount to its
// category's running total (`(acc[e.category] ?? 0) + e.amountInr`).
// ─────────────────────────────────────────────────────────────────────────────
const byCategory: Record<string, number> = {}; // REPLACE with a reduce

expect(byCategory).toEqual({ housing: 15000, food: 5000, tools: 1700, health: 1200 });

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5 — find and some
// find returns the FIRST match (or undefined); some answers yes/no.
// ─────────────────────────────────────────────────────────────────────────────
const firstFood: Expense | undefined = undefined; // REPLACE with a find call
const anyOver10k: boolean = false; // REPLACE with a some call

expect(firstFood?.label).toBe("groceries");
expect(anyOver10k).toBe(true);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6 — the sort trap
// Numeric sort, cheapest first, WITHOUT mutating `expenses`.
// Two bugs to avoid: sort() mutates in place (spread a copy first), and
// sort() without a comparator sorts as STRINGS ([1200, 15000, 1700, ...]).
// ─────────────────────────────────────────────────────────────────────────────
const cheapestFirst: Expense[] = []; // REPLACE: copy, then sort with a comparator

expect(cheapestFirst.map((e) => e.amountInr)).toEqual([1200, 1700, 1800, 3200, 15000]);
expect(expenses[0]!.label).toBe("rent"); // original order untouched

pass("04-arrays-and-methods");
