/**
 * Phase 13 · Exercise 05 — Semantic caching
 *
 * Both must pass (no API key needed):
 *   npm run ts    phases/13-applied-ai-production/05-semantic-cache.ts
 *   npm run check phases/13-applied-ai-production/05-semantic-cache.ts
 *
 * Exact-match caching only helps on IDENTICAL prompts. A semantic cache embeds
 * the incoming prompt, finds the nearest cached prompt by cosine similarity,
 * and — if it's above a threshold — serves the cached answer with no model
 * call. "What is a token bucket?" and "explain token buckets" hit the same
 * entry. Layer exact-match first (free), then semantic (one embedding).
 *
 * The embedder is INJECTED — real code plugs in Phase 7's embeddings; the test
 * injects fixed vectors so the cosine math is deterministic.
 */
import { expect, pass } from "../../helpers/assert";

type Embedder = (text: string) => Promise<number[]>;
type CacheHit = { hit: true; value: string; kind: "exact" | "semantic" };
type CacheMiss = { hit: false };

/** GIVEN — cosine similarity. */
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE — SemanticCache
//
//   constructor(embed, threshold)
//   async set(prompt, value): store the value under the EXACT prompt AND store
//     its embedding (for semantic matching later).
//   async get(prompt):
//     1. EXACT: prompt is stored verbatim → stats.exactHits++, return
//        { hit:true, value, kind:"exact" } (no embedding needed).
//     2. SEMANTIC: embed the prompt, find the highest cosine against stored
//        embeddings; if best >= threshold → stats.semanticHits++, return
//        { hit:true, value, kind:"semantic" }.
//     3. else → stats.misses++, return { hit:false }.
//   readonly stats: { exactHits, semanticHits, misses }.
// ─────────────────────────────────────────────────────────────────────────────
class SemanticCache {
  readonly stats = { exactHits: 0, semanticHits: 0, misses: 0 };

  constructor(embed: Embedder, threshold: number) {
    // IMPLEMENT
  }

  async set(prompt: string, value: string): Promise<void> {
    // IMPLEMENT
  }

  async get(prompt: string): Promise<CacheHit | CacheMiss> {
    return { hit: false }; // IMPLEMENT
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
// Injected embeddings: paraphrases map near-parallel; unrelated maps orthogonal.
const vectors: Record<string, number[]> = {
  "What is a token bucket?": [1, 0, 0],
  "Explain token buckets please": [0.99, 0.14, 0], // cosine ~0.99 with the above
  "How do I bake sourdough bread?": [0, 0, 1], // orthogonal
};
const embed: Embedder = async (t) => vectors[t] ?? [0, 0, 0];

const cache = new SemanticCache(embed, 0.95);
await cache.set("What is a token bucket?", "A rate-limiting algorithm.");

// exact repeat → exact hit, no embedding required:
const exact = await cache.get("What is a token bucket?");
expect(exact).toEqual({ hit: true, value: "A rate-limiting algorithm.", kind: "exact" });

// a paraphrase → semantic hit (cosine ~0.99 >= 0.95), still no model call:
const semantic = await cache.get("Explain token buckets please");
expect(semantic.hit).toBe(true);
if (semantic.hit) {
  expect(semantic.kind).toBe("semantic");
  expect(semantic.value).toBe("A rate-limiting algorithm.");
}

// an unrelated prompt → miss:
const miss = await cache.get("How do I bake sourdough bread?");
expect(miss.hit).toBe(false);

expect(cache.stats).toEqual({ exactHits: 1, semanticHits: 1, misses: 1 });

pass("05-semantic-cache");
