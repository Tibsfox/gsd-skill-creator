import { describe, it, expect } from 'vitest';
import { businessDepartment } from './business-department.js';

describe('Business Department', () => {
  it('has correct id', () => {
    expect(businessDepartment.id).toBe('business');
  });

  it('has exactly 5 wings', () => {
    expect(businessDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = businessDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(businessDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(businessDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(businessDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
