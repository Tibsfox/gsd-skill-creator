/**
 * MD-5 — Head forward + gradient correctness tests.
 */

import { describe, it, expect } from 'vitest';
import {
  createHead,
  forward,
  gradient,
  applyUpdateInPlace,
  cloneHead,
  sigmoid,
} from '../head.js';

describe('sigmoid — numerical stability', () => {
  it('sigmoid(0) === 0.5', () => {
    expect(sigmoid(0)).toBe(0.5);
  });

  it('sigmoid(+∞) === 1 and sigmoid(−∞) === 0', () => {
    expect(sigmoid(Number.POSITIVE_INFINITY)).toBe(1);
    expect(sigmoid(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('symmetric: sigmoid(−z) === 1 − sigmoid(z)', () => {
    for (const z of [0.1, 1, 5, 20, 40]) {
      expect(sigmoid(-z)).toBeCloseTo(1 - sigmoid(z), 12);
    }
  });

  it('does not overflow on large negative z', () => {
    // The naive 1/(1+exp(-z)) would divide by exp(1000) ~ Infinity.
    expect(sigmoid(-1000)).toBe(0);
    expect(Number.isFinite(sigmoid(-1000))).toBe(true);
  });

  it('NaN → 0.5 neutral fallback', () => {
    expect(sigmoid(Number.NaN)).toBe(0.5);
  });
});

describe('createHead — defensive construction', () => {
  it('zero-initialised: weights + bias = 0; updateCount = 0', () => {
    const h = createHead({ skillId: 's1', dim: 4, kHMin: 0.5, kHMax: 2.0 });
    expect(h.weights).toEqual([0, 0, 0, 0]);
    expect(h.bias).toBe(0);
    expect(h.updateCount).toBe(0);
  });

  it('untrained head output is the midpoint of [kHMin, kHMax]', () => {
    const h = createHead({ skillId: 's1', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    const r = forward(h, [0.1, 0.2, 0.3]);
    // sigmoid(0) = 0.5 → kHMin + 0.5 · (kHMax − kHMin) = 1.25
    expect(r.s).toBe(0.5);
    expect(r.kH).toBeCloseTo(1.25, 12);
  });

  it('rejects non-integer dim', () => {
    expect(() => createHead({ skillId: 's', dim: 1.5, kHMin: 0, kHMax: 1 })).toThrow();
  });

  it('rejects kHMax <= kHMin', () => {
    expect(() => createHead({ skillId: 's', dim: 2, kHMin: 1, kHMax: 1 })).toThrow();
    expect(() => createHead({ skillId: 's', dim: 2, kHMin: 2, kHMax: 1 })).toThrow();
  });
});

describe('forward — arithmetic correctness', () => {
  it('computes z = w·x + b exactly', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: -10, kHMax: 10 });
    h.weights[0] = 1;
    h.weights[1] = 2;
    h.weights[2] = -1;
    h.bias = 0.5;
    const r = forward(h, [1, 2, 3]);
    // z = 1·1 + 2·2 + (-1)·3 + 0.5 = 2.5
    expect(r.z).toBeCloseTo(2.5, 12);
    expect(r.s).toBeCloseTo(sigmoid(2.5), 12);
    expect(r.kH).toBeCloseTo(-10 + 20 * sigmoid(2.5), 12);
  });

  it('output is bounded in [kHMin, kHMax]', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0.1, kHMax: 5.0 });
    h.weights[0] = 100;
    h.weights[1] = -100;
    // extreme positive z
    let r = forward(h, [10, -10]);
    expect(r.kH).toBeLessThanOrEqual(5.0);
    expect(r.kH).toBeGreaterThanOrEqual(0.1);
    // extreme negative z
    r = forward(h, [-10, 10]);
    expect(r.kH).toBeLessThanOrEqual(5.0);
    expect(r.kH).toBeGreaterThanOrEqual(0.1);
  });

  it('rejects taskEmbed with wrong dimension', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0, kHMax: 1 });
    expect(() => forward(h, [1, 2])).toThrow();
  });
});

describe('gradient — hand-derived correctness vs. numerical derivative', () => {
  function kHAt(head: ReturnType<typeof createHead>, x: readonly number[]): number {
    return forward(head, x).kH;
  }

  it('dK_H/dw_i matches central finite difference', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    h.weights[0] = 0.3;
    h.weights[1] = -0.7;
    h.weights[2] = 1.1;
    h.bias = 0.2;
    const x = [0.5, -0.4, 0.8];
    const g = gradient(h, x);

    const eps = 1e-6;
    for (let i = 0; i < h.dim; i += 1) {
      const wOrig = h.weights[i]!;
      h.weights[i] = wOrig + eps;
      const up = kHAt(h, x);
      h.weights[i] = wOrig - eps;
      const dn = kHAt(h, x);
      h.weights[i] = wOrig; // restore
      const numeric = (up - dn) / (2 * eps);
      expect(g.dWeights[i]!).toBeCloseTo(numeric, 6);
    }
  });

  it('dK_H/db matches central finite difference', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0, kHMax: 1 });
    h.weights[0] = 0.1;
    h.weights[1] = -0.3;
    h.bias = 0.5;
    const x = [1, -1];
    const g = gradient(h, x);

    const eps = 1e-6;
    const bOrig = h.bias;
    h.bias = bOrig + eps;
    const up = kHAt(h, x);
    h.bias = bOrig - eps;
    const dn = kHAt(h, x);
    h.bias = bOrig;
    const numeric = (up - dn) / (2 * eps);
    expect(g.dBias).toBeCloseTo(numeric, 6);
  });

  it('dK_H/dz = (kHMax − kHMin) · s · (1 − s)', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0.5, kHMax: 2.0 });
    h.weights[0] = 0.5;
    h.bias = -0.2;
    const x = [1, 0];
    const f = forward(h, x);
    const g = gradient(h, x, f);
    const expected = (h.kHMax - h.kHMin) * f.s * (1 - f.s);
    expect(g.dKHdZ).toBeCloseTo(expected, 12);
  });
});

describe('applyUpdateInPlace — SGD semantics', () => {
  it('updates weights by θ ← θ − scaledGradient · dK_H/dθ and bumps updateCount', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0, kHMax: 1 });
    h.weights[0] = 0.5;
    h.weights[1] = -0.2;
    h.bias = 0.1;
    const x = [0.4, 0.7];
    const g = gradient(h, x);
    const scaled = 0.1;
    const w0Before = h.weights[0]!;
    const w1Before = h.weights[1]!;
    const bBefore = h.bias;
    const cntBefore = h.updateCount;
    applyUpdateInPlace(h, g, scaled);
    expect(h.weights[0]!).toBeCloseTo(w0Before - scaled * g.dWeights[0]!, 12);
    expect(h.weights[1]!).toBeCloseTo(w1Before - scaled * g.dWeights[1]!, 12);
    expect(h.bias).toBeCloseTo(bBefore - scaled * g.dBias, 12);
    expect(h.updateCount).toBe(cntBefore + 1);
  });

  it('throws on non-finite scaledGradient', () => {
    const h = createHead({ skillId: 's', dim: 1, kHMin: 0, kHMax: 1 });
    const g = gradient(h, [0]);
    expect(() => applyUpdateInPlace(h, g, Number.NaN)).toThrow();
  });
});

describe('cloneHead — deep copy', () => {
  it('clone is independent of the original', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0, kHMax: 1 });
    h.weights[0] = 1;
    h.weights[1] = 2;
    h.weights[2] = 3;
    h.bias = 0.5;
    h.updateCount = 7;
    const c = cloneHead(h);
    c.weights[0] = 99;
    c.bias = 42;
    c.updateCount = 0;
    expect(h.weights[0]!).toBe(1);
    expect(h.bias).toBe(0.5);
    expect(h.updateCount).toBe(7);
  });
});
