/**
 * BEE-RAG-style context-entropy guard (DRIFT-25).
 *
 * Adapts the BEE-RAG (Balanced Entropy-Enhanced RAG) entropy probe. Context
 * collapse — where the model attends overwhelmingly to a single retrieved
 * segment while ignoring others — is a precursor to hallucination. This module
 * quantifies that collapse via the Shannon entropy of the attention-weight
 * distribution over context segments, approximated using embedding
 * angular-similarity weights.
 *
 * Algorithm:
 *   For each context_embedding c_i, compute w_i = cosine_similarity(response, c_i).
 *   Shift weights to be non-negative: w_i = max(w_i + 1, 0) / 2 (maps [-1,1] → [0,1]).
 *   Normalise to a probability distribution: p_i = w_i / Σ w_i.
 *   Compute Shannon entropy H = -Σ p_i * log2(p_i).
 *   Normalise: H_norm = H / log2(N)  [0 = fully collapsed, 1 = uniform].
 *   Alternative path: if `token_probabilities` is provided instead of embeddings,
 *   compute entropy directly on the given distribution.
 *
 * Classification bands:
 *  - 'healthy'    — H_norm >= threshold (default 0.5)
 *  - 'collapsing' — threshold/2 <= H_norm < threshold
 *  - 'collapsed'  — H_norm < threshold/2
 *
 * Default-off guarantee: this module exports pure functions. Nothing runs on
 * import. No global hooks are registered. When the
 * `drift.retrieval.contextEntropyGuard` feature flag is false (default), the
 * check returns `{ entropy: 1, threshold: 0.5, classification: 'healthy', alert: false }`
 * — byte-identical to pre-guard behaviour.
 *
 * Feature-flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "drift": {
 *       "retrieval": {
 *         "contextEntropyGuard": true,
 *         "entropyThreshold": 0.5
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * Settings keys read by this module:
 *  - `drift.retrieval.contextEntropyGuard` (boolean, default false) — enables the guard
 *  - `drift.retrieval.entropyThreshold` (number in (0,1], default 0.5) — collapse floor
 *
 * Precedence for `entropyThreshold`: per-call `options.entropyThreshold` >
 * settings value > module default.
 *
 * Telemetry: emits a `drift.retrieval.context_collapse_detected` event to
 * `.logs/drift-telemetry.jsonl` when classification is not 'healthy'.
 * Best-effort write — never throws.
 *
 * @module drift/context-entropy
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Classification of context-attention entropy. */
export type EntropyClassification = 'healthy' | 'collapsing' | 'collapsed';

/** Input to `checkContextEntropy` (embedding path). */
export interface ContextEntropyEmbeddingInput {
  /** One embedding per retrieved context segment. */
  context_embeddings: number[][];
  /** Embedding of the generated response. */
  response_embedding: number[];
  /** Token-probability path — omit when using embedding path. */
  token_probabilities?: undefined;
}

/** Input to `checkContextEntropy` (token-probability path). */
export interface ContextEntropyProbabilityInput {
  /** Pre-computed probability distribution over context tokens / segments. */
  token_probabilities: number[];
  /** Context/response embeddings — omit when using probability path. */
  context_embeddings?: undefined;
  response_embedding?: undefined;
}

/** Union input type — caller provides either embeddings or token probs. */
export type ContextEntropyInput = ContextEntropyEmbeddingInput | ContextEntropyProbabilityInput;

/** Result returned by `checkContextEntropy`. */
export interface ContextEntropyResult {
  /**
   * Normalised Shannon entropy H_norm in [0, 1].
   * 0 = completely collapsed (all weight on one segment).
   * 1 = uniform distribution (maximum diversity).
   */
  entropy: number;
  /** The threshold used for classification. */
  threshold: number;
  /** Entropy classification. */
  classification: EntropyClassification;
  /** True when classification is not 'healthy'. */
  alert: boolean;
}

/** Options accepted by `checkContextEntropy`. */
export interface ContextEntropyOptions {
  /**
   * Normalised-entropy threshold below which classification is 'collapsing'.
   * Default: 0.5. Per-call value takes precedence over the
   * `drift.retrieval.entropyThreshold` settings value, which takes precedence
   * over the module default.
   */
  entropyThreshold?: number;
  /**
   * Path to settings.json for reading the feature flag.
   * Default: `.claude/settings.json`.
   */
  settingsPath?: string;
  /**
   * Override the feature flag directly (skips settings.json read).
   * Useful for testing without filesystem access.
   */
  flagOverride?: boolean;
  /**
   * Path to the JSONL telemetry log.
   * Default: `.logs/drift-telemetry.jsonl` relative to process.cwd().
   */
  telemetryPath?: string;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_ENTROPY_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

/**
 * Read `drift.retrieval.contextEntropyGuard` from settings.json.
 * Returns false on any read / parse / shape error.
 */
export function readContextEntropyFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return false;
    const retrieval = (drift as Record<string, unknown>).retrieval;
    if (!retrieval || typeof retrieval !== 'object') return false;
    const flag = (retrieval as Record<string, unknown>).contextEntropyGuard;
    return flag === true;
  } catch {
    return false;
  }
}

/**
 * Read `drift.retrieval.entropyThreshold` from settings.json.
 * Returns null on any read / parse / shape error (caller may fall back to
 * the per-call option or the module default of 0.5).
 *
 * Valid entropyThreshold is a number in (0, 1] since entropy is normalised.
 */
export function readEntropyThresholdSetting(
  settingsPath: string = '.claude/settings.json',
): number | null {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return null;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return null;
    const retrieval = (drift as Record<string, unknown>).retrieval;
    if (!retrieval || typeof retrieval !== 'object') return null;
    const value = (retrieval as Record<string, unknown>).entropyThreshold;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Vector math helpers
// ---------------------------------------------------------------------------

/** Compute the L2 norm of a vector. */
function _l2Norm(v: number[]): number {
  let sum = 0;
  for (const x of v) sum += x * x;
  return Math.sqrt(sum);
}

/** Compute cosine similarity between two vectors. Returns 0 for zero vectors. */
function _cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  const normA = _l2Norm(a);
  const normB = _l2Norm(b);
  if (normA < 1e-12 || normB < 1e-12) return 0;
  return dot / (normA * normB);
}

/**
 * Compute normalised Shannon entropy of a distribution.
 *
 * @param weights - Raw non-negative weights (need not sum to 1).
 * @returns Normalised entropy in [0, 1]. Returns 1.0 for trivial cases (N <= 1).
 */
export function normalisedShannonEntropy(weights: number[]): number {
  const N = weights.length;
  if (N <= 1) return 1.0; // trivially uniform — treat as healthy

  // Sum weights; guard against all-zero.
  const total = weights.reduce((s, w) => s + w, 0);
  if (total < 1e-12) return 1.0; // no information → treat as uniform

  // Normalise to probability distribution.
  const probs = weights.map((w) => w / total);

  // Shannon entropy H = -Σ p_i * log2(p_i).
  let H = 0;
  for (const p of probs) {
    if (p > 1e-12) H -= p * Math.log2(p);
  }

  // Normalise by maximum entropy log2(N).
  const Hmax = Math.log2(N);
  if (Hmax < 1e-12) return 1.0;
  return Math.min(1, Math.max(0, H / Hmax));
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

interface EntropyTelemetryEvent {
  type: 'drift.retrieval.context_collapse_detected';
  entropy: number;
  threshold: number;
  classification: EntropyClassification;
  timestamp: string;
}

/**
 * Emit a telemetry event to the drift JSONL log.
 * Swallows all errors — must never throw.
 */
function _emitTelemetry(event: EntropyTelemetryEvent, telemetryPath: string): void {
  try {
    mkdirSync(dirname(telemetryPath), { recursive: true });
    appendFileSync(telemetryPath, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // intentionally swallowed
  }
}

// ---------------------------------------------------------------------------
// Core guard
// ---------------------------------------------------------------------------

/**
 * Check whether the context-attention distribution is healthy (high entropy)
 * or collapsing / collapsed (low entropy).
 *
 * Two input paths:
 *  - Embedding path: compute cosine-similarity weights from response vs each
 *    context segment, shift to [0,1], then compute normalised Shannon entropy.
 *  - Probability path: compute normalised Shannon entropy directly on the
 *    provided token_probabilities distribution.
 *
 * When `drift.retrieval.contextEntropyGuard` is false (default), returns
 * `{ entropy: 1, threshold: 0.5, classification: 'healthy', alert: false }`
 * with no telemetry — byte-identical to pre-guard behaviour.
 *
 * @param input   - Context embeddings + response embedding, or token_probabilities.
 * @param options - Threshold, flag, settings, telemetry path overrides.
 * @returns ContextEntropyResult with entropy, threshold, classification, alert.
 */
export function checkContextEntropy(
  input: ContextEntropyInput,
  options: ContextEntropyOptions = {},
): ContextEntropyResult {
  // Resolve feature flag.
  const flagEnabled =
    options.flagOverride !== undefined
      ? options.flagOverride
      : readContextEntropyFlag(options.settingsPath ?? '.claude/settings.json');

  // Threshold precedence: per-call option > settings value > module default.
  // When the flag is off, we still report the per-call threshold (or default)
  // in the stub result; settings are only read when the flag is on to avoid
  // disturbing the default-off byte-identity guarantee.
  if (!flagEnabled) {
    const thresholdOff = options.entropyThreshold ?? DEFAULT_ENTROPY_THRESHOLD;
    return { entropy: 1, threshold: thresholdOff, classification: 'healthy', alert: false };
  }

  const settingsThreshold = readEntropyThresholdSetting(
    options.settingsPath ?? '.claude/settings.json',
  );
  const threshold =
    options.entropyThreshold ?? (settingsThreshold ?? DEFAULT_ENTROPY_THRESHOLD);

  const telemetryPath =
    options.telemetryPath ?? join(process.cwd(), '.logs', 'drift-telemetry.jsonl');

  // Compute raw weights depending on input path.
  let entropy: number;

  if (input.token_probabilities !== undefined) {
    // Probability path: direct Shannon entropy computation.
    // Clip negatives to zero (shouldn't happen, but be defensive).
    const probs = input.token_probabilities.map((p) => Math.max(0, p));
    entropy = normalisedShannonEntropy(probs);
  } else {
    // Embedding path: cosine similarity → weight per context segment.
    const { context_embeddings, response_embedding } = input;

    if (context_embeddings.length === 0) {
      // No context segments → treat as healthy (cannot collapse).
      return { entropy: 1, threshold, classification: 'healthy', alert: false };
    }

    // Compute cosine similarities in [-1, 1] and shift to [0, 1].
    const weights = context_embeddings.map((ctx) => {
      const sim = _cosineSimilarity(response_embedding, ctx);
      return (sim + 1) / 2; // map [-1,1] → [0,1]
    });

    entropy = normalisedShannonEntropy(weights);
  }

  // Classify.
  let classification: EntropyClassification;
  if (entropy >= threshold) {
    classification = 'healthy';
  } else if (entropy >= threshold / 2) {
    classification = 'collapsing';
  } else {
    classification = 'collapsed';
  }

  const alert = classification !== 'healthy';

  // Emit telemetry when not healthy.
  if (alert) {
    const event: EntropyTelemetryEvent = {
      type: 'drift.retrieval.context_collapse_detected',
      entropy,
      threshold,
      classification,
      timestamp: new Date().toISOString(),
    };
    _emitTelemetry(event, telemetryPath);
  }

  return { entropy, threshold, classification, alert };
}
