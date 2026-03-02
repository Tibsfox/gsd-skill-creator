import { describe, it, expect } from 'vitest';
import { readingDepartment } from './reading-department.js';

describe('Reading Department', () => {
  it('has correct id', () => {
    expect(readingDepartment.id).toBe('reading');
  });

  it('has exactly 5 wings', () => {
    expect(readingDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = readingDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(readingDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(readingDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(readingDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
