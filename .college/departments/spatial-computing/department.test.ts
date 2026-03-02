import { describe, it, expect } from 'vitest';
import { spatialComputingDepartment } from './spatial-computing-department.js';

describe('Spatial Computing Department', () => {
  it('has correct id', () => {
    expect(spatialComputingDepartment.id).toBe('spatial-computing');
  });

  it('has correct name', () => {
    expect(spatialComputingDepartment.name).toBe('Spatial Computing');
  });

  it('has exactly 5 wings', () => {
    expect(spatialComputingDepartment.wings).toHaveLength(5);
  });

  it('wings have unique ids', () => {
    const ids = spatialComputingDepartment.wings.map(w => w.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('wing ids match spatial computing structure', () => {
    const ids = spatialComputingDepartment.wings.map(w => w.id);
    expect(ids).toContain('spatial-foundations');
    expect(ids).toContain('building-architecture');
    expect(ids).toContain('redstone-engineering');
    expect(ids).toContain('systems-automation');
    expect(ids).toContain('collaborative-design');
  });

  it('has token budget configured', () => {
    expect(spatialComputingDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(spatialComputingDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(spatialComputingDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('each wing has at least 3 concept ids', () => {
    for (const wing of spatialComputingDepartment.wings) {
      expect(wing.concepts.length).toBeGreaterThanOrEqual(3);
    }
  });
});
