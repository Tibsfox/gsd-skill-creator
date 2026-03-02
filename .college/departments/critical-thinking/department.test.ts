import { describe, it, expect } from 'vitest';
import { criticalThinkingDepartment } from './critical-thinking-department.js';

describe('Critical Thinking Department', () => {
  it('has correct id', () => {
    expect(criticalThinkingDepartment.id).toBe('critical-thinking');
  });

  it('has exactly 5 wings', () => {
    expect(criticalThinkingDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = criticalThinkingDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(criticalThinkingDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(criticalThinkingDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(criticalThinkingDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
