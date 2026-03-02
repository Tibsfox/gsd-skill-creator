/**
 * Nutrition Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/nutrition/department.test
 */

import { describe, it, expect } from 'vitest';
import { nutritionDepartment } from './nutrition-department.js';

describe('Nutrition Department', () => {
  it('has correct id', () => {
    expect(nutritionDepartment.id).toBe('nutrition');
  });

  it('has correct name', () => {
    expect(nutritionDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(nutritionDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = nutritionDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(nutritionDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(nutritionDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(nutritionDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of nutritionDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
