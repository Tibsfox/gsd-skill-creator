/**
 * Economics Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/economics/department.test
 */

import { describe, it, expect } from 'vitest';
import { economicsDepartment } from './economics-department.js';

describe('Economics Department', () => {
  it('has correct id', () => {
    expect(economicsDepartment.id).toBe('economics');
  });

  it('has correct name', () => {
    expect(economicsDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(economicsDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = economicsDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(economicsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(economicsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(economicsDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of economicsDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
