/**
 * Claude-API-backed ClaimCompletion — the live backend for the LLM claim
 * extractor scaffold ({@link ./llm-claim-extractor.ts}). Opt-in, default OFF.
 *
 * A thin wrapper over the shared {@link ../../chips/claude-completion.js
 * ClaudeCompletion} base (egress-gated AnthropicChip, one user message,
 * temperature 0). `complete(prompt)` forwards the caller's prompt VERBATIM — the
 * prompt already fences the untrusted draft (buildClaimExtractionPrompt), so the
 * draft is never re-embedded outside that fence.
 *
 * The completion is produced only through {@link createClaudeClaimCompletion},
 * a gated factory that returns null unless BOTH the `SC_CLAIM_LLM` opt-in flag
 * and `ANTHROPIC_API_KEY` are set — so nothing reaches the network by default
 * (the extractor stays inert with a null completion).
 *
 * @module citations/verify/claude-claim-completion
 */

import {
  ClaudeCompletion,
  type ClaudeCompletionOptions,
} from '../../chips/claude-completion.js';
import type { ClaimCompletion } from './llm-claim-extractor.js';

/** Output-token bound — defends against a runaway completion. */
const DEFAULT_MAX_TOKENS = 2048;

/** Construction knobs for {@link ClaudeClaimCompletion}; see {@link ClaudeCompletionOptions}. */
export type ClaudeClaimCompletionOptions = ClaudeCompletionOptions;

/**
 * A real {@link ClaimCompletion} over the Anthropic Messages API. Any API/HTTP
 * error surfaces as a throw here; the extractor's best-effort layer
 * ({@link ./llm-claim-extractor.js extractClaimsWithLlm}) maps it to `[]`.
 * An `EgressContextDenied` also propagates and is NOT mapped to `[]` upstream.
 */
export class ClaudeClaimCompletion extends ClaudeCompletion implements ClaimCompletion {
  constructor(options: ClaudeClaimCompletionOptions = {}) {
    super('claim-extractor', DEFAULT_MAX_TOKENS, options);
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
