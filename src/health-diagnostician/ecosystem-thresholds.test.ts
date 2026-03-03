import { describe, it, expect } from 'vitest';
import { ECOSYSTEM_THRESHOLDS, getThresholds } from './ecosystem-thresholds.js';
import type { Ecosystem } from '../dependency-auditor/types.js';

const ECOSYSTEMS: Ecosystem[] = ['npm', 'pypi', 'conda', 'cargo', 'rubygems'];

describe('ECOSYSTEM_THRESHOLDS', () => {
  it('has entries for all 5 ecosystems', () => {
    for (const eco of ECOSYSTEMS) {
      expect(ECOSYSTEM_THRESHOLDS[eco]).toBeDefined();
    }
  });

  it('aging < stale < abandoned for all ecosystems', () => {
    for (const eco of ECOSYSTEMS) {
      const t = ECOSYSTEM_THRESHOLDS[eco];
      expect(t.agingDays).toBeLessThan(t.staleDays);
      expect(t.staleDays).toBeLessThan(t.abandonedDays);
    }
  });

  it('npm has the most aggressive thresholds (smallest agingDays)', () => {
    const npmAging = ECOSYSTEM_THRESHOLDS.npm.agingDays;
    for (const eco of ECOSYSTEMS) {
      if (eco !== 'npm') {
        expect(npmAging).toBeLessThanOrEqual(ECOSYSTEM_THRESHOLDS[eco].agingDays);
      }
    }
  });

  it('conda has the most conservative thresholds (largest abandonedDays)', () => {
    const condaAbandoned = ECOSYSTEM_THRESHOLDS.conda.abandonedDays;
    for (const eco of ECOSYSTEMS) {
      if (eco !== 'conda') {
        expect(condaAbandoned).toBeGreaterThanOrEqual(ECOSYSTEM_THRESHOLDS[eco].abandonedDays);
      }
    }
  });

  it('ecosystem field matches key', () => {
    for (const eco of ECOSYSTEMS) {
      expect(ECOSYSTEM_THRESHOLDS[eco].ecosystem).toBe(eco);
    }
  });
});

describe('getThresholds', () => {
  it('returns npm thresholds for npm', () => {
    expect(getThresholds('npm')).toEqual(ECOSYSTEM_THRESHOLDS.npm);
  });

  it('returns cargo thresholds for cargo', () => {
    expect(getThresholds('cargo')).toEqual(ECOSYSTEM_THRESHOLDS.cargo);
  });

  it('all ecosystems return their own thresholds', () => {
    for (const eco of ECOSYSTEMS) {
      expect(getThresholds(eco)).toEqual(ECOSYSTEM_THRESHOLDS[eco]);
    }
  });
});
