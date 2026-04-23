/**
 * Four-tier Skill Trust — CAPCOM-compatible per-action gate decisions.
 *
 * Pure function evaluateGate() returns an allow/deny decision for an (tier, action)
 * pair, plus a sandbox flag. Gate decisions compose with existing CAPCOM gates
 * without modifying them — the trust gate is strictly additive.
 *
 * Default-off guarantee: nothing in this module runs on import. Callers must
 * explicitly invoke evaluateGate().
 *
 * @module trust-tiers/gate
 */

import type { TrustTier, TrustAction, GateDecision, CartridgeTrustRecord, TrustAuditReport } from './types.js';
import { JIANG_2026_VULNERABILITY_BASELINE, TIER_RANK } from './types.js';

/**
 * Decide whether an action is permitted at a given trust tier.
 *
 * Action matrix:
 *                load    execute    modify    share
 *   T1          allow    allow      allow     allow
 *   T2          allow    allow      deny      sandbox
 *   T3          allow    allow      deny      allow(audited only)
 *   T4          sandbox  sandbox    deny      deny
 *
 * Sandbox flag is set when the action is permitted only inside an isolated
 * runtime (e.g. separate worker process, read-only filesystem, network-off).
 */
export function evaluateGate(tier: TrustTier, action: TrustAction): GateDecision {
  let allowed = false;
  let requiresSandbox = false;
  let reason = '';

  switch (tier) {
    case 'T1':
      allowed = true;
      reason = `T1 full access for action=${action}`;
      break;

    case 'T2':
      if (action === 'load' || action === 'execute') {
        allowed = true;
        reason = `T2 permits ${action}`;
      } else if (action === 'share') {
        allowed = true;
        requiresSandbox = true;
        reason = 'T2 share requires sandboxed export (audit log trace)';
      } else {
        allowed = false;
        reason = 'T2 blocks modify: first-party skills must be re-audited after modification';
      }
      break;

    case 'T3':
      if (action === 'load' || action === 'execute') {
        allowed = true;
        reason = `T3 permits ${action} (third-party audited)`;
      } else if (action === 'share') {
        allowed = true;
        reason = 'T3 permits share in audited contexts';
      } else {
        allowed = false;
        reason = 'T3 blocks modify: third-party skills cannot be modified without re-audit';
      }
      break;

    case 'T4':
      if (action === 'modify' || action === 'share') {
        allowed = false;
        reason = 'T4 blocks modify/share: untrusted skills have no outbound mutation rights';
      } else {
        allowed = true;
        requiresSandbox = true;
        reason = `T4 permits ${action} only in sandbox`;
      }
      break;
  }

  return { allowed, tier, action, reason, requiresSandbox };
}

/**
 * Helper: does this action require escalation if tier rises above threshold?
 *
 * Used by CAPCOM to decide when a tier-promotion event needs human review.
 * Promotion into T1 (highest trust) always requires review; promotion into T2
 * requires review when crossing from third-party tiers.
 */
export function requiresHumanReviewOnPromote(from: TrustTier, to: TrustTier): boolean {
  if (TIER_RANK[to] >= TIER_RANK[from]) return false; // not a promotion
  if (to === 'T1') return true;
  if (to === 'T2' && (from === 'T3' || from === 'T4')) return true;
  return false;
}

/**
 * Audit the current cartridge set, returning a TrustAuditReport.
 *
 * Pure function: inputs in, report out. No I/O. The CLI layer (trust-audit CLI)
 * is responsible for printing this report in whatever format the user wants.
 */
export function auditCartridges(cartridges: CartridgeTrustRecord[]): TrustAuditReport {
  const byTier: Record<TrustTier, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };
  const t4Cartridges: string[] = [];
  const warnings: string[] = [];
  let vulnCount = 0;
  let auditedCount = 0;

  for (const rec of cartridges) {
    byTier[rec.tier]++;
    if (rec.tier === 'T4') t4Cartridges.push(rec.cartridgeId);
    if (rec.signals.vulnerabilityReports > 0) vulnCount++;
    if (rec.signals.audited) auditedCount++;
  }

  const total = cartridges.length;
  const t4Fraction = total === 0 ? 0 : byTier.T4 / total;
  const vulnFraction = total === 0 ? 0 : vulnCount / total;

  if (total > 0 && t4Fraction >= 0.5) {
    warnings.push(`${(t4Fraction * 100).toFixed(1)}% of cartridges are T4 (sandbox-only); consider auditing third-party skills`);
  }
  if (total > 0 && vulnFraction * 100 >= JIANG_2026_VULNERABILITY_BASELINE) {
    warnings.push(
      `${(vulnFraction * 100).toFixed(1)}% of cartridges carry open vulnerability reports — exceeds the Jiang 2026 baseline of ${JIANG_2026_VULNERABILITY_BASELINE}%`
    );
  }

  // Health score: 0..1. 1 = all T1/T2 + zero vulns + all audited.
  const tierHealth = total === 0 ? 1 : 1 - TIER_RANK_WEIGHTED_AVG(cartridges);
  const vulnHealth = total === 0 ? 1 : 1 - vulnFraction;
  const auditHealth = total === 0 ? 1 : auditedCount / total;
  const healthScore = (tierHealth + vulnHealth + auditHealth) / 3;

  return {
    totalCartridges: total,
    byTier,
    t4Cartridges,
    vulnerabilityBaseline: JIANG_2026_VULNERABILITY_BASELINE,
    healthScore,
    warnings,
  };
}

/** Internal: weighted-average tier rank normalized into [0, 1]. */
function TIER_RANK_WEIGHTED_AVG(cartridges: CartridgeTrustRecord[]): number {
  if (cartridges.length === 0) return 0;
  const sum = cartridges.reduce((acc, c) => acc + (TIER_RANK[c.tier] - 1), 0);
  const maxSum = cartridges.length * 3; // each cartridge contributes at most 3 (T4 rank 4 − 1)
  return sum / maxSum;
}
