# Phase 5 — Real-World TypeScript

**Quick review from Phase 4** (60 seconds): what does `K extends keyof T`
buy you? What are the two arms of `Result<T, E>`? How is `Partial<T>`
actually defined? Fuzzy → skim `04-generics-and-types/LESSON.md`.

---

Phases 1–4 taught the language. This phase teaches the *craft* around it —
the things that make TypeScript projects shippable: configuration, runtime
validation, environment handling, the Node standard library, and tests.

| File | Concept |
|---|---|
| `01-tsconfig-demystified.ts` | what your compiler flags actually do |
| `02-zod-boundaries.ts` | runtime validation with Zod, `z.infer` |
| `03-env-and-config.ts` | typed environment/config loading |
| `04-node-essentials.ts` | `fs/promises`, `path`, JSON files |
| `05-testing-with-vitest.test.ts` | writing real tests with vitest |
| `checkpoint-typed-cli.ts` | fetch → validate → transform → save, typed end-to-end |

---

## 1. tsconfig — the ten flags that matter

`tsconfig.json` has ~100 options. These decide 95% of your experience:

- **`strict: true`** — the umbrella. Turns on `strictNullChecks` (null/
  undefined tracked in types), `noImplicitAny` (unannotated params error),
  `strictFunctionTypes`, and more. Non-negotiable on new projects; this
  course has had it on since day one.
- **`target`** — which JS syntax to emit (this repo: `es2022`; Node 22
  understands it natively).
- **`module` / `moduleResolution`** — how imports are interpreted. Modern
  choices: `nodenext` (for libraries emitting real ESM) or
  `bundler`/`preserve` (when tsx/esbuild/vite runs your code — this repo).
- **`noEmit`** — type-check only; tsx runs the source directly, so we never
  emit JS at all.
- **`skipLibCheck`** — don't type-check node_modules' .d.ts files (faster,
  avoids upstream noise).
- **`noUncheckedIndexedAccess`** — `arr[i]` becomes `T | undefined`. Honest
  (an index CAN be out of bounds) but high-friction; teams split on it.
  This repo keeps it off; the exercise shows you what it would catch, and
  why `.at()`, `find`, destructuring-with-defaults handle the same risk.

Mental model: **strictness flags change what the compiler believes about
your code, not what your code does.** Turning one on reveals existing risk;
it never creates it.

## 2. Zod — the boundary principle

Rule (it's in your global standards too): **validate at system boundaries;
trust internal code.** Inside your program, TypeScript's compile-time
guarantees are enough. Data crossing IN — HTTP responses, file contents,
env vars, model output — is `unknown`, whatever the docs promise.

Phase 3 taught hand-written type guards. They work, but they're verbose and
they *drift* from the type they guard. Zod solves both: **the schema is the
single source of truth, and the static type is derived from it**:

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  email: z.string().email(),
  tier: z.enum(["free", "pro"]).default("free"),
});

type User = z.infer<typeof UserSchema>;   // the static type, derived — no drift

const result = UserSchema.safeParse(await response.json());
if (!result.success) {
  console.error(result.error.issues);     // precise, per-field failures
} else {
  result.data;                            // fully typed User — PROVEN at runtime
}
```

`parse()` throws on bad data; `safeParse()` returns a Result-like
discriminated union (`{success: true, data} | {success: false, error}`) —
recognize the Phase 4 pattern? Prefer `safeParse` at boundaries: bad input
is a normal case, not an exception. In Phase 6, Zod schemas do double duty
as **tool input schemas** for model calls — this section is direct
preparation.

## 3. Environment and config

`process.env` is typed `Record<string, string | undefined>` — every read
may be undefined, and everything is a string (`PORT` included). The clean
pattern: **validate the whole environment once at startup with a Zod
schema** (with `z.coerce.number()` for numerics, defaults for optionals),
export the parsed result, and never touch `process.env` again elsewhere.
Fail fast: a missing required var should kill the process at boot with a
clear message, not surface as `undefined` three modules later.

Secrets live in `.env` (gitignored — check this repo's `.gitignore`),
loaded by `dotenv`. `.env.example` documents the required names with no
values. Never commit real values.

## 4. Node essentials

The four imports you'll use constantly (note the `node:` prefix —
modern convention, makes builtin imports unambiguous):

```ts
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import process from "node:process"; // argv, env, exit, cwd
```

- Always the `fs/promises` API (await-able), not the callback or `*Sync` forms.
- Always build paths with `join()`, never string concatenation.
- The JSON file round-trip: `JSON.parse(await readFile(p, "utf-8"))` —
  and what comes out is `unknown`-shaped data crossing a boundary…
  so Zod it. File contents are external input.
- `process.argv` — CLI args start at index 2 (`argv[0]` is node, `argv[1]`
  the script).

## 5. Testing with vitest

You've been *passing* checks all course; now you *write* them. The shape:

```ts
import { describe, it, expect } from "vitest";

describe("chunker", () => {
  it("splits on sentence boundaries", () => {
    expect(chunk("A. B. C.", 2)).toHaveLength(2);
  });
  it("rejects empty input", () => {
    expect(() => chunk("", 2)).toThrow("empty");
  });
});
```

Run: `npm test <file>`. The assertion API is what our `helpers/assert.ts`
mimicked — `toBe`, `toEqual`, `toThrow` — plus `toHaveLength`,
`toContain`, `toBeCloseTo` (for floats: never `toBe` two floats).

What to test (PM hat on): the **contract**, not the implementation —
one happy path, the edge cases (empty, zero, boundary-exact), and the
failure modes. A test that would survive a full rewrite of the internals
is a good test.

## Common mistakes this phase's exercises are built around

1. Trusting `response.json()` / file contents / env vars without validation.
2. Hand-writing a type AND a validator for the same shape (drift) instead of `z.infer`.
3. Reading `process.env.X!` scattered through the codebase.
4. String-concatenating file paths.
5. Testing implementation details instead of the contract.

Checkpoint: a real little CLI — fetch users from a public API, validate
with Zod, transform, write a JSON report to disk, and it must survive
malformed data. Everything from this phase in ~60 lines.
