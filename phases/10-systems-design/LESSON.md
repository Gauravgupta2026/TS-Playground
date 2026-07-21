# Phase 10 — Systems Design Primitives (in TypeScript)

**Quick review from the capstone / Phase 8** (60 seconds): what does a token
budget protect you from? Why is a per-run turn cap a *guardrail* and not a
nicety? This phase is the same instinct — *bound the blast radius of
autonomy* — pulled down one level, into the reusable pieces every backend
(and every serious LLM app) is built from.

---

You've built agents that call models in loops. In production those loops run
into the physics of real systems: APIs return `429 Too Many Requests`, a
downstream service goes dark, the same expensive embedding gets computed a
thousand times, and one runaway job saturates everything. The primitives in
this phase are the standard answers — and every one of them is small enough
to build by hand, which is the point: after this, "rate limiter" and
"circuit breaker" stop being magic words in a design doc.

Each is framed by the LLM concern it solves, because that's your domain — but
they're the same primitives that guard databases, payment gateways, and web
servers everywhere.

| File | Primitive | The LLM problem it solves |
|---|---|---|
| `01-rate-limiter.ts` | token bucket + sliding window | stay under the model API's requests/min before it 429s you |
| `02-debounce-throttle.ts` | debounce, throttle | one embedding call after typing stops; cap stream-render frequency |
| `03-load-balancer.ts` | round-robin / weighted / least-conn | spread calls across API keys, regions, or replicas |
| `04-lru-ttl-cache.ts` | LRU + TTL cache | never re-embed / re-answer an identical prompt; bound memory |
| `05-retry-backoff.ts` | exponential backoff + jitter | survive transient `429`/`529 overloaded` without a thundering herd |
| `06-circuit-breaker.ts` | closed/open/half-open breaker | stop hammering a dead model endpoint; fail fast, recover on its own |
| `07-semaphore-pool.ts` | async semaphore, bounded pool | cap concurrent in-flight calls (rate, memory, cost) |
| `08-pubsub-bus.ts` | typed event bus | decouple agent stages; a tracing/observability backbone |
| `checkpoint-resilient-client.ts` | **all of them, composed** | a `ResilientModelClient` wrapping your Anthropic client |

Everything runs offline and deterministically. That's not luck — it's
**dependency injection of time**, explained next.

---

## 0. The one idea that makes all of this testable: inject time

A rate limiter that calls `Date.now()` and a debouncer that calls
`setTimeout` are *untestable* without either sleeping for real (slow, flaky)
or monkey-patching globals (fragile). So we don't reach for the globals. Each
primitive takes its clock as a parameter:

```ts
type Now = () => number;
new TokenBucket(10, 2, clock.now);   // <- the clock is injected
```

In tests you pass a `ManualClock` (see `helpers/fake-time.ts`) whose `now()`
only moves when you call `advance(ms)`. In production you pass `() =>
Date.now()`. Same code, deterministic tests. This is exactly the fake-client
trick from Phase 6, applied to time instead of the network — and it's how you
unit-test *anything* time-dependent in real life.

## 1. Rate limiting — token bucket vs sliding window

You call a model API that allows, say, 50 requests/minute. Exceed it and you
get `429`s (and, past a point, throttling that hurts everyone). A **rate
limiter** is the valve.

- **Token bucket** — a bucket holds up to `capacity` tokens and refills at
  `refillPerSec`. Each request removes one; empty bucket → rejected. It
  allows **bursts** up to `capacity` (great when traffic is spiky) while
  bounding the long-run average. This is the model most cloud APIs actually
  use. The trick is *lazy* refill: you don't run a background timer, you
  compute `elapsed × rate` tokens at the moment of each request.
- **Sliding window log** — keep the timestamps of recent requests; allow if
  fewer than `max` fall inside the trailing `window`. Precise (no
  boundary-burst artifact of a fixed window) but memory grows with traffic.

Token bucket for throughput smoothing; sliding window when you need exact
"no more than N per rolling T".

## 2. Debounce vs throttle — they are not the same

Both limit how often a function runs, in opposite ways:

- **Debounce** — wait until the calls *stop*. Every new call resets the
  timer; the function fires once, `wait` ms after the last call. Use for
  "the user stopped typing → now fire the autocomplete / embedding query".
  Firing on every keystroke is how you melt your API bill.
- **Throttle** — fire at most once per interval, ignoring the rest. Use for
  high-frequency streams you want to *sample*: re-rendering streamed tokens,
  progress bars, scroll handlers.

Debounce = "settle down first." Throttle = "at most this often." Mixing them
up is one of the most common front-end/back-end bugs there is.

## 3. Load balancing — pick a backend

One API key or endpoint has its own limit; spread load across several:

- **Round-robin** — cycle through backends in order. Fair when they're
  identical.
- **Weighted round-robin** — send proportionally more to bigger backends
  (weights). The naive way is to expand the list (`[a, a, b]`); production
  uses *smooth* weighted round-robin (nginx) to avoid clustering.
- **Least-connections** — send the next request to whoever has the fewest
  in-flight. Adapts to backends that are momentarily slow — the best default
  when request costs vary (and LLM request costs vary wildly by prompt).

## 4. Caching — LRU + TTL

Embeddings and completions are pure-ish functions of their input: identical
prompt → identical (or cacheable) output. A cache turns a repeated call into
a free lookup — often the single biggest cost win in an LLM app.

- **LRU (Least Recently Used)** eviction bounds memory: when full, drop the
  entry untouched for the longest. In JS a `Map` gives you this almost for
  free — it preserves insertion order, so `delete`+`set` on access moves a
  key to "most recent", and the first key is always the LRU victim.
- **TTL (time to live)** bounds staleness: entries expire after a duration,
  so cached answers don't outlive their usefulness. Check-on-read ("lazy
  expiry") keeps it simple.

## 5. Retry with exponential backoff + jitter

Transient failures (`429`, `529 overloaded`, a blip) should be retried — but
*not* immediately, and *not* in lockstep with every other client, or you get
a **thundering herd** that keeps the service down.

- **Exponential backoff** — wait `base × factor^attempt`: 100ms, 200ms,
  400ms… Back off fast so a struggling service can recover.
- **Jitter** — add randomness to the delay so a thousand clients that failed
  at the same instant don't all retry at the same instant. "Full jitter"
  (random between 0 and the backoff) is the AWS-blessed default.
- **Retry only what's retryable** — a `429` yes; a `400 bad request` never
  (it'll fail identically forever). Retrying non-transient errors is just a
  slower way to fail.

## 6. Circuit breaker

Retries help with *blips*. When a dependency is genuinely *down*, retrying
just piles on. A **circuit breaker** is a state machine that trips:

- **Closed** — calls pass through; count consecutive failures.
- **Open** — after `failureThreshold` failures, reject *immediately* for a
  `cooldown` without calling the dependency at all. This is the whole point:
  fail fast, give the dependency room to recover, protect your own threads.
- **Half-open** — after the cooldown, allow ONE trial call. Succeeds → back
  to closed. Fails → back to open for another cooldown.

Breaker (is it up at all?) and retry (ride out a blip) are complementary —
the checkpoint wraps a retry *inside* a breaker.

## 7. Concurrency control — semaphore & bounded pool

`await Promise.all(thousandPrompts.map(callModel))` fires a thousand
simultaneous requests: instant rate-limit wall, memory spike, maybe an OOM. A
**semaphore** caps concurrency: `N` permits, `acquire()` waits for a free
one, `release()` hands it to the next waiter. A **worker pool** is a
semaphore applied over a list — process all items, but never more than `N` at
once, results in order. (You built a first version of this in Phase 9's
`drill-async`; here it's a reusable primitive with an explicit semaphore
underneath.)

## 8. Typed pub/sub

A **typed event bus** decouples producers from consumers: an agent `emit`s
`token`, `tool_call`, `done`; loggers, UIs, and metrics `on(...)` them
without the agent knowing they exist. TypeScript makes each event's payload
type-safe via a mapped `Record<EventName, Payload>` — `emit("token", 42)`
won't compile if `token`'s payload is a string. This is the backbone of
observability/tracing in real agent frameworks.

---

## The industry map (name-drop fluently)

| You built | The real thing |
|---|---|
| token bucket / sliding window | nginx `limit_req`, Redis rate limiters, Stripe/Anthropic API limits, `p-ratelimit` |
| debounce / throttle | lodash `debounce`/`throttle`, RxJS `debounceTime`/`throttleTime` |
| load balancing | nginx/HAProxy/Envoy upstream policies, client-side LB in gRPC |
| LRU + TTL | Redis `maxmemory-policy allkeys-lru` + `EXPIRE`, `lru-cache`, CDN edge caches |
| backoff + jitter | AWS SDK retry policy, `p-retry`, Google SRE's "retry budget" |
| circuit breaker | Netflix Hystrix, resilience4j, Polly, Envoy outlier detection |
| semaphore / pool | `p-limit`, `p-queue`, Go's buffered-channel worker pool, DB connection pools |
| typed pub/sub | Node `EventEmitter` (untyped!), `mitt`, `nanoevents`, Kafka/NATS at scale |

You'll now recognize these as *conveniences over machinery you understand* —
which is exactly the position you want to argue system design from.

## Common mistakes this phase's exercises are built around

1. Refilling the token bucket with a background timer instead of lazily on read.
2. Confusing debounce (fire after quiet) with throttle (fire at most once per interval).
3. Retrying non-retryable errors (a `400` will fail the same way forever).
4. Backoff with no jitter → a synchronized thundering herd.
5. A circuit breaker that still *calls* the dependency while "open".
6. `Promise.all` over an unbounded list — no concurrency cap at all.
7. An LRU that forgets to bump recency on **read** (so hot keys get evicted).
8. Passing the live array/handler set where a copy or unsubscribe was needed.
