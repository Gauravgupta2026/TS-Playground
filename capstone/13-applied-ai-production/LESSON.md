# Phase 13 — Applied AI in Production

**Quick review from Phase 12** (60 seconds): why is context a *budget*? What
does a subagent return to the lead, and why not its full transcript? That phase
was about the agent's *inside*. This one is about the production *outside*: the
retrieval, evaluation, caching, observability, and safety layers that turn a
model call into a system you can ship, measure, and trust.

---

These are the techniques the field converged on in 2024–2026 — the difference
between "it works in a notebook" and "it survives real traffic". Every one is
built by hand here, offline and deterministic.

| File | Technique | The production problem it solves |
|---|---|---|
| `01-contextual-retrieval.ts` | contextual embeddings + contextual BM25 | chunks lose meaning out of context → retrieval misses |
| `02-hybrid-rrf.ts` | Reciprocal Rank Fusion | semantic and keyword search each miss different things |
| `03-reranking.ts` | cross-encoder-style reranking | the right doc is retrieved but ranked too low to use |
| `04-llm-as-judge.ts` | pairwise/rubric judges + bias mitigation | you can't improve what you can't measure — automatically |
| `05-semantic-cache.ts` | embed → nearest-neighbor → threshold | pay once for an answer, serve near-duplicates free |
| `06-observability.ts` | OpenTelemetry GenAI spans | you can't debug or cost a black box |
| `07-guardrails.ts` | input/output guardrail pipeline | untrusted input and unsafe output need a boundary |
| `checkpoint-production-rag.ts` | **all of them** | a guarded, cached, traced, reranked RAG endpoint |

Sources: [Anthropic Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
· [OpenAI eval best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
· [OTel GenAI observability](https://opentelemetry.io/blog/2026/genai-observability/).

---

## 1. Contextual Retrieval — the biggest RAG upgrade of the last two years

Your Phase 7 pipeline chops docs into chunks, then embeds each chunk *alone*.
The problem: a chunk like *"It grew 3% that quarter"* has lost its subject. The
embedding doesn't know it's about ACME's revenue, so a query for "ACME revenue
growth" sails right past it. And keyword search (BM25) can't match words the
chunk never contains.

**Anthropic's Contextual Retrieval** fixes both. Before indexing, prepend a
short (50–100 token) model-generated blurb situating each chunk in its
document: *"This is from ACME's Q3 report, describing revenue growth. It grew
3% that quarter."* Now:

- **Contextual embeddings** — the vector carries the ACME/revenue signal.
- **Contextual BM25** — the keyword index gains the exact vocabulary ("ACME",
  "revenue") the raw chunk lacked.

Anthropic measured a **49% drop** in top-20 retrieval failures from these two
alone, **67%** with reranking added. File 01 builds BM25 by hand and shows a
chunk go from unretrievable (score 0) to top-ranked once contextualized.

## 2. Hybrid search + Reciprocal Rank Fusion

Semantic (embedding) search understands *meaning* but fumbles exact tokens
(names, error codes, IDs). Keyword (BM25) search nails exact tokens but misses
paraphrases. You want both. **Hybrid search** runs both retrievers and merges
their rankings with **Reciprocal Rank Fusion (RRF)**:

```
score(doc) = Σ  1 / (k + rank_in_list)      # k ≈ 60, rank is 0-based
```

RRF needs no score calibration between the two systems — it only uses *rank
position*, so a doc that both retrievers rank highly wins, and a doc either one
ranks highly still surfaces. Dead simple, remarkably strong. File 02 builds it.

## 3. Reranking — precision at the top

Retrieval (embeddings/BM25) is *recall-oriented and cheap*: cast a wide net,
get 50 candidates, one of which is buried at rank 40. A **reranker** is
*precision-oriented and expensive*: it scores each (query, candidate) pair
directly — a cross-encoder reads them together instead of comparing pre-baked
vectors — and reorders. You rerank only the top-N candidates (cost), lifting
the truly relevant one into the top-k the model actually sees. File 03 shows
recall@3 jump from 0 to 1 after reranking.

## 4. LLM-as-judge — evals you can automate

You can't improve what you don't measure, and human grading doesn't scale.
**LLM-as-judge** uses a model to grade outputs. Three modes:

- **Pairwise** — "is A or B better?" Great signal, but suffers **position
  bias**: swapping A/B order can flip the verdict 10%+ of the time.
- **Direct/rubric** — grade one output against explicit criteria (binary
  per-criterion is more reliable than a vague 1–10 score).

The load-bearing practice is **bias mitigation**. For pairwise, run *both
orders* and only trust a verdict that survives the swap — a flip means the
judge is reacting to *position*, not *quality*, so you call it a tie. File 04
builds a debiased judge that catches exactly this. (Other biases to know:
verbosity — longer looks better; self-preference — a judge favors its own
model's style.)

## 5. Semantic caching

Exact-match caching only helps on *identical* prompts. **Semantic caching**
embeds the incoming prompt, finds the nearest cached prompt by cosine
similarity, and if it's above a threshold, returns the cached answer — no model
call. "What is a token bucket?" and "explain token buckets" hit the same cache
entry. Production stacks **layer** caches: exact/prefix first (free, instant),
then semantic (one embedding call), then the model. Instrument the hit rate per
layer. Tune the threshold carefully: too low and you serve wrong answers to
merely-similar questions. File 05 builds it with a pluggable embedder.

## 6. Observability — OpenTelemetry GenAI

A model call is a black box until you trace it. The industry standard is
**OpenTelemetry's GenAI semantic conventions**: wrap each call in a **span**
with `gen_ai.*` attributes — `gen_ai.request.model`, `gen_ai.usage.input_tokens`
/ `output_tokens`, `gen_ai.response.finish_reasons` — and nest tool-call and
agent spans into a trace **tree**. From that tree you get latency, a
token-based **cost** model (cost tracks tokens, not requests), and a replayable
record of what the agent actually did. File 06 builds a tracer and a traced
client. (Real stacks: Datadog, Honeycomb, Langfuse, OpenLLMetry.)

## 7. Guardrails

The boundary principle (Phase 5) at production scale. **Input guardrails**
sanitize untrusted user input before it reaches the model: redact PII, strip or
block prompt-injection patterns, cap length. **Output guardrails** validate
what comes back: enforce a schema, block unsafe content, catch PII leakage. A
guardrail pipeline runs in order and **trips** (short-circuits) on the first
block — a tripwire. File 07 builds redaction + a banned-term tripwire + length
limits as composable guards.

---

## The industry map

| You built | The real thing |
|---|---|
| contextual embeddings + BM25 | Anthropic Contextual Retrieval, Elastic hybrid, Weaviate |
| Reciprocal Rank Fusion | Elasticsearch RRF, Reciprocal Rank Fusion in Vespa/Qdrant |
| reranking | Cohere Rerank, cross-encoder rerankers, ColBERT late interaction |
| LLM-as-judge | OpenAI Evals graders, Anthropic eval cookbooks, Braintrust, LangSmith |
| semantic cache | GPTCache, vCache, Redis LangCache, portkey semantic cache |
| OTel GenAI tracing | Langfuse, OpenLLMetry, Datadog LLM Obs, Honeycomb, Arize Phoenix |
| guardrails | NeMo Guardrails, Guardrails AI, OpenAI moderation, Llama Guard |

## Common mistakes this phase's exercises are built around

1. Embedding chunks stripped of their document context (unretrievable chunks).
2. Semantic-only OR keyword-only retrieval — each blind to the other's hits.
3. Trusting retrieval order without a reranker (the answer is there, ranked 40th).
4. A pairwise judge with no order-swap → position bias masquerades as quality.
5. Exact-match caching only → paraphrases pay full price every time.
6. No tracing → you can't see cost, latency, or what the agent actually did.
7. No input guardrail → prompt injection and PII flow straight to the model.
