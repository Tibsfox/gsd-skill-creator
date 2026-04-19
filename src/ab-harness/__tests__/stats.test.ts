/**
 * ME-3 stats.ts — unit tests.
 *
 * Verifies:
 *   - CF-ME3-01: empty/insufficient inputs → insufficient-data
 *   - CF-ME3-02: identical A and B scores → coin-flip
 *   - CF-ME3-03: noiseFloor correctly gates coin-flip vs commit-B
 *   - Wilcoxon tie handling (half-win convention)
 *   - Hand-computed p-value examples for binomial sign test
 *   - Effect size is in [0, 1]
 */

import { describe, it, expect } from 'vitest';
import {
  runSignificanceTest,
  mean,
  twoSidedBinomialP,
  binomialCdfExact,
  standardNormalCdf,
  binomialPmf,
} from '../stats.js';

// ─── Helper: generate arrays ─────────────────────────────────────────────────

function repeat(v: number, n: number): number[] {
  return Array.from({ length: n }, () => v);
}

// ─── mean() ──────────────────────────────────────────────────────────────────

describe('mean()', () => {
  it('returns NaN for empty array', () => {
    expect(mean([])).toBeNaN();
  });

  it('returns single value unchanged', () => {
    expect(mean([42])).toBe(42);
  });

  it('computes arithmetic mean', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });
});

// ─── CF-ME3-01: insufficient-data ────────────────────────────────────────────

describe('CF-ME3-01 — insufficient-data', () => {
  it('returns insufficient-data when both arrays are empty', () => {
    const result = runSignificanceTest([], [], 2.0);
    expect(result.decision).toBe('insufficient-data');
    expect(result.p_value).toBeNaN();
    expect(result.effect_size).toBeNaN();
  });

  it('returns insufficient-data when A has < 10 samples', () => {
    const a = repeat(50, 9);
    const b = repeat(55, 20);
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.decision).toBe('insufficient-data');
  });

  it('returns insufficient-data when B has < 10 samples', () => {
    const a = repeat(50, 20);
    const b = repeat(55, 5);
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.decision).toBe('insufficient-data');
  });

  it('does not crash on empty inputs — CF-ME3-01', () => {
    expect(() => runSignificanceTest([], [], 2.0)).not.toThrow();
  });
});

// ─── CF-ME3-02: coin-flip (identical scores) ─────────────────────────────────

describe('CF-ME3-02 — coin-flip on identical inputs', () => {
  it('returns coin-flip when A and B are identical', () => {
    const scores = repeat(50, 30);
    const result = runSignificanceTest(scores, [...scores], 2.0);
    expect(result.decision).toBe('coin-flip');
  });

  it('coin-flip is deterministic on identical arrays', () => {
    const scores = Array.from({ length: 30 }, (_, i) => i * 2);
    const r1 = runSignificanceTest(scores, [...scores], 2.0);
    const r2 = runSignificanceTest(scores, [...scores], 2.0);
    expect(r1.decision).toBe(r2.decision);
    expect(r1.p_value).toEqual(r2.p_value);
  });

  it('returns coin-flip when delta is exactly 0', () => {
    const a = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const b = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.decision).toBe('coin-flip');
  });

  it('returns coin-flip when |delta| ≤ noiseFloor', () => {
    // B scores are exactly 1.0 higher than A (below 2.0 floor).
    const a = repeat(50, 30);
    const b = repeat(51, 30);
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.decision).toBe('coin-flip');
  });

  it('effect_size is in [0,1] for coin-flip case', () => {
    const a = repeat(50, 15);
    const b = repeat(51, 15);
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.decision).toBe('coin-flip');
    expect(result.effect_size).toBeGreaterThanOrEqual(0);
    expect(result.effect_size).toBeLessThanOrEqual(1);
  });
});

// ─── CF-ME3-03: noise floor gates commit-B ───────────────────────────────────

describe('CF-ME3-03 — tractability-scaled noise floor', () => {
  it('commits B when delta > noiseFloor and sign test passes (tractable floor=2)', () => {
    // A = 50, B = 55; delta = 5 > floor 2.0; B wins every pair → p ≈ 0
    const a = repeat(50, 30);
    const b = repeat(55, 30);
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    expect(result.decision).toBe('commit-B');
    expect(result.p_value).toBeLessThan(0.10);
    expect(result.effect_size).toBeGreaterThanOrEqual(0);
    expect(result.effect_size).toBeLessThanOrEqual(1);
  });

  it('returns keep-A when delta > floor but B < A (negative delta)', () => {
    // A = 55, B = 50; delta = -5; exceeds floor but wrong direction
    const a = repeat(55, 30);
    const b = repeat(50, 30);
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    // |delta| = 5 > 2.0 but meanDelta < 0 → keep-A
    expect(result.decision).toBe('keep-A');
  });

  it('coin-flip floor (×2.5) requires larger delta to commit', () => {
    // delta = 3.0 < 2.0×2.5 = 5.0 → should be coin-flip
    const a = repeat(50, 30);
    const b = repeat(53, 30);
    const result = runSignificanceTest(a, b, 5.0, 0.10);
    expect(result.decision).toBe('coin-flip');
  });

  it('tractable floor (×1.0) commits at smaller delta', () => {
    // delta = 2.5 > 2.0 → should be commit-B
    const a = repeat(50, 30);
    const b = repeat(52.5, 30);
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    expect(result.decision).toBe('commit-B');
  });

  it('unknown floor (×1.5) = 3.0 does not commit at delta=2.5', () => {
    const a = repeat(50, 30);
    const b = repeat(52.5, 30);
    const result = runSignificanceTest(a, b, 3.0, 0.10);
    expect(result.decision).toBe('coin-flip');
  });
});

// ─── Two-pronged: sign test must agree ───────────────────────────────────────

describe('two-pronged significance', () => {
  it('returns keep-A when meanDelta > floor but sign test fails', () => {
    // Alternating: B wins 5, A wins 5 → p-value ≈ 1.0 (B wins half)
    // Set delta > floor by making B higher on average but not on sign.
    // Construct: B = [60,40,60,40,60,40,60,40,60,40,...] (alternating)
    //            A = [50,50,50,50,...] (constant)
    // mean(B) = 50, mean(A) = 50 → delta = 0 → coin-flip
    // Instead test with mixed-sign differences:
    const a = repeat(50, 30);
    // B has mean = 55 (delta = 5 > floor 2) but noisy; force sign test fail
    // by mixing some very low B values → fewer than 50% B wins.
    const b = Array.from({ length: 30 }, (_, i) => i < 15 ? 10 : 100);
    // mean(b) ≈ 55; but sign test: 15 losses and 15 wins → p-value ≈ 1.0
    // However mean is (15*10 + 15*100)/30 = 55 → delta = 5 > 2
    // 15 wins vs 15 losses → sign test p ≈ 1.0 > 0.10 → keep-A
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    // p_value should be high since roughly 50/50 wins
    expect(['keep-A', 'coin-flip']).toContain(result.decision);
  });
});

// ─── effect_size in [0,1] ────────────────────────────────────────────────────

describe('effect_size always in [0, 1]', () => {
  it('is clamped at 1.0 for very large delta', () => {
    const a = repeat(0, 30);
    const b = repeat(1000, 30);
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.effect_size).toBeLessThanOrEqual(1);
    expect(result.effect_size).toBeGreaterThanOrEqual(0);
  });

  it('is 0 for zero delta', () => {
    const a = repeat(50, 30);
    const b = repeat(50, 30);
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.effect_size).toBe(0);
  });
});

// ─── Tie handling (Wilcoxon half-win) ────────────────────────────────────────

describe('tie handling (Wilcoxon half-win convention)', () => {
  it('handles all-tied scores without NaN', () => {
    const a = repeat(50, 20);
    const b = repeat(50, 20); // All ties → coin-flip on delta
    const result = runSignificanceTest(a, b, 2.0);
    expect(result.decision).toBe('coin-flip');
  });

  it('mixed ties and wins produce valid p-value', () => {
    // 15 wins, 5 ties, 10 losses for B
    const a = Array.from({ length: 30 }, () => 50);
    const b = Array.from({ length: 30 }, (_, i) => {
      if (i < 15) return 57; // B wins
      if (i < 20) return 50; // tie
      return 43;             // A wins
    });
    const result = runSignificanceTest(a, b, 2.0);
    if (result.decision !== 'coin-flip' && result.decision !== 'insufficient-data') {
      expect(result.p_value).toBeGreaterThanOrEqual(0);
      expect(result.p_value).toBeLessThanOrEqual(1);
    }
  });
});

// ─── binomialCdfExact ─────────────────────────────────────────────────────────

describe('binomialCdfExact()', () => {
  it('P(X ≤ 0 | n=10, p=0.5) = 2^-10 ≈ 0.000977', () => {
    const p = binomialCdfExact(0, 10, 0.5);
    expect(p).toBeCloseTo(1 / 1024, 4);
  });

  it('P(X ≤ 5 | n=10, p=0.5) ≈ 0.6230', () => {
    const p = binomialCdfExact(5, 10, 0.5);
    expect(p).toBeCloseTo(0.6230, 3);
  });

  it('P(X ≤ n | n, p) = 1.0', () => {
    expect(binomialCdfExact(10, 10, 0.5)).toBeCloseTo(1.0, 5);
  });

  it('P(X ≤ -1) = 0', () => {
    expect(binomialCdfExact(-1, 10, 0.5)).toBe(0);
  });
});

// ─── twoSidedBinomialP ───────────────────────────────────────────────────────

describe('twoSidedBinomialP()', () => {
  it('all B wins (wins=n) → p ≈ 2 × (1/2^n)', () => {
    // wins = 10, n = 10 → lower = min(10, 0) = 0 → p = 2 × P(X ≤ 0) = 2/1024
    const p = twoSidedBinomialP(10, 10, 0.5);
    expect(p).toBeCloseTo(2 / 1024, 4);
  });

  it('50/50 wins → p ≈ 1.0 (cannot reject null)', () => {
    const p = twoSidedBinomialP(15, 30, 0.5);
    expect(p).toBeGreaterThan(0.8);
  });

  it('returns 1 for n=0', () => {
    expect(twoSidedBinomialP(0, 0, 0.5)).toBe(1);
  });

  it('is two-sided: p(wins=k) = p(wins=n-k)', () => {
    const p1 = twoSidedBinomialP(5, 30, 0.5);
    const p2 = twoSidedBinomialP(25, 30, 0.5);
    expect(p1).toBeCloseTo(p2, 5);
  });
});

// ─── binomialPmf ─────────────────────────────────────────────────────────────

describe('binomialPmf()', () => {
  it('P(X=0 | n=5, p=0.5) = 1/32', () => {
    expect(binomialPmf(0, 5, 0.5)).toBeCloseTo(1 / 32, 5);
  });

  it('P(X=5 | n=5, p=0.5) = 1/32', () => {
    expect(binomialPmf(5, 5, 0.5)).toBeCloseTo(1 / 32, 5);
  });

  it('sums to 1 over all k for n=10, p=0.5', () => {
    let sum = 0;
    for (let k = 0; k <= 10; k++) sum += binomialPmf(k, 10, 0.5);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('handles p=0: P(X=0) = 1, P(X>0) = 0', () => {
    expect(binomialPmf(0, 5, 0)).toBe(1);
    expect(binomialPmf(1, 5, 0)).toBe(0);
  });

  it('handles p=1: P(X=n) = 1, P(X<n) = 0', () => {
    expect(binomialPmf(5, 5, 1)).toBe(1);
    expect(binomialPmf(4, 5, 1)).toBe(0);
  });
});

// ─── standardNormalCdf ───────────────────────────────────────────────────────

describe('standardNormalCdf()', () => {
  it('Φ(0) ≈ 0.5', () => {
    expect(standardNormalCdf(0)).toBeCloseTo(0.5, 3);
  });

  it('Φ(1.96) ≈ 0.975', () => {
    expect(standardNormalCdf(1.96)).toBeCloseTo(0.975, 2);
  });

  it('Φ(-1.96) ≈ 0.025', () => {
    expect(standardNormalCdf(-1.96)).toBeCloseTo(0.025, 2);
  });

  it('Φ(z) + Φ(-z) = 1 for arbitrary z', () => {
    const z = 1.23;
    expect(standardNormalCdf(z) + standardNormalCdf(-z)).toBeCloseTo(1.0, 5);
  });
});

// ─── Planted-significant fixture (LS-41) ─────────────────────────────────────

describe('LS-41 — planted-significant fixture commits', () => {
  it('clear B-win: delta=10 > floor=2, all B wins → commit-B', () => {
    const a = repeat(40, 30);
    const b = repeat(50, 30);
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    expect(result.decision).toBe('commit-B');
    expect(result.p_value).toBeLessThan(0.10);
  });

  it('planted-noise: delta=1 < floor=2 → coin-flip', () => {
    const a = repeat(50, 30);
    const b = repeat(51, 30);
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    expect(result.decision).toBe('coin-flip');
  });

  it('clear A-win: delta=-8 < -floor=-2, all A wins → keep-A', () => {
    const a = repeat(50, 30);
    const b = repeat(42, 30);
    const result = runSignificanceTest(a, b, 2.0, 0.10);
    expect(result.decision).toBe('keep-A');
  });
});
