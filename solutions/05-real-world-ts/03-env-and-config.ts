/** SOLUTION — Phase 5 · 03. */
import { z } from "zod";
import { expect, pass } from "../../helpers/assert";

// EXERCISE 1 — env vars are ALWAYS strings on the way in; the schema is
// where they become real types.
const EnvSchema = z.object({
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "error"]).default("info"),
  DRY_RUN: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const full = EnvSchema.parse({ API_KEY: "sk-abc", PORT: "8080", LOG_LEVEL: "debug", DRY_RUN: "true" });
expect(full).toEqual({ API_KEY: "sk-abc", PORT: 8080, LOG_LEVEL: "debug", DRY_RUN: true });

const minimal = EnvSchema.parse({ API_KEY: "sk-abc" });
expect(minimal).toEqual({ API_KEY: "sk-abc", PORT: 3000, LOG_LEVEL: "info", DRY_RUN: false });

expect(EnvSchema.safeParse({}).success).toBe(false);
expect(EnvSchema.safeParse({ API_KEY: "" }).success).toBe(false);
expect(EnvSchema.safeParse({ API_KEY: "k", PORT: "99999" }).success).toBe(false);

// EXERCISE 2 — one crash with the complete list beats five sequential ones.
function loadEnv(env: Record<string, string | undefined>): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(env);
  if (result.success) return result.data;
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`invalid environment — ${details}`);
}

expect(loadEnv({ API_KEY: "sk-abc" }).PORT).toBe(3000);

let bootError = "";
try {
  loadEnv({ PORT: "not-a-number" });
} catch (thrown) {
  bootError = thrown instanceof Error ? thrown.message : "";
}
expect(bootError.includes("API_KEY")).toBe(true);
expect(bootError.includes("PORT")).toBe(true);

// EXERCISE 3 — satisfies: checked against AppConfig, literals preserved.
type AppConfig = {
  model: string;
  maxRetries: number;
  features: { streaming: boolean; caching: boolean };
};

const appConfig = {
  model: "claude-sonnet-5",
  maxRetries: 3,
  features: { streaming: true, caching: true },
} satisfies AppConfig;

expect(appConfig.maxRetries).toBe(3);
expect(appConfig.features.caching).toBe(true);

pass("03-env-and-config (solution)");
