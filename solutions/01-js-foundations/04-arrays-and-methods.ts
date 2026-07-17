/** SOLUTION — Phase 1 · 04. Read it, close it, rewrite the fix from memory. */
import { expect, pass } from "../../helpers/assert";

type Expense = { label: string; amountInr: number; category: string };

const expenses: Expense[] = [
  { label: "rent", amountInr: 15000, category: "housing" },
  { label: "groceries", amountInr: 3200, category: "food" },
  { label: "swiggy", amountInr: 1800, category: "food" },
  { label: "claude pro", amountInr: 1700, category: "tools" },
  { label: "gym", amountInr: 1200, category: "health" },
];

// EXERCISE 1
const labels: string[] = expenses.map((e) => e.label.toUpperCase());
expect(labels).toEqual(["RENT", "GROCERIES", "SWIGGY", "CLAUDE PRO", "GYM"]);

// EXERCISE 2 — the checks were the spec: >1500 AND not food.
const bigNonFood: Expense[] = expenses.filter((e) => e.amountInr > 1500 && e.category !== "food");
expect(bigNonFood.map((e) => e.label)).toEqual(["rent", "claude pro"]);

// EXERCISE 3
const totalInr: number = expenses.reduce((acc, e) => acc + e.amountInr, 0);
expect(totalInr).toBe(22900);

// EXERCISE 4 — the group-by reduce. `?? 0` handles the first hit per category.
const byCategory: Record<string, number> = expenses.reduce<Record<string, number>>((acc, e) => {
  acc[e.category] = (acc[e.category] ?? 0) + e.amountInr;
  return acc;
}, {});
expect(byCategory).toEqual({ housing: 15000, food: 5000, tools: 1700, health: 1200 });

// EXERCISE 5
const firstFood: Expense | undefined = expenses.find((e) => e.category === "food");
const anyOver10k: boolean = expenses.some((e) => e.amountInr > 10000);
expect(firstFood?.label).toBe("groceries");
expect(anyOver10k).toBe(true);

// EXERCISE 6 — spread first (sort mutates), numeric comparator (sort strings by default).
const cheapestFirst: Expense[] = [...expenses].sort((a, b) => a.amountInr - b.amountInr);
expect(cheapestFirst.map((e) => e.amountInr)).toEqual([1200, 1700, 1800, 3200, 15000]);
expect(expenses[0]!.label).toBe("rent");

pass("04-arrays-and-methods (solution)");
