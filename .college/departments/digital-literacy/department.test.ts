/**
 * Digital Literacy Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/digital-literacy/department.test
 */

import { describe, it, expect } from 'vitest';
import { digitalLiteracyDepartment } from './digital-literacy-department.js';

describe('Digital Literacy Department', () => {
  it('has correct id', () => {
    expect(digitalLiteracyDepartment.id).toBe('digital-literacy');
  });

  it('has correct name', () => {
    expect(digitalLiteracyDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(digitalLiteracyDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = digitalLiteracyDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(digitalLiteracyDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(digitalLiteracyDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(digitalLiteracyDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of digitalLiteracyDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
