/**
 * Learning Department Integration Test
 *
 * @module departments/learning/department.test
 */

import { describe, it, expect } from 'vitest';
import { learningDepartment } from './learning-department.js';

describe('Learning Department', () => {
  it('has correct department ID', () => {
    expect(learningDepartment.id).toBe('learning');
  });

  it('has exactly 5 wings', () => {
    expect(learningDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = learningDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(learningDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(learningDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(learningDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = learningDepartment.wings.map((w) => w.id);
    expect(ids).toContain('learning-brain');
    expect(ids).toContain('study-strategies');
    expect(ids).toContain('mindset-motivation');
    expect(ids).toContain('metacognition');
    expect(ids).toContain('learning-environments');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of learningDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
