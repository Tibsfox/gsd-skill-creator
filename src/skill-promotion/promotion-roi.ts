/**
 * skill-promotion — ROI gate implementation (Wave 0 minimum-viable).
 *
 * `computeROI` returns a fully-shaped `ROIBreakdown` for any `SkillCandidate`.
 * `shouldInstall` returns `false` unconditionally in Wave 0 — this is the
 * documented placeholder.  JP-005 (Wave 2 / phase 835) replaces this logic
 * with the real thermodynamic comparison:
 *
 *   payoffBits > installCostJoules / LANDAUER_FLOOR_JPB
 *
 * The intermediate values (`payoffBits`, `installCostJoules`, `marginBits`)
 * are computed correctly even in Wave 0 so downstream consumers can inspect
 * them; only the final `decision` / `shouldInstall` gate is deferred.
 *
 * Reference: arXiv:2604.20897 § 3 — deployment-horizon ROI.
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
 * decision          = 'reject'  (Wave 0 placeholder; JP-005 replaces)
 * ```
 *
 * Note on units: `marginBits` is expressed in bits by dividing both sides of
 * the inequality by `LANDAUER_FLOOR_JPB`, which cancels out joules and leaves
 * a dimensionless bit count.
 *
 * @param candidate - Skill candidate to evaluate.
 * @returns Full ROI breakdown with decision set to `'reject'` (Wave 0).
 */
export function computeROI(candidate: SkillCandidate): ROIBreakdown {
  const payoffBits = candidate.estimatedUses * candidate.perUseSavingsBits;
  const installCostJoules = LANDAUER_FLOOR_JPB * candidate.estimatedIK;

  // Express cost in bits (divide both sides of the inequality by LANDAUER_FLOOR_JPB)
  const installCostBits = candidate.estimatedIK; // installCostJoules / LANDAUER_FLOOR_JPB
  const marginBits = payoffBits - installCostBits;

  // Wave 0 placeholder: decision gate deferred to JP-005 (Wave 2).
  const decision: 'install' | 'reject' = 'reject';

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
 * Top-level promotion gate.
 *
 * @param candidate - Skill candidate to evaluate.
 * @returns `true` if the skill should be installed, `false` otherwise.
 *
 * **Wave 0 placeholder**: always returns `false`.  JP-005 (Wave 2) replaces
 * this with the real thermodynamic gate: `computeROI(candidate).marginBits > 0`.
 */
export function shouldInstall(_candidate: SkillCandidate): boolean {
  // Intentional Wave 0 placeholder — JP-005 (phase 835) replaces this body.
  return false;
}
