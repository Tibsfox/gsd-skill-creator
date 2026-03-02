/**
 * Home Economics Department Integration Test
 *
 * @module departments/home-economics/department.test
 */

import { describe, it, expect } from 'vitest';
import { homeEconomicsDepartment } from './home-economics-department.js';

describe('Home Economics Department', () => {
  it('has correct department ID', () => {
    expect(homeEconomicsDepartment.id).toBe('home-economics');
  });

  it('has exactly 5 wings', () => {
    expect(homeEconomicsDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = homeEconomicsDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(homeEconomicsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(homeEconomicsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(homeEconomicsDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = homeEconomicsDepartment.wings.map((w) => w.id);
    expect(ids).toContain('kitchen-cooking');
    expect(ids).toContain('textiles-clothing');
    expect(ids).toContain('home-management');
    expect(ids).toContain('financial-literacy');
    expect(ids).toContain('childcare-community');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of homeEconomicsDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
