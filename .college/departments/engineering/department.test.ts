import { describe, it, expect } from 'vitest';
import { engineeringDepartment } from './engineering-department.js';

describe('Engineering Department', () => {
  it('has correct id', () => {
    expect(engineeringDepartment.id).toBe('engineering');
  });

  it('has exactly 5 wings', () => {
    expect(engineeringDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = engineeringDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(engineeringDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(engineeringDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(engineeringDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
