/**
 * TDD tests for the token budget estimator.
 *
 * Tests estimateBudget() allocation across 7 categories with
 * complexity-based utilization targets and minimum safety margins.
 *
 * @module staging/resource/budget.test
 */

import { describe, it, expect } from 'vitest';
import { estimateBudget } from './budget.js';
import type { TokenBudgetBreakdown, BudgetCategory } from './types.js';
import { BUDGET_CATEGORIES } from './types.js';

describe('estimateBudget', () => {
  it('allocates mostly execution budget for low complexity single agent', () => {
    const result: TokenBudgetBreakdown = estimateBudget({
      complexity: 'low',
      topology: 'single',
      requirementCount: 5,
      skillCount: 0,
    });

    // Low complexity = 40% utilization
    expect(result.utilizationPercent).toBeCloseTo(40, 0);

    // Execution should be the largest category
    const maxCategory = Object.entries(result.categories).reduce(
      (max, [key, val]) => (val > max[1] ? [key, val] : max),
      ['', 0],
    );
    expect(maxCategory[0]).toBe('execution');

    // Planning should be small (no topology bonus)
    expect(result.categories['planning']).toBeLessThan(result.categories['execution']);
  });

  it('allocates larger planning and verification for high complexity pipeline', () => {
    const result = estimateBudget({
      complexity: 'high',
      topology: 'pipeline',
      requirementCount: 15,
      skillCount: 2,
    });

    // High complexity = 70% utilization
    expect(result.utilizationPercent).toBeCloseTo(70, 0);

    // Planning gets topology bonus (+5%)
    // Verification gets complexity bonus (+5%)
    // Research gets complexity bonus (+10%)
    expect(result.categories['planning']).toBeGreaterThan(0);
    expect(result.categories['verification']).toBeGreaterThan(0);
    expect(result.categories['research']).toBeGreaterThan(0);
  });

  it('maximizes utilization for critical complexity hybrid topology', () => {
    const result = estimateBudget({
      complexity: 'critical',
      topology: 'hybrid',
      requirementCount: 20,
      skillCount: 5,
    });

    // Critical = 80% utilization
    expect(result.utilizationPercent).toBeCloseTo(80, 0);

    // Safety margin should still be >= 5%
    const safetyPercent = result.categories['safety-margin'] / result.contextWindowSize * 100;
    expect(safetyPercent).toBeGreaterThanOrEqual(5);

    // HITL gets topology bonus for hybrid
    expect(result.categories['hitl']).toBeGreaterThan(0);

    // Research gets bonus for critical complexity
    expect(result.categories['research']).toBeGreaterThan(0);
  });

  it('scales skill-loading allocation with matched skill count', () => {
    const noSkills = estimateBudget({
      complexity: 'medium',
      topology: 'single',
      requirementCount: 10,
      skillCount: 0,
    });

    const manySkills = estimateBudget({
      complexity: 'medium',
      topology: 'single',
      requirementCount: 10,
      skillCount: 8,
    });

    // More skills = larger skill-loading allocation
    expect(manySkills.categories['skill-loading']).toBeGreaterThan(
      noSkills.categories['skill-loading'],
    );
  });

  it('budget categories sum to total', () => {
    const result = estimateBudget({
      complexity: 'medium',
      topology: 'pipeline',
      requirementCount: 10,
      skillCount: 3,
    });

    const categorySum = BUDGET_CATEGORIES.reduce(
      (sum, cat) => sum + result.categories[cat],
      0,
    );

    // Sum of all 7 categories should equal total
    expect(categorySum).toBeCloseTo(result.total, 0);

    // All 7 categories should be present
    for (const cat of BUDGET_CATEGORIES) {
      expect(result.categories[cat]).toBeDefined();
      expect(result.categories[cat]).toBeGreaterThanOrEqual(0);
    }
  });

  it('computes utilization percent as total / contextWindowSize * 100', () => {
    const contextWindowSize = 200_000;
    const result = estimateBudget({
      complexity: 'medium',
      topology: 'single',
      requirementCount: 10,
      skillCount: 0,
      contextWindowSize,
    });

    // Medium = 55% utilization target
    expect(result.contextWindowSize).toBe(contextWindowSize);
    const expectedUtilization = (result.total / contextWindowSize) * 100;
    expect(result.utilizationPercent).toBeCloseTo(expectedUtilization, 1);
  });

  it('maintains minimum 5% safety margin', () => {
    // Even with critical complexity (80% utilization), safety should be >= 5%
    const result = estimateBudget({
      complexity: 'critical',
      topology: 'router',
      requirementCount: 30,
      skillCount: 10,
    });

    const minSafety = result.contextWindowSize * 0.05;
    expect(result.categories['safety-margin']).toBeGreaterThanOrEqual(minSafety);
  });

  it('scales budget proportionally with custom context window size', () => {
    const smallWindow = estimateBudget({
      complexity: 'medium',
      topology: 'single',
      requirementCount: 10,
      skillCount: 1,
      contextWindowSize: 100_000,
    });

    const largeWindow = estimateBudget({
      complexity: 'medium',
      topology: 'single',
      requirementCount: 10,
      skillCount: 1,
      contextWindowSize: 300_000,
    });

    expect(smallWindow.contextWindowSize).toBe(100_000);
    expect(largeWindow.contextWindowSize).toBe(300_000);

    // Larger window = larger total budget
    expect(largeWindow.total).toBeGreaterThan(smallWindow.total);

    // Ratio should be approximately 3:1
    const ratio = largeWindow.total / smallWindow.total;
    expect(ratio).toBeCloseTo(3, 0);
  });

  it('produces minimal budget with zero requirements', () => {
    const result = estimateBudget({
      complexity: 'low',
      topology: 'single',
      requirementCount: 0,
      skillCount: 0,
    });

    // Should still produce a valid budget
    expect(result.total).toBeGreaterThan(0);

    // Safety margin should be substantial relative to total
    const safetyPercent = result.categories['safety-margin'] / result.contextWindowSize * 100;
    expect(safetyPercent).toBeGreaterThanOrEqual(5);

    // Categories still sum to total
    const categorySum = BUDGET_CATEGORIES.reduce(
      (sum, cat) => sum + result.categories[cat],
      0,
    );
    expect(categorySum).toBeCloseTo(result.total, 0);
  });
});
