import { describe, it, expect } from 'vitest';
import { electronicsDepartment } from './electronics-department.js';

describe('Electronics Department', () => {
  it('has correct id', () => {
    expect(electronicsDepartment.id).toBe('electronics');
  });

  it('has correct name', () => {
    expect(electronicsDepartment.name).toBe('Electronics');
  });

  it('has exactly 5 wings', () => {
    expect(electronicsDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = electronicsDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('wing ids match tier-based grouping', () => {
    const ids = electronicsDepartment.wings.map(w => w.id);
    expect(ids).toContain('circuit-foundations');
    expect(ids).toContain('active-devices');
    expect(ids).toContain('analog-systems');
    expect(ids).toContain('digital-mixed-signal');
    expect(ids).toContain('applied-systems');
  });

  it('has token budget configured', () => {
    expect(electronicsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(electronicsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(electronicsDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('each wing has at least 3 concept ids', () => {
    for (const wing of electronicsDepartment.wings) {
      expect(wing.concepts.length).toBeGreaterThanOrEqual(3);
    }
  });
});
