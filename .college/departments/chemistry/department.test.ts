import { describe, it, expect } from 'vitest';
import { chemistryDepartment } from './chemistry-department.js';

describe('Chemistry Department', () => {
  it('has correct id', () => {
    expect(chemistryDepartment.id).toBe('chemistry');
  });

  it('has exactly 5 wings', () => {
    expect(chemistryDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = chemistryDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(chemistryDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(chemistryDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(chemistryDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
