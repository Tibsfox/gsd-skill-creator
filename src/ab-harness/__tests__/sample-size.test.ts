/**
 * ME-3 sample-size.ts — unit tests.
 *
 * Verifies:
 *   - Required N per tractability class matches documented table.
 *   - Monotone relationship: N increases as alpha decreases.
 *   - Effect-size adjustment: large effectSize halves N (floor: MIN_N).
 *   - ABSOLUTE_MIN_SAMPLES is respected.
 */

import { describe, it, expect } from 'vitest';
import {
  requiredSampleSize,
  sampleSizeTable,
  ABSOLUTE_MIN_SAMPLES,
} from '../sample-size.js';

// ─── Base N values ────────────────────────────────────────────────────────────

describe('requiredSampleSize() — base values at alpha=0.10', () => {
  it('tractable: N = 20 at default alpha', () => {
    expect(requiredSampleSize('tractable', 0, 0.10)).toBe(20);
  });

  it('unknown: N = 30 at default alpha', () => {
    expect(requiredSampleSize('unknown', 0, 0.10)).toBe(30);
  });

  it('coin-flip: N = 50 at default alpha', () => {
    expect(requiredSampleSize('coin-flip', 0, 0.10)).toBe(50);
  });

  it('coin-flip > unknown > tractable for the same alpha', () => {
    const t = requiredSampleSize('tractable', 0, 0.10);
    const u = requiredSampleSize('unknown', 0, 0.10);
    const c = requiredSampleSize('coin-flip', 0, 0.10);
    expect(c).toBeGreaterThan(u);
    expect(u).toBeGreaterThan(t);
  });
});

// ─── Monotone in alpha ────────────────────────────────────────────────────────

describe('requiredSampleSize() — monotone in alpha', () => {
  const classes = ['tractable', 'unknown', 'coin-flip'] as const;

  for (const cls of classes) {
    it(`${cls}: N(alpha=0.05) ≥ N(alpha=0.10)`, () => {
      expect(requiredSampleSize(cls, 0, 0.05)).toBeGreaterThanOrEqual(
        requiredSampleSize(cls, 0, 0.10),
      );
    });

    it(`${cls}: N(alpha=0.01) ≥ N(alpha=0.05)`, () => {
      expect(requiredSampleSize(cls, 0, 0.01)).toBeGreaterThanOrEqual(
        requiredSampleSize(cls, 0, 0.05),
      );
    });

    it(`${cls}: N(alpha=0.001) ≥ N(alpha=0.01)`, () => {
      expect(requiredSampleSize(cls, 0, 0.001)).toBeGreaterThanOrEqual(
        requiredSampleSize(cls, 0, 0.01),
      );
    });
  }

  it('alpha >= 0.10 does not increase N beyond base', () => {
    // At alpha = 0.10 (the Zhang default) no adjustment should apply.
    expect(requiredSampleSize('unknown', 0, 0.10)).toBe(30);
    // alpha = 0.20 should also give 30 (no upward adjustment at permissive alpha).
    expect(requiredSampleSize('unknown', 0, 0.20)).toBe(30);
  });
});

// ─── Effect size adjustment ───────────────────────────────────────────────────

describe('requiredSampleSize() — effect size adjustment', () => {
  it('effectSize > 1 halves N from base', () => {
    // tractable base = 20 → halved = 10 (= MIN_N floor)
    const n = requiredSampleSize('tractable', 1.5, 0.10);
    expect(n).toBe(10); // halved to 10, which equals MIN_N
  });

  it('effectSize > 1 for coin-flip: 50/2 = 25', () => {
    const n = requiredSampleSize('coin-flip', 2.0, 0.10);
    expect(n).toBe(25);
  });

  it('effectSize = 0 does not change N', () => {
    expect(requiredSampleSize('unknown', 0, 0.10)).toBe(30);
  });

  it('effectSize = 1.0 exactly does NOT halve N (threshold is > 1)', () => {
    // The boundary is effectSize > 1, so 1.0 is NOT halved.
    expect(requiredSampleSize('unknown', 1.0, 0.10)).toBe(30);
  });
});

// ─── Absolute minimum ─────────────────────────────────────────────────────────

describe('ABSOLUTE_MIN_SAMPLES', () => {
  it('is 10', () => {
    expect(ABSOLUTE_MIN_SAMPLES).toBe(10);
  });

  it('requiredSampleSize never returns below MIN_N', () => {
    // Even with large effectSize and high alpha, N ≥ 10.
    const n = requiredSampleSize('tractable', 100, 0.50);
    expect(n).toBeGreaterThanOrEqual(ABSOLUTE_MIN_SAMPLES);
  });
});

// ─── sampleSizeTable ──────────────────────────────────────────────────────────

describe('sampleSizeTable()', () => {
  it('returns all three classes at default alpha', () => {
    const table = sampleSizeTable();
    expect(typeof table.tractable).toBe('number');
    expect(typeof table.unknown).toBe('number');
    expect(typeof table['coin-flip']).toBe('number');
  });

  it('matches individual requiredSampleSize calls', () => {
    const alpha = 0.05;
    const table = sampleSizeTable(alpha, 0);
    expect(table.tractable).toBe(requiredSampleSize('tractable', 0, alpha));
    expect(table.unknown).toBe(requiredSampleSize('unknown', 0, alpha));
    expect(table['coin-flip']).toBe(requiredSampleSize('coin-flip', 0, alpha));
  });

  it('table values are all positive integers', () => {
    const table = sampleSizeTable(0.10, 0);
    for (const v of Object.values(table)) {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

// ─── Documentation table verification ─────────────────────────────────────────

describe('documented sample-size table (CLAUDE.md reference)', () => {
  it('matches the spec: tractable=20, unknown=30, coin-flip=50 at alpha=0.10', () => {
    expect(requiredSampleSize('tractable', 0, 0.10)).toBe(20);
    expect(requiredSampleSize('unknown', 0, 0.10)).toBe(30);
    expect(requiredSampleSize('coin-flip', 0, 0.10)).toBe(50);
  });
});
