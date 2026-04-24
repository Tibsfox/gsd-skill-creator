/**
 * SIGReg — Sketched Isotropic Gaussian Regularization primitive.
 *
 * Port of Balestriero & LeCun 2025 (arXiv:2511.08544v3) SIGReg from
 * rbalestr-lab/lejepa (MIT licensed). See ../../license_notices.md for
 * attribution. The ≤80-LOC core computes the average Epps-Pulley ECF
 * statistic over M random unit directions sampled from S^{K-1}.
 *
 * Ships default-off (Phase 729 / v1.49.571). Opt-in via
 * `.claude/gsd-skill-creator.json` `heuristics-free-skill-space.sigreg.enabled`.
 *
 * @module sigreg/types
 */

/** Epps-Pulley test configuration. */
export interface EppsPulleyConfig {
  /** Number of quadrature points for the ECF weighted integral. LeJEPA default: 17. */
  numPoints: number;
  /** Weight function parameter σ in w(t) = e^{-t²/σ²}. LeJEPA default: 1.0. */
  sigma: number;
}

/** SIGReg slicing configuration. */
export interface SigregConfig {
  /**
   * Number of random unit directions sampled from S^{K-1} per regularizer call.
   * LeJEPA Fig 6: M=10 suffices for K=1024 with a 2-coord perturbation;
   * production runs typically use 512–1024 slices.
   */
  numSlices: number;
  /** Univariate-test configuration (Epps-Pulley ECF). */
  univariateTest: EppsPulleyConfig;
  /**
   * Random seed for direction sampling. Unset in production to get fresh
   * randomness; set in tests and audits for reproducibility.
   */
  seed?: number;
}

/** Breakdown of a single SIGReg call. Useful for telemetry and debugging. */
export interface SigregBreakdown {
  /** Average Epps-Pulley statistic across slices (the scalar loss). */
  loss: number;
  /** Per-slice Epps-Pulley statistics (length = numSlices). */
  perSliceStatistic: ReadonlyArray<number>;
  /** Worst-slice statistic (max over sampled directions). */
  maxSliceStatistic: number;
  /** Reproducibility tag encoding the config. */
  runTag: string;
}

/** LeJEPA Abstract + repo reference defaults. */
export const LEJEPA_DEFAULT_CONFIG: SigregConfig = {
  numSlices: 1024,
  univariateTest: { numPoints: 17, sigma: 1.0 },
};
