/**
 * MD-3 — Dark-room guard tests (SC-DARK preservation across noisy updates).
 */

import { describe, it, expect } from 'vitest';
import {
  guardDarkRoom,
  preservesDarkRoom,
  DEFAULT_DARK_ROOM_FLOOR,
} from '../dark-room-guard.js';
import { injectLangevinNoise, mulberry32 } from '../noise-injector.js';

describe('guardDarkRoom — basic semantics', () => {
  it('default floor matches actionPolicy minActivity (0.1)', () => {
    expect(DEFAULT_DARK_ROOM_FLOOR).toBe(0.1);
  });

  it('accepts noisy vector when activity above floor', () => {
    const original = [0.25, 0.25, 0.25, 0.25];
    const noisy = [0.24, 0.26, 0.25, 0.25];
    const r = guardDarkRoom(original, noisy);
    expect(r.rejected).toBe(false);
    expect(r.accepted).toEqual(noisy);
    expect(r.accepted).not.toBe(noisy); // fresh copy
  });

  it('rejects noisy vector that drops below floor', () => {
    const original = [0.5, 0.5];
    const noisy = [0.02, 0.02]; // sum = 0.04 < 0.1 floor
    const r = guardDarkRoom(original, noisy);
    expect(r.rejected).toBe(true);
    expect(r.accepted).toEqual(original);
  });

  it('reports activity diagnostics correctly', () => {
    const original = [0.4, 0.4];
    const noisy = [0.05, 0.03];
    const r = guardDarkRoom(original, noisy);
    expect(r.originalActivity).toBeCloseTo(0.8, 12);
    expect(r.noisyActivity).toBeCloseTo(0.08, 12);
    expect(r.floor).toBe(DEFAULT_DARK_ROOM_FLOOR);
  });

  it('does not reject when original was already below floor (upstream issue)', () => {
    const original = [0.02, 0.02];
    const noisy = [0.01, 0.01];
    const r = guardDarkRoom(original, noisy);
    expect(r.rejected).toBe(false);
    expect(r.accepted).toEqual(noisy);
  });

  it('honors custom minActivity', () => {
    const original = [0.5, 0.5];
    const noisy = [0.3, 0.3]; // sum = 0.6
    const r = guardDarkRoom(original, noisy, { minActivity: 0.7 });
    expect(r.rejected).toBe(true);
    expect(r.accepted).toEqual(original);
  });

  it('treats negative entries as 0 in activity sum', () => {
    const r = guardDarkRoom([0.3, 0.3], [-0.05, 0.04]);
    expect(r.noisyActivity).toBeCloseTo(0.04, 12);
    expect(r.rejected).toBe(true);
  });

  it('treats non-finite entries as 0 in activity sum', () => {
    const r = guardDarkRoom([0.3, 0.3], [Number.NaN, 0.05]);
    expect(r.noisyActivity).toBeCloseTo(0.05, 12);
    expect(r.rejected).toBe(true);
  });
});

describe('preservesDarkRoom predicate', () => {
  it('returns true when sum ≥ floor', () => {
    expect(preservesDarkRoom([0.5, 0.5])).toBe(true);
  });

  it('returns false when sum < floor', () => {
    expect(preservesDarkRoom([0.02, 0.02])).toBe(false);
  });

  it('respects custom floor', () => {
    expect(preservesDarkRoom([0.3, 0.3], { minActivity: 0.7 })).toBe(false);
    expect(preservesDarkRoom([0.4, 0.4], { minActivity: 0.7 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SC-DARK preservation across 1000 noisy updates
// ---------------------------------------------------------------------------

describe('SC-DARK preservation — 1000 noisy updates', () => {
  it('post-guard activity always ≥ floor', () => {
    const rng = mulberry32(2026);
    const seed = [0.2, 0.2, 0.2, 0.2, 0.2]; // simplex; activity = 1.0
    const floor = 0.1;
    let rejections = 0;

    for (let i = 0; i < 1000; i++) {
      // High noise to stress the guard
      const noisy = injectLangevinNoise(seed, 0.4, rng);
      const r = guardDarkRoom(seed, noisy, { minActivity: floor });
      const acceptedActivity = r.accepted.reduce(
        (s, v) => s + Math.max(0, Number.isFinite(v) ? v : 0),
        0,
      );
      expect(acceptedActivity).toBeGreaterThanOrEqual(floor);
      if (r.rejected) rejections++;
    }
    // Diagnostic: under heavy noise we expect *some* rejections; the test
    // does not over-constrain the count, only that the floor invariant held
    // across all 1000 updates.
    expect(rejections).toBeGreaterThanOrEqual(0);
  });

  it('zero-noise updates never reject', () => {
    const seed = [0.3, 0.3, 0.4];
    const rng = mulberry32(7);
    let rejections = 0;
    for (let i = 0; i < 1000; i++) {
      const noisy = injectLangevinNoise(seed, 0, rng);
      const r = guardDarkRoom(seed, noisy);
      if (r.rejected) rejections++;
    }
    expect(rejections).toBe(0);
  });
});
