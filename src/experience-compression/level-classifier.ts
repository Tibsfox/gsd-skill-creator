/**
 * Experience Compression — level classifier.
 *
 * Classifies ExperienceContent into one of three compression levels per the
 * Experience Compression Spectrum axis (Zhang et al., arXiv:2604.15877, §2):
 *
 *   episodic    : high variability, low structural regularity, low abstraction
 *                 → target compression 5–20×
 *   procedural  : moderate variability, notable structural regularity, moderate
 *                 abstraction depth
 *                 → target compression 50–500×
 *   declarative : low variability, high structural regularity, high abstraction
 *                 depth (rule-form)
 *                 → target compression 1000×+
 *
 * Classification is heuristic-based:
 *   1. variabilityScore  (explicit field or derived from payload shape)
 *   2. structuralRegularity (derived from tag hints + payload shape)
 *   3. abstractionDepth  (explicit field or derived from tags)
 *
 * No I/O. Pure functions only.
 *
 * @module experience-compression/level-classifier
 */

import type { ClassificationResult, CompressionLevel, ExperienceContent } from './types.js';

// ---------------------------------------------------------------------------
// Thresholds (tuned to hit target ratio ranges on synthetic fixtures)
// ---------------------------------------------------------------------------

/** variabilityScore above this → episodic lean */
const VARIABILITY_HIGH = 0.6;
/** variabilityScore below this → declarative lean */
const VARIABILITY_LOW = 0.2;

/** abstractionDepth ≥ this → declarative lean */
const ABSTRACTION_DEEP = 3;
/** abstractionDepth ≥ this → procedural lean */
const ABSTRACTION_MID = 1;

// ---------------------------------------------------------------------------
// Payload shape heuristics
// ---------------------------------------------------------------------------

/**
 * Derive a proxy variability score from the payload when the caller did not
 * supply an explicit variabilityScore.
 *
 * Heuristic: arrays of heterogeneous items → high variability (episodic);
 * objects with repetitive keys → low variability (declarative or procedural);
 * plain strings ≥ 200 chars → moderate (procedural).
 */
function deriveVariability(payload: unknown): number {
  if (typeof payload === 'string') {
    // Long strings are likely raw event logs → moderate–high variability
    return Math.min(0.9, 0.4 + Math.min(payload.length, 2000) / 5000);
  }
  if (Array.isArray(payload)) {
    // Arrays of mixed types → high variability
    const types = new Set(payload.map((x) => typeof x));
    return types.size > 1 ? 0.75 : 0.45;
  }
  if (payload !== null && typeof payload === 'object') {
    const keys = Object.keys(payload as Record<string, unknown>);
    // Small objects with numeric/structured values → lower variability
    if (keys.length <= 3) return 0.15;
    if (keys.length <= 6) return 0.35;
    return 0.55;
  }
  // Primitives: numbers, booleans → rule-like, low variability
  return 0.1;
}

/**
 * Derive structural regularity from payload shape and tags.
 *
 * Heuristic: rule-form objects (small, consistent schema) → high regularity;
 * arrays of uniform items → moderate; mixed/long strings → low.
 */
function deriveStructuralRegularity(
  payload: unknown,
  tags?: ReadonlyArray<string>,
): number {
  if (tags?.includes('rule-form') || tags?.includes('declarative')) return 0.9;
  if (tags?.includes('structural-pattern') || tags?.includes('procedural')) return 0.6;
  if (tags?.includes('high-variability') || tags?.includes('episodic')) return 0.1;

  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    const keys = Object.keys(payload as Record<string, unknown>);
    if (keys.length <= 2) return 0.85; // compact rule-like object
    if (keys.length <= 5) return 0.55;
    return 0.3;
  }
  if (Array.isArray(payload)) {
    const types = new Set(payload.map((x) => typeof x));
    return types.size === 1 ? 0.55 : 0.2;
  }
  return 0.15; // string / primitive → low regularity
}

/**
 * Derive abstraction depth proxy when not explicitly provided.
 *
 * Tags take priority. Fallback: deeply nested objects → higher depth.
 */
function deriveAbstractionDepth(
  payload: unknown,
  tags?: ReadonlyArray<string>,
): number {
  if (tags?.includes('rule-form') || tags?.includes('declarative')) return 4;
  if (tags?.includes('structural-pattern') || tags?.includes('procedural')) return 2;
  if (tags?.includes('high-variability') || tags?.includes('episodic')) return 0;

  // Measure nesting depth of object/array payload
  function depth(x: unknown, d: number): number {
    if (d > 5) return d;
    if (Array.isArray(x)) {
      return x.length === 0 ? d : Math.max(...x.map((e) => depth(e, d + 1)));
    }
    if (x !== null && typeof x === 'object') {
      const vals = Object.values(x as Record<string, unknown>);
      return vals.length === 0 ? d : Math.max(...vals.map((v) => depth(v, d + 1)));
    }
    return d;
  }
  return depth(payload, 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify an ExperienceContent record into a CompressionLevel.
 *
 * The three signals (variability, structural regularity, abstraction depth) are
 * combined via a simple scoring scheme. Higher variability and lower abstraction
 * push toward episodic; lower variability and higher abstraction push toward
 * declarative. The procedural band is the default middle ground.
 *
 * @param content  The experience record to classify.
 * @returns        ClassificationResult with level, confidence, and raw signals.
 */
export function classifyLevel(content: ExperienceContent): ClassificationResult {
  const variability =
    content.variabilityScore !== undefined
      ? content.variabilityScore
      : deriveVariability(content.payload);

  const structuralRegularity = deriveStructuralRegularity(content.payload, content.tags);

  const abstractionDepth =
    content.abstractionDepth !== undefined
      ? content.abstractionDepth
      : deriveAbstractionDepth(content.payload, content.tags);

  // --- Classify ---
  let level: CompressionLevel;
  let confidence: number;

  // Declarative: very low variability AND (high abstraction OR high regularity)
  const isDeclarativeLean =
    variability < VARIABILITY_LOW &&
    (abstractionDepth >= ABSTRACTION_DEEP || structuralRegularity >= 0.75);

  // Episodic: high variability OR very low abstraction depth with low regularity
  const isEpisodicLean =
    variability >= VARIABILITY_HIGH ||
    (abstractionDepth === 0 && structuralRegularity < 0.4);

  if (isDeclarativeLean) {
    level = 'declarative';
    // Confidence scales with how strongly the signals agree
    const strengthV = Math.max(0, VARIABILITY_LOW - variability) / VARIABILITY_LOW;
    const strengthA = Math.min(1, abstractionDepth / (ABSTRACTION_DEEP + 1));
    const strengthR = structuralRegularity;
    confidence = 0.5 + 0.5 * ((strengthV + strengthA + strengthR) / 3);
  } else if (isEpisodicLean) {
    level = 'episodic';
    const strengthV = Math.min(1, (variability - VARIABILITY_HIGH + 0.4) / 0.4);
    const strengthR = 1 - structuralRegularity;
    confidence = 0.5 + 0.5 * ((strengthV + strengthR) / 2);
  } else {
    level = 'procedural';
    // Confidence is highest at the centre of the procedural band
    const centreV = 1 - Math.abs(variability - 0.4) / 0.4;
    const centreA =
      abstractionDepth >= ABSTRACTION_MID && abstractionDepth < ABSTRACTION_DEEP ? 0.8 : 0.4;
    confidence = 0.5 + 0.3 * ((centreV + centreA) / 2);
  }

  return {
    level,
    confidence: Math.min(1, Math.max(0.5, confidence)),
    signals: {
      variability,
      structuralRegularity,
      abstractionDepth,
    },
  };
}
