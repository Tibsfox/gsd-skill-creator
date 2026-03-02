/**
 * Environmental Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/environmental/department.test
 */

import { describe, it, expect } from 'vitest';
import { environmentalDepartment } from './environmental-department.js';

describe('Environmental Department', () => {
  it('has correct id', () => {
    expect(environmentalDepartment.id).toBe('environmental');
  });

  it('has correct name', () => {
    expect(environmentalDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(environmentalDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = environmentalDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(environmentalDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(environmentalDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(environmentalDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of environmentalDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
