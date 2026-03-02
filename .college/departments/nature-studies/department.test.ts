/**
 * Nature Studies Department Integration Test
 *
 * @module departments/nature-studies/department.test
 */

import { describe, it, expect } from 'vitest';
import { natureStudiesDepartment } from './nature-studies-department.js';

describe('Nature Studies Department', () => {
  it('has correct department ID', () => {
    expect(natureStudiesDepartment.id).toBe('nature-studies');
  });

  it('has exactly 5 wings', () => {
    expect(natureStudiesDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = natureStudiesDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(natureStudiesDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(natureStudiesDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(natureStudiesDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = natureStudiesDepartment.wings.map((w) => w.id);
    expect(ids).toContain('outdoor-observation');
    expect(ids).toContain('plants-fungi');
    expect(ids).toContain('animals-birds');
    expect(ids).toContain('ecology-habitats');
    expect(ids).toContain('citizen-science');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of natureStudiesDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
