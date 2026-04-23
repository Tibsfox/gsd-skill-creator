/**
 * Behavioral Contamination Index (BCI) for skill training-pair governance.
 *
 * Adapts Das et al. 2025 TraceAlign BCI (arXiv:2508.02063) for skill-creator
 * training-pair governance. The TraceAlign paper reports 40% → 6.2% drift
 * reduction using BCI-gated filtering of adversarially-contaminated training pairs.
 *
 * BCI quantifies the degree to which a training pair's output activations overlap
 * with known adversarial-span fingerprints. High overlap signals that the pair
 * may propagate adversarial behavioural contamination into the trained skill.
 *
 * Computation (activation-overlap heuristic):
 *   For each adversarial fingerprint vector F_i in the fingerprint set:
 *     overlap_i = cosine_similarity(pair_output_embedding, F_i)
 *   BCI score = max(overlap_i) clamped to [0, 1]
 *
 * This is a synthetic-embedding implementation: the pair input/output strings are
 * embedded via a deterministic TF-IDF–like vectoriser (identical to semantic-drift.ts)
 * rather than a real LLM. Production deployments may substitute a real embedding call
 * while keeping the BCI contract identical.
 *
 * Feature-flag gating:
 *  - `drift.alignment.bciThreshold` (default 0.7) — BCI score above this value
 *    yields BLOCK (exit-equivalent). Configurable via settings.json.
 *
 * The BCI computation itself is always available; only the CLI validation hook
 * (`scripts/drift/bci-validate.mjs`) respects exit-code semantics.
 *
 * Default-off note: this module exports pure functions. Nothing runs on import.
 *
 * @module drift/bci
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A training pair: one input prompt and the expected output. */
export interface TrainingPair {
  /** The input prompt presented to the skill being trained. */
  input: string;
  /** The expected or actual output produced by the skill. */
  output: string;
}

/** A single adversarial fingerprint — a numeric vector. */
export type AdversarialFingerprint = number[];

/** Options for `computeBCI`. */
export interface BCIOptions {
  /** Training pair to evaluate. */
  pair: TrainingPair;
  /** Set of adversarial-span fingerprint vectors to compare against. */
  adversarial_fingerprints: AdversarialFingerprint[];
}

/** Result returned by `computeBCI`. */
export interface BCIResult {
  /**
   * BCI score in [0, 1].
   * 0 = no overlap with adversarial fingerprints.
   * 1 = full overlap (maximally contaminated).
   * Threshold default: 0.7 (configurable via `drift.alignment.bciThreshold`).
   */
  score: number;
  /**
   * Human-readable span identifiers for fingerprints that contributed to
   * the BCI score above half the threshold. Empty when score is near zero.
   */
  overlap_spans: string[];
}

/** Validation result from `validateBCI`. */
export interface BCIValidationResult {
  /** Whether the pair PASSES (score below threshold). */
  pass: boolean;
  /** The computed BCI score. */
  score: number;
  /** The threshold used for the pass/block decision. */
  threshold: number;
  /** Overlap spans reported by computeBCI. */
  overlap_spans: string[];
}

// ---------------------------------------------------------------------------
// Internal: TF-IDF vectoriser (reuses semantic-drift.ts approach)
// ---------------------------------------------------------------------------

/** Build a term-frequency map from a string. */
function _termFrequency(text: string): Map<string, number> {
  const tf = new Map<string, number>();
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  return tf;
}

/** Convert a term-frequency map to a dense numeric vector over a shared vocabulary. */
function _tfToVector(tf: Map<string, number>, vocab: string[]): number[] {
  return vocab.map((term) => tf.get(term) ?? 0);
}

/** Cosine similarity between two numeric vectors. Returns value in [0, 1]. */
function _cosine(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom < 1e-12 ? 0 : Math.min(1, dot / denom);
}

/**
 * Embed a text string into a numeric vector compatible with the fingerprint space.
 *
 * For fingerprints supplied as pre-computed numeric vectors (the common test case),
 * we embed the text using TF-IDF and then compare via cosine similarity against
 * the raw fingerprint vector directly — treating the fingerprint dimensions as
 * a shared latent space.
 *
 * The fingerprint vector length defines the embedding dimension. We project the
 * TF-IDF bag-of-words into that space by:
 *   1. Hashing each token to a bucket index in [0, dim).
 *   2. Accumulating term counts per bucket (FNV-like hash, no crypto dep).
 *   3. L2-normalising the result.
 */
function _embedText(text: string, dim: number): number[] {
  if (dim === 0) return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const bucket = new Float64Array(dim);
  for (const token of tokens) {
    // Simple polynomial hash into [0, dim)
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h = Math.imul(h ^ token.charCodeAt(i), 16777619) >>> 0;
    }
    bucket[h % dim] += 1;
  }

  // L2 normalise
  let norm = 0;
  for (const v of bucket) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm < 1e-12) return Array.from(bucket);
  return Array.from(bucket).map((v) => v / norm);
}

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

/**
 * Read `drift.alignment.bciThreshold` from settings.json.
 * Returns `0.7` (default) on any read / parse / shape error.
 */
export function readBCIThreshold(
  settingsPath: string = '.claude/settings.json',
): number {
  try {
    const raw = (() => {
      const DEFAULT_PATH = '.claude/settings.json';
      const LIB_PATH = '.claude/gsd-skill-creator.json';
      // When the caller didn't override settingsPath (i.e. it's the default
      // harness path), also check the library-native .claude/gsd-skill-creator.json
      // first, since Claude Code's harness rejects unknown keys in settings.json.
      const paths = settingsPath === DEFAULT_PATH ? [LIB_PATH, DEFAULT_PATH] : [settingsPath];
      for (const _p of paths) {
        try {
          const _txt = readFileSync(_p, 'utf8');
          if (_txt) return _txt;
        } catch {}
      }
      throw new Error('no settings file found');
    })();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return 0.7;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return 0.7;
    const alignment = (drift as Record<string, unknown>).alignment;
    if (!alignment || typeof alignment !== 'object') return 0.7;
    const thresh = (alignment as Record<string, unknown>).bciThreshold;
    if (typeof thresh === 'number' && thresh > 0 && thresh <= 1) return thresh;
    return 0.7;
  } catch {
    return 0.7;
  }
}

// ---------------------------------------------------------------------------
// Core BCI computation
// ---------------------------------------------------------------------------

/**
 * Compute the Behavioral Contamination Index for a training pair.
 *
 * Algorithm (Das 2025 TraceAlign BCI, activation-overlap heuristic):
 * 1. Embed the pair's output into a numeric vector using the fingerprint
 *    dimensionality as the embedding space.
 * 2. For each adversarial fingerprint F_i, compute cosine similarity between
 *    the output embedding and F_i.
 * 3. BCI score = max overlap across all fingerprints (clamped to [0, 1]).
 * 4. Collect span labels for fingerprints whose overlap exceeds half the
 *    default threshold (0.35).
 *
 * When `adversarial_fingerprints` is empty, BCI score is 0 (no contamination
 * possible to detect).
 *
 * @param options - TrainingPair + adversarial fingerprint vectors.
 * @returns BCIResult with score and overlap_spans.
 */
export function computeBCI(options: BCIOptions): BCIResult {
  const { pair, adversarial_fingerprints } = options;

  if (adversarial_fingerprints.length === 0) {
    return { score: 0, overlap_spans: [] };
  }

  // Determine embedding dimension from first fingerprint
  const dim = adversarial_fingerprints[0].length;
  if (dim === 0) {
    return { score: 0, overlap_spans: [] };
  }

  // Embed the pair output
  const outputEmbedding = _embedText(pair.output, dim);

  // Compute cosine similarity with each fingerprint
  const overlaps: Array<{ idx: number; similarity: number }> = [];
  for (let i = 0; i < adversarial_fingerprints.length; i++) {
    const fp = adversarial_fingerprints[i];
    const sim = _cosine(outputEmbedding, fp);
    overlaps.push({ idx: i, similarity: sim });
  }

  // BCI score = max overlap
  const maxSim = Math.max(...overlaps.map((o) => o.similarity));
  const score = Math.min(1, Math.max(0, maxSim));

  // Collect span labels for fingerprints that meaningfully overlap (> 0.35)
  const spanThreshold = 0.35;
  const overlap_spans = overlaps
    .filter((o) => o.similarity > spanThreshold)
    .map((o) => `adversarial_span_${o.idx}`);

  return { score, overlap_spans };
}

// ---------------------------------------------------------------------------
// Validation wrapper (for CLI + gate integration)
// ---------------------------------------------------------------------------

/**
 * Validate a training pair against the BCI threshold.
 *
 * Returns `{ pass: true }` when BCI score is below threshold (safe to use
 * the pair for training). Returns `{ pass: false }` when score is at or above
 * threshold (BLOCK — adversarial contamination risk).
 *
 * @param pair - The training pair to validate.
 * @param adversarial_fingerprints - Known adversarial-span fingerprints.
 * @param threshold - BCI threshold (default: 0.7).
 * @returns BCIValidationResult with pass/block decision.
 */
export function validateBCI(
  pair: TrainingPair,
  adversarial_fingerprints: AdversarialFingerprint[],
  threshold: number = 0.7,
): BCIValidationResult {
  const { score, overlap_spans } = computeBCI({ pair, adversarial_fingerprints });
  return {
    pass: score < threshold,
    score,
    threshold,
    overlap_spans,
  };
}
