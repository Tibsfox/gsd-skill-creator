import { describe, it, expect } from 'vitest';
import { materialsDepartment } from './materials-department.js';

describe('Materials Department', () => {
  it('has correct id', () => {
    expect(materialsDepartment.id).toBe('materials');
  });

  it('has exactly 5 wings', () => {
    expect(materialsDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = materialsDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(materialsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(materialsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(materialsDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
