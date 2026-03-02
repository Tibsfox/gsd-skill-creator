/**
 * Theology Department Integration Test
 *
 * @module departments/theology/department.test
 */

import { describe, it, expect } from 'vitest';
import { theologyDepartment } from './theology-department.js';

describe('Theology Department', () => {
  it('has correct department ID', () => {
    expect(theologyDepartment.id).toBe('theology');
  });

  it('has exactly 5 wings', () => {
    expect(theologyDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = theologyDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(theologyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(theologyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(theologyDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = theologyDepartment.wings.map((w) => w.id);
    expect(ids).toContain('stories-traditions');
    expect(ids).toContain('world-religions');
    expect(ids).toContain('sacred-practices');
    expect(ids).toContain('ethics-justice');
    expect(ids).toContain('ultimate-questions');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of theologyDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
