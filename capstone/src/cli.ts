/**
 * CLI entry point. PROVIDED — works the moment crew.ts does.
 *
 *   npm run ts capstone/src/cli.ts -- "your question" [--dry-run] [--docs <dir>]
 *
 * Live mode reads ANTHROPIC_API_KEY from .env at the repo root.
 */
import "dotenv/config";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import Anthropic from "@anthropic-ai/sdk";
import { runCrew } from "./crew";
import { makeDryRunClients, DEMO_QUESTION } from "./fake";
import type { CrewClients } from "./types";

const DEFAULT_DOCS = join(dirname(fileURLToPath(import.meta.url)), "../docs");

function parseCliArgs(argv: string[]): { question: string; dryRun: boolean; docsDir: string } {
  const args = argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const docsFlagIndex = args.indexOf("--docs");
  const docsDir = docsFlagIndex !== -1 && args[docsFlagIndex + 1] ? resolve(args[docsFlagIndex + 1]!) : DEFAULT_DOCS;
  const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--docs");
  const question = positional[0] ?? (dryRun ? DEMO_QUESTION : "");
  return { question, dryRun, docsDir };
}

const { question, dryRun, docsDir } = parseCliArgs(process.argv);

if (!question) {
  console.error('usage: npm run ts capstone/src/cli.ts -- "your question" [--dry-run] [--docs <dir>]');
  process.exit(1);
}

let clients: CrewClients;
if (dryRun) {
  console.log("── dry run: scripted model, real retrieval ──");
  clients = makeDryRunClients().clients;
} else {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY missing — copy .env.example to .env, or use --dry-run");
    process.exit(1);
  }
  const real = new Anthropic();
  clients = { planner: real, researcher: real, writer: real, critic: real };
}

console.log(`question: ${question}\ndocs:     ${docsDir}\n`);

const result = await runCrew(clients, docsDir, question);

if (!result.ok) {
  console.error(`crew failed: ${result.error}`);
  process.exit(1);
}

const { draft, plan, findings, rounds, tokensSpent } = result.value;
console.log("── plan ──");
for (const sub of plan.subQuestions) console.log(`  • ${sub}`);
console.log("\n── answer ──");
console.log(draft);
console.log("\n── sources ──");
const sources = new Set(findings.flatMap((f) => f.keyFacts.map((k) => k.source)));
for (const source of [...sources].sort()) console.log(`  • ${source}`);
console.log(`\n(${rounds} critic round${rounds === 1 ? "" : "s"}, ~${tokensSpent} tokens)`);
