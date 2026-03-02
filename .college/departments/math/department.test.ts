import { describe, it, expect } from 'vitest';
import { mathDepartment } from './math-department.js';

describe('Math Department', () => {
  it('has correct id', () => {
    expect(mathDepartment.id).toBe('math');
  });

  it('has exactly 5 wings', () => {
    expect(mathDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = mathDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(mathDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(mathDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(mathDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
