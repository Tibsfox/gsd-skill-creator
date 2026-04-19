/**
 * ME-1 Tractability Classifier — Selector API.
 *
 * Minimal read API exposed for `src/orchestration/selector.ts` to consume in
 * phase 655.  ME-1 exposes the API only — no wiring into the M5 selector
 * happens in this phase (that is phase 655's scope).
 *
 * Design:
 *   - `getTractabilityClass(skillFrontmatter)` — synchronous, pure; returns
 *     the TractabilityClass without I/O.
 *   - `isTractable(skillFrontmatter)` — convenience predicate.
 *   - `isCoinFlip(skillFrontmatter)` — convenience predicate.
 *   - `tractabilityWeight(skillFrontmatter)` — returns a scalar weight in [0,1]
 *     suitable for multiplying a composite score; tractable → 1.0, coin-flip
 *     → 0.5, unknown → 0.5 (conservative).
 *
 * All functions accept the raw frontmatter `output_structure` value (as
 * returned by a YAML parser) and normalise internally via ME-5 resolution.
 *
 * @module tractability/selector-api
 */

import { classifyTractability, type TractabilityClass } from '../output-structure/schema.js';
import { resolveOutputStructure } from '../output-structure/frontmatter.js';

export type { TractabilityClass };

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Return the tractability class for a skill given its raw frontmatter
 * `output_structure` value.
 *
 * This is the primary entry point for phase 655 wiring.
 *
 * @param rawOutputStructure - Raw YAML-parsed value from the skill frontmatter.
 *   Pass `undefined` or `null` when the field is absent.
 */
export function getTractabilityClass(
  rawOutputStructure: unknown,
): TractabilityClass {
  const resolved = resolveOutputStructure(rawOutputStructure);
  // When source is 'default' the skill declared no output_structure — treat as null
  if (resolved.source === 'default') return 'unknown';
  return classifyTractability(resolved.structure);
}

/**
 * Return `true` when the skill is in the tractable regime (structured output
 * declared).  Equivalent to `getTractabilityClass(...) === 'tractable'`.
 */
export function isTractable(rawOutputStructure: unknown): boolean {
  return getTractabilityClass(rawOutputStructure) === 'tractable';
}

/**
 * Return `true` when the skill is in the coin-flip regime (prose output
 * declared).  Equivalent to `getTractabilityClass(...) === 'coin-flip'`.
 */
export function isCoinFlip(rawOutputStructure: unknown): boolean {
  return getTractabilityClass(rawOutputStructure) === 'coin-flip';
}

/**
 * Return a composite-score weight in [0, 1] based on tractability class.
 *
 * The weight is a hint for the M5 selector (phase 655 wiring):
 *   - `tractable`  → 1.0  (full weight; prompt-content edits are reliable)
 *   - `coin-flip`  → 0.5  (half weight; optimization effect is unreliable)
 *   - `unknown`    → 0.5  (conservative; treat as coin-flip until declared)
 *
 * Note: This weight is NOT applied by ME-1 itself — it is read by the M5
 * selector after phase 655 wires the consumption path.
 */
export function tractabilityWeight(rawOutputStructure: unknown): number {
  const cls = getTractabilityClass(rawOutputStructure);
  switch (cls) {
    case 'tractable': return 1.0;
    case 'coin-flip': return 0.5;
    case 'unknown':   return 0.5;
    default: {
      // Exhaustiveness guard
      const _exhaustive: never = cls;
      void _exhaustive;
      return 0.5;
    }
  }
}

/**
 * Summarise tractability for a batch of skill frontmatter values.
 *
 * Useful for the selector when it has a full candidate pool and wants to
 * pre-classify all candidates without calling `getTractabilityClass` in a loop.
 *
 * @returns Map from the index in `rawValues` to its `TractabilityClass`.
 */
export function batchClassify(
  rawValues: readonly unknown[],
): Map<number, TractabilityClass> {
  const result = new Map<number, TractabilityClass>();
  for (let i = 0; i < rawValues.length; i++) {
    result.set(i, getTractabilityClass(rawValues[i]));
  }
  return result;
}
