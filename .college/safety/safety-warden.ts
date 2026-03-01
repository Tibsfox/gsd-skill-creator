/**
 * SafetyWarden -- absolute food safety enforcement with three modes.
 *
 * Sits between the CalibrationEngine's adjustment computation and the output,
 * intercepting proposed values and enforcing boundaries. Temperature floors
 * for poultry (165F), ground meat (160F), and whole cuts (145F) are ABSOLUTE
 * and can never be overridden by calibration or user preference.
 *
 * Three enforcement modes:
 * 1. Annotate -- flag safety concern, allow user to proceed
 * 2. Gate -- require explicit acknowledgment before proceeding
 * 3. Redirect -- substitute safe alternative, never expose unsafe value
 *
 * @module safety/safety-warden
 */

import type { SafetyBoundary } from '../rosetta-core/types.js';
import type { SafetyMode, SafetyCheckInput, SafetyCheckResult, DangerZoneEntry } from './types.js';

export class SafetyWarden {
  private boundaries: Map<string, SafetyBoundary> = new Map();
  private dangerZones: Map<string, { temperature: number; startTime: Date }> = new Map();
  private now: () => Date;

  constructor(now?: () => Date) {
    this.now = now ?? (() => new Date());
  }

  /**
   * Register safety boundaries. For duplicate parameters, keep the stricter limit.
   * For temperature boundaries (higher is stricter -- minimum safe temp), keep the higher value.
   * For time boundaries (lower is stricter -- maximum allowed time), keep the lower value.
   */
  registerBoundaries(boundaries: SafetyBoundary[]): void {
    for (const boundary of boundaries) {
      const existing = this.boundaries.get(boundary.parameter);
      if (existing) {
        const existingLimit = typeof existing.limit === 'number' ? existing.limit : 0;
        const newLimit = typeof boundary.limit === 'number' ? boundary.limit : 0;

        // For temp boundaries, higher is stricter (minimum safe temp)
        // For time boundaries, lower is stricter (maximum allowed time)
        const isTimeBoundary = boundary.parameter.includes('time') || boundary.parameter.includes('zone');
        const isStricter = isTimeBoundary
          ? newLimit < existingLimit
          : newLimit > existingLimit;

        if (isStricter) {
          this.boundaries.set(boundary.parameter, boundary);
        }
      } else {
        this.boundaries.set(boundary.parameter, boundary);
      }
    }
  }

  /**
   * Core enforcement method. Check a proposed value against registered boundaries.
   *
   * Returns {safe: true} if no boundary found or value is within limits.
   * Returns mode-specific result if value violates a boundary.
   */
  check(input: SafetyCheckInput, mode: SafetyMode): SafetyCheckResult {
    const boundary = this.boundaries.get(input.parameter);
    if (!boundary) {
      return { safe: true };
    }

    const limit = typeof boundary.limit === 'number' ? boundary.limit : 0;

    // Determine if the value is safe
    // For temperature boundaries, proposedValue must be >= limit (minimum safe temp)
    // For time/zone boundaries, proposedValue must be <= limit (maximum allowed)
    const isTimeBoundary = input.parameter.includes('time') || input.parameter.includes('zone')
      || input.parameter.includes('storage') || input.parameter.includes('hours');
    const isSafe = isTimeBoundary
      ? input.proposedValue <= limit
      : input.proposedValue >= limit;

    if (isSafe) {
      return { safe: true };
    }

    // Unsafe -- return mode-specific result
    const isAbsolute = boundary.type === 'absolute';

    switch (mode) {
      case 'annotate':
        return {
          safe: false,
          action: 'annotate',
          warning: isAbsolute
            ? `SAFETY VIOLATION: ${boundary.reason}`
            : boundary.reason,
          proposedValue: input.proposedValue,
          boundary: isAbsolute ? boundary : undefined,
        };

      case 'gate':
        return {
          safe: false,
          action: 'gate',
          requiresAcknowledgment: true,
          warning: boundary.reason,
          boundary: isAbsolute ? boundary : undefined,
        };

      case 'redirect':
        return {
          safe: false,
          action: 'redirect',
          safeValue: limit,
          reason: boundary.reason,
          boundary: isAbsolute ? boundary : undefined,
        };
    }
  }

  /**
   * Check all calibration adjustments against boundaries.
   *
   * For each parameter in adjustments, compute the resulting value
   * (currentParams[param] + adjustments[param]) and run check().
   * Returns a Map of parameter -> SafetyCheckResult for any violations.
   */
  checkCalibrationOutput(
    adjustments: Record<string, number>,
    currentParams: Record<string, number>,
    mode: SafetyMode,
  ): Map<string, SafetyCheckResult> {
    const violations = new Map<string, SafetyCheckResult>();

    for (const param of Object.keys(adjustments)) {
      const current = currentParams[param] ?? 0;
      const resultingValue = current + adjustments[param];
      const result = this.check({ parameter: param, proposedValue: resultingValue }, mode);

      if (!result.safe) {
        violations.set(param, result);
      }
    }

    return violations;
  }

  /**
   * Track an item in the temperature danger zone (40-140F inclusive).
   *
   * If temperature is within 40-140F, starts tracking.
   * If temperature is outside that range, removes any existing tracking
   * (food left the danger zone).
   */
  trackDangerZone(itemId: string, temperatureF: number): void {
    if (temperatureF >= 40 && temperatureF <= 140) {
      if (!this.dangerZones.has(itemId)) {
        this.dangerZones.set(itemId, {
          temperature: temperatureF,
          startTime: this.now(),
        });
      }
    } else {
      // Food left the danger zone
      this.dangerZones.delete(itemId);
    }
  }

  /**
   * Get all items currently being tracked in the danger zone.
   *
   * Returns entries with elapsed time calculated from startTime to now().
   * Sets warning: true if elapsedMinutes >= 120 (2 hours).
   */
  getActiveDangerZones(): DangerZoneEntry[] {
    const entries: DangerZoneEntry[] = [];
    const currentTime = this.now();

    for (const [itemId, tracking] of this.dangerZones) {
      const elapsedMs = currentTime.getTime() - tracking.startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      entries.push({
        itemId,
        temperature: tracking.temperature,
        startTime: tracking.startTime,
        warning: elapsedMinutes >= 120,
        elapsedMinutes,
      });
    }

    return entries;
  }

  /**
   * Remove danger zone tracking for an item.
   */
  clearDangerZone(itemId: string): void {
    this.dangerZones.delete(itemId);
  }
}
