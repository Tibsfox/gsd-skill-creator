/**
 * Logic Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/logic/department.test
 */

import { describe, it, expect } from 'vitest';
import { logicDepartment } from './logic-department.js';

describe('Logic Department', () => {
  it('has correct id', () => {
    expect(logicDepartment.id).toBe('logic');
  });

  it('has correct name', () => {
    expect(logicDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(logicDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = logicDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(logicDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(logicDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(logicDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of logicDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
