/**
 * Living Sensoria M6 types — receptor-state activation (Lanzara net-shift).
 *
 * Wave 0.1 of the Living Sensoria milestone (v1.49.561). Types only;
 * the equations and applicator hook land in Phase 639 (Wave 1 Track A).
 *
 * Source: Lanzara 2023, *Origins of Life's Sensoria*, §13–14 + Appendix III.
 *
 * @module types/sensoria
 */

/**
 * Per-skill sensoria frontmatter block. Declared in skill frontmatter under
 * `sensoria:`; defaults applied when the key is absent. Setting `disabled: true`
 * short-circuits back to the M5 αβγ scoring fallback for this skill.
 */
export interface SensoriaBlock {
  /** High-affinity binding constant. */
  K_H: number;
  /** Low-affinity binding constant. */
  K_L: number;
  /** Initial total-receptor amount. */
  R_T_init: number;
  /** Activation threshold: skill fires iff ΔR_H > theta. */
  theta: number;
  /** Short-circuit to M5 fallback when true. */
  disabled?: boolean;
}

/**
 * Result of a single net-shift computation for a skill–ligand pair.
 * ΔR_H is the equilibrium shift from the inactive state (R_L) to the active
 * state (R_H) induced by the ligand at its current effective intensity [L].
 */
export interface NetShiftResult {
  deltaR_H: number;
  activated: boolean;
  R_H: number;
  R_L: number;
}

/**
 * Slow-timescale desensitisation state for a skill. Time-integrated dose
 * feeds back onto effective K_H (tachyphylaxis); long-term overuse reduces
 * R_T (desensitisation).
 */
export interface DesensitisationState {
  skillId: string;
  integratedDose: number;
  effectiveK_H: number;
  lastUpdateTs: number;
  fadeCount: number;
}
