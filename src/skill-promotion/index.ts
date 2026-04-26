/**
 * skill-promotion — barrel export (Wave 0 / phase 827).
 *
 * Thermodynamic skill-promotion mathematics for gsd-skill-creator.
 *
 * The central decision inequality is:
 *
 *   ROI(skill) > 0  ⟺  N_uses · per_use_savings > Landauer_floor · I_K
 *
 * Wave 0 ships the schema + minimum-viable gate.  JP-005 (Wave 2 / phase 835)
 * wires the real ROI comparator and the first callsite.  JP-018 (Wave 3 /
 * phase 844) adds multi-step Bayesian-optimization auto-tuning on top.
 *
 * Reference: arXiv:2604.20897 — Watts-per-Intelligence Part II: Algorithmic
 * Catalysis (deployment-horizon ROI, §3).
 *
 * @module skill-promotion
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type { SkillCandidate, ROIBreakdown } from './types.js';
export { LANDAUER_FLOOR_JPB } from './types.js';

// ─── ROI gate ─────────────────────────────────────────────────────────────────
export { computeROI, shouldInstall } from './promotion-roi.js';
