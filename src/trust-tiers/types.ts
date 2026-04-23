/**
 * Four-tier Skill Trust Framework — type definitions.
 *
 * Adopts the T1-T4 trust model from Jiang et al. 2026 (arXiv:2602.12430),
 * which addresses the 26.1% community-skill vulnerability baseline observed
 * in community-contributed skill surveys. Tiers map skill provenance to
 * graduated deployment capabilities:
 *
 *   T1 — first-party, audited          (full access)
 *   T2 — first-party, unaudited        (execute allowed; share/modify gated)
 *   T3 — third-party, audited          (execute allowed; modify blocked)
 *   T4 — third-party, unaudited        (sandbox only)
 *
 * @module trust-tiers/types
 */

/** Four-tier trust label for a cartridge/skill. */
export type TrustTier = 'T1' | 'T2' | 'T3' | 'T4';

/** Inputs to the tier-assignment decision. Pure data, no side effects. */
export interface TrustSignals {
  /** Who produced the skill. */
  provenance: 'first-party' | 'third-party' | 'unknown';
  /** Has a human reviewer signed off on the skill's behavior? */
  audited: boolean;
  /** Is the cartridge cryptographically signed and signature-verified? */
  signatureVerified: boolean;
  /** The source corpus the skill was imported from. */
  sourceCorpus: 'library' | 'wasteland' | 'gastown' | 'dolthub' | 'user' | 'unknown';
  /** Count of corrections applied to this skill across sessions (usage-trust signal). */
  correctionHistory: number;
  /** How long the skill has been in the library (days). */
  ageDays: number;
  /** Open vulnerability reports against this skill. */
  vulnerabilityReports: number;
}

/** Per-action gate decision for a given tier. */
export type TrustAction = 'load' | 'execute' | 'modify' | 'share';

/** Result of the gate decision. */
export interface GateDecision {
  allowed: boolean;
  tier: TrustTier;
  action: TrustAction;
  reason: string;
  requiresSandbox: boolean;
}

/** Result of the tier-assignment function. */
export interface TierAssignment {
  tier: TrustTier;
  rationale: string[];
  /** True if vulnerabilityReports caused a demotion relative to the base rule. */
  demoted: boolean;
  /** True if correctionHistory caused a promotion relative to the base rule. */
  promoted: boolean;
}

/** Result of canPromote(). */
export interface PromotionDecision {
  allowed: boolean;
  from: TrustTier;
  to: TrustTier;
  reason: string;
  requirementsUnmet: string[];
}

/** Telemetry event emitted on tier transition. */
export interface TierTransitionEvent {
  type: 'trust.tier.transition';
  timestamp: string;
  cartridgeId: string;
  from: TrustTier;
  to: TrustTier;
  rationale: string;
}

/** Input to the audit command — a cartridge with metadata. */
export interface CartridgeTrustRecord {
  cartridgeId: string;
  tier: TrustTier;
  signals: TrustSignals;
}

/** Output of the audit command. */
export interface TrustAuditReport {
  totalCartridges: number;
  byTier: Record<TrustTier, number>;
  t4Cartridges: string[];
  vulnerabilityBaseline: number; // always 26.1 — the Jiang et al. 2026 baseline
  healthScore: number; // 0..1, where 1 means all T1/T2 and no vuln reports
  warnings: string[];
}

/** Tier label ordering helper. */
export const TIER_RANK: Record<TrustTier, number> = {
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4,
};

/** The vulnerability baseline this framework exists to beat. */
export const JIANG_2026_VULNERABILITY_BASELINE = 26.1;
