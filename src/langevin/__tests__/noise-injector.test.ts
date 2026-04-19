/**
 * MD-3 — Noise injector tests (CF-MD3-03 Gaussian properties; determinism).
 */

import { describe, it, expect } from 'vitest';
import {
  injectLangevinNoise,
  gaussianSample,
  mulberry32,
} from '../noise-injector.js';

describe('injectLangevinNoise — Gaussian properties', () => {
  it('zero-mean noise: sample mean ≈ 0 over large draw', () => {
    const rng = mulberry32(1);
    const params = new Array<number>(8000).fill(0);
    const noisy = injectLangevinNoise(params, 1.0, rng);
    let sum = 0;
    for (const x of noisy) sum += x;
    const mean = sum / noisy.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
  });

  it('variance ≈ scale² on large draw (scale=1.0)', () => {
    const rng = mulberry32(2);
    const params = new Array<number>(8000).fill(0);
    const noisy = injectLangevinNoise(params, 1.0, rng);
    let sum = 0;
    for (const x of noisy) sum += x;
    const mean = sum / noisy.length;
    let ssq = 0;
    for (const x of noisy) ssq += (x - mean) * (x - mean);
    const variance = ssq / noisy.length;
    // Tolerance ~5% on 8000 draws.
    expect(variance).toBeGreaterThan(0.92);
    expect(variance).toBeLessThan(1.08);
  });

  it('variance ≈ scale² on large draw (scale=0.25)', () => {
    const rng = mulberry32(3);
    const params = new Array<number>(8000).fill(0);
    const noisy = injectLangevinNoise(params, 0.25, rng);
    let sum = 0;
    for (const x of noisy) sum += x;
    const mean = sum / noisy.length;
    let ssq = 0;
    for (const x of noisy) ssq += (x - mean) * (x - mean);
    const variance = ssq / noisy.length;
    const expected = 0.25 * 0.25;
    expect(Math.abs(variance - expected)).toBeLessThan(expected * 0.1);
  });
});

describe('injectLangevinNoise — seeded determinism', () => {
  it('identical seeds produce identical noisy vectors', () => {
    const params = [0.1, 0.2, 0.3, 0.4];
    const a = injectLangevinNoise(params, 0.5, mulberry32(42));
    const b = injectLangevinNoise(params, 0.5, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('different seeds produce different noisy vectors', () => {
    const params = [0.1, 0.2, 0.3, 0.4];
    const a = injectLangevinNoise(params, 0.5, mulberry32(1));
    const b = injectLangevinNoise(params, 0.5, mulberry32(2));
    expect(a).not.toEqual(b);
  });

  it('returns a fresh array (no input mutation)', () => {
    const params = [0.1, 0.2, 0.3];
    const original = [...params];
    const noisy = injectLangevinNoise(params, 0.1, mulberry32(7));
    expect(params).toEqual(original); // input untouched
    expect(noisy).not.toBe(params); // distinct reference
  });
});

describe('injectLangevinNoise — safety valve', () => {
  it('scale = 0 returns identity copy', () => {
    const params = [0.25, 0.25, 0.25, 0.25];
    const result = injectLangevinNoise(params, 0, mulberry32(5));
    expect(result).toEqual(params);
    expect(result).not.toBe(params); // fresh copy
  });

  it('negative scale returns identity copy', () => {
    const params = [0.5, 0.5];
    const result = injectLangevinNoise(params, -1, mulberry32(5));
    expect(result).toEqual(params);
  });

  it('NaN scale returns identity copy', () => {
    const params = [0.5, 0.5];
    const result = injectLangevinNoise(params, Number.NaN, mulberry32(5));
    expect(result).toEqual(params);
  });

  it('empty input returns empty output', () => {
    const result = injectLangevinNoise([], 1.0, mulberry32(5));
    expect(result).toEqual([]);
  });
});

describe('gaussianSample — Box-Muller', () => {
  it('produces finite values for typical RNG output', () => {
    const rng = mulberry32(11);
    for (let i = 0; i < 1000; i++) {
      const x = gaussianSample(rng);
      expect(Number.isFinite(x)).toBe(true);
    }
  });

  it('handles RNG returning exact zero (Box-Muller log-floor)', () => {
    let calls = 0;
    const pathological = () => {
      calls++;
      return calls === 1 ? 0 : 0.5;
    };
    const x = gaussianSample(pathological);
    expect(Number.isFinite(x)).toBe(true);
  });
});

describe('mulberry32', () => {
  it('produces uniform-ish values in [0, 1)', () => {
    const rng = mulberry32(99);
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(min).toBeLessThan(0.05);
    expect(max).toBeGreaterThan(0.95);
  });
});
