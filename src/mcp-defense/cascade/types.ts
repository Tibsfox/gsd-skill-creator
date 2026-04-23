/**
 * CASCADE three-tier MCP defense — type definitions.
 *
 * Abasikelesh Turgut et al. 2026 (arXiv:2604.17125) describe a cascaded
 * hybrid defense for prompt-injection detection in MCP-based systems.
 * Three tiers of increasingly expensive validation:
 *
 *   Tier 1 — regex + phrase-weighting + entropy    (cheapest, fastest)
 *   Tier 2 — BGE embedding + local LLM fallback    (medium cost)
 *   Tier 3 — pattern-based output filtering        (post-response check)
 *
 * Reported 95.85% precision at 6.06% FPR, fully local operation.
 *
 * This module implements Tier 1 + Tier 3 as pure JavaScript (no external
 * dependencies) and provides a pluggable interface for Tier 2 — callers
 * supply their own embedding/LLM function. Tier 2 tests use a stub.
 *
 * @module mcp-defense/cascade/types
 */

/** Tier of the CASCADE pipeline that caught (or cleared) a payload. */
export type CascadeTier = 1 | 2 | 3 | 'cleared';

/** Input to the cascade defense. */
export interface CascadeInput {
  /** The raw MCP tool-call payload (stringified). */
  payload: string;
  /** The downstream tool's response, for Tier 3 checks. Optional at request time. */
  response?: string;
  /** Metadata used for audit logging. */
  callId: string;
}

/** Result of one tier's evaluation. */
export interface TierResult {
  tier: CascadeTier;
  flagged: boolean;
  confidence: number; // 0..1
  reason: string;
  matchedPatterns: string[];
}

/** Overall cascade decision. */
export interface CascadeDecision {
  allowed: boolean;
  caughtAt: CascadeTier;
  tierResults: TierResult[];
  summary: string;
}

/** Tier 2 hook — callers supply their own embedding+LLM implementation. */
export interface Tier2Hook {
  /** Called with the payload; returns flagged + confidence in [0, 1]. */
  check: (payload: string) => Promise<{ flagged: boolean; confidence: number; reason: string }>;
}

/** CASCADE configuration. */
export interface CascadeConfig {
  /** Tier 1 confidence threshold at which to flag. Default 0.6. */
  tier1Threshold: number;
  /** Tier 2 threshold. Default 0.5. */
  tier2Threshold: number;
  /** Tier 3 threshold. Default 0.7. */
  tier3Threshold: number;
  /** Optional Tier 2 hook; if absent, Tier 2 is skipped. */
  tier2Hook?: Tier2Hook;
}

/** Tool-poisoning attack pattern (known from Huang et al. 2026 MCP threat model). */
export interface KnownAttackPattern {
  id: string;
  pattern: RegExp;
  weight: number;
  description: string;
}

/** Reported CASCADE precision/FPR per Abasikelesh Turgut et al. 2026. */
export const CASCADE_REPORTED_PRECISION = 0.9585;
export const CASCADE_REPORTED_FPR = 0.0606;

/** Default configuration matching the source paper's thresholds. */
export const DEFAULT_CONFIG: CascadeConfig = {
  tier1Threshold: 0.6,
  tier2Threshold: 0.5,
  tier3Threshold: 0.7,
};
