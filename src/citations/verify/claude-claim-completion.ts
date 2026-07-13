/**
 * Claude-API-backed ClaimCompletion — the live backend for the LLM claim
 * extractor scaffold ({@link ./llm-claim-extractor.ts}). Opt-in, default OFF.
 *
 * It wraps the egress-gated {@link ../../chips/anthropic-chip.js AnthropicChip}
 * rather than opening a new network call site, so the EgressContext chokepoint
 * audit stays clean and every request routes through the chip's
 * `ensureEgressAllowed`. `complete(prompt)` forwards the caller's prompt
 * VERBATIM as the user message — the prompt already fences the untrusted draft
 * (buildClaimExtractionPrompt), so the draft is never re-embedded outside that
 * fence. temperature is pinned to 0 and max_tokens is bounded.
 *
 * The completion is produced only through {@link createClaudeClaimCompletion},
 * a gated factory that returns null unless BOTH the `SC_CLAIM_LLM` opt-in flag
 * and `ANTHROPIC_API_KEY` are set — so nothing reaches the network by default
 * (the extractor stays inert with a null completion).
 *
 * @module citations/verify/claude-claim-completion
 */

import { AnthropicChip } from '../../chips/anthropic-chip.js';
import { NULL_EGRESS_AUDIT_SINK, type EgressContext } from '../../security/egress-context.js';
import type { ClaimCompletion } from './llm-claim-extractor.js';

/** The only host this completion is permitted to reach. */
const ANTHROPIC_ALLOW = 'https://api.anthropic.com/';
/** Cheap, current default model; override with SC_CLAIM_LLM_MODEL. */
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
/** Output-token bound — defends against a runaway completion. */
const DEFAULT_MAX_TOKENS = 2048;

export interface ClaudeClaimCompletionOptions {
  /** Claude model id. Default {@link DEFAULT_MODEL}. */
  model?: string;
  /** Max output tokens. Default {@link DEFAULT_MAX_TOKENS}. */
  maxTokens?: number;
  /** Explicit API key; falls back to ANTHROPIC_API_KEY inside the chip. */
  apiKey?: string;
  /**
   * Egress context. Defaults to an allow-list of only the Anthropic host, so a
   * misconfigured caller cannot reach anywhere else. Pass a denying context to
   * exercise the chokepoint in tests.
   */
  ctx?: EgressContext;
}

/**
 * A real {@link ClaimCompletion} over the Anthropic Messages API. Any API/HTTP
 * error surfaces as a throw here; the extractor's best-effort layer
 * ({@link ./llm-claim-extractor.js extractClaimsWithLlm}) maps it to `[]`.
 * An `EgressContextDenied` also propagates and is NOT mapped to `[]` upstream.
 */
export class ClaudeClaimCompletion implements ClaimCompletion {
  private readonly chip: AnthropicChip;
  private readonly maxTokens: number;

  constructor(options: ClaudeClaimCompletionOptions = {}) {
    const ctx: EgressContext = options.ctx ?? {
      allowList: [ANTHROPIC_ALLOW],
      audit: NULL_EGRESS_AUDIT_SINK,
    };
    this.chip = new AnthropicChip(
      {
        type: 'anthropic',
        name: 'claim-extractor',
        defaultModel: options.model ?? DEFAULT_MODEL,
        ...(options.apiKey ? { apiKey: options.apiKey } : {}),
      },
      ctx,
    );
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(prompt: string): Promise<string> {
    const res = await this.chip.chat([{ role: 'user', content: prompt }], {
      maxTokens: this.maxTokens,
      temperature: 0,
    });
    return res.content;
  }
}

/**
 * Gated factory. Returns a live completion ONLY when the operator has explicitly
 * opted in AND supplied a key — otherwise null (the extractor stays inert: no
 * network, no cost, no non-determinism). Both gates are required:
 *   - `SC_CLAIM_LLM` truthy (1/true/on)
 *   - `ANTHROPIC_API_KEY` present
 * `SC_CLAIM_LLM_MODEL` optionally overrides the model.
 */
export function createClaudeClaimCompletion(
  env: Record<string, string | undefined> = process.env,
): ClaimCompletion | null {
  const enabled = /^(1|true|on)$/i.test((env.SC_CLAIM_LLM ?? '').trim());
  if (!enabled) return null;
  if (!env.ANTHROPIC_API_KEY) return null;

  const model = env.SC_CLAIM_LLM_MODEL?.trim();
  // Forward the key from the injected env so the completion is actually usable
  // when env !== process.env (DI/testing); the chip would otherwise read only the
  // real process.env and drop an injected key.
  return new ClaudeClaimCompletion({ apiKey: env.ANTHROPIC_API_KEY, ...(model ? { model } : {}) });
}
