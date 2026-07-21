/** SOLUTION — Phase 13 · 04. */
import type Anthropic from "@anthropic-ai/sdk";
import { fakeMessage, makeScriptedClient, type ModelClient } from "../../helpers/fake-anthropic";
import { expect, pass } from "../../helpers/assert";

type Verdict = "A" | "B" | "tie";

function textOf(message: Anthropic.Message): string {
  return message.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
}

async function pairwiseJudge(client: ModelClient, question: string, a: string, b: string): Promise<Verdict> {
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 10,
    messages: [
      {
        role: "user",
        content: `Question: ${question}\n\nAnswer A:\n${a}\n\nAnswer B:\n${b}\n\nWhich is better? Reply "A", "B", or "tie".`,
      },
    ],
  });
  const t = textOf(response).trim().toUpperCase();
  if (t.startsWith("A")) return "A";
  if (t.startsWith("B")) return "B";
  return "tie";
}

async function debiasedPairwise(client: ModelClient, question: string, a: string, b: string): Promise<Verdict> {
  const first = await pairwiseJudge(client, question, a, b); // A means a
  const swappedRaw = await pairwiseJudge(client, question, b, a); // A means b, B means a
  const second: Verdict = swappedRaw === "A" ? "B" : swappedRaw === "B" ? "A" : "tie";
  if (first !== "tie" && first === second) return first;
  return "tie"; // the judge flipped with position → don't trust it
}

async function rubricJudge(
  client: ModelClient,
  answer: string,
  criteria: string[]
): Promise<{ passed: number; total: number; score: number }> {
  let passed = 0;
  for (const criterion of criteria) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 10,
      messages: [
        { role: "user", content: `Answer:\n${answer}\n\nCriterion: ${criterion}\nReply "PASS" or "FAIL".` },
      ],
    });
    if (textOf(response).trim().toUpperCase().startsWith("PASS")) passed += 1;
  }
  const total = criteria.length;
  return { passed, total, score: passed / total };
}

// ── The spec ────────────────────────────────────────────────────────────────
const p = makeScriptedClient([fakeMessage("A")]);
expect(await pairwiseJudge(p.client, "which is better?", "answer a", "answer b")).toBe("A");

const consistent = makeScriptedClient([fakeMessage("A"), fakeMessage("B")]);
expect(await debiasedPairwise(consistent.client, "q", "answer a", "answer b")).toBe("A");

const biased = makeScriptedClient([fakeMessage("A"), fakeMessage("A")]);
expect(await debiasedPairwise(biased.client, "q", "answer a", "answer b")).toBe("tie");

const rubric = makeScriptedClient([fakeMessage("PASS"), fakeMessage("PASS"), fakeMessage("FAIL")]);
const scored = await rubricJudge(rubric.client, "the answer", ["cites sources", "is concise", "no errors"]);
expect(scored).toEqual({ passed: 2, total: 3, score: 2 / 3 });

pass("04-llm-as-judge (solution)");
