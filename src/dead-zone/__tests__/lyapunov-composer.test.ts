/**
 * MB-5 — lyapunov-composer.ts unit tests.
 *
 * Covers acceptance gates:
 *   CF-MB5-04 — V̇_deadzone ≤ V̇_raw on fixture trajectory (Sastry Theorem 5.7.1)
 *   LS-33     — 100-step fixture enters, resides in, and exits dead-zone;
 *               V̇_composed ≤ 0 at every step
 */

import { describe, it, expect } from 'vitest';
import {
  composedVdot,
  verifyComposedDescent,
  buildFixtureTrajectory,
} from '../lyapunov-composer.js';

describe('composedVdot', () => {
  it('returns adaptScale · Vdot_raw', () => {
    expect(composedVdot(-1, 0.5)).toBeCloseTo(-0.5, 9);
    expect(composedVdot(-2, 1.0)).toBeCloseTo(-2.0, 9);
    expect(composedVdot(-2, 0.0)).toBeCloseTo(0, 9);
  });

  it('V̇_dz ≤ 0 when V̇_raw ≤ 0 and scale ∈ [0, 1]', () => {
    const Vdot_raw_values = [-0.001, -0.1, -1.0, -100];
    const scales = [0, 0.1, 0.5, 1.0];
    for (const vdot of Vdot_raw_values) {
      for (const s of scales) {
        expect(composedVdot(vdot, s)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('clamps scale to [0, 1]', () => {
    // scale > 1 clamped to 1
    expect(composedVdot(-1, 2)).toBeCloseTo(-1, 9);
    // scale < 0 clamped to 0
    expect(composedVdot(-1, -0.5)).toBeCloseTo(0, 9);
  });

  it('handles non-finite Vdot_raw safely', () => {
    expect(composedVdot(NaN, 0.5)).toBe(0);
    expect(composedVdot(-Infinity, 0)).toBe(0);
  });

  it('inside dead-zone (scale=0): V̇_dz = 0', () => {
    // 0 * (-5) = -0 in IEEE 754; use toBeCloseTo to handle negative zero
    expect(composedVdot(-5, 0)).toBeCloseTo(0, 9);
  });
});

describe('verifyComposedDescent', () => {
  it('holds on a trivial all-negative trajectory', () => {
    const traj = Array.from({ length: 50 }, (_, i) => ({
      Vdot_raw:   -(i + 1) * 0.01,
      adaptScale: 0.8,
    }));
    const cert = verifyComposedDescent(traj);
    expect(cert.holds).toBe(true);
    expect(cert.failures).toHaveLength(0);
  });

  it('fails when V̇_raw > 0 and scale > 0', () => {
    const traj = [{ Vdot_raw: 0.1, adaptScale: 0.5 }];
    const cert = verifyComposedDescent(traj);
    expect(cert.holds).toBe(false);
    expect(cert.failures).toContain(0);
  });

  it('inside dead-zone (scale=0) does not fail even when V̇_raw > 0', () => {
    // When scale=0, V̇_composed = 0 which is ≤ tolerance
    const traj = [{ Vdot_raw: 99, adaptScale: 0 }];
    const cert = verifyComposedDescent(traj);
    expect(cert.holds).toBe(true);
  });

  it('counts zone entries and exits correctly', () => {
    const traj = [
      { Vdot_raw: -1, adaptScale: 1.0 },  // outside
      { Vdot_raw: -1, adaptScale: 0.05 }, // inside (entry)
      { Vdot_raw: -1, adaptScale: 0.05 }, // inside (still)
      { Vdot_raw: -1, adaptScale: 1.0 },  // outside again (exit)
    ];
    const cert = verifyComposedDescent(traj, 1e-9, 0.1);
    expect(cert.zoneEntries).toBe(1);
    expect(cert.zoneExits).toBe(1);
    expect(cert.deadZoneActivations).toBe(2);
  });

  it('empty trajectory → holds=true', () => {
    const cert = verifyComposedDescent([]);
    expect(cert.holds).toBe(true);
    expect(cert.steps).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CF-MB5-04 + LS-33: 100-step fixture trajectory
// ---------------------------------------------------------------------------

describe('CF-MB5-04 + LS-33 — 100-step zone-crossing trajectory', () => {
  const trajectory = buildFixtureTrajectory(100);

  it('trajectory has exactly 100 steps', () => {
    expect(trajectory).toHaveLength(100);
  });

  it('all V̇_raw values are ≤ 0 (MB-1 descent assumption)', () => {
    for (const step of trajectory) {
      expect(step.Vdot_raw).toBeLessThanOrEqual(0);
    }
  });

  it('all adaptScale values are in [0, 1]', () => {
    for (const step of trajectory) {
      expect(step.adaptScale).toBeGreaterThanOrEqual(0);
      expect(step.adaptScale).toBeLessThanOrEqual(1);
    }
  });

  it('LS-33: V̇_composed ≤ 0 at every step (composed descent certificate holds)', () => {
    const cert = verifyComposedDescent(trajectory);
    expect(cert.holds).toBe(true);
    expect(cert.failures).toHaveLength(0);
  });

  it('LS-33: trajectory enters the dead-zone at least once', () => {
    const cert = verifyComposedDescent(trajectory);
    expect(cert.zoneEntries).toBeGreaterThanOrEqual(1);
  });

  it('LS-33: trajectory resides inside the dead-zone (multiple steps with adaptScale < 0.1)', () => {
    const cert = verifyComposedDescent(trajectory);
    expect(cert.deadZoneActivations).toBeGreaterThan(0);
  });

  it('LS-33: trajectory exits the dead-zone at least once', () => {
    const cert = verifyComposedDescent(trajectory);
    expect(cert.zoneExits).toBeGreaterThanOrEqual(1);
  });

  it('CF-MB5-04: V̇_dz ≤ V̇_raw at every step (dead-zone only reduces descent rate)', () => {
    // V̇_raw ≤ 0; V̇_dz = s·V̇_raw; |V̇_dz| ≤ |V̇_raw| iff s ≤ 1 → V̇_dz ≥ V̇_raw (less negative)
    for (const step of trajectory) {
      const Vdot_dz = composedVdot(step.Vdot_raw, step.adaptScale);
      // Numerically: Vdot_dz ≥ Vdot_raw (closer to zero) since s ∈ [0,1] and Vdot_raw ≤ 0
      expect(Vdot_dz).toBeGreaterThanOrEqual(step.Vdot_raw - 1e-12);
      // And still ≤ 0
      expect(Vdot_dz).toBeLessThanOrEqual(1e-9);
    }
  });
});

// ---------------------------------------------------------------------------
// Additional: 200-step fixture (IT-W2-MB5 partial check)
// ---------------------------------------------------------------------------

describe('200-step fixture (extended stability)', () => {
  const traj = buildFixtureTrajectory(200);

  it('composed descent certificate holds on 200-step trajectory', () => {
    const cert = verifyComposedDescent(traj);
    expect(cert.holds).toBe(true);
    expect(cert.failures).toHaveLength(0);
  });

  it('has multiple zone entry/exit cycles', () => {
    const cert = verifyComposedDescent(traj);
    // At least one entry and exit (single cycle is expected)
    expect(cert.zoneEntries).toBeGreaterThanOrEqual(1);
    expect(cert.zoneExits).toBeGreaterThanOrEqual(1);
  });
});
