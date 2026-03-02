/**
 * Electronics Department Calibration Wiring
 *
 * Registers electronics domain calibration model with a CalibrationEngine.
 * Updated in Phase 26 to include SafetyBoundary definitions for electrical safety (SAFE-02).
 *
 * @module departments/electronics/calibration/electronics-calibration
 */

import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import type { CalibrationEngine, DomainCalibrationModel, ComparisonDelta } from '../../../calibration/engine.js';

// ─── Electronics Safety Model ────────────────────────────────────────────────

/**
 * Calibration model for electronics lab safety parameters.
 *
 * Defines measurable safety boundaries based on IEC 60364 (SELV standard):
 * - DC voltage zone limit: 50V (safe extra-low voltage)
 * - AC voltage RMS zone limit: 25V
 * - Body current zone limit: 10mA (let-go threshold)
 * - Capacitor discharge energy zone: 0.1J (VF risk threshold)
 *
 * Parameter naming uses 'zone' suffix to activate SafetyWarden's upper-limit
 * polarity: proposed <= limit is safe (maximum allowed value semantics).
 */
export const electronicsModel: DomainCalibrationModel = {
  domain: 'electronics-safety',
  parameters: ['dc_voltage_zone_v', 'ac_voltage_rms_zone_v', 'body_current_zone_ma', 'capacitor_discharge_zone_joules'],
  science:
    'IEC 60364-4-41 (SELV standard): 50V DC and 25V AC RMS are the maximum safe extra-low voltage ' +
    'thresholds for dry skin contact. IEC 60479-1: 10mA AC is the let-go threshold for adult males. ' +
    'Capacitor discharge above 0.1J can cause ventricular fibrillation on chest contact.',
  safetyBoundaries: [
    {
      parameter: 'dc_voltage_zone_v',
      limit: 50,
      type: 'absolute' as const,
      reason: 'IEC 60364 SELV: 50V DC maximum safe extra-low voltage',
    },
    {
      parameter: 'ac_voltage_rms_zone_v',
      limit: 25,
      type: 'absolute' as const,
      reason: 'IEC 60364 SELV: 25V AC RMS maximum safe extra-low voltage',
    },
    {
      parameter: 'body_current_zone_ma',
      limit: 10,
      type: 'absolute' as const,
      reason: 'IEC 60479-1: 10mA AC let-go threshold — above this level muscular contraction prevents releasing the conductor',
    },
    {
      parameter: 'capacitor_discharge_zone_joules',
      limit: 0.1,
      type: 'absolute' as const,
      reason: 'Capacitor discharge energy above 0.1J can cause ventricular fibrillation — discharge large capacitors through a resistor before handling',
    },
  ],

  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    const base = 5;
    const scaled = base * Math.min(delta.magnitude, 2);
    switch (delta.direction) {
      case 'over':
        return { dc_voltage_zone_v: -scaled };
      case 'under':
        return { dc_voltage_zone_v: scaled * 0.5 };
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
        return Math.min(0.8, 0.6 + delta.magnitude * 0.1);
      case 'miss':
        return 0.4;
      default:
        return 0.3;
    }
  },
};

/**
 * Register electronics calibration models with the provided engine.
 */
export function registerElectronicsModels(engine: CalibrationEngine): void {
  engine.registerModel(electronicsModel);
}
