/** SOLUTION — capstone crew.ts (drop-in for capstone/src/crew.ts). */
import { TokenBudget } from "./budget";
import { buildStore } from "./rag";
import { runCritic, runPlanner, runResearcher, runWriter } from "./agents";
import { CREW_DEFAULTS, type CrewClients, type CrewResult, type Findings, type Result } from "./types";

export type CrewOptions = Partial<{
  topK: number;
  maxCriticRounds: number;
  maxTokens: number;
}>;

export async function runCrew(
  clients: CrewClients,
  docsDir: string,
  question: string,
  opts: CrewOptions = {}
): Promise<Result<CrewResult, string>> {
  const maxCriticRounds = opts.maxCriticRounds ?? CREW_DEFAULTS.maxCriticRounds;
  const budget = new TokenBudget(opts.maxTokens ?? CREW_DEFAULTS.maxTokens);
  const store = await buildStore(docsDir);

  // PLAN
  const plan = await runPlanner(clients.planner, budget, question);
  if (!plan.ok) return { ok: false, error: `planner: ${plan.error}` };

  // RESEARCH — sequential: scripted clients are ordered, and live spend
  // stays observable stage by stage.
  const findings: Findings[] = [];
  for (const subQuestion of plan.value.subQuestions) {
    const found = await runResearcher(clients.researcher, budget, store, subQuestion);
    if (!found.ok) return { ok: false, error: `researcher: ${found.error}` };
    findings.push(found.value);
  }

  // WRITE
  const firstDraft = await runWriter(clients.writer, budget, question, findings);
  if (!firstDraft.ok) return { ok: false, error: `writer: ${firstDraft.error}` };
  let draft = firstDraft.value;

  // CRITIQUE loop
  let rounds = 0;
  while (rounds < maxCriticRounds) {
    const critique = await runCritic(clients.critic, budget, draft, findings);
    if (!critique.ok) return { ok: false, error: `critic: ${critique.error}` };
    rounds += 1;

    if (critique.value.approved) {
      return { ok: true, value: { draft, plan: plan.value, findings, rounds, tokensSpent: budget.spent } };
    }
    if (rounds >= maxCriticRounds) break;

    const revised = await runWriter(clients.writer, budget, question, findings, {
      previousDraft: draft,
      feedback: critique.value.feedback,
    });
    if (!revised.ok) return { ok: false, error: `writer: ${revised.error}` };
    draft = revised.value;
  }

  return { ok: false, error: `no approval after ${maxCriticRounds} rounds` };
}
