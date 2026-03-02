/**
 * Coding Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/coding/department.test
 */

import { describe, it, expect } from 'vitest';
import { codingDepartment } from './coding-department.js';

describe('Coding Department', () => {
  it('has correct id', () => {
    expect(codingDepartment.id).toBe('coding');
  });

  it('has correct name', () => {
    expect(codingDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(codingDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = codingDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(codingDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(codingDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(codingDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of codingDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
