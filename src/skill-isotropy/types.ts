/**
 * Skill Space Isotropy Audit — type definitions.
 *
 * Applies the Hyperspherical Cramér-Wold theorem (Balestriero & LeCun 2025,
 * arXiv:2511.08544v3, Lemma 3) to the skill library: given semantic embeddings of
 * each skill, sample M random unit directions on S^{K-1}, project every skill
 * along each direction, and run a univariate goodness-of-fit test against a
 * configurable target distribution (default: standard Gaussian). Directions
 * whose projected distribution deviates significantly from target become audit
 * findings.
 *
 * Read-only audit. No skill-library writes. No CAPCOM bypass path.
 * Ships default-off (Phase 728 / v1.49.571). Opt-in via
 * `.claude/gsd-skill-creator.json` `heuristics-free-skill-space.skill_isotropy_audit.enabled`.
 *
 * @module skill-isotropy/types
 */

/** A single skill's semantic embedding for audit purposes. */
export interface SkillEmbedding {
  /** Stable skill identifier. */
  skillId: string;
  /** Dense semantic vector. Length must equal the audit's expected `dim`. */
  vector: ReadonlyArray<number>;
  /** Optional metadata carried through; not used by the audit itself. */
  metadata?: Readonly<Record<string, unknown>>;
}

/** Supported target distributions for the univariate test. */
export type TargetDistribution =
  | 'standard-gaussian'  // N(0, 1) — default per LeJEPA
  | 'uniform-sphere'     // for projections of uniformly-distributed unit vectors
  | 'zero-mean';         // mean-only check (weakest target)

/** Supported univariate goodness-of-fit tests. */
export type UnivariateTest =
  | 'anderson-darling'   // default for N ~ hundreds; no gradient flow required
  | 'ks-statistic'       // simpler; returns KS distance as deviation score
  | 'shapiro-wilk';      // classical; works best for N < 50 per direction

/** Configuration for one audit run. */
export interface IsotropyAuditConfig {
  /** Number of random unit directions to sample from S^{K-1}. LeJEPA Fig 6: M=10 suffices for K=1024. */
  numDirections: number;
  /** Which univariate test to run per direction. */
  univariateTest: UnivariateTest;
  /** Which target distribution to compare against. */
  target: TargetDistribution;
  /**
   * Significance level for per-direction rejection. Deviations with p-value below
   * this threshold become findings. Default: 0.01 (conservative; avoids false
   * positives in small skill libraries).
   */
  significanceLevel: number;
  /**
   * Random seed for direction sampling. Present to make audit runs deterministic
   * for CI; unset in production audits where fresh randomness is desired.
   */
  seed?: number;
}

/** One audit finding: a direction whose projections deviate from the target. */
export interface IsotropyFinding {
  /** Direction index in the audit's sampled direction set. */
  directionIndex: number;
  /** The unit direction itself, for reproducibility. */
  direction: ReadonlyArray<number>;
  /** Scalar deviation score (test statistic). Larger = more anomalous. */
  deviationScore: number;
  /** Approximate p-value for the deviation under the target distribution. */
  pValue: number;
  /** Human-readable one-line description of the anomaly. */
  description: string;
}

/** Full audit report. */
export interface IsotropyAuditReport {
  /** Total skills considered. */
  skillCount: number;
  /** Embedding dimension K. */
  embeddingDim: number;
  /** Config used for this run. */
  config: IsotropyAuditConfig;
  /** Findings (deviating directions) sorted by descending deviation score. */
  findings: ReadonlyArray<IsotropyFinding>;
  /** Mean per-direction deviation score (health indicator; lower = more isotropic). */
  meanDeviationScore: number;
  /** Worst-case deviation score across sampled directions. */
  maxDeviationScore: number;
  /**
   * Overall verdict: 'healthy' (no findings above threshold),
   * 'watch' (some findings but none critical),
   * 'collapse-suspected' (many findings OR high max score).
   */
  verdict: 'healthy' | 'watch' | 'collapse-suspected';
  /**
   * Reproducibility tag: concatenation of config + seed (if set). Useful for
   * the Phase 733 Intrinsic Telemetry correlation pipeline.
   */
  runTag: string;
}

/** LeJEPA Figure 6 reference parameters — useful as a regression sanity check. */
export const LEJEPA_FIG6_REFERENCE = {
  embeddingDim: 1024,
  numDirections: 10,
  sampleCount: 100,
  perturbationDims: 2,
} as const;
