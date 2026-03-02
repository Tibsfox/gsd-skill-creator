import { describe, it, expect } from 'vitest';
import { scienceDepartment } from './science-department.js';

describe('Science Department', () => {
  it('has correct id', () => {
    expect(scienceDepartment.id).toBe('science');
  });

  it('has exactly 5 wings', () => {
    expect(scienceDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = scienceDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(scienceDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(scienceDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(scienceDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
