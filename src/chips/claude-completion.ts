/**
 * Shared base for the opt-in, Claude-backed LLM completion wrappers — the claim
 * extractor's {@link ../citations/verify/claude-claim-completion.js ClaudeClaimCompletion},
 * the try-session author's {@link ../college/llm-try-session-author.js ClaudeAuthorCompletion},
 * and the distill namer's {@link ../cartridge/distill-namer-llm.js ClaudeNamerCompletion}.
 * Those three were byte-identical AnthropicChip wrappers differing only in the
 * chip's caller `name` and a default output-token bound; this collapses that
 * duplication into one place.
 *
 * Each instance wraps the egress-gated {@link ./anthropic-chip.js AnthropicChip}
 * rather than opening its own network call site, so the EgressContext chokepoint
 * audit stays clean and every request routes through the chip's
 * `ensureEgressAllowed`. `complete(prompt)` forwards the caller's prompt VERBATIM
 * as a single user message; temperature is pinned to 0 and max_tokens is bounded.
 *
 * The `complete(prompt): Promise<string>` shape structurally satisfies the
 * ClaimCompletion / AuthorCompletion / NamerCompletion seams, so subclasses can
 * `implements` their local interface without a nominal dependency on this module.
 *
 * @module chips/claude-completion
 */

import { AnthropicChip } from './anthropic-chip.js';
import { NULL_EGRESS_AUDIT_SINK, type EgressContext } from '../security/egress-context.js';

/** The only host these completions are permitted to reach. */
const ANTHROPIC_ALLOW = 'https://api.anthropic.com/';

/** Cheap, current default model; each wrapper's factory may override per env. */
const DEFAULT_CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

/** Construction knobs shared by every Claude-backed completion wrapper. */
export interface ClaudeCompletionOptions {
  /** Claude model id. Default {@link DEFAULT_CLAUDE_MODEL}. */
  model?: string;
  /** Max output tokens. Default is the subclass's per-use bound. */
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
 * A minimal completion over the Anthropic Messages API. Any API/HTTP error
 * surfaces as a throw from {@link complete}; each caller's best-effort layer
 * decides how to map it. An `EgressContextDenied` also propagates.
 *
 * Abstract: construct a concrete subclass that fixes the chip's caller `name`
 * and a default output-token bound.
 */
export abstract class ClaudeCompletion {
  private readonly chip: AnthropicChip;
  private readonly maxTokens: number;

  /**
   * @param name             chip caller name (identifies the request source)
   * @param defaultMaxTokens output-token bound when `options.maxTokens` is unset
   * @param options          per-instance overrides
   */
  protected constructor(
    name: string,
    defaultMaxTokens: number,
    options: ClaudeCompletionOptions = {},
  ) {
    const ctx: EgressContext = options.ctx ?? {
      allowList: [ANTHROPIC_ALLOW],
      audit: NULL_EGRESS_AUDIT_SINK,
    };
    this.chip = new AnthropicChip(
      {
        type: 'anthropic',
        name,
        defaultModel: options.model ?? DEFAULT_CLAUDE_MODEL,
        ...(options.apiKey ? { apiKey: options.apiKey } : {}),
      },
      ctx,
    );
    this.maxTokens = options.maxTokens ?? defaultMaxTokens;
  }

  /** Forward `prompt` as one user message; temperature 0, bounded max_tokens. */
  async complete(prompt: string): Promise<string> {
    const res = await this.chip.chat([{ role: 'user', content: prompt }], {
      maxTokens: this.maxTokens,
      temperature: 0,
    });
    return res.content;
  }
}
