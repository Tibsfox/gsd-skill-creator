/**
 * Art Department Integration Test
 *
 * Verifies the department definition: correct ID, exactly 5 wings,
 * unique wing IDs, and token budget configuration.
 *
 * @module departments/art/department.test
 */

import { describe, it, expect } from 'vitest';
import { artDepartment } from './art-department.js';

describe('Art Department', () => {
  it('has correct department ID', () => {
    expect(artDepartment.id).toBe('art');
  });

  it('has exactly 5 wings', () => {
    expect(artDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = artDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(artDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(artDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(artDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = artDepartment.wings.map((w) => w.id);
    expect(ids).toContain('seeing-drawing');
    expect(ids).toContain('color-composition');
    expect(ids).toContain('materials-making');
    expect(ids).toContain('art-in-context');
    expect(ids).toContain('creative-process');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of artDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
