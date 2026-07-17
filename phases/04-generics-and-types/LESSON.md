# Phase 4 — Generics & the Type System

**Quick review from Phase 3** (60 seconds): what's the difference between
`unknown` and `any`? Why do literal unions beat `enum`? What are the two
parts of a discriminated union? Fuzzy → skim `03-ts-fundamentals/LESSON.md`.

---

This is the phase where TypeScript stops being "JavaScript with labels" and
becomes a language you can *compute* in. Generics power every serious
library you'll use — the Anthropic SDK, Zod, vitest — and by the end of this
phase you'll read their signatures fluently instead of squinting at them.

| File | Concept |
|---|---|
| `01-generic-functions.ts` | type parameters, inference at call sites |
| `02-generic-constraints.ts` | `extends`, default type params, generic types |
| `03-keyof-typeof-indexed.ts` | `keyof`, `typeof`, indexed access types |
| `04-utility-types.ts` | `Partial`, `Pick`, `Omit`, `Record`, `ReturnType`… |
| `05-mapped-and-conditional.ts` | mapped types, conditional types, `infer` |
| `06-result-type.ts` | build `Result<T, E>` — typed error handling |
| `checkpoint-event-emitter.ts` | a fully type-safe event emitter |

---

## 1. Why generics exist

Without generics you have two bad options for a function that works on many
types: write it once per type (duplication), or take `unknown` and lose the
type (the caller gets `unknown` back). Generics are the third option:
**a type variable that links inputs to outputs**.

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);        // T inferred as number → returns number | undefined
first(["a", "b"]);       // T inferred as string → returns string | undefined
```

`<T>` declares a type parameter. The caller almost never writes it —
**inference fills it in from the arguments**. Think of generics as functions
FROM types TO types, evaluated at compile time.

Read `Array<T>`, `Promise<T>`, `Record<K, V>` the same way: types
parameterized by other types. You've been consuming generics since Phase 1
(`number[]` is `Array<number>`); now you produce them.

## 2. Constraints: `extends`

An unconstrained `T` could be anything, so you can't DO anything with it.
Constraints give the body something to stand on:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;   // .length is safe now
}
longest("hello", "hi");     // strings have length ✓
longest([1, 2], [3]);       // arrays too ✓
longest(10, 20);            // ✗ numbers don't — compile error
```

`extends` here means "must be assignable to" — a lower bound, not
inheritance.

The most important constraint pattern in all of TypeScript links an object
to its keys:

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] { … }
get(user, "name");   // typed as user's name type
get(user, "nmae");   // compile error — typo caught
```

That signature is worth memorizing — it's the basis of half the typed APIs
you'll write, and the checkpoint depends on it.

## 3. `keyof`, `typeof`, indexed access

Three small operators that compose into everything:

- `keyof T` — union of T's property names: `keyof User` → `"id" | "name"`.
- `typeof x` — the TYPE of a runtime value (in type position). Lets a value
  be the source of truth: `type Config = typeof defaultConfig`.
- `T[K]` — indexed access: the type OF a property: `User["id"]` → `number`.
  Works with unions: `User[keyof User]` → all value types.

The trio in action — a pattern you'll use in the capstone's config:

```ts
const MODELS = { fast: "claude-haiku-4-5", smart: "claude-sonnet-5" } as const;
type ModelTier = keyof typeof MODELS;        // "fast" | "smart"
type ModelId   = (typeof MODELS)[ModelTier]; // the two literal id strings
```

## 4. Utility types — the standard library of types

All of these are built FROM mapped/conditional types (next section) — they
ship with TS because everyone needs them:

| Utility | Meaning |
|---|---|
| `Partial<T>` | all properties optional (updates/patches) |
| `Required<T>` | all properties required |
| `Pick<T, K>` | keep only keys K |
| `Omit<T, K>` | remove keys K |
| `Record<K, V>` | object with keys K, values V |
| `Readonly<T>` | all properties readonly |
| `ReturnType<F>` / `Parameters<F>` | extract from function types |
| `Awaited<T>` | what a Promise resolves to |
| `NonNullable<T>` | strip null/undefined from a union |

Idiomatic TS *derives* types instead of duplicating them: an update-payload
type isn't written by hand next to `User` (where it will drift out of sync) —
it's `Partial<Omit<User, "id">>`, permanently in sync by construction.

## 5. Mapped and conditional types (intro level)

**Mapped types** loop over keys — this is `Partial<T>`'s actual definition:

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
```

**Conditional types** are if/else on types, and `infer` pattern-matches a
type apart — this is `ReturnType`'s actual definition:

```ts
type IsString<T> = T extends string ? true : false;
type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;
```

You don't need to be a wizard here — the goal is to READ these fluently
(library source, error messages) and write the simple ones. The deep end
(recursive conditional types, distributivity) is reference material, not a
gate.

## 6. `Result<T, E>` — errors as values

Exceptions are invisible in type signatures: `parseJson(s): Config` tells
you nothing about the throw. A `Result` union makes failure part of the
contract, and the compiler FORCES callers to handle both arms before
touching the value:

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

It's a discriminated union (Phase 3) parameterized by generics (this phase) —
the two ideas composing. Rust calls it `Result`, and typed AI pipelines use
it everywhere model calls can fail. You'll build it in `06-result-type.ts`
and reuse it in Phases 6–8 and the capstone.

## Common mistakes this phase's exercises are built around

1. Writing `unknown`/overloads where one generic would link input to output.
2. Forgetting the constraint, then wondering why `T.length` errors.
3. Hand-writing derived types (drift) instead of `Pick`/`Omit`/`Partial`.
4. `keyof typeof` confusion — which order, and why both are needed.
5. Throwing exceptions across API boundaries the types don't document.

Checkpoint: a typed event emitter where `emit("message", …)` only accepts
the payload type registered for `"message"` — the `K extends keyof T`
pattern doing real work. It's the exact shape of typed message passing
between agents in Phase 8.
