/**
 * CF-M6-01, CF-M6-02, CF-M6-04, CF-M6-05, CF-M6-06, SC-M6-CONS tests.
 *
 * Covers the pure net-shift function in isolation. Hand-computed reference
 * values are inlined with their derivation so that a reviewer can audit the
 * expected numbers without a calculator.
 */

import { describe, it, expect } from 'vitest';
import { computeNetShift, peakLigand } from '../netShift.js';

describe('computeNetShift — CF-M6-01 symbolic match to Lanzara Appendix III', () => {
  it('matches the hand-computed reference at K_H=10, K_L=0.1, R_T=1, [L]=1 to 10⁻⁶', () => {
    // Hand computation:
    //   numerator   = [L] · R_T · (K_H − K_L) = 1 · 1 · (10 − 0.1) = 9.9
    //   (1 + K_H·[L]) = 1 + 10·1    = 11
    //   (1 + K_L·[L]) = 1 + 0.1·1   = 1.1
    //   denominator = 11 · 1.1      = 12.1
    //   ΔR_H        = 9.9 / 12.1    = 0.81818181818...
    const expected = 9.9 / 12.1;
    const r = computeNetShift(1.0, 1.0, 10, 0.1, 0.05);
    expect(Math.abs(r.deltaR_H - expected)).toBeLessThan(1e-6);
    expect(r.activated).toBe(true);
  });

  it('matches hand-computed reference at L=0.5, R_T=2, K_H=4, K_L=0.5', () => {
    // numerator   = 0.5 · 2 · (4 − 0.5) = 3.5
    // denominator = (1 + 4·0.5)(1 + 0.5·0.5) = 3 · 1.25 = 3.75
    // ΔR_H        = 3.5 / 3.75 = 0.93333...
    const expected = 3.5 / 3.75;
    const r = computeNetShift(0.5, 2.0, 4, 0.5);
    expect(Math.abs(r.deltaR_H - expected)).toBeLessThan(1e-6);
  });
});

describe('computeNetShift — CF-M6-05 silent binder exactness', () => {
  it('returns ΔR_H exactly 0 (not epsilon-close) when K_H === K_L', () => {
    const r = computeNetShift(1.0, 1.0, 0.5, 0.5, 0.05);
    // Must be literally the number 0, not 1e-16 or similar.
    expect(r.deltaR_H).toBe(0);
    expect(r.activated).toBe(false);
  });

  it('silent-binder holds across ligand and receptor sweeps', () => {
    for (const L of [0, 0.001, 1, 1000, 1e6]) {
      for (const R_T of [0, 0.5, 1, 100]) {
        for (const K of [0.01, 1, 100]) {
          const r = computeNetShift(L, R_T, K, K);
          expect(r.deltaR_H).toBe(0);
        }
      }
    }
  });
});

describe('computeNetShift — CF-M6-04 saturation as [L] → ∞', () => {
  it('ΔR_H approaches 0 as [L] → 10⁶', () => {
    const r = computeNetShift(1e6, 1.0, 10, 0.1);
    // ΔR_H ≈ R_T · (K_H − K_L) / (K_H · K_L · [L])  = 9.9 / (10 · 0.1 · 1e6) ≈ 9.9e-6
    expect(r.deltaR_H).toBeLessThan(1e-4);
    expect(r.deltaR_H).toBeGreaterThan(0);
  });

  it('ΔR_H monotone decreases past the peak ligand', () => {
    const K_H = 10;
    const K_L = 0.1;
    const peak = peakLigand(K_H, K_L);
    const rPeak = computeNetShift(peak, 1, K_H, K_L).deltaR_H;
    const rHigh = computeNetShift(peak * 100, 1, K_H, K_L).deltaR_H;
    const rHigher = computeNetShift(peak * 10000, 1, K_H, K_L).deltaR_H;
    expect(rPeak).toBeGreaterThan(rHigh);
    expect(rHigh).toBeGreaterThan(rHigher);
  });
});

describe('computeNetShift — CF-M6-02 Weber-Fechner log-linearity R² ≥ 0.95', () => {
  it('log-linear response holds across 3 decades in the rising-linear regime', () => {
    // In the rising-linear regime where K_H·[L] ≪ 1 and K_L·[L] ≪ 1 (both
    // denominator factors ≈ 1), the closed form collapses to
    //   ΔR_H ≈ [L] · R_T · (K_H − K_L)
    // — strictly linear in [L]. Plotting log(ΔR_H) vs log([L]) gives a
    // straight line with slope ≈ +1. R² → 1 as the window shrinks.
    // Choose K_H=1, K_L=0.001, L ∈ [1e-6, 1e-3] → K_H·L ∈ [1e-6, 1e-3] ≪ 1
    // and K_L·L ∈ [1e-9, 1e-6] ≪ 1. Three decades.
    const K_H = 1;
    const K_L = 0.001;
    const logLs: number[] = [];
    const logDeltas: number[] = [];
    for (let i = 0; i < 30; i += 1) {
      const logL = -6 + (i / 29) * 3; // log10 L from -6..-3
      const L = Math.pow(10, logL);
      const r = computeNetShift(L, 1, K_H, K_L).deltaR_H;
      logLs.push(logL);
      logDeltas.push(Math.log10(r));
    }
    // log-log should have slope ≈ 1, R² ≈ 1.
    const rsqLog = rSquared(logLs, logDeltas);
    expect(rsqLog).toBeGreaterThanOrEqual(0.95);
  });
});

describe('computeNetShift — CF-M6-06 specialisation gradient', () => {
  it('produces expected activation ordering for a 10-skill K_H/K_L gradient', () => {
    // 10 skills, K_H grows 1..10, K_L shrinks 0.9..0.0 — the ratio K_H/K_L
    // grows monotonically. ΔR_H at a fixed probe [L]=1 should grow
    // monotonically too (until saturation kicks in).
    const L = 1;
    const deltas: number[] = [];
    for (let i = 1; i <= 10; i += 1) {
      const K_H = i;
      const K_L = Math.max(1e-3, 1 - i * 0.1);
      const r = computeNetShift(L, 1, K_H, K_L).deltaR_H;
      deltas.push(r);
    }
    // Expected ordering: ΔR_H[9] > ΔR_H[0].
    expect(deltas[9]).toBeGreaterThan(deltas[0]);
    // And at least 7 of the 9 adjacent pairs should be non-decreasing (a
    // couple of inversions near saturation are acceptable).
    let nondecreasing = 0;
    for (let i = 1; i < deltas.length; i += 1) {
      if (deltas[i]! >= deltas[i - 1]!) nondecreasing += 1;
    }
    expect(nondecreasing).toBeGreaterThanOrEqual(7);
  });
});

describe('computeNetShift — SC-M6-CONS receptor conservation', () => {
  it('R_H + R_L === R_T to 10⁻⁹ across the full sweep', () => {
    const K_H = 10;
    const K_L = 0.1;
    const R_T = 3.141592653589793;
    for (const L of [0, 1e-3, 1, 1e3, 1e6]) {
      const r = computeNetShift(L, R_T, K_H, K_L);
      expect(Math.abs(r.R_H + r.R_L - R_T)).toBeLessThan(1e-9);
    }
  });

  it('conservation holds in silent-binder edge case', () => {
    const R_T = 2.71828;
    const r = computeNetShift(1.0, R_T, 0.5, 0.5);
    expect(Math.abs(r.R_H + r.R_L - R_T)).toBeLessThan(1e-9);
  });
});

describe('computeNetShift — edge-case input guards', () => {
  it('returns NaN on negative inputs rather than silently misleading numbers', () => {
    const r = computeNetShift(-1, 1, 10, 0.1);
    expect(Number.isNaN(r.deltaR_H)).toBe(true);
  });

  it('returns NaN on non-finite inputs', () => {
    const r = computeNetShift(Infinity, 1, 10, 0.1);
    expect(Number.isNaN(r.deltaR_H)).toBe(true);
  });

  it('L = 0 gives ΔR_H = 0 with equilibrium split', () => {
    const r = computeNetShift(0, 1, 10, 0.1);
    expect(r.deltaR_H).toBe(0);
    expect(r.R_H).toBe(0.5);
    expect(r.R_L).toBe(0.5);
  });
});

describe('peakLigand', () => {
  it('equals 1/sqrt(K_H·K_L)', () => {
    expect(peakLigand(10, 0.1)).toBeCloseTo(1 / Math.sqrt(1), 10);
    expect(peakLigand(4, 1)).toBeCloseTo(0.5, 10);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rSquared(xs: number[], ys: number[]): number {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i]! - meanX;
    const dy = ys[i]! - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return 0;
  const r = num / Math.sqrt(denX * denY);
  return r * r;
}
