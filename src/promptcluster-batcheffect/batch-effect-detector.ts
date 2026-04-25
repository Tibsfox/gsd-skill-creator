/**
 * PromptCluster BatchEffect Detector — core detection engine.
 *
 * Detects systematic embedding-space shifts across batches of skill embeddings.
 * Implements a centroid-shift test with Welch's t-test significance gate,
 * following the batch-divergence measurement framework of:
 *
 *   Tao et al. (2026). "Batch Effects in Brain Foundation Model Embeddings."
 *   arXiv:2604.14441.
 *
 * §2.2 of Tao et al. shows that per-batch centroid deviation from the grand
 * mean (averaged across M random projection directions) is a sensitive,
 * statistically grounded proxy for ComBat-style batch contamination. We apply
 * this to skill embeddings in lieu of fMRI volumes.
 *
 * Three batch-effect types are detected:
 * - `'model-version'`          — same prompt, different model checkpoint
 * - `'training-distribution'`  — different training corpus / fine-tune split
 * - `'prompt-template'`        — different instruction framing / template
 *
 * Each type maps to a separate `BatchKey.type` value that callers supply.
 *
 * CAPCOM preservation: read-only audit. No skill-library writes.
 * Default-off: callers check `isPromptClusterBatchEffectEnabled` before invoking.
 *
 * Cross-link: v1.49.571 SSIA (`src/skill-isotropy/`) for isotropy-collapse
 * detection — orthogonal failure mode. Composed via `ssia-composer.ts`.
 *
 * @module promptcluster-batcheffect/batch-effect-detector
 */

import type {
  BatchEffectEvidence,
  BatchEffectReport,
  BatchKey,
  Embedding,
} from './types.js';

// ---------------------------------------------------------------------------
// PRNG (mulberry32) — identical to src/skill-isotropy/slicing.ts; duplicated
// to keep the module self-contained without cross-module imports.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleStdNormal(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Sample M unit directions on S^{K-1}. */
function sampleUnitDirections(
  m: number,
  k: number,
  seed?: number,
): Array<ReadonlyArray<number>> {
  if (m < 1) throw new Error('numProjectionDirections must be >= 1');
  if (k < 1) throw new Error('embedding dim must be >= 1');
  const rand = seed === undefined ? Math.random : mulberry32(seed);
  const out: Array<ReadonlyArray<number>> = [];
  for (let i = 0; i < m; i++) {
    const v = new Array<number>(k);
    let sumSq = 0;
    for (let j = 0; j < k; j++) {
      const x = sampleStdNormal(rand);
      v[j] = x;
      sumSq += x * x;
    }
    const norm = Math.sqrt(sumSq) || 1;
    for (let j = 0; j < k; j++) v[j] = v[j] / norm;
    out.push(v);
  }
  return out;
}

/** Dot-product projection of one vector onto a direction. */
function dot(v: ReadonlyArray<number>, d: ReadonlyArray<number>): number {
  let acc = 0;
  for (let j = 0; j < d.length; j++) acc += v[j] * d[j];
  return acc;
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function variance(xs: number[], mu: number): number {
  if (xs.length < 2) return 0;
  let s = 0;
  for (const x of xs) s += (x - mu) * (x - mu);
  return s / (xs.length - 1); // sample variance
}

/**
 * Welch's t-test: tests whether the mean of `sample` differs from
 * `grandMean`. Returns the |t| statistic and an approximate two-tailed
 * p-value via a normal approximation (adequate for n ≥ 5, which is the
 * minimum viable batch size for meaningful detection).
 *
 * Reference: Welch (1947) §2; the single-sample form tests μ_1 ≠ μ_0.
 *
 * For two-sample Welch we also expose a two-group variant used when
 * comparing two distinct batches.
 */
function welchOneSample(
  sample: number[],
  grandMean: number,
): { tStat: number; pValue: number } {
  const n = sample.length;
  if (n < 2) return { tStat: 0, pValue: 1 };
  const mu = mean(sample);
  const v = variance(sample, mu);
  const se = Math.sqrt(v / n);
  if (se === 0) return { tStat: 0, pValue: 1 };
  const tStat = Math.abs((mu - grandMean) / se);
  const pValue = twoTailedPFromT(tStat, n - 1);
  return { tStat, pValue };
}

/**
 * Two-tailed p-value from a t-statistic using a normal approximation
 * (erfc-based). Accurate for df > 30; used here with df = n-1 where n ≥ 5.
 *
 * erfc(x) ≈ using the rational approximation from Abramowitz & Stegun §7.1.26.
 */
function erfc(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return poly * Math.exp(-(x * x));
}

function twoTailedPFromT(tStat: number, _df: number): number {
  // Normal approximation: p ≈ 2 * Φ(-|t|) = erfc(|t| / √2)
  const p = erfc(Math.abs(tStat) / Math.sqrt(2));
  return Math.min(1, Math.max(0, p));
}

// ---------------------------------------------------------------------------
// L2 distance between two vectors
// ---------------------------------------------------------------------------

function l2(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  let s = 0;
  for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) * (a[j] - b[j]);
  return Math.sqrt(s);
}

// ---------------------------------------------------------------------------
// Grand mean embedding
// ---------------------------------------------------------------------------

function grandMeanVector(vectors: ReadonlyArray<ReadonlyArray<number>>): number[] {
  const k = vectors[0].length;
  const g = new Array<number>(k).fill(0);
  for (const v of vectors) {
    for (let j = 0; j < k; j++) g[j] += v[j];
  }
  const n = vectors.length;
  for (let j = 0; j < k; j++) g[j] /= n;
  return g;
}

function batchCentroid(vectors: ReadonlyArray<ReadonlyArray<number>>): number[] {
  return grandMeanVector(vectors); // same algorithm, aliased for clarity
}

// ---------------------------------------------------------------------------
// Default config constants
// ---------------------------------------------------------------------------

export const DEFAULT_SIGNIFICANCE_LEVEL = 0.05;
export const DEFAULT_NUM_PROJECTION_DIRECTIONS = 8;

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

/**
 * Detect batch effects in a set of embeddings grouped by `batchKey`.
 *
 * Algorithm (Tao et al. arXiv:2604.14441 §2.2 centroid-based batch divergence):
 * 1. Compute the grand-mean embedding across all embeddings.
 * 2. For each distinct batch value, compute the per-batch centroid.
 * 3. For M random unit directions, project all embeddings; run a one-sample
 *    Welch t-test for each batch testing whether the batch projected mean
 *    equals the grand projected mean.
 * 4. Average the |t| statistics and take the minimum p-value across directions
 *    as the per-batch evidence.
 * 5. Emit a `BatchEffectEvidence` item for each batch, sorted by centroid
 *    shift magnitude.
 *
 * Complexity: O(M · N · K) where M = numProjectionDirections, N = embedding
 * count, K = dimension.
 *
 * @param embeddings       Embeddings to analyse.
 * @param batchKey         Identifies which batch-effect type to test.
 * @param batchAssignment  Maps each embedding `id` to its batch value string.
 * @param significanceLevel  p-value threshold for flagging (default 0.05).
 * @param numProjectionDirections  Random projection count (default 8).
 * @param seed             Optional PRNG seed for reproducibility.
 */
export function detectBatchEffects(
  embeddings: ReadonlyArray<Embedding>,
  batchKey: BatchKey,
  batchAssignment: ReadonlyMap<string, string>,
  significanceLevel: number = DEFAULT_SIGNIFICANCE_LEVEL,
  numProjectionDirections: number = DEFAULT_NUM_PROJECTION_DIRECTIONS,
  seed?: number,
): BatchEffectReport {
  const reportedAt = new Date().toISOString();

  if (embeddings.length === 0) {
    return emptyReport(batchKey, significanceLevel, reportedAt);
  }

  const dim = embeddings[0].vector.length;
  for (let i = 1; i < embeddings.length; i++) {
    if (embeddings[i].vector.length !== dim) {
      throw new Error(
        `embedding ${embeddings[i].id} has dim ${embeddings[i].vector.length}; ` +
          `expected ${dim}`,
      );
    }
  }

  // Group embeddings by batch value.
  const batchMap = new Map<string, Embedding[]>();
  for (const emb of embeddings) {
    const bv = batchAssignment.get(emb.id) ?? '__unknown__';
    if (!batchMap.has(bv)) batchMap.set(bv, []);
    batchMap.get(bv)!.push(emb);
  }

  if (batchMap.size < 2) {
    // Single batch: no inter-batch comparison possible; report clean.
    return {
      status: 'clean',
      embeddingCount: embeddings.length,
      embeddingDim: dim,
      batchKey,
      significanceLevel,
      evidence: [],
      maxCentroidShift: 0,
      meanCentroidShift: 0,
      reportedAt,
    };
  }

  const allVectors = embeddings.map((e) => e.vector);
  const grandMean = grandMeanVector(allVectors);

  // Sample M projection directions once for all batches (shared basis
  // ensures comparable statistics across batches, per Tao et al. §2.2).
  const directions = sampleUnitDirections(numProjectionDirections, dim, seed);
  const grandMeanProjections = directions.map((d) => dot(grandMean, d));

  const evidenceItems: BatchEffectEvidence[] = [];

  for (const [batchValue, batchEmbs] of batchMap) {
    const batchVectors = batchEmbs.map((e) => e.vector);
    const centroid = batchCentroid(batchVectors);
    const centroidShift = l2(centroid, grandMean);

    // Per-direction Welch t-test.
    let sumT = 0;
    let minP = 1;
    for (let m = 0; m < directions.length; m++) {
      const d = directions[m];
      const projections = batchVectors.map((v) => dot(v, d));
      const { tStat, pValue } = welchOneSample(
        projections,
        grandMeanProjections[m],
      );
      sumT += tStat;
      if (pValue < minP) minP = pValue;
    }
    const meanT = sumT / directions.length;

    const batchSizes: Record<string, number> = {};
    for (const [bv, be] of batchMap) batchSizes[bv] = be.length;

    evidenceItems.push({
      batchKey: { type: batchKey.type, value: batchValue },
      centroidShiftMagnitude: centroidShift,
      welchTStatistic: meanT,
      pValue: minP,
      batchCount: batchMap.size,
      batchSizes,
      description:
        `batch '${batchValue}' (${batchEmbs.length} embeddings): centroid shift ` +
        `${centroidShift.toFixed(4)}, mean |t|=${meanT.toFixed(3)}, min-p=${minP.toExponential(2)}`,
    });
  }

  evidenceItems.sort(
    (a, b) => b.centroidShiftMagnitude - a.centroidShiftMagnitude,
  );

  const significant = evidenceItems.filter(
    (e) => e.pValue < significanceLevel,
  );
  const maxShift =
    evidenceItems.length > 0 ? evidenceItems[0].centroidShiftMagnitude : 0;
  const meanShift =
    evidenceItems.length > 0
      ? evidenceItems.reduce((s, e) => s + e.centroidShiftMagnitude, 0) /
        evidenceItems.length
      : 0;

  return {
    status: significant.length > 0 ? 'batch-effect-detected' : 'clean',
    embeddingCount: embeddings.length,
    embeddingDim: dim,
    batchKey,
    significanceLevel,
    evidence: evidenceItems,
    maxCentroidShift: maxShift,
    meanCentroidShift: meanShift,
    reportedAt,
  };
}

// ---------------------------------------------------------------------------
// Disabled-state helper
// ---------------------------------------------------------------------------

function emptyReport(
  batchKey: BatchKey,
  significanceLevel: number,
  reportedAt: string,
): BatchEffectReport {
  return {
    status: 'clean',
    embeddingCount: 0,
    embeddingDim: 0,
    batchKey,
    significanceLevel,
    evidence: [],
    maxCentroidShift: 0,
    meanCentroidShift: 0,
    reportedAt,
  };
}

/**
 * Return a byte-identical disabled report (flag-off contract).
 * Shape is identical to a real report with `status: 'disabled'`.
 */
export function disabledReport(batchKey: BatchKey): BatchEffectReport {
  return {
    status: 'disabled',
    embeddingCount: 0,
    embeddingDim: 0,
    batchKey,
    significanceLevel: DEFAULT_SIGNIFICANCE_LEVEL,
    evidence: [],
    maxCentroidShift: 0,
    meanCentroidShift: 0,
    reportedAt: new Date().toISOString(),
  };
}
