/**
 * Semantic Drift (SD) score detector for long-form agent outputs.
 *
 * Adapts the Spataru et al. 2024 methodology (arXiv:2404.05411).
 * Core finding: SD score clusters at 0.77–0.79 across six frontier LLMs on a
 * 500-biography FActScore corpus; oracle early-stopping at the drift point
 * raises FActScore from 44.6% to 81.7%. 37% of paragraphs drift within the
 * first 10% of facts.
 *
 * This module implements a lightweight TF-IDF–like claim-window similarity
 * baseline (no external LLM calls required). It is intentionally simple —
 * a production deployment should swap the `_embedWindow` function for a
 * real embedding API while keeping the scoring contract identical.
 *
 * Telemetry: emits a `drift.knowledge.detected` event to
 * `.logs/drift-telemetry.jsonl` when the score exceeds the configured
 * threshold. This write is best-effort: a failure is silently swallowed
 * so the detector itself never throws because of logging.
 *
 * Default-off guarantee: this module exports pure functions. Nothing runs
 * on import. No global hooks are registered. Existing test suite behaviour
 * is unchanged unless a caller explicitly invokes `detectSemanticDrift`.
 *
 * @module drift/semantic-drift
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Result returned by `detectSemanticDrift`. */
export interface SDResult {
  /**
   * Semantic drift score in [0, 1].
   * Higher = more drift detected relative to early-window vocabulary.
   * Mirrors Spataru 2024's SD score axis (0 = no drift, 1 = maximal drift).
   */
  score: number;
  /**
   * Claim index (0-based) at which drift was detected.
   * Null when the score is below the detection threshold or when the text
   * has fewer than two windows to compare.
   */
  drift_point: number | null;
  /**
   * Confidence of the drift detection in [0, 1].
   * Derived from the slope magnitude relative to the score.
   */
  confidence: number;
}

/** Options accepted by `detectSemanticDrift`. */
export interface SDOptions {
  /**
   * Optional list of reference fact strings to compare against.
   * When provided, the detector supplements window-based similarity with
   * reference-agreement scores.
   */
  referenceFacts?: string[];
  /**
   * Number of claims (sentences) per comparison window.
   * Default: 3. Spataru 2024 uses a sliding window over atomic facts.
   */
  windowSize?: number;
  /**
   * Score threshold above which a `drift.knowledge.detected` telemetry
   * event is emitted and `drift_point` is set.
   * Default: 0.6.
   */
  threshold?: number;
  /**
   * Path to the JSONL telemetry log.
   * Default: `.logs/drift-telemetry.jsonl` relative to process.cwd().
   */
  telemetryPath?: string;
}

// ---------------------------------------------------------------------------
// Claim segmentation
// ---------------------------------------------------------------------------

/**
 * Split text into atomic claim segments (sentence-level).
 * Splits on `.`, `!`, `?` followed by whitespace or end-of-string,
 * and on newlines. Filters empty segments.
 */
export function splitClaims(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// Vocabulary / term-frequency helpers (TF-IDF baseline)
// ---------------------------------------------------------------------------

/** Build a term-frequency map from a string of text. */
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

/** Cosine similarity between two term-frequency maps. Range [0, 1]. */
function _cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const [term, countA] of a) {
    dot += countA * (b.get(term) ?? 0);
    magA += countA * countA;
  }
  for (const [, countB] of b) {
    magB += countB * countB;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Embed a window of claims into a TF vector.
 * Production deployments may replace this with a real embedding call.
 */
function _embedWindow(claims: string[]): Map<string, number> {
  return _termFrequency(claims.join(' '));
}

// ---------------------------------------------------------------------------
// Reference-fact agreement
// ---------------------------------------------------------------------------

/**
 * Score how well a window of claims agrees with the provided reference facts.
 * Returns a value in [0, 1]; 1 = perfect agreement, 0 = no lexical overlap.
 */
function _referenceAgreement(
  window: string[],
  referenceFacts: string[],
): number {
  if (referenceFacts.length === 0) return 1;
  const windowTF = _embedWindow(window);
  const refTF = _termFrequency(referenceFacts.join(' '));
  return _cosineSimilarity(windowTF, refTF);
}

// ---------------------------------------------------------------------------
// Telemetry emit
// ---------------------------------------------------------------------------

interface DriftTelemetryEvent {
  type: 'drift.knowledge.detected';
  score: number;
  drift_point: number | null;
  confidence: number;
  timestamp: string;
}

/**
 * Emit a `drift.knowledge.detected` event to the telemetry log.
 * Swallows all errors — callers must never crash because of logging.
 */
function _emitTelemetry(event: DriftTelemetryEvent, telemetryPath: string): void {
  try {
    mkdirSync(dirname(telemetryPath), { recursive: true });
    appendFileSync(telemetryPath, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // intentionally swallowed: telemetry must not throw
  }
}

// ---------------------------------------------------------------------------
// Core detector
// ---------------------------------------------------------------------------

/**
 * Detect semantic drift in `text` using the Spataru 2024 SD score methodology.
 *
 * Algorithm (sliding-window approach):
 * 1. Segment `text` into atomic claims (sentence-level).
 * 2. Build an anchor window from the first `windowSize` claims (the
 *    "correct-locus" baseline per Spataru 2024).
 * 3. Slide a comparison window through the remaining claims, computing
 *    cosine similarity to the anchor at each step.
 * 4. When reference facts are provided, supplement with reference-agreement
 *    scores: similarity = 0.6 * window_sim + 0.4 * ref_agreement.
 * 5. SD score = 1 − (mean of all window similarities).
 *    High score → low similarity to anchor → drift.
 * 6. Drift point: earliest window index where similarity drops ≥ 0.2 below
 *    the anchor-window self-similarity baseline.
 *
 * @param text - The generated text to analyse.
 * @param options - Optional tuning parameters (see `SDOptions`).
 * @returns SDResult with score, drift_point, and confidence.
 */
export function detectSemanticDrift(text: string, options: SDOptions = {}): SDResult {
  const windowSize = options.windowSize ?? 3;
  const threshold = options.threshold ?? 0.6;
  const referenceFacts = options.referenceFacts ?? [];
  const telemetryPath =
    options.telemetryPath ??
    join(process.cwd(), '.logs', 'drift-telemetry.jsonl');

  const claims = splitClaims(text);

  // Insufficient data: return no-drift with low confidence.
  if (claims.length < windowSize + 1) {
    return { score: 0, drift_point: null, confidence: 0 };
  }

  // Anchor window: first `windowSize` claims.
  const anchorClaims = claims.slice(0, windowSize);
  const anchorTF = _embedWindow(anchorClaims);

  // Anchor self-similarity with reference facts.
  const anchorRefAgreement = _referenceAgreement(anchorClaims, referenceFacts);
  // Self-similarity: always 1.0; blended if ref facts provided.
  const anchorScore =
    referenceFacts.length > 0
      ? 0.6 * 1.0 + 0.4 * anchorRefAgreement
      : 1.0;

  // Sliding window comparison.
  const similarities: number[] = [];
  let driftPoint: number | null = null;

  for (let i = windowSize; i <= claims.length - windowSize; i++) {
    const window = claims.slice(i, i + windowSize);
    const windowTF = _embedWindow(window);
    const windowSim = _cosineSimilarity(anchorTF, windowTF);
    const refAgreement = _referenceAgreement(window, referenceFacts);

    const blended =
      referenceFacts.length > 0
        ? 0.6 * windowSim + 0.4 * refAgreement
        : windowSim;

    similarities.push(blended);

    // Mark first drift point where similarity drops ≥ 0.2 below anchor.
    if (driftPoint === null && anchorScore - blended >= 0.2) {
      driftPoint = i;
    }
  }

  if (similarities.length === 0) {
    return { score: 0, drift_point: null, confidence: 0 };
  }

  const meanSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const score = Math.max(0, Math.min(1, 1 - meanSim));

  // Confidence: proportional to score divided by threshold (capped at 1).
  // If score is at threshold, confidence = 1.0; below → less confident.
  const confidence = score > 0 ? Math.min(1, score / threshold) : 0;

  const result: SDResult = {
    score,
    drift_point: score >= threshold ? driftPoint : null,
    confidence,
  };

  // Emit telemetry when score exceeds threshold.
  if (score >= threshold) {
    const event: DriftTelemetryEvent = {
      type: 'drift.knowledge.detected',
      score,
      drift_point: result.drift_point,
      confidence,
      timestamp: new Date().toISOString(),
    };
    _emitTelemetry(event, telemetryPath);
  }

  return result;
}
