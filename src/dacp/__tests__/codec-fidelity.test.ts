/**
 * Tests for the DACP fidelity-tier codec (bit-allocation oracle).
 *
 * Anchored on arXiv:2511.18884 (Robust Nonlinear Transform Coding).
 * Load-bearing acceptance criterion: under decreasing P_budget, the oracle
 * preserves highest-priority dimensions monotonically.
 *
 * @module dacp/__tests__/codec-fidelity
 */

import { describe, it, expect } from 'vitest';
import {
  allocateFidelityDimensions,
  selectFidelityTier,
  DEFAULT_FIDELITY_DIMENSIONS,
  type FidelityDimension,
} from '../codec-fidelity.js';

// ============================================================================
// Helpers
// ============================================================================

/** Return the set of allocated dimension names for a given budget. */
function allocatedNames(budget: number, dims?: FidelityDimension[]): Set<string> {
  const result = allocateFidelityDimensions(budget, dims);
  return new Set(result.allocated.map(d => d.name));
}

// ============================================================================
// Monotonicity (load-bearing acceptance criterion)
// ============================================================================

describe('monotone priority preservation under decreasing P_budget (arXiv:2511.18884)', () => {
  it('allocated set under smaller budget is a subset of allocated set under larger budget', () => {
    // Test across a range of budget levels that straddle dimension cost thresholds.
    const budgets = [20_000, 15_000, 11_000, 6_000, 3_000, 1_000, 0];

    for (let i = 0; i < budgets.length - 1; i++) {
      const higherBudget = budgets[i];
      const lowerBudget = budgets[i + 1];

      const higher = allocatedNames(higherBudget);
      const lower = allocatedNames(lowerBudget);

      // Every name allocated under the lower budget must also be allocated
      // under the higher budget (subset / monotone containment).
      for (const name of lower) {
        expect(higher.has(name)).toBe(true);
      }
    }
  });

  it('highest-priority dimension (prose) is allocated whenever budget ≥ its cost', () => {
    const proseDim = DEFAULT_FIDELITY_DIMENSIONS.find(d => d.name === 'prose')!;
    expect(proseDim).toBeDefined();

    // At or above cost: prose must be allocated.
    const atCost = allocatedNames(proseDim.cost);
    expect(atCost.has('prose')).toBe(true);

    const above = allocatedNames(proseDim.cost + 500);
    expect(above.has('prose')).toBe(true);
  });

  it('lowest-priority dimension (tests) is excluded first as budget decreases', () => {
    // Full budget: tests should be included.
    const fullBudget = DEFAULT_FIDELITY_DIMENSIONS.reduce((s, d) => s + d.cost, 0);
    const full = allocatedNames(fullBudget);
    expect(full.has('tests')).toBe(true);

    // Budget one token below tests cost: tests must be excluded.
    const testsDim = DEFAULT_FIDELITY_DIMENSIONS.find(d => d.name === 'tests')!;
    // Remove tests cost from full — just enough for everything else.
    const withoutTests = allocatedNames(fullBudget - testsDim.cost);
    expect(withoutTests.has('tests')).toBe(false);
  });

  it('fidelity tier decreases monotonically as budget decreases', () => {
    // Sweep across a wide budget range and confirm tiers are non-increasing.
    const step = 1_000;
    const maxBudget = 25_000;
    const tiers: number[] = [];

    for (let b = maxBudget; b >= 0; b -= step) {
      tiers.push(selectFidelityTier(b));
    }

    // Each tier must be ≤ the previous (non-increasing / monotone decreasing).
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i]).toBeLessThanOrEqual(tiers[i - 1]);
    }
  });
});

// ============================================================================
// Allocation correctness
// ============================================================================

describe('allocateFidelityDimensions correctness', () => {
  it('returns empty allocation for zero budget', () => {
    const result = allocateFidelityDimensions(0);
    expect(result.allocated).toHaveLength(0);
    expect(result.totalCost).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.fidelityTier).toBe(0);
  });

  it('allocates all dimensions when budget covers full cost', () => {
    const fullCost = DEFAULT_FIDELITY_DIMENSIONS.reduce((s, d) => s + d.cost, 0);
    const result = allocateFidelityDimensions(fullCost);
    expect(result.allocated).toHaveLength(DEFAULT_FIDELITY_DIMENSIONS.length);
    expect(result.excluded).toHaveLength(0);
    expect(result.fidelityTier).toBe(4);
  });

  it('totalCost + remaining === budget', () => {
    const budget = 12_000;
    const result = allocateFidelityDimensions(budget);
    expect(result.totalCost + result.remaining).toBe(budget);
  });

  it('throws RangeError for negative P_budget', () => {
    expect(() => allocateFidelityDimensions(-1)).toThrow(RangeError);
  });

  it('respects custom dimension set', () => {
    const custom: FidelityDimension[] = [
      { name: 'alpha', priority: 10, cost: 100 },
      { name: 'beta', priority: 20, cost: 200 },
    ];
    const result = allocateFidelityDimensions(200, custom);
    // beta has higher priority; budget 200 covers beta (200) but not both.
    expect(result.allocated.map(d => d.name)).toContain('beta');
    expect(result.allocated.map(d => d.name)).not.toContain('alpha');
  });
});

// ============================================================================
// Fidelity tier inference
// ============================================================================

describe('selectFidelityTier tier mapping', () => {
  it('returns tier 0 (PROSE) for budget covering only prose', () => {
    // prose cost = 1_000
    expect(selectFidelityTier(1_000)).toBe(0);
  });

  it('returns tier 1 (PROSE_DATA) for budget covering prose + data', () => {
    // prose 1_000 + data 2_000 = 3_000
    expect(selectFidelityTier(3_000)).toBe(1);
  });

  it('returns tier 2 (PROSE_DATA_SCHEMA) for budget covering prose + data + schema', () => {
    // prose 1_000 + data 2_000 + schema 3_000 = 6_000
    expect(selectFidelityTier(6_000)).toBe(2);
  });

  it('returns tier 3 (PROSE_DATA_CODE) for budget covering prose + data + schema + code', () => {
    // prose 1_000 + data 2_000 + schema 3_000 + code 8_000 = 14_000
    expect(selectFidelityTier(14_000)).toBe(3);
  });

  it('returns tier 4 (PROSE_DATA_CODE_TESTS) for full budget', () => {
    const fullCost = DEFAULT_FIDELITY_DIMENSIONS.reduce((s, d) => s + d.cost, 0);
    expect(selectFidelityTier(fullCost)).toBe(4);
  });
});
