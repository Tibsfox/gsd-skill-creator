/**
 * Astronomy Department Integration Test
 *
 * @module departments/astronomy/department.test
 */

import { describe, it, expect } from 'vitest';
import { astronomyDepartment } from './astronomy-department.js';

describe('Astronomy Department', () => {
  it('has correct department ID', () => {
    expect(astronomyDepartment.id).toBe('astronomy');
  });

  it('has exactly 5 wings', () => {
    expect(astronomyDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = astronomyDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(astronomyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(astronomyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(astronomyDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = astronomyDepartment.wings.map((w) => w.id);
    expect(ids).toContain('observing-sky');
    expect(ids).toContain('earth-moon-sun');
    expect(ids).toContain('stellar-physics');
    expect(ids).toContain('solar-system');
    expect(ids).toContain('cosmology');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of astronomyDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
