import { describe, it, expect } from 'vitest';
import { evaluateRetireCandidate, RETIRE_GRACE_DAYS } from './retire-signal.js';

describe('evaluateRetireCandidate', () => {
  it('flags a measured-zero skill past the grace window', () => {
    const v = evaluateRetireCandidate({ activationCount: 0, ageDays: 90 });
    expect(v.isCandidate).toBe(true);
    expect(v.reason).toMatch(/measured zero/);
  });

  it('NEVER flags a never-measured skill (undefined != measured-zero)', () => {
    // The critical false-positive guard: an unmeasured skill means the scan
    // did not run, not that the skill failed.
    const v = evaluateRetireCandidate({ activationCount: undefined, ageDays: 365 });
    expect(v.isCandidate).toBe(false);
    expect(v.reason).toMatch(/never measured/);
  });

  it('spares a brand-new skill inside the grace window', () => {
    const v = evaluateRetireCandidate({ activationCount: 0, ageDays: RETIRE_GRACE_DAYS - 1 });
    expect(v.isCandidate).toBe(false);
    expect(v.reason).toMatch(/grace window/);
  });

  it('retires exactly at the grace boundary', () => {
    expect(evaluateRetireCandidate({ activationCount: 0, ageDays: RETIRE_GRACE_DAYS }).isCandidate).toBe(true);
    expect(evaluateRetireCandidate({ activationCount: 0, ageDays: RETIRE_GRACE_DAYS - 0.1 }).isCandidate).toBe(false);
  });

  it('does not flag a skill with measured activations', () => {
    const v = evaluateRetireCandidate({ activationCount: 5, ageDays: 365 });
    expect(v.isCandidate).toBe(false);
    expect(v.reason).toMatch(/5 measured activation/);
  });

  it('spares a skill whose age is unknown (no anchor)', () => {
    expect(evaluateRetireCandidate({ activationCount: 0, ageDays: null }).isCandidate).toBe(false);
    expect(evaluateRetireCandidate({ activationCount: 0 }).isCandidate).toBe(false);
  });

  it('honors a custom grace window', () => {
    expect(evaluateRetireCandidate({ activationCount: 0, ageDays: 10 }, 7).isCandidate).toBe(true);
    expect(evaluateRetireCandidate({ activationCount: 0, ageDays: 10 }, 14).isCandidate).toBe(false);
  });
});
