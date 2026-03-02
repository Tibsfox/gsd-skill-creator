import { describe, it, expect } from 'vitest';
import { historyDepartment } from './history-department.js';

describe('History Department', () => {
  it('has correct id', () => {
    expect(historyDepartment.id).toBe('history');
  });

  it('has exactly 5 wings', () => {
    expect(historyDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = historyDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(historyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(historyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(historyDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
