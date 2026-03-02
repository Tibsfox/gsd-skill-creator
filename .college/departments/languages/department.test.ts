/**
 * Languages Department integration test.
 * Verifies 5 wings, correct id, token budget.
 *
 * @module departments/languages/department.test
 */

import { describe, it, expect } from 'vitest';
import { languagesDepartment } from './languages-department.js';

describe('Languages Department', () => {
  it('has correct id', () => {
    expect(languagesDepartment.id).toBe('languages');
  });

  it('has correct name', () => {
    expect(languagesDepartment.name).toBeTruthy();
  });

  it('has exactly 5 wings', () => {
    expect(languagesDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = languagesDepartment.wings.map(w => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has token budget configured', () => {
    expect(languagesDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(languagesDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(languagesDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('all wings have non-empty descriptions', () => {
    for (const wing of languagesDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
