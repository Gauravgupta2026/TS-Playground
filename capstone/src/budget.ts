/**
 * The shared token budget. PROVIDED — this is your Phase 8 guardrail,
 * promoted to library code. One instance per crew run; every model call
 * records against it.
 */
import type Anthropic from "@anthropic-ai/sdk";

export class TokenBudget {
  private readonly maxTokens: number;
  private total = 0;

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
  }

  record(usage: Anthropic.Usage): void {
    this.total += usage.input_tokens + usage.output_tokens;
  }

  get spent(): number {
    return this.total;
  }

  get exhausted(): boolean {
    return this.total >= this.maxTokens;
  }
}
