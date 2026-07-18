/** SOLUTION — Phase 9 · drill-types. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// 1.
function zip<A, B>(a: A[], b: B[]): [A, B][] {
  const length = Math.min(a.length, b.length);
  const out: [A, B][] = [];
  for (let i = 0; i < length; i++) out.push([a[i]!, b[i]!]);
  return out;
}

const zipped = zip([1, 2, 3], ["a", "b"]);
type _t1 = Expect<Equal<typeof zipped, [number, string][]>>;
expect(zipped).toEqual([
  [1, "a"],
  [2, "b"],
]);

// 2.
function rename<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  newKey: string
): Omit<T, K> & Record<string, T[K]> {
  const { [key]: value, ...rest } = obj;
  return { ...rest, [newKey]: value };
}

const renamed = rename({ id: 7, title: "spec" }, "id", "docId");
expect(renamed).toEqual({ docId: 7, title: "spec" });
// @ts-expect-error -- renaming a key that doesn't exist must not compile
rename({ id: 7 }, "missing", "x");

// 3.
type Shrink<T> = { readonly [K in keyof T]?: T[K] };

type _t3 = Expect<
  Equal<Shrink<{ a: string; b: number }>, { readonly a?: string; readonly b?: number }>
>;

// 4. Mapped over a tuple, unwrapping each slot.
type UnwrapAll<T> = { [K in keyof T]: T[K] extends Promise<infer V> ? V : T[K] };

type _t4a = Expect<Equal<UnwrapAll<[Promise<string>, Promise<number>]>, [string, number]>>;
type _t4b = Expect<Equal<UnwrapAll<Promise<boolean>[]>, boolean[]>>;

// 5.
type Figure =
  | { kind: "square"; side: number }
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };

function area(figure: Figure): number {
  switch (figure.kind) {
    case "square":
      return figure.side ** 2;
    case "circle":
      return Math.PI * figure.radius ** 2;
    case "rect":
      return figure.w * figure.h;
    default: {
      const unhandled: never = figure;
      throw new Error(`unhandled figure: ${JSON.stringify(unhandled)}`);
    }
  }
}

expect(area({ kind: "square", side: 3 })).toBe(9);
expect(Math.abs(area({ kind: "circle", radius: 1 }) - Math.PI) < 1e-9).toBe(true);
expect(area({ kind: "rect", w: 2, h: 5 })).toBe(10);

pass("drill-types (solution)");
