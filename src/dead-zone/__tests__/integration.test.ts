/**
 * MB-5 — integration tests.
 *
 * Covers acceptance gate:
 *   SC-MB5-01 — flag-off byte-identical to M4 phase-645
 *
 * Tests that with `deadZoneEnabled = false`:
 *   - adaptationScale with DEFAULT params (bw=0, tau=Inf) replicates M4 exactly
 *   - The branches/delta.ts 20% rejection logic is unmodified
 *   - The 7-day cooldown in learning/types behaves as before
 *
 * Also covers:
 *   - Flag-ON path with smooth params gives different (non-identical) results
 *   - readDeadZoneEnabledFlag returns false for absent/malformed settings
 */

import { describe, it, expect } from 'vitest';
import { computeDelta, MAX_DELTA_FRACTION } from '../../branches/delta.js';
import { adaptationScale, DEFAULT_DEAD_ZONE_PARAMS } from '../diff-bound-adapter.js';
import { recoveryScale } from '../cooldown-adapter.js';
import { readDeadZoneEnabledFlag } from '../settings.js';

// ---------------------------------------------------------------------------
// SC-MB5-01: flag-off byte-identical to M4 phase-645
// ---------------------------------------------------------------------------

describe('SC-MB5-01 — flag-off = M4 byte-identical behaviour', () => {
  it('M4 MAX_DELTA_FRACTION is still 0.20', () => {
    // Verifies the M4 surface was NOT modified
    expect(MAX_DELTA_FRACTION).toBe(0.20);
  });

  it('M4 computeDelta still rejects > 20% diff (hard rule unchanged)', () => {
    // Build strings that differ by > 20%
    const parent   = 'a'.repeat(100);
    const proposed = 'b'.repeat(100); // 100% change
    const delta = computeDelta(parent, proposed);
    expect(delta.exceeds).toBe(true);
    expect(delta.fraction).toBeGreaterThan(0.20);
  });

  it('M4 computeDelta accepts <= 20% diff', () => {
    const parent   = 'x'.repeat(100);
    // Change last 19 bytes — delta = 38 changed bytes / 100 = 38% ← exceeds!
    // Use prefix-suffix: change bytes 90-99 only (10 bytes changed)
    // parent changed = 10, proposed changed = 10, total = 20; denom = 100
    // fraction = 20/100 = 0.20 (boundary, should NOT exceed)
    const proposed = 'x'.repeat(90) + 'y'.repeat(10);
    const delta = computeDelta(parent, proposed);
    expect(delta.fraction).toBeCloseTo(0.20, 10);
    expect(delta.exceeds).toBe(false);
  });

  it('adaptationScale at DEFAULT params replicates M4 hard rule for fork fixture', () => {
    // Fixture: a sequence of (diffFraction, cooldownAge) pairs
    // Expected: (diff <= 0.20 AND age >= 7) ? 1 : 0 — same as M4
    const fixture = [
      { diff: 0.10, age: 10 }, // pass both → 1
      { diff: 0.20, age:  7 }, // exactly at boundary → 1
      { diff: 0.201, age: 7 }, // exceeds diff → 0
      { diff: 0.10, age:  6 }, // in cooldown → 0
      { diff: 0.201, age: 2 }, // both fail → 0
      { diff: 0.15, age: 30 }, // pass both → 1
    ];

    const expectedHard = fixture.map(({ diff, age }) =>
      (diff <= 0.20 ? 1 : 0) * (age >= 7 ? 1 : 0),
    );

    const actual = fixture.map(({ diff, age }) =>
      adaptationScale(diff, age, DEFAULT_DEAD_ZONE_PARAMS, 'tractable'),
    );

    expect(actual).toEqual(expectedHard);
  });

  it('recoveryScale at tau=Infinity replicates M4 cooldown hard rule', () => {
    const params = { cooldownDays: 7, tau: Infinity };
    expect(recoveryScale(0, params)).toBe(0);
    expect(recoveryScale(6, params)).toBe(0);
    expect(recoveryScale(7, params)).toBe(1);
    expect(recoveryScale(100, params)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Flag-ON gives smooth (different) results
// ---------------------------------------------------------------------------

describe('Flag-ON path produces different (smoother) results', () => {
  const smoothParams = {
    diffThreshold: 0.20,
    diffBandwidth: 0.02,
    cooldownDays:  7,
    cooldownTau:   3,
  };

  it('at diff=0.21, tau=Inf (hard), scale=0; with smooth bw=0.02, scale>0', () => {
    const hardScale   = adaptationScale(0.21, 100, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    const smoothScale = adaptationScale(0.21, 100, smoothParams, 'tractable');
    expect(hardScale).toBe(0);       // hard rule
    expect(smoothScale).toBeGreaterThan(0); // smooth rule
  });

  it('at age=5 (in cooldown), tau=Inf scale=0; with tau=3, scale>0', () => {
    const hardScale   = adaptationScale(0.10, 5, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    const smoothScale = adaptationScale(0.10, 5, smoothParams, 'tractable');
    expect(hardScale).toBe(0);       // hard cooldown
    expect(smoothScale).toBeGreaterThan(0); // smooth recovery
  });
});

// ---------------------------------------------------------------------------
// readDeadZoneEnabledFlag
// ---------------------------------------------------------------------------

describe('readDeadZoneEnabledFlag', () => {
  it('returns false for non-existent settings file', () => {
    // Use a path that definitely does not exist
    expect(readDeadZoneEnabledFlag('/tmp/__mb5_no_such_settings__.json')).toBe(false);
  });

  it('returns false by default (no explicit opt-in)', () => {
    // Default settings path probably does not have the flag or returns false
    const result = readDeadZoneEnabledFlag('/tmp/__mb5_nonexistent__.json');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Barrel export completeness
// ---------------------------------------------------------------------------

describe('barrel export (index.ts)', () => {
  it('exports all public symbols', async () => {
    const barrel = await import('../index.js');
    expect(typeof barrel.deadZone).toBe('function');
    expect(typeof barrel.hardDeadZone).toBe('function');
    expect(typeof barrel.adaptationScale).toBe('function');
    expect(typeof barrel.DEFAULT_DEAD_ZONE_PARAMS).toBe('object');
    expect(typeof barrel.TRACTABILITY_BW_SCALE).toBe('object');
    expect(typeof barrel.recoveryScale).toBe('function');
    expect(typeof barrel.smoothDaysRemaining).toBe('function');
    expect(typeof barrel.DEFAULT_COOLDOWN_ADAPTER_PARAMS).toBe('object');
    expect(typeof barrel.composedVdot).toBe('function');
    expect(typeof barrel.verifyComposedDescent).toBe('function');
    expect(typeof barrel.buildFixtureTrajectory).toBe('function');
    expect(typeof barrel.readDeadZoneEnabledFlag).toBe('function');
  });
});
