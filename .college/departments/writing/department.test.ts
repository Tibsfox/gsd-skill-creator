/**
 * Writing Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/writing/department.test
 */

import { describe, it, expect } from 'vitest';
import { writingDepartment } from './writing-department.js';

describe('Writing Department', () => {
  it('has correct id', () => {
    expect(writingDepartment.id).toBe('writing');
  });

  it('has correct name', () => {
    expect(writingDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(writingDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = writingDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(writingDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(writingDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(writingDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of writingDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
