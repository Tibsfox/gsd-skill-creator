/**
 * Local-linearity validator tests (Phase 767).
 *
 * @module activation-steering/__tests__/local-linearity
 */

import { describe, expect, it } from 'vitest';
import {
  validateLocalLinearity,
  type LinearitySample,
} from '../local-linearity-validator.js';

describe('validateLocalLinearity', () => {
  it('reports zero residual on a perfectly linear y = 2x + 1 sequence', () => {
    const samples: LinearitySample[] = [];
    for (let i = 0; i < 8; i++) {
      const x = [i, i * 0.5];
      const y = [2 * x[0]! + 1, 2 * x[1]! + 1];
      samples.push({ x, y });
    }
    const fit = validateLocalLinearity(samples, 0.1);
    expect(fit.normalisedResidual).toBeLessThan(1e-9);
    expect(fit.withinThreshold).toBe(true);
    expect(fit.warning).toBeUndefined();
    expect(fit.samples).toBe(8);
  });

  it('flags residuals exceeding the threshold', () => {
    // Highly non-linear: y = sin(x), large jumps relative to x range.
    const samples: LinearitySample[] = [];
    for (let i = 0; i < 16; i++) {
      const xv = (i / 16) * Math.PI * 4;
      const x = [xv];
      const y = [Math.sin(xv) * 10]; // amplitude blown up to make residual huge
      samples.push({ x, y });
    }
    const fit = validateLocalLinearity(samples, 0.1);
    expect(fit.withinThreshold).toBe(false);
    expect(fit.warning).toBeDefined();
    expect(fit.warning!).toMatch(/residual/);
  });

  it('returns benign result on zero samples', () => {
    const fit = validateLocalLinearity([], 0.1);
    expect(fit.samples).toBe(0);
    expect(fit.withinThreshold).toBe(true);
    expect(fit.warning).toMatch(/no samples/);
  });

  it('returns benign result on single sample', () => {
    const fit = validateLocalLinearity([{ x: [1, 2], y: [3, 4] }], 0.1);
    expect(fit.samples).toBe(1);
    expect(fit.withinThreshold).toBe(true);
    expect(fit.warning).toMatch(/single sample/);
  });

  it('throws on inconsistent sample dimensionality', () => {
    expect(() =>
      validateLocalLinearity(
        [
          { x: [1, 2], y: [1, 2] },
          { x: [1, 2, 3], y: [1, 2, 3] },
        ],
        0.1,
      ),
    ).toThrow(/dimensionality/);
  });

  it('throws on out-of-range threshold', () => {
    expect(() => validateLocalLinearity([], 0)).toThrow();
    expect(() => validateLocalLinearity([], 2)).toThrow();
  });
});
