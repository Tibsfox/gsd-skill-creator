/**
 * Cooking Calibration Models -- domain-specific science for culinary calibration.
 *
 * Four DomainCalibrationModel implementations:
 * - temperatureModel: Newton's law of cooling, USDA safety boundaries
 * - timingModel: Exponential heat penetration, danger zone limits
 * - seasoningModel: Weber-Fechner logarithmic perception
 * - textureModel: Protein denaturation models
 *
 * Safety boundaries are ABSOLUTE -- calibration cannot override minimum
 * internal temperatures (poultry 165F, ground meat 160F, whole cuts 145F).
 *
 * @module calibration/models/cooking
 */

import type { SafetyBoundary } from '../../rosetta-core/types.js';
import type { DomainCalibrationModel, ComparisonDelta } from '../engine.js';

// ─── Temperature Model ──────────────────────────────────────────────────────

export const temperatureModel: DomainCalibrationModel = {
  domain: 'cooking-temperature',
  parameters: ['oven_temp', 'internal_temp', 'surface_temp'],
  science: 'Newton\'s law of cooling: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt). ' +
    'Temperature adjustments are based on the relationship between oven/surface temperature and ' +
    'the observed outcome (overdone vs underdone). Safety boundaries enforce USDA minimum internal ' +
    'temperatures that no calibration adjustment may reduce.',
  safetyBoundaries: [
    {
      parameter: 'poultry_internal_temp',
      limit: 165,
      type: 'absolute' as const,
      reason: 'USDA minimum safe internal temperature for poultry',
    },
    {
      parameter: 'ground_meat_internal_temp',
      limit: 160,
      type: 'absolute' as const,
      reason: 'USDA minimum safe internal temperature for ground meat',
    },
    {
      parameter: 'whole_cuts_internal_temp',
      limit: 145,
      type: 'absolute' as const,
      reason: 'USDA minimum safe internal temperature for whole cuts with 3-minute rest',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 20; // base adjustment in degrees F
    const scaled = base * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'over':
        // Overdone: reduce oven temperature
        return { oven_temp: -scaled, surface_temp: -scaled * 0.5 };
      case 'under':
        // Underdone: increase oven temperature
        return { oven_temp: scaled * 0.75, surface_temp: scaled * 0.4 };
      case 'miss':
        // Missed target: small adjustment
        return { oven_temp: 5 };
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

// ─── Timing Model ───────────────────────────────────────────────────────────

export const timingModel: DomainCalibrationModel = {
  domain: 'cooking-timing',
  parameters: ['cook_time', 'rest_time', 'prep_time'],
  science: 'Exponential heat penetration: core temperature lags surface temperature due to ' +
    'thermal conductivity limits. Thicker foods require disproportionately more time. The danger ' +
    'zone (40-140F) imposes an absolute 120-minute limit on food exposure.',
  safetyBoundaries: [
    {
      parameter: 'danger_zone_time',
      limit: 120,
      type: 'absolute' as const,
      reason: 'Maximum time food may remain in 40-140F danger zone',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    // 12.5% base adjustment (midpoint of 10-15%)
    const factor = 0.125 * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'under':
        // Undercooked: increase cook time
        return { cook_time: factor * 100, rest_time: factor * 20 };
      case 'over':
        // Overcooked: decrease cook time
        return { cook_time: -factor * 100, rest_time: -factor * 10 };
      case 'miss':
        return { cook_time: 5 };
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
        return 0.5;
      default:
        return 0.3;
    }
  },
};

// ─── Seasoning Model ────────────────────────────────────────────────────────

export const seasoningModel: DomainCalibrationModel = {
  domain: 'cooking-seasoning',
  parameters: ['salt_amount', 'spice_amount', 'acid_amount'],
  science: 'Weber-Fechner law: perceived intensity is logarithmic (deltaI/I = constant). ' +
    'Each successive seasoning adjustment should be smaller because perception follows a ' +
    'logarithmic curve -- doubling salt does not double perceived saltiness.',
  safetyBoundaries: [
    {
      parameter: 'sodium_daily_max',
      limit: 2300,
      type: 'absolute' as const,
      reason: 'FDA recommended daily sodium limit in milligrams',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    // Weber-Fechner: logarithmic scaling
    const logFactor = Math.log(1 + delta.magnitude) * 5;

    switch (delta.direction) {
      case 'under':
        // Bland: increase seasoning
        return {
          salt_amount: logFactor,
          spice_amount: logFactor * 0.8,
          acid_amount: logFactor * 0.5,
        };
      case 'over':
        // Over-seasoned: decrease
        return {
          salt_amount: -logFactor,
          spice_amount: -logFactor * 0.8,
          acid_amount: -logFactor * 0.5,
        };
      case 'miss':
        return { salt_amount: 1, spice_amount: 1 };
      default:
        return {};
    }
  },

  confidence(delta: ComparisonDelta): number {
    // Taste is subjective, lower confidence overall
    switch (delta.direction) {
      case 'over':
      case 'under':
        return Math.min(0.7, 0.5 + delta.magnitude * 0.05);
      case 'miss':
        return 0.4;
      default:
        return 0.3;
    }
  },
};

// ─── Texture Model ──────────────────────────────────────────────────────────

export const textureModel: DomainCalibrationModel = {
  domain: 'cooking-texture',
  parameters: ['heat_level', 'moisture_amount', 'cook_time', 'fat_amount'],
  science: 'Protein denaturation models: temperature determines which proteins denature, ' +
    'affecting texture. Collagen converts to gelatin above 70C (158F) with extended time. ' +
    'Over-denaturation expels moisture (dry result). Under-denaturation leaves food raw or tough.',
  safetyBoundaries: [
    {
      parameter: 'minimum_internal_temp',
      limit: 145,
      type: 'absolute' as const,
      reason: 'Minimum safe internal temperature for most proteins',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 15;
    const scaled = base * Math.min(delta.magnitude, 2);

    switch (delta.direction) {
      case 'over':
        // Too dry/overcooked: reduce heat, add moisture
        return {
          heat_level: -scaled,
          moisture_amount: scaled * 0.5,
          cook_time: -scaled * 0.3,
          fat_amount: scaled * 0.2,
        };
      case 'under':
        // Too wet/raw: increase heat and time
        return {
          heat_level: scaled,
          moisture_amount: -scaled * 0.3,
          cook_time: scaled * 0.5,
          fat_amount: 0,
        };
      case 'miss':
        return { heat_level: 5, cook_time: 3 };
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
