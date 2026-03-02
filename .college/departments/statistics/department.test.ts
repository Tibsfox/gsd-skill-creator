import { describe, it, expect } from 'vitest';
import { statisticsDepartment } from './statistics-department.js';

describe('Statistics Department', () => {
  it('has correct id', () => {
    expect(statisticsDepartment.id).toBe('statistics');
  });

  it('has exactly 5 wings', () => {
    expect(statisticsDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = statisticsDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(statisticsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(statisticsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(statisticsDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
