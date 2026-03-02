import { describe, it, expect } from 'vitest';
import { communicationDepartment } from './communication-department.js';

describe('Communication Department', () => {
  it('has correct id', () => {
    expect(communicationDepartment.id).toBe('communication');
  });

  it('has exactly 5 wings', () => {
    expect(communicationDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = communicationDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(communicationDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(communicationDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(communicationDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
