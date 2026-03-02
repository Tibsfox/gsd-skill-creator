import { describe, it, expect } from 'vitest';
import { physicsDepartment } from './physics-department.js';

describe('Physics Department', () => {
  it('has correct id', () => {
    expect(physicsDepartment.id).toBe('physics');
  });

  it('has exactly 5 wings', () => {
    expect(physicsDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = physicsDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(physicsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(physicsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(physicsDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
