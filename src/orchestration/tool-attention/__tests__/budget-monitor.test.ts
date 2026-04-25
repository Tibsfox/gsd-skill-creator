import { describe, it, expect } from 'vitest';
import { withFlag } from './_fixtures.js';
import { checkBudget, DEFAULT_FRACTURE_THRESHOLD } from '../budget-monitor.js';

describe('HB-01 budget-monitor — 70% fracture threshold', () => {
  it('is byte-identically disabled with flag off', () => {
    const env = withFlag(false);
    try {
      const out = checkBudget({ occupancyTokens: 100, contextWindowTokens: 100 }, env.configPath);
      expect(out).toEqual({
        occupancyTokens: 0,
        contextWindowTokens: 0,
        occupancyRatio: 0,
        fractureAlert: false,
        fractureThreshold: 0,
        disabled: true,
      });
    } finally { env.cleanup(); }
  });

  it('alert fires at exactly 70% (≥ threshold)', () => {
    const env = withFlag(true);
    try {
      const out = checkBudget(
        { occupancyTokens: 7000, contextWindowTokens: 10000 },
        env.configPath,
      );
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.fractureAlert).toBe(true);
      expect(out.occupancyRatio).toBeCloseTo(0.70, 6);
      expect(out.fractureThreshold).toBe(DEFAULT_FRACTURE_THRESHOLD);
    } finally { env.cleanup(); }
  });

  it('no alert at 69%', () => {
    const env = withFlag(true);
    try {
      const out = checkBudget(
        { occupancyTokens: 6900, contextWindowTokens: 10000 },
        env.configPath,
      );
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.fractureAlert).toBe(false);
    } finally { env.cleanup(); }
  });

  it('zero context window does not divide by zero', () => {
    const env = withFlag(true);
    try {
      const out = checkBudget({ occupancyTokens: 100, contextWindowTokens: 0 }, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.occupancyRatio).toBe(0);
      expect(out.fractureAlert).toBe(false);
    } finally { env.cleanup(); }
  });

  it('respects custom fractureThreshold override', () => {
    const env = withFlag(true);
    try {
      const out = checkBudget(
        { occupancyTokens: 5000, contextWindowTokens: 10000, fractureThreshold: 0.5 },
        env.configPath,
      );
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.fractureAlert).toBe(true);
      expect(out.fractureThreshold).toBe(0.5);
    } finally { env.cleanup(); }
  });
});
