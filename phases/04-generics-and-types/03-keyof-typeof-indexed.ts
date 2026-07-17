/**
 * Phase 4 · Exercise 03 — keyof, typeof, indexed access
 *
 * Both must pass:
 *   npm run ts    phases/04-generics-and-types/03-keyof-typeof-indexed.ts
 *   npm run check phases/04-generics-and-types/03-keyof-typeof-indexed.ts
 */
import { expect, pass } from "../../helpers/assert";
import type { Expect, Equal } from "../../helpers/type-assert";

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — keyof: a type's keys as a union
// Fill in the Expect assertions. No code changes — reading practice.
// ─────────────────────────────────────────────────────────────────────────────
type AgentConfig = { model: string; maxTokens: number; stream: boolean };

type ConfigKey = keyof AgentConfig;
type ModelType = AgentConfig["model"]; // indexed access: type OF a property
type AllValueTypes = AgentConfig[keyof AgentConfig]; // union of all value types

type _e1a = Expect<Equal<ConfigKey, unknown>>; // REPLACE unknown
type _e1b = Expect<Equal<ModelType, unknown>>; // REPLACE unknown
type _e1c = Expect<Equal<AllValueTypes, unknown>>; // REPLACE unknown

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — typeof + keyof: the value as source of truth
//
// MODELS is the single source of truth. Derive types FROM it instead of
// duplicating the names (which would drift the moment someone adds a tier):
//   type Tier    = keyof typeof MODELS       ("fast" | "smart")
//   type ModelId = (typeof MODELS)[Tier]     (the two id literals)
// Replace the hand-written (already-drifted!) versions.
// ─────────────────────────────────────────────────────────────────────────────
const MODELS = {
  fast: "claude-haiku-4-5",
  smart: "claude-sonnet-5",
} as const;

type Tier = "fast" | "cheap"; // DRIFTED — derive with keyof typeof instead
type ModelId = "claude-haiku-4-5"; // DRIFTED — derive with indexed access

function pickModel(tier: Tier): ModelId {
  return MODELS[tier];
}

expect(pickModel("fast")).toBe("claude-haiku-4-5");
expect(pickModel("smart")).toBe("claude-sonnet-5");
// @ts-expect-error -- "cheap" is not a real tier; must be rejected after deriving
pickModel("cheap");

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — the generic getter, for real this time
//
// Implement `get` with the canonical signature — no casts in the body:
//   get<T, K extends keyof T>(obj: T, key: K): T[K]
// ─────────────────────────────────────────────────────────────────────────────
function get(obj: object, key: string): unknown {
  // RETYPE and implement: return obj[key]
  return undefined;
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

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4 — typed object update: set<T, K>
//
// The write-side sibling: set(obj, key, value) returns a NEW object with
// that key replaced — and the VALUE type must match the key:
//   set<T, K extends keyof T>(obj: T, key: K, value: T[K]): T
// ─────────────────────────────────────────────────────────────────────────────
function set(obj: object, key: string, value: unknown): object {
  // RETYPE and implement with spread + computed key: { ...obj, [key]: value }
  return obj;
}

const updated = set(config, "maxTokens", 8192) as AgentConfig; // delete cast after retyping
expect(updated.maxTokens).toBe(8192);
expect(config.maxTokens).toBe(4096); // original untouched

// @ts-expect-error -- maxTokens must be a number, not a string
set(config, "maxTokens", "lots");

pass("03-keyof-typeof-indexed");
