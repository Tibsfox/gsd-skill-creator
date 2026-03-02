/**
 * Electronics safety boundaries and checker for electrical safety enforcement.
 *
 * Implements numeric SafetyBoundary definitions for the existing SafetyWarden
 * (IEC 60364 SELV standard: 50V DC, 25V AC RMS safe limits). Three helper
 * functions expose annotate/gate/redirect behavior using SafetyWarden.
 *
 * SafetyWarden polarity (CRITICAL):
 * - Parameters containing 'time', 'zone', 'storage', 'hours' → upper-limit
 *   (proposed <= limit is safe → maximum allowed value semantics)
 * - All other parameters → lower-limit (proposed >= limit is safe)
 *
 * All voltage/current parameters use 'zone' in name to trigger upper-limit
 * polarity, correctly modeling them as maximum allowed values.
 *
 * @module departments/electronics/safety/electronics-safety-boundaries
 */

import { SafetyWarden } from '../../../safety/safety-warden.js';
import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import type { SafetyCheckResult } from '../../../safety/types.js';

// ─── Safety Boundary Definitions ────────────────────────────────────────────

/**
 * Electronics safety boundaries based on IEC 60364 (SELV standard) and
 * IEC 60479-1 (body current effects).
 *
 * Parameter naming convention: voltage/current parameters use '_zone_' to
 * activate SafetyWarden upper-limit polarity (proposed <= limit is safe),
 * correctly modeling these as maximum allowed values.
 * Time-based parameters use '_time_' similarly.
 */
export const ELECTRONICS_SAFETY_BOUNDARIES: SafetyBoundary[] = [
  {
    parameter: 'dc_voltage_zone_v',
    limit: 50,
    type: 'absolute' as const,
    reason:
      'IEC 60364 SELV standard: 50V DC is the maximum safe extra-low voltage without shock risk under dry skin conditions',
  },
  {
    parameter: 'ac_voltage_rms_zone_v',
    limit: 25,
    type: 'absolute' as const,
    reason:
      'IEC 60364 SELV standard: 25V AC RMS is the maximum safe extra-low voltage — AC is more dangerous than DC at equivalent voltages',
  },
  {
    parameter: 'body_current_zone_ma',
    limit: 10,
    type: 'absolute' as const,
    reason:
      'IEC 60479-1: 10mA AC is the let-go threshold — above this, muscular contraction prevents releasing the conductor',
  },
  {
    parameter: 'capacitor_discharge_zone_joules',
    limit: 0.1,
    type: 'absolute' as const,
    reason:
      'Capacitor discharge energy above 0.1J can cause ventricular fibrillation — discharge large capacitors through a resistor before handling',
  },
  {
    parameter: 'thermal_runaway_time_seconds',
    limit: 5,
    type: 'warning' as const,
    reason:
      'Component reaching thermal limit for more than 5 seconds risks permanent damage or fire — check heat dissipation design',
  },
  {
    parameter: 'soldering_exposure_time_seconds',
    limit: 3,
    type: 'warning' as const,
    reason:
      'Component lead soldering heat application should not exceed 3 seconds to avoid PCB pad damage',
  },
];

// ─── ElectronicsSafetyChecker ────────────────────────────────────────────────

/**
 * Electronics Safety Checker — thin wrapper around SafetyWarden for electrical safety.
 *
 * Pre-registers ELECTRONICS_SAFETY_BOUNDARIES and exposes annotate/gate/redirect
 * modes via convenience methods that accept parameter value maps.
 */
export class ElectronicsSafetyChecker {
  private warden: SafetyWarden;

  constructor() {
    this.warden = new SafetyWarden();
    this.warden.registerBoundaries(ELECTRONICS_SAFETY_BOUNDARIES);
  }

  /**
   * ANNOTATE MODE: Check electrical safety parameters, returning violations.
   *
   * Iterates the provided parameter map and calls SafetyWarden.check() in
   * 'annotate' mode for each. Collects non-safe results for display.
   *
   * @param params - Map of parameter name to proposed value
   * @returns Array of { parameter, result } for each safety concern found
   */
  annotate(params: Record<string, number>): Array<{ parameter: string; result: SafetyCheckResult }> {
    const violations: Array<{ parameter: string; result: SafetyCheckResult }> = [];

    for (const [parameter, proposedValue] of Object.entries(params)) {
      const result = this.warden.check({ parameter, proposedValue }, 'annotate');
      if (!result.safe) {
        violations.push({ parameter, result });
      }
    }

    return violations;
  }

  /**
   * GATE MODE: Block operation if any absolute boundary is violated.
   *
   * Checks all parameters and returns { allowed: false, violations } if
   * any absolute boundary is exceeded. Warning-only boundaries do not block.
   *
   * @param params - Map of parameter name to proposed value
   * @returns { allowed: boolean, violations: string[] }
   */
  gate(params: Record<string, number>): { allowed: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const [parameter, proposedValue] of Object.entries(params)) {
      const result = this.warden.check({ parameter, proposedValue }, 'gate');
      if (!result.safe && result.boundary?.type === 'absolute') {
        violations.push(
          `${parameter}: ${proposedValue} exceeds absolute limit — ${result.boundary.reason}`,
        );
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  /**
   * REDIRECT MODE: Return safe clamped values for violated parameters.
   *
   * For each parameter violation, SafetyWarden returns the boundary limit
   * as safeValue. Collects all such pairs for substitution.
   *
   * @param params - Map of parameter name to proposed value
   * @returns Array of { parameter, safeValue } for each violation
   */
  redirect(params: Record<string, number>): Array<{ parameter: string; safeValue: number }> {
    const redirects: Array<{ parameter: string; safeValue: number }> = [];

    for (const [parameter, proposedValue] of Object.entries(params)) {
      const result = this.warden.check({ parameter, proposedValue }, 'redirect');
      if (!result.safe && result.safeValue !== undefined) {
        redirects.push({ parameter, safeValue: result.safeValue });
      }
    }

    return redirects;
  }
}
