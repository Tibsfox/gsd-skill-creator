/**
 * Stackelberg Drainability Pricing Reference — utility model tests.
 *
 * Verifies that CES, Cobb-Douglas, and Quadratic utility models produce
 * mathematically expected values for known inputs.
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 */

import { describe, expect, it } from 'vitest';
import {
  cesBestResponse,
  cobbDouglasBestResponse,
  computeBestResponse,
  computeRevenue,
  evaluateCobbDouglas,
  evaluateCES,
  evaluateQuadratic,
  evaluateUtility,
  quadraticBestResponse,
  quadraticBestResponseMulti,
} from '../utility-models.js';
import type {
  CESUtilityParams,
  CobbDouglasUtilityParams,
  QuadraticUtilityParams,
} from '../types.js';

// ============================================================================
// Quadratic utility
// ============================================================================

describe('evaluateQuadratic', () => {
  it('returns 0 for x=0', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    expect(evaluateQuadratic(params, 0)).toBe(0);
  });

  it('returns a·x − (b/2)·x² for known input', () => {
    // a=10, b=2, x=3 → 10·3 − (2/2)·9 = 30 − 9 = 21
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    expect(evaluateQuadratic(params, 3)).toBeCloseTo(21, 6);
  });

  it('returns 0 for negative x', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    expect(evaluateQuadratic(params, -1)).toBe(0);
  });

  it('is concave — utility at midpoint > average of endpoints', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    const u0 = evaluateQuadratic(params, 0);
    const u4 = evaluateQuadratic(params, 4);
    const u2 = evaluateQuadratic(params, 2);
    expect(u2).toBeGreaterThan((u0 + u4) / 2);
  });
});

describe('quadraticBestResponse', () => {
  it('returns closed-form x* = (a - p) / b for interior solutions', () => {
    // a=10, b=2, p=4 → x* = (10-4)/2 = 3
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    expect(quadraticBestResponse(params, 4, 100)).toBeCloseTo(3, 6);
  });

  it('returns 0 when price >= a (no profitable consumption)', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    expect(quadraticBestResponse(params, 10, 100)).toBe(0);
    expect(quadraticBestResponse(params, 15, 100)).toBe(0);
  });

  it('clamps to maxX when unconstrained optimum exceeds capacity', () => {
    // a=10, b=2, p=0 → unconstrained x* = 5; maxX=3 → clamp to 3
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    expect(quadraticBestResponse(params, 0, 3)).toBeCloseTo(3, 6);
  });

  it('demand decreases as price increases (law of demand)', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    const d1 = quadraticBestResponse(params, 2, 100);
    const d2 = quadraticBestResponse(params, 6, 100);
    expect(d1).toBeGreaterThan(d2);
  });
});

describe('quadraticBestResponseMulti', () => {
  it('computes per-resource demand independently', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    const demand = quadraticBestResponseMulti(
      params,
      { compute: 4, bandwidth: 6 },
      { compute: 100, bandwidth: 100 },
    );
    // compute: (10-4)/2 = 3; bandwidth: (10-6)/2 = 2
    expect(demand.compute).toBeCloseTo(3, 5);
    expect(demand.bandwidth).toBeCloseTo(2, 5);
  });
});

// ============================================================================
// CES utility
// ============================================================================

describe('evaluateCES', () => {
  it('returns positive value for positive consumption', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 2,
      alpha: { compute: 0.5, bandwidth: 0.5 },
      rho: 0.5,
    };
    const u = evaluateCES(params, { compute: 4, bandwidth: 4 });
    expect(u).toBeGreaterThan(0);
  });

  it('returns 0 if any resource consumption is 0 and rho<0 (Leontief)', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 1,
      alpha: { compute: 0.5, bandwidth: 0.5 },
      rho: -1,
    };
    expect(evaluateCES(params, { compute: 0, bandwidth: 4 })).toBe(0);
  });

  it('is symmetric for equal alpha and equal consumption', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 1,
      alpha: { a: 0.5, b: 0.5 },
      rho: 0.5,
    };
    const u1 = evaluateCES(params, { a: 2, b: 3 });
    const u2 = evaluateCES(params, { a: 3, b: 2 });
    // Symmetric alpha → swapping resources gives same utility
    expect(u1).toBeCloseTo(u2, 8);
  });

  it('increases monotonically with consumption when rho>0', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 1,
      alpha: { compute: 1 },
      rho: 0.5,
    };
    const u1 = evaluateCES(params, { compute: 1 });
    const u2 = evaluateCES(params, { compute: 4 });
    expect(u2).toBeGreaterThan(u1);
  });
});

describe('cesBestResponse', () => {
  it('produces non-negative demand for each resource', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 1,
      alpha: { compute: 0.6, bandwidth: 0.4 },
      rho: 0.5,
    };
    const demand = cesBestResponse(
      params,
      { compute: 2, bandwidth: 3 },
      { compute: 10, bandwidth: 10 },
    );
    expect(demand.compute).toBeGreaterThanOrEqual(0);
    expect(demand.bandwidth).toBeGreaterThanOrEqual(0);
  });

  it('does not exceed maxConsumption', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 2,
      alpha: { compute: 0.5, bandwidth: 0.5 },
      rho: 0.5,
    };
    const maxC = 5;
    const maxB = 3;
    const demand = cesBestResponse(
      params,
      { compute: 0.1, bandwidth: 0.1 },
      { compute: maxC, bandwidth: maxB },
    );
    expect(demand.compute).toBeLessThanOrEqual(maxC + 1e-9);
    expect(demand.bandwidth).toBeLessThanOrEqual(maxB + 1e-9);
  });
});

// ============================================================================
// Cobb-Douglas utility
// ============================================================================

describe('evaluateCobbDouglas', () => {
  it('returns A · x^α for single resource', () => {
    // A=2, alpha={x: 0.5}, x=4 → 2 · 4^0.5 = 2 · 2 = 4
    const params: CobbDouglasUtilityParams = {
      kind: 'cobb-douglas',
      A: 2,
      alpha: { x: 0.5 },
    };
    expect(evaluateCobbDouglas(params, { x: 4 })).toBeCloseTo(4, 6);
  });

  it('returns 0 if any resource consumption is 0', () => {
    const params: CobbDouglasUtilityParams = {
      kind: 'cobb-douglas',
      A: 1,
      alpha: { compute: 0.5, bandwidth: 0.5 },
    };
    expect(evaluateCobbDouglas(params, { compute: 0, bandwidth: 4 })).toBe(0);
  });

  it('is monotone increasing in each resource', () => {
    const params: CobbDouglasUtilityParams = {
      kind: 'cobb-douglas',
      A: 1,
      alpha: { compute: 0.4, bandwidth: 0.6 },
    };
    const u1 = evaluateCobbDouglas(params, { compute: 2, bandwidth: 3 });
    const u2 = evaluateCobbDouglas(params, { compute: 4, bandwidth: 3 });
    expect(u2).toBeGreaterThan(u1);
  });

  it('satisfies homogeneity: U(λx) = λ^(Σα) · U(x)', () => {
    // Σα = 0.4 + 0.6 = 1.0, so U(2x) = 2 · U(x)
    const params: CobbDouglasUtilityParams = {
      kind: 'cobb-douglas',
      A: 1,
      alpha: { compute: 0.4, bandwidth: 0.6 },
    };
    const u1 = evaluateCobbDouglas(params, { compute: 2, bandwidth: 3 });
    const u2 = evaluateCobbDouglas(params, { compute: 4, bandwidth: 6 });
    // λ=2, Σα=1 → U(2x) = 2^1 · U(x)
    expect(u2).toBeCloseTo(2 * u1, 5);
  });
});

describe('cobbDouglasBestResponse', () => {
  it('produces positive demand at low prices', () => {
    const params: CobbDouglasUtilityParams = {
      kind: 'cobb-douglas',
      A: 1,
      alpha: { compute: 0.4, bandwidth: 0.6 },
    };
    const demand = cobbDouglasBestResponse(
      params,
      { compute: 0.01, bandwidth: 0.01 },
      { compute: 10, bandwidth: 10 },
    );
    expect(demand.compute).toBeGreaterThan(0);
    expect(demand.bandwidth).toBeGreaterThan(0);
  });
});

// ============================================================================
// Unified dispatcher
// ============================================================================

describe('evaluateUtility', () => {
  it('dispatches to quadratic for kind=quadratic', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    // Single resource: x=3 → 10·3 − (2/2)·9 = 21
    expect(evaluateUtility(params, { r: 3 })).toBeCloseTo(21, 5);
  });

  it('dispatches to CES for kind=ces', () => {
    const params: CESUtilityParams = {
      kind: 'ces',
      A: 1,
      alpha: { r: 1 },
      rho: 0.5,
    };
    const u = evaluateUtility(params, { r: 4 });
    // CES single resource, rho=0.5: U = A · (1·4^0.5)^(1/0.5) = (2)^2 = 4
    expect(u).toBeCloseTo(4, 5);
  });

  it('dispatches to Cobb-Douglas for kind=cobb-douglas', () => {
    const params: CobbDouglasUtilityParams = {
      kind: 'cobb-douglas',
      A: 2,
      alpha: { x: 0.5 },
    };
    expect(evaluateUtility(params, { x: 4 })).toBeCloseTo(4, 5);
  });
});

describe('computeBestResponse', () => {
  it('dispatches correctly for quadratic utility', () => {
    const params: QuadraticUtilityParams = { kind: 'quadratic', a: 10, b: 2 };
    const demand = computeBestResponse(
      params,
      { compute: 4 },
      { compute: 100 },
    );
    // (10-4)/2 = 3
    expect(demand.compute).toBeCloseTo(3, 5);
  });
});

// ============================================================================
// Revenue model
// ============================================================================

describe('computeRevenue', () => {
  it('computes linear revenue = Σ pᵣ · dᵣ', () => {
    const revenue = computeRevenue(
      { compute: 3, bandwidth: 2 },
      { compute: 10, bandwidth: 5 },
      'linear',
    );
    // 3·10 + 2·5 = 30 + 10 = 40
    expect(revenue).toBeCloseTo(40, 6);
  });

  it('computes quadratic (margin) revenue = Σ (pᵣ − cᵣ) · dᵣ', () => {
    const revenue = computeRevenue(
      { compute: 5, bandwidth: 4 },
      { compute: 10, bandwidth: 5 },
      'quadratic',
      { compute: 1, bandwidth: 2 },
    );
    // (5-1)·10 + (4-2)·5 = 40 + 10 = 50
    expect(revenue).toBeCloseTo(50, 6);
  });
});
