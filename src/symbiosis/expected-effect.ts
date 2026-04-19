/**
 * ME-4 — Expected-Effect Classification
 *
 * Pure function that consults the ME-1 selector-api to classify how much
 * measurable effect a teach entry is expected to have on the targeted skill's
 * behaviour, given its tractability class.
 *
 * Mapping (per ME-4 brief, Phase 656):
 *   tractable  → high   (structured output; prompt edits have reliable effect)
 *   coin-flip  → low    (prose output; effect is statistically noise-level)
 *   unknown    → low    (no declared output_structure; conservative default)
 *
 * Confidence scaling: the ME-1 `tractabilityWeight` [0, 1] is reused as an
 * effect-confidence proxy.  A tractable skill at weight 1.0 gets confidence 1.0;
 * coin-flip and unknown at weight 0.5 get confidence 0.5.  Medium is reserved for
 * future hybrid / partial-tractability classes (not yet emitted by ME-1).
 *
 * @module symbiosis/expected-effect
 */

import { getTractabilityClass, tractabilityWeight } from '../tractability/selector-api.js';
import type { TractabilityClass } from '../tractability/selector-api.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ExpectedEffectLevel = 'low' | 'medium' | 'high';

export interface ExpectedEffectResult {
  /** Coarse three-level effect estimate. */
  level: ExpectedEffectLevel;
  /**
   * How the classification was determined.
   *   'me1'      — live lookup via ME-1 selector-api on the provided raw frontmatter.
   *   'fallback' — ME-1 threw or rawOutputStructure was unreachable; defaulted to 'low'.
   */
  source: 'me1' | 'fallback';
  /**
   * Confidence in [0, 1] derived from ME-1 tractability weight.
   * tractable → 1.0, coin-flip/unknown → 0.5.
   */
  confidence: number;
  /** The raw tractability class returned by ME-1 (undefined on fallback). */
  tractabilityClass?: TractabilityClass;
}

// ---------------------------------------------------------------------------
// Core mapping
// ---------------------------------------------------------------------------

/**
 * Map a ME-1 tractability class to an expected-effect level.
 *
 * Rules:
 *   tractable  → high
 *   coin-flip  → low
 *   unknown    → low   (conservative; treat same as coin-flip per CF-ME5-04)
 */
export function levelFromTractabilityClass(cls: TractabilityClass): ExpectedEffectLevel {
  switch (cls) {
    case 'tractable': return 'high';
    case 'coin-flip': return 'low';
    case 'unknown':   return 'low';
    default: {
      // Exhaustiveness guard — new classes added to ME-1 will cause a TS error here.
      const _exhaustive: never = cls;
      void _exhaustive;
      return 'low';
    }
  }
}

// ---------------------------------------------------------------------------
// Primary API
// ---------------------------------------------------------------------------

/**
 * Classify the expected effect of a teach entry on the named skill.
 *
 * @param rawOutputStructure - Raw frontmatter `output_structure` value for the
 *   target skill.  Callers that have already parsed the skill frontmatter should
 *   pass this directly.  Pass `undefined` when the value is absent (conservative
 *   default applies).
 * @returns `ExpectedEffectResult` with level, source, confidence, and class.
 */
export function classifyExpectedEffect(
  rawOutputStructure: unknown,
): ExpectedEffectResult {
  try {
    const cls = getTractabilityClass(rawOutputStructure);
    const weight = tractabilityWeight(rawOutputStructure);
    const level = levelFromTractabilityClass(cls);
    return {
      level,
      source: 'me1',
      confidence: weight,
      tractabilityClass: cls,
    };
  } catch {
    // ME-1 classifier threw (malformed frontmatter, missing module, etc.)
    // Fail-open: return low-confidence low-effect estimate so the teach entry
    // still commits (see ME-4 proposal §Error-recovery).
    return {
      level: 'low',
      source: 'fallback',
      confidence: 0.5,
    };
  }
}

/**
 * Convenience overload: classify by passing a known TractabilityClass directly,
 * bypassing the ME-1 lookup.  Useful in test harnesses and when tractability has
 * already been resolved by the caller.
 *
 * Source is always 'me1' when using this path (the class is treated as authoritative).
 */
export function classifyExpectedEffectFromClass(
  cls: TractabilityClass,
): ExpectedEffectResult {
  const weight = cls === 'tractable' ? 1.0 : 0.5;
  return {
    level: levelFromTractabilityClass(cls),
    source: 'me1',
    confidence: weight,
    tractabilityClass: cls,
  };
}
