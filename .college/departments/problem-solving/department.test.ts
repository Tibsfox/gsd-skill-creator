import { describe, it, expect } from 'vitest';
import { problemSolvingDepartment } from './problem-solving-department.js';

describe('Problem Solving Department', () => {
  it('has correct id', () => {
    expect(problemSolvingDepartment.id).toBe('problem-solving');
  });

  it('has exactly 5 wings', () => {
    expect(problemSolvingDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = problemSolvingDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has token budget configured', () => {
    expect(problemSolvingDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(problemSolvingDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(problemSolvingDepartment.tokenBudget.deepLimit).toBe(50000);
  });
});
