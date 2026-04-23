/**
 * CASCADE three-tier defense — orchestrator.
 *
 * Cascades through Tier 1 (regex+phrase+entropy), Tier 2 (optional embedding+LLM
 * hook), Tier 3 (output filter). Short-circuits on any flagged tier. Emits a
 * CascadeDecision with per-tier detail for audit.
 *
 * @module mcp-defense/cascade/cascade
 */

import type {
  CascadeInput,
  CascadeDecision,
  CascadeConfig,
  TierResult,
} from './types.js';
import { DEFAULT_CONFIG } from './types.js';
import { tier1Detect, tier3Detect } from './detectors.js';

/**
 * Run the three-tier CASCADE. Returns allowed=true iff all three tiers
 * clear the payload (and optional response).
 */
export async function runCascade(
  input: CascadeInput,
  config: CascadeConfig = DEFAULT_CONFIG,
): Promise<CascadeDecision> {
  const tierResults: TierResult[] = [];

  // Tier 1: regex + phrase weighting + entropy
  const t1 = tier1Detect(input.payload, config.tier1Threshold);
  tierResults.push(t1);
  if (t1.flagged) {
    return {
      allowed: false,
      caughtAt: 1,
      tierResults,
      summary: `CASCADE BLOCK at Tier 1: ${t1.reason}`,
    };
  }

  // Tier 2: optional embedding+LLM hook
  if (config.tier2Hook) {
    const t2Raw = await config.tier2Hook.check(input.payload);
    const t2: TierResult = {
      tier: 2,
      flagged: t2Raw.flagged && t2Raw.confidence >= config.tier2Threshold,
      confidence: t2Raw.confidence,
      reason: t2Raw.reason,
      matchedPatterns: [],
    };
    tierResults.push(t2);
    if (t2.flagged) {
      return {
        allowed: false,
        caughtAt: 2,
        tierResults,
        summary: `CASCADE BLOCK at Tier 2: ${t2.reason}`,
      };
    }
  }

  // Tier 3: output filter (only if response supplied)
  if (input.response != null) {
    const t3 = tier3Detect(input.response, config.tier3Threshold);
    tierResults.push(t3);
    if (t3.flagged) {
      return {
        allowed: false,
        caughtAt: 3,
        tierResults,
        summary: `CASCADE BLOCK at Tier 3: ${t3.reason}`,
      };
    }
  }

  return {
    allowed: true,
    caughtAt: 'cleared',
    tierResults,
    summary: `CASCADE cleared (${tierResults.length} tier(s) checked)`,
  };
}

/** Short synchronous variant for tests that supply no Tier 2 hook. */
export function runCascadeSync(
  input: CascadeInput,
  config: Omit<CascadeConfig, 'tier2Hook'> = DEFAULT_CONFIG,
): CascadeDecision {
  const tierResults: TierResult[] = [];

  const t1 = tier1Detect(input.payload, config.tier1Threshold);
  tierResults.push(t1);
  if (t1.flagged) {
    return {
      allowed: false,
      caughtAt: 1,
      tierResults,
      summary: `CASCADE BLOCK at Tier 1: ${t1.reason}`,
    };
  }

  if (input.response != null) {
    const t3 = tier3Detect(input.response, config.tier3Threshold);
    tierResults.push(t3);
    if (t3.flagged) {
      return {
        allowed: false,
        caughtAt: 3,
        tierResults,
        summary: `CASCADE BLOCK at Tier 3: ${t3.reason}`,
      };
    }
  }

  return {
    allowed: true,
    caughtAt: 'cleared',
    tierResults,
    summary: `CASCADE cleared (${tierResults.length} tier(s) checked, sync)`,
  };
}
