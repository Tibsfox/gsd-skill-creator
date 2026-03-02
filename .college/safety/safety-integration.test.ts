/**
 * Safety-critical integration tests -- SC-01 through SC-08, INT-04, INT-12 through INT-14.
 *
 * Verifies SafetyWarden with CalibrationEngine integration, AllergenManager
 * in integration context, all three enforcement modes, danger zone tracking,
 * and storage time limits.
 *
 * @module safety/safety-integration.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SafetyWarden } from './safety-warden.js';
import { AllergenManager } from './allergen-manager.js';
import { CalibrationEngine } from '../calibration/engine.js';
import type { SafetyBoundary, CalibrationDelta } from '../rosetta-core/types.js';
import type { DomainCalibrationModel, ComparisonDelta } from '../calibration/engine.js';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const cookingSafetyBoundaries: SafetyBoundary[] = [
  { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', reason: 'USDA minimum safe internal temperature for poultry' },
  { parameter: 'ground_meat_internal_temp', limit: 160, type: 'absolute', reason: 'USDA minimum for ground meat' },
  { parameter: 'whole_cuts_internal_temp', limit: 145, type: 'absolute', reason: 'USDA minimum for whole cuts with 3-min rest' },
  { parameter: 'danger_zone_time', limit: 120, type: 'absolute', reason: 'Maximum minutes food may remain in 40-140F danger zone' },
  { parameter: 'refrigerated_storage_hours', limit: 96, type: 'warning', reason: 'Cooked leftovers safe for 3-4 days refrigerated' },
];

/** Mock DeltaStore for CalibrationEngine. */
const createMockStore = () => {
  const deltas: CalibrationDelta[] = [];
  return {
    save: async (delta: CalibrationDelta) => { deltas.push(delta); },
    getHistory: async () => [...deltas],
  };
};

/** Aggressive temperature model that produces large negative adjustments. */
const aggressiveTemperatureModel: DomainCalibrationModel = {
  domain: 'test-temp',
  parameters: ['poultry_internal_temp', 'oven_temp'],
  science: 'Test model producing aggressive temperature reductions',
  safetyBoundaries: [
    { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', reason: 'USDA minimum for poultry' },
  ],
  computeAdjustment(delta: ComparisonDelta): Record<string, number> {
    if (delta.direction === 'over') {
      // Aggressively reduce temperature -- will exceed 20% bound but engine clips it
      return { poultry_internal_temp: -50 };
    }
    return { poultry_internal_temp: 5 };
  },
  confidence(delta: ComparisonDelta): number {
    return delta.direction === 'over' ? 0.7 : 0.5;
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Safety Integration', () => {
  let warden: SafetyWarden;

  beforeEach(() => {
    warden = new SafetyWarden();
    warden.registerBoundaries(cookingSafetyBoundaries);
  });

  // ─── SC-01 through SC-03: Temperature Floor Enforcement ─────────────────

  describe('SC-01: Poultry temperature floor', () => {
    it('redirect mode: blocks poultry below 165F, returns safeValue: 165', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('redirect');
      expect(result.safeValue).toBe(165);
    });

    it('gate mode: requires acknowledgment for poultry below 165F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'gate');
      expect(result.safe).toBe(false);
      expect(result.requiresAcknowledgment).toBe(true);
    });

    it('annotate mode: flags warning for poultry below 165F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'annotate');
      expect(result.safe).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.proposedValue).toBe(150);
    });

    it('allows poultry at exactly 165F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 165 }, 'redirect');
      expect(result.safe).toBe(true);
    });

    it('allows poultry above 165F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 180 }, 'redirect');
      expect(result.safe).toBe(true);
    });
  });

  describe('SC-02: Ground meat temperature floor', () => {
    it('redirect mode: blocks ground meat below 160F, returns safeValue: 160', () => {
      const result = warden.check({ parameter: 'ground_meat_internal_temp', proposedValue: 155 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.safeValue).toBe(160);
    });

    it('allows ground meat at exactly 160F', () => {
      const result = warden.check({ parameter: 'ground_meat_internal_temp', proposedValue: 160 }, 'redirect');
      expect(result.safe).toBe(true);
    });
  });

  describe('SC-03: Whole cuts temperature floor', () => {
    it('redirect mode: blocks whole cuts below 145F, returns safeValue: 145', () => {
      const result = warden.check({ parameter: 'whole_cuts_internal_temp', proposedValue: 140 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.safeValue).toBe(145);
    });

    it('allows whole cuts at exactly 145F', () => {
      const result = warden.check({ parameter: 'whole_cuts_internal_temp', proposedValue: 145 }, 'redirect');
      expect(result.safe).toBe(true);
    });
  });

  // ─── SC-04: Danger Zone Time Tracking ───────────────────────────────────

  describe('SC-04: Danger zone time tracking', () => {
    it('warns when food at 100F for 2+ hours', () => {
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
      expect(zones[0].itemId).toBe('chicken-breast');
    });

    it('does not warn at 1 hour', () => {
      let currentTime = new Date('2026-01-01T12:00:00Z');
      const timedWarden = new SafetyWarden(() => currentTime);
      timedWarden.trackDangerZone('steak', 100);

      currentTime = new Date('2026-01-01T13:00:00Z');
      const zones = timedWarden.getActiveDangerZones();
      expect(zones[0].warning).toBe(false);
    });
  });

  // ─── SC-05: Allergen Flagging ───────────────────────────────────────────

  describe('SC-05: Allergen flagging on substitutions', () => {
    const allergenManager = new AllergenManager();

    it('butter -> ghee flags milk allergen in both', () => {
      const result = allergenManager.checkSubstitution('butter', 'ghee');
      expect(result.original.some(f => f.allergen === 'milk')).toBe(true);
      expect(result.replacement.some(f => f.allergen === 'milk')).toBe(true);
      expect(result.safe).toBe(false);
    });

    it('wheat flour -> rice flour flags wheat in original only', () => {
      const result = allergenManager.checkSubstitution('wheat flour', 'rice flour');
      expect(result.original.some(f => f.allergen === 'wheat')).toBe(true);
      expect(result.replacement.length).toBe(0);
      expect(result.safe).toBe(true);
    });

    it('butter -> coconut oil removes allergen', () => {
      const result = allergenManager.checkSubstitution('butter', 'coconut oil');
      expect(result.original.some(f => f.allergen === 'milk')).toBe(true);
      expect(result.replacement.length).toBe(0);
      expect(result.safe).toBe(true);
    });

    it('egg -> flax egg removes allergen', () => {
      const result = allergenManager.checkSubstitution('egg', 'flax egg');
      expect(result.original.some(f => f.allergen === 'eggs')).toBe(true);
      expect(result.replacement.length).toBe(0);
      expect(result.safe).toBe(true);
    });

    it('wheat flour -> almond flour introduces new allergen', () => {
      const result = allergenManager.checkSubstitution('wheat flour', 'almond flour');
      expect(result.original.some(f => f.allergen === 'wheat')).toBe(true);
      expect(result.replacement.some(f => f.allergen === 'tree-nuts')).toBe(true);
      expect(result.safe).toBe(false);
    });
  });

  // ─── SC-06: Storage Time Limits ─────────────────────────────────────────

  describe('SC-06: Refrigerated storage time limits', () => {
    it('warns when leftovers exceed 96 hours (warning-type boundary)', () => {
      const result = warden.check({ parameter: 'refrigerated_storage_hours', proposedValue: 120 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('redirect');
      expect(result.safeValue).toBe(96);
    });

    it('allows storage at 72 hours', () => {
      const result = warden.check({ parameter: 'refrigerated_storage_hours', proposedValue: 72 }, 'redirect');
      expect(result.safe).toBe(true);
    });
  });

  // ─── SC-07: Redirect Mode Never Exposes Unsafe Value ────────────────────

  describe('SC-07: Redirect mode never exposes unsafe value', () => {
    it('returns safeValue 165F, not the unsafe proposed 150F', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.safeValue).toBe(165);
      // proposedValue should NOT be in the redirect result
      expect(result.proposedValue).toBeUndefined();
    });

    it('returns safeValue 160F for ground meat, not the unsafe proposed 140F', () => {
      const result = warden.check({ parameter: 'ground_meat_internal_temp', proposedValue: 140 }, 'redirect');
      expect(result.safeValue).toBe(160);
      expect(result.proposedValue).toBeUndefined();
    });
  });

  // ─── SC-08: Gate Mode Requires Acknowledgment ──────────────────────────

  describe('SC-08: Gate mode requires acknowledgment', () => {
    it('returns requiresAcknowledgment: true for temperature violation', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'gate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('gate');
      expect(result.requiresAcknowledgment).toBe(true);
      expect(result.warning).toBeDefined();
    });

    it('returns requiresAcknowledgment: true for storage time violation', () => {
      const result = warden.check({ parameter: 'refrigerated_storage_hours', proposedValue: 120 }, 'gate');
      expect(result.requiresAcknowledgment).toBe(true);
    });
  });

  // ─── INT-04: Safety Overrides Calibration ──────────────────────────────

  describe('INT-04: Safety warden overrides calibration engine', () => {
    it('catches calibration adjustment that would reduce poultry temp below 165F', async () => {
      const mockStore = createMockStore();
      const engine = new CalibrationEngine(mockStore);
      engine.registerModel(aggressiveTemperatureModel);

      const delta = await engine.process({
        domain: 'test-temp',
        translationId: 'test',
        observedResult: 'severely overdone, burnt',
        expectedResult: 'perfect',
        parameters: { poultry_internal_temp: 180 },
      });

      // Calibration suggests a reduction (engine applies 20% bound: max -36 from 180)
      expect(delta.adjustment.poultry_internal_temp).toBeLessThan(0);

      // Safety warden checks if resulting temp is unsafe
      const violations = warden.checkCalibrationOutput(
        delta.adjustment,
        { poultry_internal_temp: 180 },
        'redirect',
      );

      // 180 + adjustment: if adjustment brings it below 165, warden catches it
      const resultingTemp = 180 + delta.adjustment.poultry_internal_temp;
      if (resultingTemp < 165) {
        expect(violations.has('poultry_internal_temp')).toBe(true);
        expect(violations.get('poultry_internal_temp')!.safe).toBe(false);
        expect(violations.get('poultry_internal_temp')!.safeValue).toBe(165);
      } else {
        // Even if the 20% bound keeps it safe, verify no violation reported
        expect(violations.has('poultry_internal_temp')).toBe(false);
      }
    });

    it('safety overrides calibration with direct unsafe adjustment', () => {
      // Bypass engine -- directly test checkCalibrationOutput with known-unsafe values
      const violations = warden.checkCalibrationOutput(
        { poultry_internal_temp: -20 },
        { poultry_internal_temp: 180 },
        'redirect',
      );

      // 180 - 20 = 160 < 165: violation
      expect(violations.has('poultry_internal_temp')).toBe(true);
      expect(violations.get('poultry_internal_temp')!.safe).toBe(false);
      expect(violations.get('poultry_internal_temp')!.safeValue).toBe(165);
    });
  });

  // ─── INT-12, INT-13, INT-14: Three Modes in Integration Context ────────

  describe('INT-12: Annotate mode flags concern in output', () => {
    it('annotate result includes warning and original proposedValue', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'annotate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('annotate');
      expect(result.warning).toBeDefined();
      expect(result.warning!.length).toBeGreaterThan(0);
      expect(result.proposedValue).toBe(150);
    });
  });

  describe('INT-13: Gate mode returns requiresAcknowledgment', () => {
    it('gate result requires explicit acknowledgment', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'gate');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('gate');
      expect(result.requiresAcknowledgment).toBe(true);
    });
  });

  describe('INT-14: Redirect mode returns safeValue', () => {
    it('redirect result returns safe floor value, not the unsafe proposedValue', () => {
      const result = warden.check({ parameter: 'poultry_internal_temp', proposedValue: 150 }, 'redirect');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('redirect');
      expect(result.safeValue).toBe(165);
      // The result should contain the safe value, NOT expose the unsafe one
      expect(result.proposedValue).toBeUndefined();
    });
  });
});
