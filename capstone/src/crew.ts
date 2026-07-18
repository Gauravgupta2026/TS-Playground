/**
 * The orchestrator — YOU IMPLEMENT (Phase 8's pipeline + critic loop).
 *
 * SPEC — runCrew(clients, docsDir, question, opts?):
 *  opts (all optional, defaults from CREW_DEFAULTS):
 *    { topK, maxCriticRounds, maxTokens }
 *
 *  1. budget = new TokenBudget(maxTokens)
 *  2. store  = await buildStore(docsDir)
 *  3. PLAN      runPlanner — err → err(`planner: ${e}`)
 *  4. RESEARCH  for each sub-question SEQUENTIALLY (scripted clients are
 *               ordered; and in live mode sequential keeps token spend
 *               observable): runResearcher — err → err(`researcher: ${e}`)
 *  5. WRITE     runWriter (no revision) — err → err(`writer: ${e}`)
 *  6. CRITIQUE  loop up to maxCriticRounds:
 *                 runCritic — err → err(`critic: ${e}`)
 *                 approved → done
 *                 feedback → runWriter with revision {previousDraft, feedback}
 *                 (a revision consumes the NEXT critic round)
 *               never approved → err(`no approval after ${maxCriticRounds} rounds`)
 *  7. ok({ draft, plan, findings, rounds, tokensSpent: budget.spent })
 *     rounds = number of critic calls made.
 */
import { TokenBudget } from "./budget";
import { buildStore } from "./rag";
import { runCritic, runPlanner, runResearcher, runWriter } from "./agents";
import { CREW_DEFAULTS, type CrewClients, type CrewResult, type Result } from "./types";

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
  return { ok: false, error: "IMPLEMENT" };
}
