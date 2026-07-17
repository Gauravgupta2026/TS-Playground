/**
 * Type-level assertion helpers (the same trick used by the famous
 * "type-challenges" repo). These have NO runtime behavior — they exist so
 * that `npm run check <file>` fails until your TYPES are right, not just
 * your runtime values.
 *
 * Usage:
 *   import type { Expect, Equal } from "../../helpers/type-assert";
 *   type _t1 = Expect<Equal<MyType, { id: number }>>;
 *   // ^ compiles only when MyType is exactly { id: number }
 *
 * How Equal works (deep magic, revisited properly in Phase 4):
 * TypeScript treats two generic function signatures as assignable only when
 * their conditional-type checks are IDENTICAL types — not merely mutually
 * assignable. That strictness is what lets Equal distinguish `any`, `string`
 * vs `string | number`, optional vs required, etc.
 */

export type Expect<T extends true> = T;

export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
  ? true
  : false;

export type NotEqual<A, B> = Equal<A, B> extends true ? false : true;

/** True when T is exactly `any` (any is the only type where 0 extends 1&T). */
export type IsAny<T> = 0 extends 1 & T ? true : false;
