/**
 * Intrinsic Telemetry — type definitions.
 *
 * Identifies GSD-internal signals that correlate with mission quality without
 * requiring CAPCOM verdict. The goal is a Spearman-style rank correlation
 * between per-mission internal signals and final mission outcome, mirroring
 * LeJEPA's Figure 1 top-left result (training-loss ↔ downstream-accuracy
 * Spearman ≈ 0.99).
 *
 * Ships default-off (Phase 733 / v1.49.571). Opt-in via
 * `.claude/gsd-skill-creator.json`
 * `heuristics-free-skill-space.intrinsic_telemetry.enabled`.
 *
 * @module intrinsic-telemetry/types
 */

/** One observation pairing an internal signal with a final mission-quality score. */
export interface TelemetrySample {
  /** Stable mission identifier (e.g., "v1.49.571"). */
  missionId: string;
  /** Value of the internal signal. Higher = candidate for better quality. */
  signalValue: number;
  /**
   * Final mission quality score on whatever scale the caller chose (e.g.,
   * retrospective rating 0–10, or composite verification-pass fraction).
   */
  qualityScore: number;
}

/** One signal's rank-correlation report. */
export interface SignalCorrelation {
  /** Signal name, e.g. "test_pass_density", "skill_invocation_entropy". */
  signalName: string;
  /** Spearman rank correlation in [-1, 1]. */
  spearman: number;
  /** Pearson correlation in [-1, 1]. */
  pearson: number;
  /** Number of paired observations used in the computation. */
  sampleCount: number;
  /**
   * Qualitative verdict:
   *   'strong'     → |Spearman| ≥ 0.7
   *   'moderate'   → 0.4 ≤ |Spearman| < 0.7
   *   'weak'       → |Spearman| < 0.4
   *   'insufficient' → sampleCount < 5
   */
  verdict: 'strong' | 'moderate' | 'weak' | 'insufficient';
}

/** Full report — one row per signal name. */
export interface TelemetryReport {
  correlations: ReadonlyArray<SignalCorrelation>;
  /** Signal name with the highest |Spearman|, if any meet the minimum sample threshold. */
  bestSignal?: string;
  /** Reproducibility tag. */
  runTag: string;
}

/** Candidate signal names that the substrate can plumb. */
export const CANDIDATE_SIGNALS = [
  'test_pass_density',
  'skill_invocation_entropy',
  'retrospective_feedforward_uptake',
  'dacp_fidelity_compliance',
  'sigreg_on_embeddings',           // only when Phase 729 SIGReg is available
  'skill_isotropy_audit_deviation', // only when Phase 728 Isotropy Audit is available
] as const;
