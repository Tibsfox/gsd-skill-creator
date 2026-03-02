import { describe, it, expect } from 'vitest';
import { technologyDepartment } from './technology-department.js';

describe('Technology Department', () => {
  it('has correct id', () => {
    expect(technologyDepartment.id).toBe('technology');
  });

  it('has exactly 5 wings', () => {
    expect(technologyDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = technologyDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(technologyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(technologyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(technologyDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
