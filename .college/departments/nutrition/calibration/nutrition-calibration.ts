/**
 * Nutrition Department Calibration Wiring
 *
 * Registers nutrition domain calibration model with a CalibrationEngine.
 * Includes SafetyBoundary definitions for allergen management (SAFE-04).
 *
 * @module departments/nutrition/calibration/nutrition-calibration
 */

import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import type { CalibrationEngine, DomainCalibrationModel, ComparisonDelta } from '../../../calibration/engine.js';
import { NUTRITION_ALLERGEN_BOUNDARIES } from '../safety/nutrition-allergen-boundaries.js';

// ─── Nutrition Safety Model ──────────────────────────────────────────────────

/**
 * Calibration model for nutrition safety parameters.
 *
 * Embeds the NUTRITION_ALLERGEN_BOUNDARIES so they are accessible via
 * the CalibrationEngine pattern and compatible with SafetyWarden.registerBoundaries().
 */
export const nutritionSafetyModel: DomainCalibrationModel = {
  domain: 'nutrition-allergen-safety',
  parameters: ['cross_contamination_storage_hours', 'trace_allergen_threshold_ppm'],
  science:
    'FDA Food Allergen Labeling and Consumer Protection Act (FALCPA) and FASTER Act (2021) ' +
    'establish the Big 9 major food allergens. FDA gluten-free threshold: <20 ppm. ' +
    'Cross-contamination prevention requires strict separation during storage, preparation, and service. ' +
    'Label reading is non-negotiable as formulations change without notice.',
  safetyBoundaries: NUTRITION_ALLERGEN_BOUNDARIES,

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    // Allergen safety is non-negotiable — calibration only adjusts awareness thresholds
    const base = 2;
    const scaled = base * Math.min(delta.magnitude, 2);
    switch (delta.direction) {
      case 'over':
        return { trace_allergen_threshold_ppm: -scaled };
      case 'under':
        return { trace_allergen_threshold_ppm: scaled };
      case 'miss':
        return {};
      default:
        return {};
    }
  },

  confidence(delta: ComparisonDelta): number {
    switch (delta.direction) {
      case 'over':
      case 'under':
        return Math.min(0.9, 0.7 + delta.magnitude * 0.1);
      case 'miss':
        return 0.5;
      default:
        return 0.3;
    }
  },
};

export function registerNutritionModels(engine: CalibrationEngine): void {
  engine.registerModel(nutritionSafetyModel);
}
