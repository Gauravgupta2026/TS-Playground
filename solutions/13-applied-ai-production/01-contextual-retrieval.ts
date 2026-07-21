/** SOLUTION — Phase 13 · 01. */
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

class BM25 {
  private readonly df = new Map<string, number>();
  private readonly docLen: number[];
  private readonly avgdl: number;
  private readonly N: number;

  constructor(
    private readonly docs: string[][],
    private readonly k1 = 1.5,
    private readonly b = 0.75
  ) {
    this.N = docs.length;
    this.docLen = docs.map((d) => d.length);
    this.avgdl = this.docLen.reduce((a, b2) => a + b2, 0) / (this.N || 1);
    for (const doc of docs) {
      for (const term of new Set(doc)) this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
  }

  idf(term: string): number {
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
  }

  score(queryTerms: string[], docIndex: number): number {
    const doc = this.docs[docIndex]!;
    const len = this.docLen[docIndex]!;
    let total = 0;
    for (const term of queryTerms) {
      const f = doc.filter((t) => t === term).length;
      if (f === 0) continue;
      const numerator = f * (this.k1 + 1);
      const denominator = f + this.k1 * (1 - this.b + this.b * (len / this.avgdl));
      total += this.idf(term) * (numerator / denominator);
    }
    return total;
  }

  rank(queryTerms: string[]): number[] {
    return this.docs
      .map((_, i) => i)
      .sort((a, b) => this.score(queryTerms, b) - this.score(queryTerms, a) || a - b);
  }
}

async function contextualizeChunk(client: ModelClient, fullDoc: string, chunk: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Document:\n${fullDoc}\n\nChunk:\n${chunk}\n\nGive a short blurb situating this chunk in the document.`,
      },
    ],
  });
  const context = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  return `${context}\n\n${chunk}`;
}

// ── The spec ────────────────────────────────────────────────────────────────
const corpus = [
  tokenize("the cat sat on the mat"),
  tokenize("dogs are loyal companions"),
  tokenize("the cat chased the mouse"),
];
const bm = new BM25(corpus);
const catQuery = tokenize("cat");
const ranked = bm.rank(catQuery);
expect(ranked[0] === 0 || ranked[0] === 2).toBe(true);
expect(bm.score(catQuery, 1)).toBe(0);

const rawChunk = "It grew by 3 percent that quarter.";
const unrelated = "The weather was mild throughout the spring.";
const query = tokenize("acme revenue growth");

const rawIndex = new BM25([tokenize(rawChunk), tokenize(unrelated)]);
expect(rawIndex.score(query, 0)).toBe(0);

const ctx = makeScriptedClient([
  fakeMessage("This excerpt is from ACME Corp's Q3 revenue report, describing growth."),
]);
const contextualized = await contextualizeChunk(ctx.client, "ACME Q3 report ...", rawChunk);
expect(contextualized.includes(rawChunk)).toBe(true);

const ctxIndex = new BM25([tokenize(contextualized), tokenize(unrelated)]);
expect(ctxIndex.score(query, 0) > 0).toBe(true);
expect(ctxIndex.rank(query)[0]).toBe(0);

pass("01-contextual-retrieval (solution)");
