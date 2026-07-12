/**
 * Pedagogy Calibration Model -- domain science for rendering-complexity feedback.
 *
 * When a user rates a translation as too-complex or too-simple, that feedback
 * calibrates the *pedagogical depth* the Rosetta Core should render at. This
 * model plugs into the universal CalibrationEngine so RosettaCore.processFeedback
 * produces a real, persisted CalibrationDelta on the `complexity` parameter --
 * the same key ExpressionRenderer.renderCalibrated reads to pick a RenderDepth.
 *
 * Science: cognitive-load theory. Over-dense material (too-complex) exceeds
 * working-memory capacity and calls for a simpler tier; over-sparse material
 * (too-simple) under-loads and calls for a deeper tier. Adjustments are held to
 * a small fixed step so a single rating never swings depth by more than one tier.
 *
 * @module calibration/models/pedagogy
 */

import type { DomainCalibrationModel, ComparisonDelta } from '../engine.js';

/** Domain key for the pedagogical rendering-complexity calibration model. */
export const COMPLEXITY_DOMAIN = 'rosetta-complexity';

/** Fixed per-feedback adjustment step on the `complexity` parameter. */
export const COMPLEXITY_STEP = 0.1;

/**
 * DomainCalibrationModel governing render-depth complexity.
 *
 * - direction 'over'  (too-complex)  -> reduce complexity  ({ complexity: -step })
 * - direction 'under' (too-simple)   -> raise  complexity  ({ complexity: +step })
 * - direction 'miss'  (on target)    -> no change          ({ complexity: 0 })
 */
export const complexityModel: DomainCalibrationModel = {
  domain: COMPLEXITY_DOMAIN,
  parameters: ['complexity'],
  science:
    'Cognitive-load theory: pedagogical depth is calibrated against the learner\'s working-memory ' +
    'capacity. Material rated too-complex over-loads and is stepped down a tier; material rated ' +
    'too-simple under-loads and is stepped up a tier. Steps are fixed and small so no single rating ' +
    'swings depth by more than one tier.',
  safetyBoundaries: [],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    if (delta.direction === 'over') return { complexity: -COMPLEXITY_STEP };
    if (delta.direction === 'under') return { complexity: COMPLEXITY_STEP };
    return { complexity: 0 };
  },

  confidence(delta: ComparisonDelta): number {
    return delta.direction === 'miss' ? 0.5 : 0.7;
  },
};
