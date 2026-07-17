# Phase 3 — TypeScript Fundamentals

**Quick review from Phase 2** (60 seconds — say the answers out loud):
sync vs microtask vs macrotask order? Why must you check `response.ok`?
When does `await` in a loop hurt you? If any answer is fuzzy, skim
`02-async-js/LESSON.md` before continuing.

---

From this phase on, the workflow gains a second command. Every file must pass
BOTH:

```bash
npm run ts    phases/03-ts-fundamentals/01-inference-and-annotations.ts  # runtime
npm run check phases/03-ts-fundamentals/01-inference-and-annotations.ts # types
```

Some exercises in this phase have **no runtime behavior at all** — the
compiler is the test. That's the point: TypeScript's value is catching bugs
*before* the code runs.

| File | Concept |
|---|---|
| `01-inference-and-annotations.ts` | inference, when to annotate, primitives |
| `02-functions.ts` | typing params/returns, optional params, function types |
| `03-objects-interfaces-types.ts` | object types, `interface` vs `type`, optional/readonly |
| `04-unions-and-literals.ts` | union types, literal types, why they beat enums |
| `05-narrowing.ts` | `typeof`/`in` guards, discriminated unions |
| `06-unknown-vs-any.ts` | why `any` is banned, `unknown` + narrowing |
| `checkpoint-type-the-module.ts` | type a messy untyped module until strict-clean |

---

## 1. What TypeScript actually is

TypeScript = JavaScript + a type layer that is **completely erased** at
runtime. `tsx` strips the types and runs the JS. Two consequences that
explain 80% of TS confusion:

1. **Types can't affect runtime behavior.** You can't `if (x instanceof MyInterface)` —
   interfaces don't exist at runtime. Checking real data needs real
   JavaScript (that's narrowing, file 05, and Zod in Phase 5).
2. **A type is a claim, not a check.** `as SomeType` doesn't convert
   anything — it's you overruling the compiler. If the claim is wrong, the
   error surfaces at runtime, far from the lie.

### Structural typing — the big mental shift

TypeScript compares types by **shape**, not by name. If it has `name: string`
and `age: number`, it IS a `Person`, whatever it was declared as. (Swift/Java
are the opposite — *nominal* — so unlearn that instinct.) A value with EXTRA
properties is still assignable: `{name, age, email}` satisfies `Person` —
with one exception you'll hit in the exercises: object literals assigned
directly are checked exactly ("excess property checking") to catch typos.

## 2. Inference — let the compiler work

```ts
let count = 0;            // inferred number — annotating this is noise
const mode = "dark";      // inferred as the LITERAL type "dark" (const can't change)
const items = [1, 2, 3];  // number[]
```

House style (and good industry style): **annotate function boundaries
(params + return), let inference handle locals.** Return annotations are a
contract: with one, a wrong implementation errors at the function; without
one, the wrong type silently flows and errors somewhere downstream.

## 3. Functions

```ts
function repeat(text: string, times: number = 2): string { … }  // default param
function label(id: number, prefix?: string): string { … }       // optional — type is string | undefined
type Predicate = (value: number) => boolean;                    // function TYPE (for callbacks)
```

Optional (`?`) means the type quietly becomes `T | undefined` — you must
handle the undefined case in the body. That's not annoying, that's the bug
being caught at compile time.

## 4. Object types: `interface` vs `type`

```ts
interface User { id: number; name: string; }
type User = { id: number; name: string; };   // 95% interchangeable
```

Real differences: `interface` can be reopened/merged and `extends` reads
nicer for OO-style hierarchies; `type` can alias ANYTHING — unions,
primitives, functions, tuples — which interfaces can't. House rule: `type`
by default (it covers everything), `interface` when you're designing an
object contract others will extend. Consistency matters more than the pick.

Modifiers: `?` optional, `readonly` compile-time immutability.

## 5. Unions and literal types — TypeScript's superpower

```ts
type Status = "queued" | "running" | "done" | "failed";
```

A union of string LITERALS. Only those four strings are assignable —
`"donee"` is a compile error. This kills the entire "magic string typo"
bug class, gives you autocomplete, and — with narrowing — exhaustiveness
checking. It's why idiomatic TS barely uses `enum`: literal unions do the
job with zero runtime footprint and no enum quirks.

`A | B` means "either". A value of type `A | B` only lets you use members
that exist on BOTH until you narrow it down.

## 6. Narrowing — convincing the compiler

The compiler tracks your runtime checks and narrows types inside branches:

```ts
function describe(x: string | number) {
  if (typeof x === "string") return x.toUpperCase(); // x: string here
  return x.toFixed(2);                               // x: number here
}
```

Guards: `typeof` (primitives), `Array.isArray`, `instanceof` (classes),
`in` (property existence), equality checks, and truthiness (careful: `if (n)`
also excludes 0 and "").

### Discriminated unions — the pattern you'll use forever

Give each variant a common literal field (`kind`), switch on it, and the
compiler narrows each case — this is exactly how the Anthropic SDK types
message content blocks (`type: "text" | "tool_use"`), which you'll consume
in Phase 6:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;  // s is the circle variant
    case "rect":   return s.width * s.height;       // s is the rect variant
  }
}
```

Add the `never` trick for exhaustiveness — `default: const _x: never = s` —
and adding a new variant makes every unhandled switch a compile error.
That's refactoring with a safety net.

## 7. `unknown` vs `any`

- `any` — "turn the type checker OFF for this value." It infects everything
  it touches, silently. One `any` in a chain and the compiler stops
  protecting all of it. **Banned in this course**, and behind most
  "TypeScript didn't catch it" stories.
- `unknown` — "I don't know what this is *yet*." You can hold it and pass it
  around, but you can't USE it until you narrow it with real checks. Same
  flexibility, none of the danger.

External data (JSON.parse, fetch bodies, model output) is where `unknown`
lives. Narrowing it by hand is verbose — which is exactly the pain Zod
removes in Phase 5. Feel the pain first; you'll appreciate the cure.

## Common mistakes this phase's exercises are built around

1. Annotating everything (noise) or nothing at function boundaries (no contract).
2. Reaching for `as` to silence an error instead of fixing the type.
3. String-typed state (`status: string`) instead of literal unions.
4. Using a union member before narrowing.
5. `any` leaking in from JSON and disabling the compiler downstream.

Checkpoint: `checkpoint-type-the-module.ts` hands you working-but-untyped
JavaScript. Your job is types only — no logic changes — until it's
strict-clean AND the deliberately wrong calls at the bottom error.
