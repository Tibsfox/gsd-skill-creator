/**
 * PromptCluster BatchEffect Detector — type definitions.
 *
 * Applies batch-effect detection methodology (Tao et al. 2026,
 * arXiv:2604.14441 "Batch Effects in Brain Foundation Model Embeddings") to
 * the skill-embedding space. Identifies systematic shifts across batches that
 * the v1.49.571 SSIA (Skill Space Isotropy Audit) cannot catch because SSIA
 * tests distribution shape (Cramér-Wold/Anderson-Darling), while batch effects
 * are inter-batch mean/variance shifts — orthogonal failure modes.
 *
 * CAPCOM preservation: read-only audit, no skill-library writes, no gate
 * bypass. Default-off; opt-in via
 * `gsd-skill-creator.upstream-intelligence.promptcluster-batcheffect.enabled`.
 *
 * Cross-link: v1.49.571 SSIA at `src/skill-isotropy/` (arXiv:2511.08544v3,
 * Balestriero & LeCun 2025). Combined audit surface exposed via
 * `src/promptcluster-batcheffect/ssia-composer.ts`.
 *
 * @module promptcluster-batcheffect/types
 */

/**
 * A single embedding entry — a dense vector associated with a skill or prompt
 * instance, identified by an opaque `id` and tagged with a `batchKey` that
 * encodes the source batch.
 */
export interface Embedding {
  /** Stable identifier for the skill / prompt / asset. */
  id: string;
  /** Dense vector. All embeddings in a detection call must share the same dimension. */
  vector: ReadonlyArray<number>;
  /** Optional metadata carried through; not consumed by the detector. */
  metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Identifies the source batch for each embedding. Batch effects manifest as
 * systematic shifts correlated with `batchKey` values.
 *
 * Typical keys:
 * - `{ type: 'model-version', value: 'gpt-4o-mini-2024-07-18' }`
 * - `{ type: 'training-distribution', value: 'corpus-v3' }`
 * - `{ type: 'prompt-template', value: 'template-B' }`
 */
export interface BatchKey {
  /** Which batch-effect type this key encodes. */
  type: BatchEffectType;
  /** Opaque value that distinguishes batches within the type. */
  value: string;
}

/**
 * The three batch-effect types modelled after Tao et al. arXiv:2604.14441.
 *
 * - `'model-version'` — same prompt through different model checkpoints/versions
 *   produces embedding clusters that drift systematically in space.
 * - `'training-distribution'` — different training corpora or fine-tune
 *   checkpoints cause the embedding prior to shift, analogous to scanner/site
 *   effects in fMRI (Tao et al. §2.1).
 * - `'prompt-template'` — variation in prompt framing / instruction style
 *   induces systematic directional shifts independent of content.
 */
export type BatchEffectType =
  | 'model-version'
  | 'training-distribution'
  | 'prompt-template';

/** Statistical evidence for a detected batch effect. */
export interface BatchEffectEvidence {
  /** Batch key that defines the pairs compared. */
  batchKey: BatchKey;
  /**
   * Centroid-shift magnitude: L2 distance between the grand mean embedding and
   * the per-batch centroid, averaged over all batches (Tao et al. §2.2
   * centroid-based batch-divergence measure).
   */
  centroidShiftMagnitude: number;
  /**
   * Welch's t-statistic for the null hypothesis that per-batch projected means
   * equal the grand projected mean. Higher = more evidence of batch effect.
   */
  welchTStatistic: number;
  /**
   * Two-tailed p-value from the Welch t-test. Below the configured
   * `significanceLevel` → batch effect flagged.
   */
  pValue: number;
  /** Number of distinct batch values observed under this batch key. */
  batchCount: number;
  /** Per-batch embedding counts. */
  batchSizes: Record<string, number>;
  /** Human-readable description. */
  description: string;
}

/**
 * Full batch-effect detection report for one call to `detectBatchEffects`.
 *
 * Paper reference: Tao et al. arXiv:2604.14441 — batch-effect framework.
 * Module cross-link: v1.49.571 SSIA (`src/skill-isotropy/`).
 */
export interface BatchEffectReport {
  /**
   * `'disabled'` when the opt-in flag is off; all other fields are empty/zero.
   * `'clean'` when no evidence passes the significance threshold.
   * `'batch-effect-detected'` when ≥1 evidence item is significant.
   */
  status: 'disabled' | 'clean' | 'batch-effect-detected';
  /** Total embedding count analysed. */
  embeddingCount: number;
  /** Embedding dimension. */
  embeddingDim: number;
  /** Batch key used for grouping. */
  batchKey: BatchKey;
  /** Significance level applied. */
  significanceLevel: number;
  /**
   * All batch-effect evidence items, sorted by descending centroid-shift
   * magnitude.
   */
  evidence: ReadonlyArray<BatchEffectEvidence>;
  /**
   * Maximum centroid-shift magnitude observed (0 when disabled or no batches).
   * Comparable to SSIA `maxDeviationScore` for cross-module monitoring.
   */
  maxCentroidShift: number;
  /**
   * Mean centroid-shift magnitude across all evaluated batch pairs.
   * Health indicator: lower = less batch contamination.
   */
  meanCentroidShift: number;
  /**
   * ISO 8601 timestamp of this report (wall-clock; included for reproducibility
   * and cross-correlation with SSIA `runTag`).
   */
  reportedAt: string;
}

/**
 * Combined report produced by `composeWithSSIA` in `ssia-composer.ts`.
 *
 * Brings together SSIA isotropy-collapse signals (from v1.49.571,
 * `src/skill-isotropy/`) with batch-effect signals (this module). Neither
 * half overwrites the other; the combined report is additive.
 */
export interface CombinedReport {
  /** Source module versions for forensic identification. */
  moduleVersions: {
    ssia: string;
    batchEffect: string;
  };
  /** SSIA report as-received; fields match `IsotropyAuditReport`. */
  ssiaReport: unknown;
  /** Batch-effect report as-received. */
  batchEffectReport: BatchEffectReport;
  /**
   * Overall joint status derived from both sub-reports:
   * - `'healthy'`  — SSIA verdict is 'healthy' AND batch status is 'clean'.
   * - `'watch'`    — SSIA verdict is 'watch' OR batch status is 'clean' with
   *                  minor centroid shift.
   * - `'degraded'` — any of: SSIA 'collapse-suspected', batch
   *                  'batch-effect-detected', or both.
   * - `'disabled'` — batch-effect flag off.
   */
  jointStatus: 'healthy' | 'watch' | 'degraded' | 'disabled';
  /**
   * Prose summary: one sentence per sub-report status, concatenated.
   * Useful for logging / telemetry streams without importing both sub-report
   * types.
   */
  summary: string;
}
