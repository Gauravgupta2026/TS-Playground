/** SOLUTION — Phase 13 · 05. */
import { expect, pass } from "../../helpers/assert";

type Embedder = (text: string) => Promise<number[]>;
type CacheHit = { hit: true; value: string; kind: "exact" | "semantic" };
type CacheMiss = { hit: false };

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

class SemanticCache {
  readonly stats = { exactHits: 0, semanticHits: 0, misses: 0 };

  private readonly exact = new Map<string, string>();
  private readonly entries: Array<{ embedding: number[]; value: string }> = [];

  constructor(
    private readonly embed: Embedder,
    private readonly threshold: number
  ) {}

  async set(prompt: string, value: string): Promise<void> {
    this.exact.set(prompt, value);
    this.entries.push({ embedding: await this.embed(prompt), value });
  }

  async get(prompt: string): Promise<CacheHit | CacheMiss> {
    const exactValue = this.exact.get(prompt);
    if (exactValue !== undefined) {
      this.stats.exactHits += 1;
      return { hit: true, value: exactValue, kind: "exact" };
    }

    const queryEmbedding = await this.embed(prompt);
    let best: { value: string; score: number } | null = null;
    for (const entry of this.entries) {
      const score = cosine(queryEmbedding, entry.embedding);
      if (!best || score > best.score) best = { value: entry.value, score };
    }

    if (best && best.score >= this.threshold) {
      this.stats.semanticHits += 1;
      return { hit: true, value: best.value, kind: "semantic" };
    }
    this.stats.misses += 1;
    return { hit: false };
  }
}

// ── The spec ────────────────────────────────────────────────────────────────
const vectors: Record<string, number[]> = {
  "What is a token bucket?": [1, 0, 0],
  "Explain token buckets please": [0.99, 0.14, 0],
  "How do I bake sourdough bread?": [0, 0, 1],
};
const embed: Embedder = async (t) => vectors[t] ?? [0, 0, 0];

const cache = new SemanticCache(embed, 0.95);
await cache.set("What is a token bucket?", "A rate-limiting algorithm.");

const exact = await cache.get("What is a token bucket?");
expect(exact).toEqual({ hit: true, value: "A rate-limiting algorithm.", kind: "exact" });

const semantic = await cache.get("Explain token buckets please");
expect(semantic.hit).toBe(true);
if (semantic.hit) {
  expect(semantic.kind).toBe("semantic");
  expect(semantic.value).toBe("A rate-limiting algorithm.");
}

const miss = await cache.get("How do I bake sourdough bread?");
expect(miss.hit).toBe(false);

expect(cache.stats).toEqual({ exactHits: 1, semanticHits: 1, misses: 1 });

pass("05-semantic-cache (solution)");
