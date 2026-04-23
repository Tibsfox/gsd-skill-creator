/**
 * Four-tier Skill Trust Framework — public API.
 *
 * Default-off module shipped by Phase 711 (v1.49.570 Convergent Substrate).
 * Source paper: Jiang et al. 2026, arXiv:2602.12430, "Agent Skills for Large
 * Language Models: Architecture, Acquisition, Security, and the Path Forward".
 *
 * The module addresses the 26.1% community-skill vulnerability baseline by
 * mapping skill provenance to graduated deployment capabilities via four
 * trust tiers (T1-T4). All module exports are pure functions with no side
 * effects; callers explicitly invoke the API.
 *
 * @module trust-tiers
 */

export type {
  TrustTier,
  TrustAction,
  TrustSignals,
  GateDecision,
  TierAssignment,
  PromotionDecision,
  TierTransitionEvent,
  CartridgeTrustRecord,
  TrustAuditReport,
} from './types.js';

export { TIER_RANK, JIANG_2026_VULNERABILITY_BASELINE } from './types.js';

export { assignTier, canPromote } from './assign.js';

export { evaluateGate, requiresHumanReviewOnPromote, auditCartridges } from './gate.js';
