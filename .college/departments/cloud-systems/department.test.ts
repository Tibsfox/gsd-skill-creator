import { describe, it, expect } from 'vitest';
import { cloudSystemsDepartment } from './cloud-systems-department.js';

describe('Cloud Systems Department', () => {
  it('has correct id', () => {
    expect(cloudSystemsDepartment.id).toBe('cloud-systems');
  });

  it('has correct name', () => {
    expect(cloudSystemsDepartment.name).toBe('Cloud Systems');
  });

  it('has exactly 5 wings', () => {
    expect(cloudSystemsDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = cloudSystemsDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('wing ids match OpenStack/NASA SE service layer grouping', () => {
    const ids = cloudSystemsDepartment.wings.map(w => w.id);
    expect(ids).toContain('identity-networking');
    expect(ids).toContain('compute-storage');
    expect(ids).toContain('orchestration');
    expect(ids).toContain('nasa-se-lifecycle');
    expect(ids).toContain('runbook-operations');
  });

  it('has token budget configured', () => {
    expect(cloudSystemsDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(cloudSystemsDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(cloudSystemsDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('each wing has at least 3 concept ids', () => {
    for (const wing of cloudSystemsDepartment.wings) {
      expect(wing.concepts.length).toBeGreaterThanOrEqual(3);
    }
  });
});
