/**
 * Phase 9 · DRILL — Types
 *
 * Gate: npm run ts + npm run check, both green. No guidance below this line.
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// 1. Implement `zip<A, B>`: pairs elements up to the SHORTER length.
function zip(a: unknown[], b: unknown[]): unknown[] {
  return [];
}

const zipped = zip([1, 2, 3], ["a", "b"]);
type _t1 = Expect<Equal<typeof zipped, [number, string][]>>;
expect(zipped).toEqual([
  [1, "a"],
  [2, "b"],
]);

// 2. Implement `rename<T, K extends keyof T>`: returns a copy of obj with
// key K's VALUE moved to newKey (a plain string), K removed. Return type:
// Omit<T, K> & Record<string, T[K]>.
function rename(obj: object, key: string, newKey: string): object {
  return obj;
}

const renamed = rename({ id: 7, title: "spec" }, "id", "docId");
expect(renamed).toEqual({ docId: 7, title: "spec" });
// @ts-expect-error -- renaming a key that doesn't exist must not compile
rename({ id: 7 }, "missing", "x");

// 3. Define `Shrink<T>`: a mapped type making every property optional AND
// readonly.
type Shrink<T> = never;

type _t3 = Expect<
  Equal<Shrink<{ a: string; b: number }>, { readonly a?: string; readonly b?: number }>
>;

// 4. Define `UnwrapAll<T>`: given a tuple/array of Promises, the array of
// their resolved types. (Conditional + infer + mapped over tuple.)
type UnwrapAll<T> = never;

type _t4a = Expect<Equal<UnwrapAll<[Promise<string>, Promise<number>]>, [string, number]>>;
type _t4b = Expect<Equal<UnwrapAll<Promise<boolean>[]>, boolean[]>>;

// 5. Discriminated union + exhaustiveness. Implement `area`; the `never`
// default must survive adding new variants (that IS the spec).
type Figure =
  | { kind: "square"; side: number }
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };

function area(figure: Figure): number {
  return 0;
}

expect(area({ kind: "square", side: 3 })).toBe(9);
expect(Math.abs(area({ kind: "circle", radius: 1 }) - Math.PI) < 1e-9).toBe(true);
expect(area({ kind: "rect", w: 2, h: 5 })).toBe(10);

pass("drill-types — 1/4 gates down.");
