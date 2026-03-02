/**
 * Data Science Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/data-science/department.test
 */

import { describe, it, expect } from 'vitest';
import { dataScienceDepartment } from './data-science-department.js';

describe('Data Science Department', () => {
  it('has correct id', () => {
    expect(dataScienceDepartment.id).toBe('data-science');
  });

  it('has correct name', () => {
    expect(dataScienceDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(dataScienceDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = dataScienceDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(dataScienceDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(dataScienceDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(dataScienceDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of dataScienceDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
