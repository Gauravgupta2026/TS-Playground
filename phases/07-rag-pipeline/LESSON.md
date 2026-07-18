# Phase 7 — RAG from Scratch

**Quick review from Phase 6** (60 seconds): what's the tool-use loop's exit
condition? Why does model JSON need Zod + retry? What does an eval report?
Fuzzy → skim `06-ts-for-ai/LESSON.md`.

---

RAG — Retrieval-Augmented Generation — is the most-deployed LLM architecture
in industry, and the most cargo-culted. You'll build every stage by hand, so
that "add a vector DB" is never a magic incantation again. **No API key
needed**: embeddings run locally (a ~25MB model downloads on first run and
is cached).

The pipeline you're building:

```
docs → CHUNK → EMBED → STORE          (ingest time)
query → EMBED → TOP-K → PROMPT+CITATIONS → model   (query time)
```

| File | Stage |
|---|---|
| `01-chunking.ts` | split documents without destroying meaning |
| `02-embeddings.ts` | text → vector, locally |
| `03-cosine-similarity.ts` | the similarity math, by hand |
| `04-vector-store.ts` | a typed in-memory vector store |
| `05-retrieval-and-citations.ts` | prompt assembly with citations |
| `06-retrieval-evals.ts` | recall@k and MRR — is retrieval any good? |
| `checkpoint-notes-qa.ts` | Q&A over the sample docs, end to end |

---

## 1. Why RAG exists

Models know nothing about your data (your notes, your company's docs,
anything after training). Two ways to fix that: stuff everything into the
prompt (doesn't scale, costs per call, drowns the signal) or **retrieve
just the relevant pieces per query** and prompt with those. RAG is option
two. It also gives you *citations* — the retrieved chunks are evidence you
can show — which is why it dominates in any domain where "the model said
so" isn't good enough (finance, legal, support).

## 2. Chunking — the underrated stage

You can't embed a whole book as one vector (embedding models have token
limits, and one vector for many topics is mush — its meaning averages
out). You also shouldn't embed per-word (no context). Chunking is that
tradeoff, and **bad chunking is the #1 cause of bad RAG** in practice:

- **Fixed-size** (N words/tokens): dumb, fast, baseline. Cuts sentences in
  half — a chunk ending mid-idea embeds poorly and reads worse as a citation.
- **Sentence-aware**: pack whole sentences up to the size limit. Nearly as
  simple, much better retrieval quality. This is your default.
- **Overlap**: repeat the tail of each chunk at the head of the next
  (10–20%), so ideas that straddle a boundary exist WHOLE in at least one
  chunk.
- Fancier (structure-aware by headings, semantic splitting) exists; know it,
  don't start there.

Chunk metadata matters as much as chunk text: keep `{ source, index }` on
every chunk — citations depend on it.

## 3. Embeddings

An embedding model maps text → vector (here: 384 dimensions) such that
**semantically similar text lands nearby**. "How do I get my money back?"
and "refund policy" share almost no words but sit close in embedding space —
that's the entire trick, and it's what makes RAG beat keyword search.

We run `Xenova/all-MiniLM-L6-v2` locally via `@huggingface/transformers`
(the ONNX build of a classic sentence-transformer). Two settings you'll use
and should understand:

- `pooling: "mean"` — the model emits one vector per TOKEN; mean-pooling
  averages them into one vector per TEXT.
- `normalize: true` — scales each vector to length 1. Then cosine
  similarity reduces to a plain dot product (see below).

Production alternatives (same interface, different quality/cost): hosted
embedding APIs — Voyage (Anthropic's recommended partner), OpenAI, Cohere.
The code you write here changes by ~5 lines to use any of them.

## 4. Cosine similarity

"How close are two vectors?" — measured by the angle between them:

```
cos(a, b) = (a · b) / (|a| · |b|)     ∈ [-1, 1], higher = more similar
```

For **normalized** vectors, |a| = |b| = 1, so cosine = dot product — one
multiply-add loop. That's why everyone normalizes at embed time. You'll
implement dot, magnitude, and cosine yourself; after this file the "vector
similarity" in every vector-DB ad is just… a for-loop you've written.

## 5. The vector store

A vector store is: rows of `{ id, text, vector, metadata }` + "give me the
k rows most similar to this query vector". Yours is an array + cosine + a
sort — **that's genuinely what a vector DB does**, plus engineering for
scale (ANN indexes like HNSW that trade exact answers for speed, filtering,
persistence, sharding). Rule of thumb: brute force is FINE up to ~100k
vectors. Your notes are thousands at most. Industry names, so you can place
them: **pgvector** (Postgres extension — the boring, correct default),
**Chroma / LanceDB** (embedded local), **Pinecone / Weaviate / Qdrant**
(managed/self-hosted services), and **LlamaIndex / LangChain** (frameworks
wrapping this whole pipeline).

## 6. Retrieval + citations

Query time: embed the query, top-k the store (k=3–5 to start), and build
the prompt:

```
Answer using ONLY the sources below. Cite as [1], [2] after each claim.
If the sources don't contain the answer, say so.

[1] (notes/rag.md) chunk text…
[2] (notes/evals.md) chunk text…

Question: …
```

The numbered list is the contract: the model cites `[n]`, and you can map
`[n]` back to `{ source, index }` — verifiable answers. The "say so"
escape hatch measurably reduces hallucination when retrieval comes back
empty-handed.

## 7. Retrieval evals

Before blaming the model, measure retrieval — a labeled set of
(query → which doc SHOULD come back) pairs and two metrics:

- **recall@k** — fraction of queries where a correct doc is in the top k.
  The "did we even find it" number.
- **MRR** (mean reciprocal rank) — 1/rank of the first correct hit,
  averaged. Rewards putting the right doc FIRST, where it has the most
  prompt influence.

Chunk size, overlap, k, embedding model — every knob you tune should move
these numbers on a fixed labeled set, or you're tuning blind.

## Common mistakes this phase's exercises are built around

1. Chunks that cut sentences mid-thought (fixed-size, no overlap).
2. Comparing unnormalized vectors with dot product and calling it cosine.
3. Returning top-k text without source metadata — uncitable answers.
4. Never measuring retrieval, then prompt-engineering around bad chunks.
5. Sorting similarities ascending (everyone does it once).
