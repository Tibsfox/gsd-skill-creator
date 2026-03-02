/**
 * Physical Education Department Calibration Wiring
 *
 * Registers PE domain calibration models with a CalibrationEngine.
 * Includes SafetyBoundary definitions for exercise intensity and duration (SAFE-03).
 *
 * @module departments/physical-education/calibration/pe-calibration
 */

import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import type { CalibrationEngine, DomainCalibrationModel, ComparisonDelta } from '../../../calibration/engine.js';

export const peSafetyModel: DomainCalibrationModel = {
  domain: 'pe-exercise-safety',
  parameters: ['session_duration_hours', 'hr_reserve_headroom_pct', 'recovery_time_hours'],
  science:
    'ACSM guidelines: general population exercise recommendations limit continuous aerobic sessions ' +
    'to 60-90 minutes for untrained individuals. Heart rate reserve (Karvonen method) provides ' +
    'individualized intensity zones. Recovery time between high-intensity sessions: minimum 24-48 hours.',
  safetyBoundaries: [
    {
      parameter: 'session_duration_hours',
      limit: 3,
      type: 'warning' as const,
      reason:
        'Sessions longer than 3 hours increase injury and overtraining risk for general population',
    },
    {
      parameter: 'recovery_time_hours',
      limit: 24,
      type: 'warning' as const,
      reason:
        'Minimum 24 hours recovery between high-intensity sessions (ACSM overtraining prevention)',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 5;
    const scaled = base * Math.min(delta.magnitude, 2);
    switch (delta.direction) {
      case 'over':
        return { session_duration_hours: -scaled * 0.1, exertion_recovery_hours: scaled * 0.5 };
      case 'under':
        return { session_duration_hours: scaled * 0.05 };
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
        return Math.min(0.7, 0.5 + delta.magnitude * 0.1);
      case 'miss':
        return 0.4;
      default:
        return 0.3;
    }
  },
};

export function registerPEModels(engine: CalibrationEngine): void {
  engine.registerModel(peSafetyModel);
}
