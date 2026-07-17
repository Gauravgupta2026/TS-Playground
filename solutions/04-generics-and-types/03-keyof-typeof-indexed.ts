/** SOLUTION — Phase 4 · 03. */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// EXERCISE 1 — keys as a union, property types via indexed access.
type AgentConfig = { model: string; maxTokens: number; stream: boolean };

type ConfigKey = keyof AgentConfig;
type ModelType = AgentConfig["model"];
type AllValueTypes = AgentConfig[keyof AgentConfig];

type _e1a = Expect<Equal<ConfigKey, "model" | "maxTokens" | "stream">>;
type _e1b = Expect<Equal<ModelType, string>>;
type _e1c = Expect<Equal<AllValueTypes, string | number | boolean>>;

// EXERCISE 2 — derive from the value; drift becomes impossible.
const MODELS = {
  fast: "claude-haiku-4-5",
  smart: "claude-sonnet-5",
} as const;

type Tier = keyof typeof MODELS;
type ModelId = (typeof MODELS)[Tier];

function pickModel(tier: Tier): ModelId {
  return MODELS[tier];
}
expect(pickModel("fast")).toBe("claude-haiku-4-5");
expect(pickModel("smart")).toBe("claude-sonnet-5");
// @ts-expect-error -- "cheap" is not a real tier; must be rejected after deriving
pickModel("cheap");

// EXERCISE 3 — the canonical signature; the body needs no casts at all.
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const config: AgentConfig = { model: "claude-sonnet-5", maxTokens: 4096, stream: true };
const model = get(config, "model");
const maxTokens = get(config, "maxTokens");
type _e3a = Expect<Equal<typeof model, string>>;
type _e3b = Expect<Equal<typeof maxTokens, number>>;
expect(model).toBe("claude-sonnet-5");
expect(maxTokens).toBe(4096);
// @ts-expect-error -- unknown key must be rejected
get(config, "temperature");

// EXERCISE 4 — value typed as T[K]: the key dictates what you may write.
function set<T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}
const updated = set(config, "maxTokens", 8192);
expect(updated.maxTokens).toBe(8192);
expect(config.maxTokens).toBe(4096);
// @ts-expect-error -- maxTokens must be a number, not a string
set(config, "maxTokens", "lots");

pass("03-keyof-typeof-indexed (solution)");
