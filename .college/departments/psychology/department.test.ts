/**
 * Psychology Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/psychology/department.test
 */

import { describe, it, expect } from 'vitest';
import { psychologyDepartment } from './psychology-department.js';

describe('Psychology Department', () => {
  it('has correct id', () => {
    expect(psychologyDepartment.id).toBe('psychology');
  });

  it('has correct name', () => {
    expect(psychologyDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(psychologyDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = psychologyDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(psychologyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(psychologyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(psychologyDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of psychologyDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
