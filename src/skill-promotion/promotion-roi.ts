/**
 * skill-promotion — deployment-horizon ROI gate (JP-005, Wave 2).
 *
 * `computeROI` returns a fully-shaped `ROIBreakdown` for any `SkillCandidate`.
 * `shouldInstall` is the live ROI gate: install iff
 *
 *   payoffBits > installCostJoules / LANDAUER_FLOOR_JPB
 *
 * Equivalently (after dividing both sides by `LANDAUER_FLOOR_JPB`):
 *
 *   payoffBits > estimatedIK   →  marginBits > 0   →  install
 *
 * The `estimatedIK` field on `SkillCandidate` carries the algorithmic
 * mutual information between substrate and class descriptor; a Wave 3
 * estimator may refine this (see JP-018 multi-step BO autotune in
 * `bo-autotune.ts`), but the gate itself is live.
 *
 * Reference: arXiv:2604.20897 § 3 — deployment-horizon ROI.
 *
 * History: shipped in Wave 0 (phase 827) as a stub returning `false`
 * unconditionally; replaced in Wave 2 (phase 835) by the real gate below.
 *
 * @module skill-promotion/promotion-roi
 */

import { LANDAUER_FLOOR_JPB } from './types.js';
import type { SkillCandidate, ROIBreakdown } from './types.js';

// ─── computeROI ───────────────────────────────────────────────────────────────

/**
 * Compute the full ROI breakdown for a skill candidate.
 *
 * The breakdown arithmetic is:
 *
 * ```
 * payoffBits       = estimatedUses × perUseSavingsBits
 * installCostJoules = LANDAUER_FLOOR_JPB × estimatedIK
 * marginBits        = payoffBits − (installCostJoules / LANDAUER_FLOOR_JPB)
 *                   = payoffBits − estimatedIK          (dimensionless bits)
 * decision          = marginBits > 0 ? 'install' : 'reject'
 * ```
 *
 * Note on units: `marginBits` is expressed in bits by dividing both sides of
 * the inequality by `LANDAUER_FLOOR_JPB`, which cancels out joules and leaves
 * a dimensionless bit count.
 *
 * @param candidate - Skill candidate to evaluate.
 * @returns Full ROI breakdown with `decision` set per the live gate.
 */
export function computeROI(candidate: SkillCandidate): ROIBreakdown {
  const payoffBits = candidate.estimatedUses * candidate.perUseSavingsBits;
  const installCostJoules = LANDAUER_FLOOR_JPB * candidate.estimatedIK;

  // Express cost in bits (divide both sides of the inequality by LANDAUER_FLOOR_JPB)
  const installCostBits = candidate.estimatedIK; // installCostJoules / LANDAUER_FLOOR_JPB
  const marginBits = payoffBits - installCostBits;

  // Live ROI gate — install iff marginBits > 0 (JP-005, Wave 2).
  const decision: 'install' | 'reject' = marginBits > 0 ? 'install' : 'reject';

  return {
    candidate,
    payoffBits,
    installCostJoules,
    decision,
    marginBits,
  };
}

// ─── shouldInstall ────────────────────────────────────────────────────────────

/**
 * Top-level promotion gate (JP-005, Wave 2, phase 835).
 *
 * Implements the full thermodynamic ROI gate:
 *
 *   ROI(skill) > 0  ⟺  N_uses · per_use_savings > Landauer_floor · I_K
 *
 * Equivalently (normalised to bits by dividing both sides by LANDAUER_FLOOR_JPB):
 *
 *   payoffBits > estimatedIK   →  marginBits > 0   →  install
 *
 * Reference: arXiv:2604.20897 §3 — deployment-horizon ROI gate.
 *
 * @param candidate - Skill candidate to evaluate.
 * @returns `true` if ROI > 0 (payoffBits > Landauer floor × I_K); `false`
 *   otherwise.
 */
export function shouldInstall(candidate: SkillCandidate): boolean {
  return computeROI(candidate).marginBits > 0;
}
