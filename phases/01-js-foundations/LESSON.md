# Phase 1 — JavaScript Foundations

TypeScript is JavaScript with a type layer on top. Every confusing TypeScript
moment you'll ever have is really one of two things: a JavaScript behavior you
didn't know, or a type-system rule you didn't know. This phase eliminates the
first category.

Work the files in order. Each one is runnable:

```bash
npm run ts phases/01-js-foundations/01-values-and-variables.ts
```

| File | Concept |
|---|---|
| `01-values-and-variables.ts` | `let`/`const`, primitives, truthiness, `==` vs `===` |
| `02-functions-and-closures.ts` | function forms, default params, closures |
| `03-objects-and-this.ts` | object literals, methods, `this`, references vs copies |
| `04-arrays-and-methods.ts` | `map`, `filter`, `reduce`, `find`, `some`, `sort` |
| `05-destructuring-spread.ts` | destructuring, spread/rest, shallow copies |
| `checkpoint-task-list.ts` | build a task list from scratch — no hand-holding |

---

## 1. Values and variables

`const` means the **binding** can't be reassigned — not that the value is
frozen. A `const` object can still be mutated:

```js
const user = { name: "GG" };
user.name = "Gaurav";   // fine — we mutated the object
user = { name: "X" };   // TypeError — we reassigned the binding
```

**Rule for this course: `const` by default.** Reach for `let` only when you
genuinely reassign (counters, accumulators). Never `var` — `var` is
function-scoped and hoisted, which produces the classic loop bug you'll meet
in exercise form.

### The seven primitives

`string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol`.
Everything else — objects, arrays, functions — is an **object**.

Two of these deserve special attention because TypeScript's `strictNullChecks`
is built entirely around them:

- `undefined` — "nothing was ever put here." Missing object properties,
  functions with no `return`, uninitialized `let`.
- `null` — "someone deliberately put nothing here." You assign it on purpose.

### Truthiness

In a boolean position (`if`, `&&`, `||`, `!`), every value coerces to
true/false. The **falsy** list is short — memorize it:

`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`

Everything else is truthy — including `"0"`, `"false"`, `[]`, and `{}`.
That last pair surprises everyone once.

### `==` vs `===`

`==` performs type coercion before comparing (`"5" == 5` is true). The
coercion rules are arcane and nobody holds them all in memory. `===` compares
without coercion. **Always `===`.** The one idiomatic exception:
`x == null` is true for both `null` and `undefined`, and some codebases use
it as a deliberate "is it nullish?" check.

### `??` vs `||`

`a || b` falls through on ANY falsy value — so `0 || 10` gives `10`, which is
a bug if `0` was a legitimate value. `a ?? b` falls through only on
`null`/`undefined`. When you mean "use a default if missing", you almost
always mean `??`.

---

## 2. Functions and closures

Three ways to write a function:

```js
function add(a, b) { return a + b; }        // declaration — hoisted
const add = function (a, b) { ... };        // expression
const add = (a, b) => a + b;                // arrow — concise, lexical `this`
```

Arrow functions with a single expression return it implicitly. The moment you
add `{ }`, you need an explicit `return` — forgetting this returns
`undefined` and is one of the most common silent bugs in JS. You'll fix
exactly that bug in the exercises.

### Closures — the concept that powers everything

A closure is a function that **remembers the variables of the scope where it
was created**, even after that scope has finished running.

```js
function makeCounter() {
  let count = 0;                 // lives on after makeCounter returns…
  return () => { count += 1; return count; };  // …because this arrow closed over it
}
const next = makeCounter();
next(); // 1
next(); // 2
```

This isn't a party trick — it's the mechanism behind private state, React
hooks, middleware, memoization, and the rate-limiters and agent loops you'll
build in Phases 6–8. If you internalize one thing in this phase, make it
closures.

---

## 3. Objects and `this`

Objects are bags of key→value pairs. Keys are strings (or symbols) — even
`{ 1: "a" }` stores the key as `"1"`.

### References, not copies

Assigning an object copies the **reference**, not the object:

```js
const a = { x: 1 };
const b = a;
b.x = 99;
a.x; // 99 — same object, two names
```

This is the root cause of an entire genus of bugs ("I changed one thing and
something else changed too"). Arrays are objects; same rule.

### `this`

In a method called as `obj.method()`, `this` is `obj`. But `this` is decided
**at call time, by how the function is called** — not where it was written.
Detach the method and `this` is lost:

```js
const dog = { name: "Rex", speak() { return `${this.name} says woof`; } };
dog.speak();            // "Rex says woof"
const f = dog.speak;
f();                    // TypeError — `this` is undefined
```

Arrow functions don't have their own `this` — they inherit it from the
surrounding scope (that's "lexical `this`"). This makes arrows perfect for
callbacks and wrong for object methods that need `this`.

---

## 4. Arrays and the big five methods

These five run 90% of data manipulation in real codebases. Each takes a
function and **returns a new array or value — the original is untouched**
(except `sort`, see below):

| Method | Question it answers | Returns |
|---|---|---|
| `map(fn)` | "transform each element" | new array, same length |
| `filter(fn)` | "keep only some elements" | new array, ≤ length |
| `find(fn)` | "first element matching?" | element or `undefined` |
| `some(fn)` / `every(fn)` | "does any / do all match?" | boolean |
| `reduce(fn, init)` | "boil the array down to one value" | anything |

`reduce` deserves its own note because it's the one people fear:

```js
[1, 2, 3].reduce((acc, item) => acc + item, 0); // 6
```

`acc` starts as `init` (`0` here), and each iteration's return value becomes
the next iteration's `acc`. Sums, groupings, lookups-by-id — all reduce.
When you build the RAG vector store in Phase 7, top-k selection is a reduce.

**Trap:** `sort()` mutates in place AND compares as strings by default —
`[10, 9, 1].sort()` gives `[1, 10, 9]`. Always pass a comparator:
`arr.sort((a, b) => a - b)`, and spread first (`[...arr].sort(...)`) if you
need the original intact.

---

## 5. Destructuring, spread, rest

```js
const { name, age = 0 } = user;        // pull properties into variables (+ default)
const [first, ...others] = list;       // arrays too; rest collects the tail
const copy = { ...user, age: 24 };     // spread: shallow copy with overrides
function log(...args) {}               // rest params: variadic functions
```

The `{ ...obj, key: newValue }` pattern — copy-with-override — is the
backbone of immutable updates everywhere (React state, reducers, config
merging). Order matters: later keys win.

**Shallow means shallow.** `{ ...user }` copies top-level keys, but nested
objects are still shared references. The exercise makes you feel this bug.

---

## Common mistakes this phase's exercises are built around

1. Arrow function with `{ }` and no `return` → returns `undefined`.
2. Using `||` for defaults when `0` or `""` are valid values → use `??`.
3. Mutating a shared object/array reference thinking you had a copy.
4. `sort()` without a comparator on numbers.
5. Expecting `==` to behave.

When your checks fail, that's the course working. Read the error, find the
line, reason about *why*, then fix.

**Done with all five files?** Do `checkpoint-task-list.ts` — it hands you a
spec and empty functions, nothing else. Then tick off Phase 1 in
`PROGRESS.md` and start Phase 2.
