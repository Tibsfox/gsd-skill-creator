/**
 * Physical Education Department Integration Test
 *
 * @module departments/physical-education/department.test
 */

import { describe, it, expect } from 'vitest';
import { physicalEducationDepartment } from './physical-education-department.js';

describe('Physical Education Department', () => {
  it('has correct department ID', () => {
    expect(physicalEducationDepartment.id).toBe('physical-education');
  });

  it('has exactly 5 wings', () => {
    expect(physicalEducationDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = physicalEducationDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(physicalEducationDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(physicalEducationDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(physicalEducationDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = physicalEducationDepartment.wings.map((w) => w.id);
    expect(ids).toContain('movement-foundations');
    expect(ids).toContain('fitness-body-science');
    expect(ids).toContain('sports-games');
    expect(ids).toContain('wellness-lifetime-fitness');
    expect(ids).toContain('outdoor-adventure');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of physicalEducationDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
