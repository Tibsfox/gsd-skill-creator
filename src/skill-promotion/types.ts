/**
 * skill-promotion — public types.
 *
 * Thermodynamic skill-promotion schema (Wave 0 / phase 827).
 *
 * The core decision inequality is:
 *
 *   ROI(skill) > 0  ⟺  N_uses · per_use_savings > Landauer_floor · I_K
 *
 * where I_K is the algorithmic mutual information between the substrate and
 * the skill's class descriptor.  Wave 2 (JP-005) fills in the production I_K
 * estimator; the types defined here are stable from Wave 0 onward.
 *
 * Reference: arXiv:2604.20897 — Watts-per-Intelligence Part II: Algorithmic
 * Catalysis (deployment-horizon ROI derivation, §3).
 *
 * @module skill-promotion/types
 */

// ─── Landauer floor constant ──────────────────────────────────────────────────

/**
 * k_B · T · ln(2) at T = 300 K (joules per bit erased).
 *
 * This is the minimum energy required to erase one bit of information at room
 * temperature (Landauer 1961).  Used as the physical cost floor in the
 * deployment-horizon ROI gate.
 *
 * Value: 1.380649e-23 J/K × 300 K × ln(2) ≈ 2.871e-21 J/bit.
 */
export const LANDAUER_FLOOR_JPB = 1.380649e-23 * 300 * Math.LN2;

// ─── Core types ───────────────────────────────────────────────────────────────

/**
 * A skill candidate presented to the promotion gate.
 *
 * Callers that cannot estimate `estimatedIK` should supply `1` (conservative
 * default: every skill has at least 1 bit of mutual information with its
 * target task class).
 */
export interface SkillCandidate {
  /** Unique stable identifier for this skill. */
  id: string;

  /** Projected number of future uses (N_uses). */
  estimatedUses: number;

  /**
   * Bits of computational work saved per use.
   *
   * Represents the per-invocation savings compared to performing the task
   * without the skill.  Must be ≥ 0.  Zero means the skill has no per-use
   * benefit.
   */
  perUseSavingsBits: number;

  /**
   * Estimated algorithmic mutual information I_K(skill ; task_class).
   *
   * Quantifies how much the skill's internal structure is informative about
   * the target task class.  JP-005 (Wave 2) supplies a production estimator;
   * for Wave 0 callers default to 1 (conservative floor).
   */
  estimatedIK: number;
}

/**
 * Full decomposition of the ROI calculation for one skill candidate.
 */
export interface ROIBreakdown {
  /** The candidate that was evaluated. */
  candidate: SkillCandidate;

  /**
   * Total benefit side: N_uses × perUseSavingsBits (bits).
   *
   * Represents the aggregate information-theoretic work saved if the skill is
   * installed.
   */
  payoffBits: number;

  /**
   * Total cost side: LANDAUER_FLOOR_JPB × estimatedIK (joules).
   *
   * The thermodynamic floor cost of encoding the skill onto the substrate.
   */
  installCostJoules: number;

  /**
   * Promotion decision.
   *
   * `'install'`  — payoffBits > installCostJoules / (k_B T ln 2), i.e. ROI > 0.
   * `'reject'`   — ROI ≤ 0; skill is not worth installing at current estimates.
   *
   * Wave 0 placeholder always returns `'reject'`; JP-005 (Wave 2) replaces
   * the gate logic with the full thermodynamic comparison.
   */
  decision: 'install' | 'reject';

  /**
   * Signed margin (bits): payoffBits − (installCostJoules / LANDAUER_FLOOR_JPB).
   *
   * Positive → install region; negative → reject region.
   */
  marginBits: number;
}
