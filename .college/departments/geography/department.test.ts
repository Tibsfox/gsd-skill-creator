import { describe, it, expect } from 'vitest';
import { geographyDepartment } from './geography-department.js';

describe('Geography Department', () => {
  it('has correct id', () => {
    expect(geographyDepartment.id).toBe('geography');
  });

  it('has exactly 5 wings', () => {
    expect(geographyDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = geographyDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(geographyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(geographyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(geographyDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
