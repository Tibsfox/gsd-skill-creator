/**
 * Philosophy Department Integration Test
 *
 * @module departments/philosophy/department.test
 */

import { describe, it, expect } from 'vitest';
import { philosophyDepartment } from './philosophy-department.js';

describe('Philosophy Department', () => {
  it('has correct department ID', () => {
    expect(philosophyDepartment.id).toBe('philosophy');
  });

  it('has exactly 5 wings', () => {
    expect(philosophyDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = philosophyDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(philosophyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(philosophyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(philosophyDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = philosophyDepartment.wings.map((w) => w.id);
    expect(ids).toContain('wonder-questioning');
    expect(ids).toContain('logic-reasoning');
    expect(ids).toContain('ethics');
    expect(ids).toContain('epistemology');
    expect(ids).toContain('aesthetics');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of philosophyDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
