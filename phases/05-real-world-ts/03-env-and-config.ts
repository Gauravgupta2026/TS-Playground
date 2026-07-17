/**
 * Phase 5 · Exercise 03 — Typed environment & config
 *
 * Both must pass:
 *   npm run ts    phases/05-real-world-ts/03-env-and-config.ts
 *   npm run check phases/05-real-world-ts/03-env-and-config.ts
 *
 * The pattern: validate the WHOLE environment once, at startup, with a Zod
 * schema. Export the parsed object. Nothing else ever reads process.env.
 * (We validate fake env objects here so the exercise is deterministic —
 * the pattern is identical for the real process.env.)
 */
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the env schema
//
// Build EnvSchema for an app that needs:
//   API_KEY     required, non-empty string (.min(1) — "" should fail!)
//   PORT        coerced number, int, 1..65535, DEFAULT 3000
//   LOG_LEVEL   enum "debug" | "info" | "error", DEFAULT "info"
//   DRY_RUN     "true"/"false" string → boolean. Trick: env vars are always
//               strings, so use  z.enum(["true","false"]).default("false")
//               .transform((v) => v === "true")
// ─────────────────────────────────────────────────────────────────────────────
const EnvSchema = z.object({
  API_KEY: z.string(), // TIGHTEN
  PORT: z.number(), // FIX: envs are strings! coerce + bounds + default
  LOG_LEVEL: z.string(), // FIX
  DRY_RUN: z.boolean(), // FIX: string in, boolean out (transform)
});

const full = EnvSchema.parse({ API_KEY: "sk-abc", PORT: "8080", LOG_LEVEL: "debug", DRY_RUN: "true" });
expect(full).toEqual({ API_KEY: "sk-abc", PORT: 8080, LOG_LEVEL: "debug", DRY_RUN: true });

const minimal = EnvSchema.parse({ API_KEY: "sk-abc" });
expect(minimal).toEqual({ API_KEY: "sk-abc", PORT: 3000, LOG_LEVEL: "info", DRY_RUN: false });

expect(EnvSchema.safeParse({}).success).toBe(false); // API_KEY required
expect(EnvSchema.safeParse({ API_KEY: "" }).success).toBe(false); // empty is missing
expect(EnvSchema.safeParse({ API_KEY: "k", PORT: "99999" }).success).toBe(false);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — fail fast, fail loud
//
// Implement loadEnv: parse with safeParse. On success return the config.
// On failure, throw ONE Error whose message lists every bad variable as
// "VAR_NAME: message", joined with "; " — so the whole problem is visible
// in a single crash at boot, not one var at a time.
// Issue objects: issue.path.join(".") is the var name, issue.message the reason.
// ─────────────────────────────────────────────────────────────────────────────
function loadEnv(env: Record<string, string | undefined>): z.infer<typeof EnvSchema> {
  return EnvSchema.parse(env); // REWRITE with safeParse + the combined error
}

expect(loadEnv({ API_KEY: "sk-abc" }).PORT).toBe(3000);

let bootError = "";
try {
  loadEnv({ PORT: "not-a-number" });
} catch (thrown) {
  bootError = thrown instanceof Error ? thrown.message : "";
}
expect(bootError.includes("API_KEY")).toBe(true); // both problems reported…
expect(bootError.includes("PORT")).toBe(true); // …in one error

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — config drift protection with satisfies
//
// `satisfies` checks a value against a type WITHOUT widening it — you keep
// the literal types AND get the check. The config below has drifted: a typo
// key and a wrong value type. Annotate with  satisfies AppConfig  (after
// the closing brace), read the two errors, fix the data.
// ─────────────────────────────────────────────────────────────────────────────
type AppConfig = {
  model: string;
  maxRetries: number;
  features: { streaming: boolean; caching: boolean };
};

const appConfig = {
  model: "claude-sonnet-5",
  maxRetires: 3, // typo — satisfies will catch it
  features: { streaming: true, caching: "yes" }, // wrong type — satisfies will catch it
};

expect((appConfig as AppConfig).maxRetries).toBe(3);
expect((appConfig as AppConfig).features.caching).toBe(true);

pass("03-env-and-config");
