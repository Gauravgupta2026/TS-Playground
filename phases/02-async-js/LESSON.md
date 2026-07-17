# Phase 2 — Async JavaScript

Everything interesting you'll build later — API calls, agent loops, RAG
pipelines — is async code. Most "weird" async bugs stop being weird once you
have an accurate mental model of the event loop. That model is the first
thing this phase installs.

| File | Concept |
|---|---|
| `01-event-loop.ts` | sync vs microtask vs macrotask — predict execution order |
| `02-promises.ts` | creating promises, chaining, promisifying callbacks |
| `03-async-await.ts` | `async/await`, try/catch, sequential vs parallel |
| `04-promise-combinators.ts` | `Promise.all` / `allSettled` / `race`, timeouts |
| `05-fetch.ts` | real HTTP against a public API, response checking |
| `checkpoint-fetch-retry.ts` | build `fetchWithRetry` with backoff + timeout |

---

## 1. The event loop — the one-paragraph model

JavaScript runs **one thing at a time** on a single thread. Async work
(timers, network, file I/O) is handed to the runtime, and its *callbacks*
wait in queues until the current code finishes. There are two queues that
matter, with different priorities:

- **Microtask queue** — promise callbacks (`.then`, code after `await`).
  Drained **completely** after the current synchronous code finishes,
  before anything else.
- **Macrotask queue** — `setTimeout`, `setInterval`, I/O callbacks. One is
  taken per loop turn, *after* all microtasks are done.

So the invariable ordering is:

```
all synchronous code  →  ALL microtasks  →  one macrotask  →  microtasks again  →  …
```

Which is why this prints `1 4 3 2`:

```js
console.log(1);
setTimeout(() => console.log(2), 0);   // macrotask — even with 0ms delay
Promise.resolve().then(() => console.log(3)); // microtask
console.log(4);                        // sync finishes first
```

`setTimeout(fn, 0)` never means "now". It means "after all sync code and all
pending microtasks".

---

## 2. Promises

A promise is an object representing a value that will exist later. It's in
one of three states: **pending** → **fulfilled** (with a value) or
**rejected** (with a reason). Once settled, it never changes again.

```js
const p = new Promise<string>((resolve, reject) => {
  // do async work, then call exactly one of:
  resolve("done");        // → fulfilled
  reject(new Error("x")); // → rejected
});
```

You rarely write `new Promise` in application code — mostly you consume
promises from APIs (`fetch`) or wrap old callback-style APIs once
("promisification"). The classic wrap, worth knowing by heart:

```js
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
```

### Chaining

`.then()` returns a **new** promise of whatever its callback returns — that's
what makes chains flat instead of nested. If the callback returns a promise,
the chain waits for it. `.catch()` handles a rejection from **any** earlier
link.

---

## 3. `async` / `await`

`async/await` is syntax over promises — not a different mechanism:

- An `async` function **always returns a promise**. `return 5` inside one
  fulfills that promise with 5.
- `await p` pauses *this function* (not the thread!) until `p` settles,
  then gives you the fulfilled value — or **throws** the rejection reason.
  Rejections becoming ordinary `throw`s is the whole point: you handle async
  errors with plain `try/catch`.

### The sequential-await mistake

```js
// SLOW — b doesn't start until a finished (total: a + b)
const a = await fetchA();
const b = await fetchB();

// FAST — both start immediately, then wait for both (total: max(a, b))
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

`await` in a loop is the same trap multiplied. If the iterations don't
depend on each other, collect the promises and `Promise.all` them. You'll
embed vector-store chunks in Phase 7 exactly this way.

---

## 4. Combinators

| Combinator | Resolves when | Rejects when | Use for |
|---|---|---|---|
| `Promise.all(ps)` | all fulfill (array of values, order preserved) | ANY rejects (fail-fast) | "I need all of these" |
| `Promise.allSettled(ps)` | always — array of `{status, value|reason}` | never | "try all, report per-item" |
| `Promise.race(ps)` | first to **settle** wins (fulfil or reject) | first settles as rejection | timeouts |
| `Promise.any(ps)` | first to **fulfill** | all reject | fallback mirrors |

The timeout idiom — a race between real work and a timer that rejects:

```js
const result = await Promise.race([doWork(), rejectAfter(5000)]);
```

---

## 5. `fetch`

Built into Node 18+. Two things everyone gets wrong at first:

1. **`fetch` does not reject on HTTP errors.** A 404 or 500 fulfills
   normally — the promise only rejects on *network* failure. You must check
   `response.ok` (or `response.status`) yourself.
2. **Reading the body is a second await**: `await response.json()` — the
   headers arrive first; the body streams in after.

```js
const response = await fetch(url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json(); // typed `unknown` — cast for now; Phase 5 fixes this with Zod
```

### Retries and backoff (the checkpoint)

Real networks flake. Production code retries transient failures (5xx,
timeouts) with **exponential backoff** — wait 100ms, then 200, then 400 —
and gives up after N attempts. It does NOT retry things that will never
succeed (a 404 stays a 404). You'll build exactly this, and the same skeleton
reappears in Phase 6 wrapping model calls.

---

## Common mistakes this phase's exercises are built around

1. Believing `setTimeout(fn, 0)` runs before promise callbacks.
2. Forgetting that `await` in a loop serializes independent work.
3. Forgetting `response.ok` — treating a 500 as data.
4. `.then(fn)` without returning inside a chain — values vanish.
5. Retrying non-transient errors, or retrying without backoff.

Finish with `checkpoint-fetch-retry.ts`, tick off Phase 2, and you're done
with pure JavaScript — Phase 3 turns on the type system.
