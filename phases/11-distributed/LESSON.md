# Phase 11 — Distributed Systems Primitives

**Quick review from Phase 10** (60 seconds): why does a token bucket refill
*lazily* instead of on a timer? What does a circuit breaker do while "open"?
Those primitives lived inside ONE process. This phase crosses the process
boundary — the moment your app runs as **more than one instance**, a new
class of problems appears, and a new set of primitives answers them.

---

The instant you scale from one server to many — or shard one big index across
several nodes — single-process assumptions break:

- A per-instance rate limiter no longer bounds your *total* API spend (ten
  instances × "50/min each" = 500/min against a 50/min key).
- "Which node owns this key?" becomes a real question, and the naive answer
  (`hash % N`) reshuffles *everything* the moment you add a node.
- Retries and network blips mean the *same request can arrive twice* — and if
  it isn't idempotent, you double-charge or double-generate.
- With no single authority, two nodes can both think they're in charge.

You'll build the standard answers by hand. They're the load-bearing ideas
behind Redis clusters, Cassandra, Kafka, and every "how does a vector DB
shard?" system-design conversation you'll have.

| File | Primitive | The distributed problem it solves |
|---|---|---|
| `01-consistent-hashing.ts` | hash ring + virtual nodes | route keys to nodes so adding one remaps ~1/N keys, not all |
| `02-sharding.ts` | shard routing, the `% N` trap | partition a corpus; see *why* modulo sharding doesn't scale |
| `03-leader-election.ts` | failure detection + election | pick ONE orchestrator among replicas so work isn't duplicated |
| `04-distributed-rate-limit.ts` | shared-store fixed window | one global budget across every instance, not per-instance |
| `05-idempotency.ts` | idempotency keys + dedup | make retried / duplicated requests safe (exactly-once *effect*) |
| `checkpoint-distributed-cache.ts` | **all of them** | a sharded embedding-cache cluster with a global compute budget |

Everything is simulated deterministically in one process (injected clock, an
in-memory "shared store" standing in for Redis). The *logic* is real; only the
network is faked — same trust boundary as your fake model client.

---

## 1. Consistent hashing — the elastic-scaling primitive

You have K keys (documents, embeddings, sessions) and N nodes. You need a
stable, agreed function `key → node`. The obvious one is `hash(key) % N`.

The obvious one is a trap. Change N (add or lose a node) and `% N` changes for
**almost every key** — a near-total reshuffle: cache-cold everywhere, data
moving between every pair of nodes at once. For a cache that's a stampede; for
a stateful store it's an outage.

**Consistent hashing** fixes this. Picture a ring of hash values 0…2³². Each
node is placed at `hash(node)` on the ring. A key is placed at `hash(key)`,
and belongs to the **first node clockwise**. Now add a node: it lands at one
spot and only steals the keys in the arc *behind* it — everything else stays
put. Adding the (N+1)th node remaps only ~1/(N+1) of keys.

One wrinkle: a few nodes on a ring cluster unevenly, so one node can own a huge
arc. The fix is **virtual nodes** — place each physical node at *many* points
(`node#0`, `node#1`, …). More points → smoother distribution and smoother
rebalancing. This is exactly what Cassandra, DynamoDB, and Ketama-style
memcached clients do.

## 2. Sharding, and the `% N` trap made concrete

Sharding = "which partition does this key live in?" File 02 builds the naive
modulo router and *measures* the damage: going from 4 shards to 5 remaps the
large majority of keys. Then you feel why file 01 exists. The rule to
internalize: **modulo sharding is fine only when N never changes.** The moment
you need elasticity, you want a ring (or range-based sharding with a routing
table, the other industry answer — used by Vitess, CockroachDB).

## 3. Leader election — one authority among equals

Some jobs must run *exactly once* across the cluster: the planner that assigns
work, the cron that reconciles state, the writer that compacts an index. If
every replica does it, you get duplicated work or corruption. **Leader
election** designates one node as the doer.

Two ingredients: **failure detection** (nodes heartbeat; a node silent past a
timeout is presumed dead) and an **election rule** (a deterministic tiebreak —
here, "highest live id wins", the bully algorithm's core). When the leader
dies (stops heartbeating), the next-highest live node takes over; when it
recovers, leadership can return. Real systems (etcd, ZooKeeper, Consul, Raft)
add quorum and consensus so a network partition can't produce *two* leaders —
but the shape is what you build here.

## 4. Distributed rate limiting — one budget, many nodes

A Phase 10 token bucket living in each instance can't bound *total* spend —
its counter is local. To enforce "50 requests/min across the whole fleet", the
counter must live in **shared state** every instance reads and writes: a
**fixed-window counter** keyed by `${client}:${windowStart}`, incremented
atomically. In production that atomic increment is Redis `INCR` (plus
`EXPIRE`); here it's an in-memory shared store.

The load-bearing word is **atomic**. `read; add 1; write` from two nodes at
once loses an increment (a lost update) and lets traffic slip past the limit.
Real distributed limiters lean on an atomic primitive (`INCR`, a Lua script,
a compare-and-swap) precisely so concurrent nodes can't interleave. Fixed
windows also have a **boundary burst** (2× the limit can pass across a window
edge); sliding-window-counter variants smooth it — the same tradeoff you saw
in Phase 10, now distributed.

## 5. Idempotency — make "at least once" safe

Networks retry. A client that times out and retries, a queue with
at-least-once delivery, your own Phase 10 retry loop — all can deliver the
**same request twice**. If the effect isn't idempotent, twice means
double-charged, double-sent, double-generated.

The standard fix: the caller attaches an **idempotency key** (a UUID for
*this* logical operation). The server records "key → result" the first time
and, on any repeat of that key, returns the stored result **without re-running
the effect**. Stripe's API works exactly this way. Two subtleties you'll
implement: **in-flight dedup** (two concurrent requests with the same key must
share ONE execution, not race), and **TTL** (keys expire so the store doesn't
grow forever). This turns unreliable "at least once" delivery into an
effective "exactly once" *effect* — the strongest guarantee you can actually
get.

---

## The industry map

| You built | The real thing |
|---|---|
| consistent hash ring + vnodes | Cassandra/DynamoDB partitioning, Ketama memcached, Envoy ring-hash LB |
| shard routing table | Vitess, Citus, CockroachDB range sharding, Elasticsearch shards |
| heartbeat + highest-id election | Raft/Paxos leaders, etcd, ZooKeeper, Consul, Kafka controller |
| shared-store fixed window | Redis `INCR`+`EXPIRE` rate limiters, Stripe/Cloudflare edge limits |
| idempotency keys + TTL | Stripe idempotency keys, Kafka exactly-once, SQS dedup IDs |

## Common mistakes this phase's exercises are built around

1. `hash(key) % N` for anything that must scale elastically (mass reshuffle on resize).
2. Too few virtual nodes → lumpy distribution, one hot node.
3. Treating "no heartbeat yet" the same as "confirmed dead" (or vice versa).
4. A per-instance counter masquerading as a global rate limit.
5. Non-atomic read-modify-write on the shared counter (lost updates leak traffic).
6. Idempotency that caches the *result* but still *runs the effect* on the retry.
7. Two concurrent same-key requests that each execute instead of sharing one.
