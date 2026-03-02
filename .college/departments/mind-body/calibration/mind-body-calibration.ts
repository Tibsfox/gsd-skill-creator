/**
 * Mind-Body Department Calibration Wiring
 *
 * Registers mind-body domain calibration models with a CalibrationEngine.
 * Call registerMindBodyModels(engine) at startup to enable mind-body calibration.
 *
 * Three calibration models:
 * - consistency: time-of-day and day-of-week practice patterns
 * - preference: module frequency and engagement patterns
 * - energy: energy-level correlation with modules and session timing
 *
 * Follows the same wiring pattern as cooking-calibration.ts.
 *
 * @module departments/mind-body/calibration/mind-body-calibration
 */

import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import type { CalibrationEngine, DomainCalibrationModel, ComparisonDelta } from '../../../calibration/engine.js';

// ─── Consistency Model ──────────────────────────────────────────────────────

/**
 * Calibration model for practice timing consistency.
 *
 * Adjusts session scheduling suggestions based on observed vs expected
 * practice regularity. When users are consistent, the system reinforces
 * their rhythm; when patterns shift, it adapts.
 */
export const consistencyModel: DomainCalibrationModel = {
  domain: 'mind-body-consistency',
  parameters: ['session_regularity', 'preferred_day_count', 'session_frequency'],
  science: 'Habit formation research (Lally et al., 2010): average habit formation takes 66 days. ' +
    'Consistency in timing strengthens automaticity. The system tracks practice regularity and ' +
    'adapts scheduling suggestions to match the user\'s natural rhythm.',
  safetyBoundaries: [
    {
      parameter: 'max_daily_sessions',
      limit: 3,
      type: 'warning' as const,
      reason: 'More than 3 practice sessions per day may indicate overtraining',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 10;
    const scaled = base * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'over':
        // More sessions than expected: increase frequency target slightly
        return { session_regularity: scaled * 0.5, session_frequency: scaled * 0.3 };
      case 'under':
        // Fewer sessions: reduce expectations gently
        return { session_regularity: -scaled * 0.3, session_frequency: -scaled * 0.2 };
      case 'miss':
        return { session_regularity: 2 };
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

// ─── Preference Model ───────────────────────────────────────────────────────

/**
 * Calibration model for module preference patterns.
 *
 * Tracks which modules the user engages with most and adjusts content
 * suggestions to deepen preferred areas while gently introducing variety.
 */
export const preferenceModel: DomainCalibrationModel = {
  domain: 'mind-body-preference',
  parameters: ['module_depth', 'variety_score', 'engagement_level'],
  science: 'Self-Determination Theory (Deci & Ryan): intrinsic motivation is sustained by autonomy, ' +
    'competence, and relatedness. The system respects user preferences (autonomy) while suggesting ' +
    'deeper engagement (competence) and cross-module connections (relatedness).',
  safetyBoundaries: [] as SafetyBoundary[],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 8;
    const scaled = base * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'over':
        // Strong preference: deepen that module
        return { module_depth: scaled, variety_score: -scaled * 0.2 };
      case 'under':
        // Less engagement: suggest variety
        return { module_depth: -scaled * 0.3, variety_score: scaled * 0.5 };
      case 'miss':
        return { engagement_level: 3 };
      default:
        return {};
    }
  },

  confidence(delta: ComparisonDelta): number {
    switch (delta.direction) {
      case 'over':
      case 'under':
        return Math.min(0.8, 0.6 + delta.magnitude * 0.1);
      case 'miss':
        return 0.4;
      default:
        return 0.3;
    }
  },
};

// ─── Energy Model ───────────────────────────────────────────────────────────

/**
 * Calibration model for energy-level patterns.
 *
 * Correlates modules and session timing with self-reported energy levels
 * to make informed suggestions about which practices suit different energy states.
 */
export const energyModel: DomainCalibrationModel = {
  domain: 'mind-body-energy',
  parameters: ['energy_baseline', 'energy_sensitivity', 'recovery_factor'],
  science: 'Exercise physiology: different movement modalities affect perceived energy differently. ' +
    'Low-intensity mindful movement (tai chi, gentle yoga) tends to restore energy, while ' +
    'higher-intensity practices (vigorous yoga, martial arts) can either boost or deplete energy ' +
    'depending on the user\'s baseline state. The system learns individual energy responses.',
  safetyBoundaries: [
    {
      parameter: 'min_energy_warning',
      limit: 1,
      type: 'warning' as const,
      reason: 'Consistently low post-session energy may indicate overexertion or underlying fatigue',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 5;
    const scaled = base * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'over':
        // Energy higher than expected: good response to this practice
        return { energy_sensitivity: scaled * 0.5, recovery_factor: scaled * 0.3 };
      case 'under':
        // Energy lower than expected: reduce intensity suggestions
        return { energy_sensitivity: -scaled * 0.4, recovery_factor: -scaled * 0.2 };
      case 'miss':
        return { energy_baseline: 2 };
      default:
        return {};
    }
  },

  confidence(delta: ComparisonDelta): number {
    // Energy perception is subjective, moderate confidence
    switch (delta.direction) {
      case 'over':
      case 'under':
        return Math.min(0.7, 0.5 + delta.magnitude * 0.08);
      case 'miss':
        return 0.35;
      default:
        return 0.3;
    }
  },
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register all 3 mind-body calibration models with the provided engine.
 *
 * @throws TypeError if any model is already registered (use engine.replaceModel() for overrides)
 */
export function registerMindBodyModels(engine: CalibrationEngine): void {
  engine.registerModel(consistencyModel);
  engine.registerModel(preferenceModel);
  engine.registerModel(energyModel);
}
