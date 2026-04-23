/**
 * Four-tier Skill Trust — assignment logic.
 *
 * Pure functions that map TrustSignals → TrustTier. Deterministic: identical
 * signals produce identical tiers. No I/O, no globals, no side effects.
 *
 * Default-off guarantee: nothing in this module runs on import. The tier
 * assignment must be explicitly invoked by callers.
 *
 * @module trust-tiers/assign
 */

import type {
  TrustSignals,
  TrustTier,
  TierAssignment,
  PromotionDecision,
} from './types.js';
import { TIER_RANK } from './types.js';

const MAX_TIER_RANK = 4;

/**
 * Assign a trust tier from signals. Pure function.
 *
 * Base rules (before adjustments):
 *   - unknown provenance                          → T4
 *   - third-party + !audited                      → T4
 *   - third-party + audited + !signatureVerified  → T4
 *   - third-party + audited + signatureVerified   → T3
 *   - first-party + !audited                      → T2
 *   - first-party + audited                       → T1
 *
 * Adjustments (apply in order):
 *   - vulnerabilityReports > 0  → demote at most one tier (never promote)
 *   - correctionHistory >= 3 AND ageDays >= 7 → promote at most one tier
 *     (usage-trust signal; gated on minimum age to prevent rapid manipulation)
 *
 * Tier floor: T4. Tier ceiling: T1. Adjustments never cross the ceiling/floor.
 */
export function assignTier(signals: TrustSignals): TierAssignment {
  const rationale: string[] = [];
  let tier: TrustTier;

  if (signals.provenance === 'unknown') {
    tier = 'T4';
    rationale.push('provenance=unknown forces T4');
  } else if (signals.provenance === 'third-party') {
    if (!signals.audited) {
      tier = 'T4';
      rationale.push('third-party + unaudited → T4');
    } else if (!signals.signatureVerified) {
      tier = 'T4';
      rationale.push('third-party + audited but signature unverified → T4');
    } else {
      tier = 'T3';
      rationale.push('third-party + audited + signature-verified → T3');
    }
  } else {
    // first-party
    if (signals.audited) {
      tier = 'T1';
      rationale.push('first-party + audited → T1');
    } else {
      tier = 'T2';
      rationale.push('first-party + unaudited → T2');
    }
  }

  let demoted = false;
  let promoted = false;

  // Demotion: vulnerabilityReports > 0 demotes one tier (floor T4).
  if (signals.vulnerabilityReports > 0) {
    const currentRank = TIER_RANK[tier];
    if (currentRank < MAX_TIER_RANK) {
      const newTier = (['T1', 'T2', 'T3', 'T4'] as TrustTier[])[currentRank]; // +1 step
      tier = newTier;
      demoted = true;
      rationale.push(`${signals.vulnerabilityReports} open vulnerability report(s) → demote to ${tier}`);
    } else {
      rationale.push('already T4; vulnerabilityReports cannot demote further');
    }
  }

  // Promotion: correctionHistory >= 3 AND ageDays >= 7 promotes one tier (ceiling T1).
  if (signals.correctionHistory >= 3 && signals.ageDays >= 7 && !demoted) {
    const currentRank = TIER_RANK[tier];
    if (currentRank > 1) {
      const newTier = (['T1', 'T2', 'T3', 'T4'] as TrustTier[])[currentRank - 2]; // -1 step
      tier = newTier;
      promoted = true;
      rationale.push(
        `correctionHistory=${signals.correctionHistory} + ageDays=${signals.ageDays} → promote to ${tier}`
      );
    }
  }

  return { tier, rationale, demoted, promoted };
}

/**
 * Decide if a promotion from `from` → `to` is permitted given current signals.
 *
 * Promotion rules:
 *   T4 → T3 : requires audited=true AND signatureVerified=true
 *   T3 → T2 : requires provenance='first-party'
 *   T2 → T1 : requires audited=true
 *   T1 → *  : T1 is the ceiling; promotion not allowed
 *   Skip-tier promotion is never allowed; T4→T2 must go via T3 first.
 */
export function canPromote(
  from: TrustTier,
  to: TrustTier,
  signals: TrustSignals,
): PromotionDecision {
  const unmet: string[] = [];

  if (from === to) {
    return { allowed: false, from, to, reason: 'from === to; no promotion needed', requirementsUnmet: [] };
  }

  if (TIER_RANK[to] > TIER_RANK[from]) {
    return {
      allowed: false,
      from,
      to,
      reason: `cannot promote from ${from} to ${to}: ${to} is a lower-trust tier (use demote instead)`,
      requirementsUnmet: [],
    };
  }

  if (TIER_RANK[from] - TIER_RANK[to] > 1) {
    return {
      allowed: false,
      from,
      to,
      reason: `skip-tier promotion forbidden: ${from} → ${to} must go via intermediate tier(s)`,
      requirementsUnmet: [],
    };
  }

  // from is exactly one step below to (from's rank is to's rank + 1 because T1 has rank 1 < T4 rank 4)
  if (from === 'T4' && to === 'T3') {
    if (!signals.audited) unmet.push('audited=true');
    if (!signals.signatureVerified) unmet.push('signatureVerified=true');
  } else if (from === 'T3' && to === 'T2') {
    if (signals.provenance !== 'first-party') unmet.push("provenance='first-party'");
  } else if (from === 'T2' && to === 'T1') {
    if (!signals.audited) unmet.push('audited=true');
  }

  return {
    allowed: unmet.length === 0,
    from,
    to,
    reason:
      unmet.length === 0
        ? `promotion ${from} → ${to} permitted`
        : `promotion ${from} → ${to} blocked: requires ${unmet.join(', ')}`,
    requirementsUnmet: unmet,
  };
}
