/**
 * Chemistry Department Calibration Wiring
 *
 * Registers chemistry domain calibration model with a CalibrationEngine.
 * Call registerChemistryModels(engine) at startup to enable chemistry calibration.
 * Updated in Phase 26 to include SafetyBoundary definitions for lab safety (SAFE-01).
 *
 * @module departments/chemistry/calibration/chemistry-calibration
 */

import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import type { CalibrationEngine, DomainCalibrationModel, ComparisonDelta } from '../../../calibration/engine.js';

// ─── Chemistry Safety Model ──────────────────────────────────────────────────

/**
 * Calibration model for chemistry lab safety parameters.
 *
 * Defines measurable safety boundaries for lab procedures:
 * - reaction temperature limits (avoid runaway reactions)
 * - reagent concentration limits (reduce splash/burn risk)
 * - unventilated exposure time limits (prevent vapor accumulation)
 *
 * SafetyBoundary polarity notes:
 * - 'exposure_time_minutes': contains 'time' → upper-limit (proposed <= limit is safe)
 * - 'concentration_zone_molar': contains 'zone' → upper-limit (proposed <= limit is safe)
 * - 'reaction_temperature_headroom_c': no time/zone/storage/hours → lower-limit polarity;
 *   headroom = 200 - actual; limit = 0; violation when actual > 200°C
 *   (proposedValue = 200 - actualTemp; if temp=210, proposedValue=-10, -10 >= 0 is false → violation)
 */
export const chemistrySafetyModel: DomainCalibrationModel = {
  domain: 'chemistry-lab-safety',
  parameters: ['reaction_temperature_c', 'exposure_time_minutes', 'concentration_zone_molar'],
  science:
    'OSHA Laboratory Standard (29 CFR 1910.1450) and NFPA 45 establish lab safety minimums. ' +
    'Reaction temperatures above 200°C require specialized equipment and training. ' +
    'Acid concentrations above 6M cause immediate tissue damage on contact. ' +
    'Exposure to chemical vapors in unventilated spaces beyond 15 minutes creates acute inhalation risk.',
  safetyBoundaries: [
    {
      parameter: 'exposure_time_minutes',
      limit: 15,
      type: 'absolute' as const,
      reason:
        'Maximum unventilated chemical vapor exposure time — 15 minutes before mandatory fresh air break (OSHA IDLH guidelines)',
    },
    {
      parameter: 'concentration_zone_molar',
      limit: 6,
      type: 'absolute' as const,
      reason:
        'Acid concentrations above 6M cause immediate tissue damage — requires specialized handling protocols',
    },
    {
      parameter: 'reaction_temperature_headroom_c',
      limit: 0,
      type: 'absolute' as const,
      reason:
        'Reaction temperature must not exceed 200°C without specialized equipment — headroom = 200 - actual; violation when actual > 200',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    // Chemistry lab accuracy calibration: adjusts expected outcomes
    const base = 5;
    const scaled = base * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'over':
        return { reaction_temperature_c: -scaled, exposure_time_minutes: -scaled * 0.5 };
      case 'under':
        return { reaction_temperature_c: scaled * 0.5, exposure_time_minutes: scaled * 0.3 };
      case 'miss':
        return { reaction_temperature_c: 2 };
      default:
        return {};
    }
  },

  confidence(delta: ComparisonDelta): number {
    switch (delta.direction) {
      case 'over':
      case 'under':
        return Math.min(0.7, 0.5 + delta.magnitude * 0.1);
      case 'miss':
        return 0.4;
      default:
        return 0.3;
    }
  },
};

/**
 * Register chemistry calibration models with the provided engine.
 */
export function registerChemistryModels(engine: CalibrationEngine): void {
  engine.registerModel(chemistrySafetyModel);
}
