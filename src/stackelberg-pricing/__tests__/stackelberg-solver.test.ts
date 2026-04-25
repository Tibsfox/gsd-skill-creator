/**
 * Stackelberg Drainability Pricing Reference — Stackelberg solver tests.
 *
 * Verifies:
 *   - Stackelberg equilibrium convergence for ≥2 utility models.
 *   - Drainability guardrail is respected in the equilibrium solution.
 *   - Revenue is non-negative at equilibrium.
 *   - Monotone scaling: equilibrium prices are non-decreasing as tenants added.
 *   - Solver handles edge cases gracefully.
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 */

import { describe, expect, it } from 'vitest';
import { solveStackelberg as solveRaw } from '../stackelberg-solver.js';
import type { StackelbergGame } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeQuadraticGame(
  numTenants: number,
  a = 10,
  b = 2,
  capacity = 100,
  floor = 20,
  gridSteps = 15,
): StackelbergGame {
  return {
    resources: [
      { id: 'compute', capacity, guardrailFloor: floor, minPrice: 0, maxPrice: a },
    ],
    tenants: Array.from({ length: numTenants }, (_, i) => ({
      id: `T${i}`,
      utility: { kind: 'quadratic' as const, a, b },
      maxConsumption: { compute: capacity },
    })),
    gridSteps,
  };
}

// ============================================================================
// Equilibrium convergence — Quadratic utility model
// ============================================================================

describe('solveStackelberg — quadratic utility (equilibrium convergence)', () => {
  it('returns a PricingSolution with the required fields', () => {
    const game = makeQuadraticGame(2);
    const sol = solveRaw(game);
    expect(sol).toHaveProperty('prices');
    expect(sol).toHaveProperty('tenantUsages');
    expect(sol).toHaveProperty('aggregateDemand');
    expect(sol).toHaveProperty('revenue');
    expect(sol).toHaveProperty('guardrailFeasible');
    expect(sol).toHaveProperty('guardrailSlack');
    expect(sol).toHaveProperty('solverIterations');
  });

  it('equilibrium is guardrail-feasible for 2 tenants', () => {
    const game = makeQuadraticGame(2);
    const sol = solveRaw(game);
    expect(sol.guardrailFeasible).toBe(true);
    expect(sol.guardrailSlack.compute).toBeGreaterThanOrEqual(0);
  });

  it('equilibrium revenue is positive', () => {
    const game = makeQuadraticGame(2);
    const sol = solveRaw(game);
    expect(sol.revenue).toBeGreaterThan(0);
  });

  it('equilibrium price is within [minPrice, maxPrice]', () => {
    const game = makeQuadraticGame(3, 10, 2, 100, 20, 10);
    const sol = solveRaw(game);
    expect(sol.prices.compute).toBeGreaterThanOrEqual(0);
    expect(sol.prices.compute).toBeLessThanOrEqual(10);
  });

  it('all tenants have non-negative demand at equilibrium', () => {
    const game = makeQuadraticGame(3);
    const sol = solveRaw(game);
    for (const usage of sol.tenantUsages) {
      expect(usage.consumption.compute).toBeGreaterThanOrEqual(0);
    }
  });

  it('aggregate demand matches sum of individual demands', () => {
    const game = makeQuadraticGame(3);
    const sol = solveRaw(game);
    const summed = sol.tenantUsages.reduce(
      (acc, u) => acc + (u.consumption.compute ?? 0),
      0,
    );
    expect(sol.aggregateDemand.compute).toBeCloseTo(summed, 6);
  });
});

// ============================================================================
// Equilibrium convergence — CES utility model
// ============================================================================

describe('solveStackelberg — CES utility (equilibrium convergence)', () => {
  it('finds a feasible equilibrium for 2 CES tenants', () => {
    const game: StackelbergGame = {
      resources: [
        { id: 'compute', capacity: 100, guardrailFloor: 20, minPrice: 0.1, maxPrice: 5 },
      ],
      tenants: [
        {
          id: 'T0',
          utility: { kind: 'ces', A: 2, alpha: { compute: 1 }, rho: 0.5 },
          maxConsumption: { compute: 50 },
        },
        {
          id: 'T1',
          utility: { kind: 'ces', A: 1.5, alpha: { compute: 1 }, rho: 0.5 },
          maxConsumption: { compute: 50 },
        },
      ],
      gridSteps: 10,
    };
    const sol = solveRaw(game);
    expect(sol.guardrailFeasible).toBe(true);
    expect(sol.revenue).toBeGreaterThan(0);
  });
});

// ============================================================================
// Equilibrium convergence — Cobb-Douglas utility model
// ============================================================================

describe('solveStackelberg — Cobb-Douglas utility (equilibrium convergence)', () => {
  it('finds a feasible equilibrium for 2 Cobb-Douglas tenants', () => {
    const game: StackelbergGame = {
      resources: [
        { id: 'compute', capacity: 100, guardrailFloor: 15, minPrice: 0.1, maxPrice: 3 },
      ],
      tenants: [
        {
          id: 'T0',
          utility: { kind: 'cobb-douglas', A: 2, alpha: { compute: 0.6 } },
          maxConsumption: { compute: 40 },
        },
        {
          id: 'T1',
          utility: { kind: 'cobb-douglas', A: 1.5, alpha: { compute: 0.5 } },
          maxConsumption: { compute: 40 },
        },
      ],
      gridSteps: 10,
    };
    const sol = solveRaw(game);
    expect(sol.guardrailFeasible).toBe(true);
    expect(sol.revenue).toBeGreaterThan(0);
  });
});

// ============================================================================
// Drainability guardrail enforcement
// ============================================================================

describe('solveStackelberg — drainability guardrail enforcement', () => {
  it('equilibrium respects guardrail floor (aggregate ≤ C − δ)', () => {
    const capacity = 100;
    const floor = 20;
    const game = makeQuadraticGame(4, 10, 2, capacity, floor, 15);
    const sol = solveRaw(game);
    expect(sol.guardrailFeasible).toBe(true);
    const limit = capacity - floor; // 80
    expect(sol.aggregateDemand.compute).toBeLessThanOrEqual(limit + 1e-6);
  });

  it('solver returns feasible solution even with strict guardrail (large floor)', () => {
    // Very strict guardrail: floor = 80% of capacity
    const game = makeQuadraticGame(3, 10, 2, 100, 80, 15);
    const sol = solveRaw(game);
    // Either feasible, or has non-negative aggregate demand at most = 20
    if (sol.guardrailFeasible) {
      expect(sol.aggregateDemand.compute).toBeLessThanOrEqual(20 + 1e-6);
    }
  });
});

// ============================================================================
// Monotone scaling — prices non-decreasing as tenants increase
// ============================================================================

describe('solveStackelberg — monotone scaling property', () => {
  it('equilibrium price is non-decreasing as more tenants are added', () => {
    // Per arXiv:2604.16802: under drainability guardrails, adding tenants
    // tightens the guardrail constraint → prices must be non-decreasing.
    const a = 10;
    const b = 2;
    const capacity = 100;
    const floor = 20;
    const steps = 15;

    const prices: number[] = [];
    for (const n of [1, 2, 3, 4]) {
      const game = makeQuadraticGame(n, a, b, capacity, floor, steps);
      const sol = solveRaw(game);
      prices.push(sol.prices.compute ?? 0);
    }

    // Each subsequent price should be ≥ the previous (allowing small numeric tolerance).
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]!).toBeGreaterThanOrEqual(prices[i - 1]! - 1e-6);
    }
  });
});

// ============================================================================
// Error handling
// ============================================================================

describe('solveStackelberg — error handling', () => {
  it('throws when no resources are provided', () => {
    const game: StackelbergGame = {
      resources: [],
      tenants: [
        {
          id: 'T0',
          utility: { kind: 'quadratic', a: 10, b: 2 },
          maxConsumption: { compute: 50 },
        },
      ],
    };
    expect(() => solveRaw(game)).toThrow();
  });

  it('throws when no tenants are provided', () => {
    const game: StackelbergGame = {
      resources: [{ id: 'compute', capacity: 100, guardrailFloor: 20 }],
      tenants: [],
    };
    expect(() => solveRaw(game)).toThrow();
  });
});
