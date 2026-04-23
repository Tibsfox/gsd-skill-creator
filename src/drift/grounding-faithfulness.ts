/**
 * Grounding faithfulness assertion via Semantic Grounding Index (SGI) (DRIFT-24).
 *
 * Adapts the SGI-style (Semantic Grounding Index) grounding probe. Measures
 * angular similarity between the response embedding and both the retrieved
 * context and the original query, distinguishing three behavioural classes:
 *
 *  - 'grounded' — response is angularly close to context; faithfully grounded
 *  - 'lazy'     — response stays close to query but drifts from context
 *                 ("semantic laziness": hallucinated content that parrots the
 *                 query without engaging the retrieved evidence)
 *  - 'drifted'  — response is far from both query and context (incoherence)
 *
 * Thresholds (configurable):
 *  - `groundingThreshold` (default 0.8) — angular similarity to context required
 *    for 'grounded' classification
 *  - `lazyThreshold` (default 0.85) — similarity to query above which, when
 *    context similarity is below `groundingThreshold`, classification is 'lazy'
 *
 * Default-off guarantee: this module exports pure functions. Nothing runs on
 * import. No global hooks are registered. When the
 * `drift.retrieval.groundingFaithfulness` feature flag is false (default), the
 * check returns a stub result with classification 'grounded' and all scores at
 * 1.0 — byte-identical to pre-check behaviour.
 *
 * Feature-flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "drift": {
 *       "retrieval": {
 *         "groundingFaithfulness": true
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * Telemetry: emits a `drift.retrieval.lazy_grounding_detected` event to
 * `.logs/drift-telemetry.jsonl` when classification is 'lazy'. Best-effort
 * write — never throws.
 *
 * @module drift/grounding-faithfulness
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Classification of response grounding quality. */
export type GroundingClassification = 'grounded' | 'lazy' | 'drifted';

/** Input to `checkGroundingFaithfulness`. */
export interface GroundingFaithfulnessInput {
  /** Embedding of the generated response. */
  response_embedding: number[];
  /** Embedding of the original query. */
  query_embedding: number[];
  /** Embedding of the retrieved context. */
  context_embedding: number[];
}

/** Result returned by `checkGroundingFaithfulness`. */
export interface GroundingFaithfulnessResult {
  /**
   * Semantic Grounding Index score in [0, 1].
   * Higher = response is more faithfully grounded in the retrieved context.
   * Computed as angular similarity between response and context embeddings.
   */
  sgi_score: number;
  /**
   * Angular (cosine) similarity between response and context embeddings.
   * 1.0 = identical direction, 0.0 = orthogonal, -1.0 = opposite.
   */
  angular_response_to_context: number;
  /**
   * Angular (cosine) similarity between response and query embeddings.
   */
  angular_response_to_query: number;
  /** Grounding classification. */
  classification: GroundingClassification;
}

/** Options accepted by `checkGroundingFaithfulness`. */
export interface GroundingFaithfulnessOptions {
  /**
   * Minimum angular similarity to context for 'grounded' classification.
   * Default: 0.8.
   */
  groundingThreshold?: number;
  /**
   * Minimum angular similarity to query for 'lazy' classification
   * (when context similarity is below groundingThreshold).
   * Default: 0.85.
   */
  lazyThreshold?: number;
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

const DEFAULT_GROUNDING_THRESHOLD = 0.8;
const DEFAULT_LAZY_THRESHOLD = 0.85;

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

/**
 * Read `drift.retrieval.groundingFaithfulness` from settings.json.
 * Returns false on any read / parse / shape error.
 */
export function readGroundingFaithfulnessFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
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
    if (!scope || typeof scope !== 'object') return false;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return false;
    const retrieval = (drift as Record<string, unknown>).retrieval;
    if (!retrieval || typeof retrieval !== 'object') return false;
    const flag = (retrieval as Record<string, unknown>).groundingFaithfulness;
    return flag === true;
  } catch {
    return false;
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

/**
 * Compute cosine (angular) similarity between two vectors.
 * Returns 0 when either vector is zero-length.
 *
 * Throws when `a.length !== b.length` — cosine similarity is only well-defined
 * on equal-length vectors. The previous permissive (truncating) implementation
 * mixed a truncated dot product with full-length norms, which produced
 * mathematically incorrect values for mismatched inputs.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity requires equal-length vectors; got ${a.length} and ${b.length}`,
    );
  }
  const len = a.length;
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  const normA = _l2Norm(a);
  const normB = _l2Norm(b);
  if (normA < 1e-12 || normB < 1e-12) return 0;
  return dot / (normA * normB);
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

interface GroundingTelemetryEvent {
  type: 'drift.retrieval.lazy_grounding_detected';
  sgi_score: number;
  angular_response_to_context: number;
  angular_response_to_query: number;
  classification: GroundingClassification;
  timestamp: string;
}

/**
 * Emit a telemetry event to the drift JSONL log.
 * Swallows all errors — must never throw.
 */
function _emitTelemetry(event: GroundingTelemetryEvent, telemetryPath: string): void {
  try {
    mkdirSync(dirname(telemetryPath), { recursive: true });
    appendFileSync(telemetryPath, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // intentionally swallowed
  }
}

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------

/**
 * Assert that a generated response is faithfully grounded in the retrieved context.
 *
 * Algorithm (SGI-style):
 * 1. Compute cosine similarity(response, context) → angular_response_to_context.
 * 2. Compute cosine similarity(response, query)   → angular_response_to_query.
 * 3. sgi_score = angular_response_to_context (primary grounding signal).
 * 4. Classify:
 *    - sgi_score >= groundingThreshold → 'grounded'
 *    - sgi_score < groundingThreshold AND angular_response_to_query >= lazyThreshold
 *      → 'lazy' (response parrots query without engaging context)
 *    - otherwise → 'drifted' (response far from both)
 * 5. Emit telemetry when classification='lazy'.
 *
 * When `drift.retrieval.groundingFaithfulness` is false (default), returns
 * `{ sgi_score: 1, angular_response_to_context: 1, angular_response_to_query: 1,
 *    classification: 'grounded' }` with no telemetry.
 *
 * @param input   - Response, query, and context embeddings.
 * @param options - Thresholds, flag, settings, telemetry path overrides.
 * @returns GroundingFaithfulnessResult with scores and classification.
 */
export function checkGroundingFaithfulness(
  input: GroundingFaithfulnessInput,
  options: GroundingFaithfulnessOptions = {},
): GroundingFaithfulnessResult {
  // Resolve feature flag.
  const flagEnabled =
    options.flagOverride !== undefined
      ? options.flagOverride
      : readGroundingFaithfulnessFlag(options.settingsPath ?? '.claude/settings.json');

  // Default-off: return stub when flag is false.
  if (!flagEnabled) {
    return {
      sgi_score: 1,
      angular_response_to_context: 1,
      angular_response_to_query: 1,
      classification: 'grounded',
    };
  }

  const groundingThreshold = options.groundingThreshold ?? DEFAULT_GROUNDING_THRESHOLD;
  const lazyThreshold = options.lazyThreshold ?? DEFAULT_LAZY_THRESHOLD;
  const telemetryPath =
    options.telemetryPath ?? join(process.cwd(), '.logs', 'drift-telemetry.jsonl');

  const angular_response_to_context = cosineSimilarity(
    input.response_embedding,
    input.context_embedding,
  );
  const angular_response_to_query = cosineSimilarity(
    input.response_embedding,
    input.query_embedding,
  );

  const sgi_score = angular_response_to_context;

  // Classify.
  let classification: GroundingClassification;
  if (sgi_score >= groundingThreshold) {
    classification = 'grounded';
  } else if (angular_response_to_query >= lazyThreshold) {
    classification = 'lazy';
  } else {
    classification = 'drifted';
  }

  // Emit telemetry when lazy.
  if (classification === 'lazy') {
    const event: GroundingTelemetryEvent = {
      type: 'drift.retrieval.lazy_grounding_detected',
      sgi_score,
      angular_response_to_context,
      angular_response_to_query,
      classification,
      timestamp: new Date().toISOString(),
    };
    _emitTelemetry(event, telemetryPath);
  }

  return { sgi_score, angular_response_to_context, angular_response_to_query, classification };
}
