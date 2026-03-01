/**
 * TDD tests for SafetyWarden -- three enforcement modes, temperature floors, danger zone tracking.
 *
 * RED phase: tests written first, implementation follows.
 *
 * @module safety/safety-warden.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SafetyWarden } from './safety-warden.js';
import type { SafetyBoundary } from '../rosetta-core/types.js';
import type { SafetyCheckResult } from './types.js';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const cookingSafetyBoundaries: SafetyBoundary[] = [
  { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', reason: 'USDA minimum safe internal temperature for poultry' },
  { parameter: 'ground_meat_internal_temp', limit: 160, type: 'absolute', reason: 'USDA minimum for ground meat' },
  { parameter: 'whole_cuts_internal_temp', limit: 145, type: 'absolute', reason: 'USDA minimum for whole cuts with 3-min rest' },
  { parameter: 'danger_zone_time', limit: 120, type: 'absolute', reason: 'Maximum minutes food may remain in 40-140F danger zone' },
  { parameter: 'refrigerated_storage_hours', limit: 96, type: 'warning', reason: 'Cooked leftovers safe for 3-4 days refrigerated' },
];

describe('SafetyWarden', () => {
  let warden: SafetyWarden;

  beforeEach(() => {
    warden = new SafetyWarden();
    warden.registerBoundaries(cookingSafetyBoundaries);
  });

  // ─── Temperature Floor Enforcement (SAFE-01) ──────────────────────────────

  describe('Temperature Floor Enforcement', () => {
    it('blocks poultry below 165F in redirect mode', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('redirect');
      expect(result.safeValue).toBe(165);
      expect(result.reason).toContain('poultry');
    });

    it('allows poultry at or above 165F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 170 }, 'redirect');
      expect(result.safe).toBe(true);
    });

    it('allows poultry exactly at 165F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 165 }, 'redirect');
      expect(result.safe).toBe(true);
    });

    it('blocks ground meat below 160F in redirect mode', () => {
      const result = warden.check({ parameter: 'ground_meat_internal_temp', proposedValue: 155 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.safeValue).toBe(160);
    });

    it('blocks whole cuts below 145F in redirect mode', () => {
      const result = warden.check({ parameter: 'whole_cuts_internal_temp', proposedValue: 140 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.safeValue).toBe(145);
    });

    it('returns safe for unknown parameter', () => {
      const result = warden.check({ parameter: 'unknown_param', proposedValue: 50 }, 'redirect');
      expect(result.safe).toBe(true);
    });
  });

  // ─── Three Modes (SAFE-03) ────────────────────────────────────────────────

  describe('Three Enforcement Modes', () => {
    it('annotate mode flags concern but includes proposedValue', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'annotate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('annotate');
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('SAFETY VIOLATION');
      expect(result.proposedValue).toBe(150);
    });

    it('gate mode requires acknowledgment', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'gate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('gate');
      expect(result.requiresAcknowledgment).toBe(true);
      expect(result.warning).toBeDefined();
    });

    it('redirect mode substitutes safe value', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('redirect');
      expect(result.safeValue).toBe(165);
      expect(result.reason).toBeDefined();
    });

    it('absolute boundaries are always flagged regardless of mode', () => {
      for (const mode of ['annotate', 'gate', 'redirect'] as const) {
        const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, mode);
        expect(result.safe).toBe(false);
        expect(result.action).toBe(mode);
      }
    });

    it('warning-type boundary in annotate mode flags concern', () => {
      const result = warden.check({ parameter: 'refrigerated_storage_hours', proposedValue: 120 }, 'annotate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('annotate');
      expect(result.warning).toBeDefined();
      expect(result.proposedValue).toBe(120);
    });

    it('warning-type boundary in gate mode requires acknowledgment', () => {
      const result = warden.check({ parameter: 'refrigerated_storage_hours', proposedValue: 120 }, 'gate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('gate');
      expect(result.requiresAcknowledgment).toBe(true);
    });

    it('warning-type boundary in redirect mode substitutes safe value', () => {
      const result = warden.check({ parameter: 'refrigerated_storage_hours', proposedValue: 120 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('redirect');
      expect(result.safeValue).toBe(96);
    });
  });

  // ─── Danger Zone Tracking (SAFE-04) ──────────────────────────────────────

  describe('Danger Zone Tracking', () => {
    it('starts tracking when temperature is within 40-140F', () => {
      warden.trackDangerZone('chicken-breast', 100);
      const zones = warden.getActiveDangerZones();
      expect(zones.length).toBe(1);
      expect(zones[0].itemId).toBe('chicken-breast');
      expect(zones[0].temperature).toBe(100);
    });

    it('does not track when temperature is below 40F', () => {
      warden.trackDangerZone('chicken-breast', 35);
      const zones = warden.getActiveDangerZones();
      expect(zones.length).toBe(0);
    });

    it('does not track when temperature is above 140F', () => {
      warden.trackDangerZone('chicken-breast', 180);
      const zones = warden.getActiveDangerZones();
      expect(zones.length).toBe(0);
    });

    it('tracks at boundary temperatures (40F and 140F)', () => {
      warden.trackDangerZone('item-40', 40);
      warden.trackDangerZone('item-140', 140);
      const zones = warden.getActiveDangerZones();
      expect(zones.length).toBe(2);
    });

    it('warns after 2+ hours (120 minutes)', () => {
      let currentTime = new Date('2026-01-01T12:00:00Z');
      const timedWarden = new SafetyWarden(() => currentTime);
      timedWarden.registerBoundaries(cookingSafetyBoundaries);
      timedWarden.trackDangerZone('chicken-breast', 100);

      // Advance clock by 121 minutes
      currentTime = new Date('2026-01-01T14:01:00Z');
      const zones = timedWarden.getActiveDangerZones();
      expect(zones.length).toBe(1);
      expect(zones[0].warning).toBe(true);
      expect(zones[0].elapsedMinutes).toBeGreaterThanOrEqual(120);
    });

    it('does not warn before 2 hours', () => {
      let currentTime = new Date('2026-01-01T12:00:00Z');
      const timedWarden = new SafetyWarden(() => currentTime);
      timedWarden.registerBoundaries(cookingSafetyBoundaries);
      timedWarden.trackDangerZone('chicken-breast', 100);

      // Advance clock by 60 minutes
      currentTime = new Date('2026-01-01T13:00:00Z');
      const zones = timedWarden.getActiveDangerZones();
      expect(zones.length).toBe(1);
      expect(zones[0].warning).toBe(false);
      expect(zones[0].elapsedMinutes).toBe(60);
    });

    it('clears danger zone tracking for an item', () => {
      warden.trackDangerZone('chicken-breast', 100);
      warden.clearDangerZone('chicken-breast');
      const zones = warden.getActiveDangerZones();
      expect(zones.length).toBe(0);
    });

    it('removes tracking when food leaves danger zone', () => {
      warden.trackDangerZone('chicken-breast', 100);
      expect(warden.getActiveDangerZones().length).toBe(1);

      // Food heated above 140F
      warden.trackDangerZone('chicken-breast', 180);
      expect(warden.getActiveDangerZones().length).toBe(0);
    });
  });

  // ─── Boundary Registration ────────────────────────────────────────────────

  describe('Boundary Registration', () => {
    it('registers boundaries from CalibrationModel.safetyBoundaries', () => {
      const freshWarden = new SafetyWarden();
      freshWarden.registerBoundaries([
        { parameter: 'test_temp', limit: 100, type: 'absolute', reason: 'test' },
      ]);
      const result = freshWarden.check({ parameter: 'test_temp', proposedValue: 90 }, 'redirect');
      expect(result.safe).toBe(false);
    });

    it('keeps stricter limit for duplicate parameter registration', () => {
      const freshWarden = new SafetyWarden();
      freshWarden.registerBoundaries([
        { parameter: 'test_temp', limit: 150, type: 'absolute', reason: 'lenient' },
      ]);
      freshWarden.registerBoundaries([
        { parameter: 'test_temp', limit: 165, type: 'absolute', reason: 'strict' },
      ]);
      // The stricter (higher for temps) limit should be kept
      const result = freshWarden.check({ parameter: 'test_temp', proposedValue: 155 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.safeValue).toBe(165);
    });
  });

  // ─── checkCalibrationOutput ───────────────────────────────────────────────

  describe('checkCalibrationOutput', () => {
    it('catches calibration adjustment that would reduce temp below floor', () => {
      const violations = warden.checkCalibrationOutput(
        { poultry_internal_temp: -20 },
        { poultry_internal_temp: 180 },
        'redirect',
      );
      // 180 + (-20) = 160 < 165 -- violation
      expect(violations.has('poultry_internal_temp')).toBe(true);
      expect(violations.get('poultry_internal_temp')!.safe).toBe(false);
      expect(violations.get('poultry_internal_temp')!.safeValue).toBe(165);
    });

    it('allows calibration adjustment that stays above floor', () => {
      const violations = warden.checkCalibrationOutput(
        { poultry_internal_temp: -5 },
        { poultry_internal_temp: 180 },
        'redirect',
      );
      // 180 + (-5) = 175 >= 165 -- safe
      expect(violations.size).toBe(0);
    });

    it('returns empty map when no boundaries violated', () => {
      const violations = warden.checkCalibrationOutput(
        { unknown_param: -50 },
        { unknown_param: 100 },
        'redirect',
      );
      expect(violations.size).toBe(0);
    });

    it('checks multiple parameters at once', () => {
      const violations = warden.checkCalibrationOutput(
        { poultry_internal_temp: -20, ground_meat_internal_temp: -5 },
        { poultry_internal_temp: 180, ground_meat_internal_temp: 162 },
        'redirect',
      );
      // poultry: 180-20=160 < 165 -- violation
      expect(violations.has('poultry_internal_temp')).toBe(true);
      // ground: 162-5=157 < 160 -- violation
      expect(violations.has('ground_meat_internal_temp')).toBe(true);
    });
  });
});
