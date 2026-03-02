/**
 * Trades Department Integration Test
 *
 * @module departments/trades/department.test
 */

import { describe, it, expect } from 'vitest';
import { tradesDepartment } from './trades-department.js';

describe('Trades Department', () => {
  it('has correct department ID', () => {
    expect(tradesDepartment.id).toBe('trades');
  });

  it('has exactly 5 wings', () => {
    expect(tradesDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = tradesDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(tradesDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(tradesDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(tradesDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = tradesDepartment.wings.map((w) => w.id);
    expect(ids).toContain('tools-safety');
    expect(ids).toContain('woodworking');
    expect(ids).toContain('electrical-basics');
    expect(ids).toContain('plumbing-hvac');
    expect(ids).toContain('project-management');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of tradesDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
