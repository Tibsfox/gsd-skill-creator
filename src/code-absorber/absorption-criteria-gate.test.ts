import { describe, it, expect } from 'vitest';
import {
  checkCriteria,
  isHardBlocked,
  AbsorptionCriteriaGate,
} from './absorption-criteria-gate.js';
import type { AbsorptionCandidate } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCandidate(overrides: Partial<AbsorptionCandidate> = {}): AbsorptionCandidate {
  return {
    packageName: 'tiny-math',
    ecosystem: 'npm',
    implementationLines: 100,
    isAlgorithmStable: true,
    isPureAlgorithmic: true,
    apiUsageRatio: 0.10,
    categoryTags: ['math', 'utility'],
    ...overrides,
  };
}

// ─── checkCriteria — approval ─────────────────────────────────────────────────

describe('checkCriteria', () => {
  it('approved when all 4 criteria pass', () => {
    const verdict = checkCriteria(makeCandidate());
    expect(verdict.status).toBe('approved');
    expect(verdict.rejectionReasons).toHaveLength(0);
    expect(verdict.isHardBlocked).toBe(false);
  });

  it('approved at exact boundary: 500 lines, 0.20 ratio', () => {
    const verdict = checkCriteria(makeCandidate({
      implementationLines: 500,
      apiUsageRatio: 0.20,
    }));
    expect(verdict.status).toBe('approved');
  });

  // ─── Soft rejections ────────────────────────────────────────────────────────

  it('rejected when implementationLines > 500', () => {
    const verdict = checkCriteria(makeCandidate({ implementationLines: 501 }));
    expect(verdict.status).toBe('rejected');
    expect(verdict.rejectionReasons.some(r => r.includes('501'))).toBe(true);
    expect(verdict.isHardBlocked).toBe(false);
  });

  it('rejected just over boundary: 501 lines', () => {
    const verdict = checkCriteria(makeCandidate({ implementationLines: 501 }));
    expect(verdict.status).toBe('rejected');
  });

  it('rejected when isAlgorithmStable=false', () => {
    const verdict = checkCriteria(makeCandidate({ isAlgorithmStable: false }));
    expect(verdict.status).toBe('rejected');
    expect(verdict.rejectionReasons.some(r => r.includes('stable'))).toBe(true);
  });

  it('rejected when isPureAlgorithmic=false', () => {
    const verdict = checkCriteria(makeCandidate({ isPureAlgorithmic: false }));
    expect(verdict.status).toBe('rejected');
    expect(verdict.rejectionReasons.some(r => r.includes('pure algorithmic'))).toBe(true);
  });

  it('rejected when apiUsageRatio > 0.20', () => {
    const verdict = checkCriteria(makeCandidate({ apiUsageRatio: 0.21 }));
    expect(verdict.status).toBe('rejected');
    expect(verdict.rejectionReasons.some(r => r.includes('21.0%'))).toBe(true);
  });

  it('rejected just over ratio: 0.21', () => {
    const verdict = checkCriteria(makeCandidate({ apiUsageRatio: 0.21 }));
    expect(verdict.status).toBe('rejected');
  });

  it('rejected with multiple reasons when multiple criteria fail', () => {
    const verdict = checkCriteria(makeCandidate({
      implementationLines: 600,
      isAlgorithmStable: false,
      isPureAlgorithmic: false,
      apiUsageRatio: 0.50,
    }));
    expect(verdict.status).toBe('rejected');
    expect(verdict.rejectionReasons).toHaveLength(4);
  });

  // ─── Hard blocks ────────────────────────────────────────────────────────────

  it('hard-blocked for crypto tag', () => {
    const verdict = checkCriteria(makeCandidate({ categoryTags: ['crypto'] }));
    expect(verdict.status).toBe('hard-blocked');
    expect(verdict.isHardBlocked).toBe(true);
  });

  it('hard-blocked for cryptography tag', () => {
    const verdict = checkCriteria(makeCandidate({ categoryTags: ['cryptography'] }));
    expect(verdict.status).toBe('hard-blocked');
  });

  it('hard-blocked for parser tag', () => {
    const verdict = checkCriteria(makeCandidate({ categoryTags: ['parser'] }));
    expect(verdict.status).toBe('hard-blocked');
  });

  it('hard-blocked for compression tag', () => {
    const verdict = checkCriteria(makeCandidate({ categoryTags: ['compression'] }));
    expect(verdict.status).toBe('hard-blocked');
  });

  it('hard-blocked for native binding tag', () => {
    const verdict = checkCriteria(makeCandidate({ categoryTags: ['native', 'binding'] }));
    expect(verdict.status).toBe('hard-blocked');
  });

  it('hard-blocked returns isHardBlocked=true and status=hard-blocked', () => {
    const verdict = checkCriteria(makeCandidate({ categoryTags: ['encryption'] }));
    expect(verdict.status).toBe('hard-blocked');
    expect(verdict.isHardBlocked).toBe(true);
    expect(verdict.rejectionReasons).toHaveLength(1);
  });

  it('hard-block fires even if all other criteria pass', () => {
    // Perfect candidate except crypto tag
    const verdict = checkCriteria(makeCandidate({
      implementationLines: 10,
      isAlgorithmStable: true,
      isPureAlgorithmic: true,
      apiUsageRatio: 0.01,
      categoryTags: ['crypto'],
    }));
    expect(verdict.status).toBe('hard-blocked');
    // Hard block doesn't accumulate soft reasons
    expect(verdict.rejectionReasons).toHaveLength(1);
  });

  // ─── checkedAt ──────────────────────────────────────────────────────────────

  it('checkedAt is a valid ISO 8601 string', () => {
    const verdict = checkCriteria(makeCandidate());
    expect(() => new Date(verdict.checkedAt)).not.toThrow();
    expect(new Date(verdict.checkedAt).toISOString()).toBe(verdict.checkedAt);
  });

  // ─── Class wrapper ──────────────────────────────────────────────────────────

  it('class wrapper delegates to checkCriteria', () => {
    const gate = new AbsorptionCriteriaGate();
    const candidate = makeCandidate();
    const verdict = gate.check(candidate);
    expect(verdict.status).toBe('approved');
    expect(verdict.candidatePackage).toBe('tiny-math');
  });
});

// ─── isHardBlocked ────────────────────────────────────────────────────────────

describe('isHardBlocked', () => {
  it('returns false for benign tags', () => {
    expect(isHardBlocked(['math', 'utility', 'string'])).toBe(false);
  });

  it('returns true for crypto substring match', () => {
    expect(isHardBlocked(['cryptographic'])).toBe(true);
  });

  it('returns true for case-insensitive match', () => {
    expect(isHardBlocked(['CRYPTO'])).toBe(true);
  });

  it('returns false for empty tags', () => {
    expect(isHardBlocked([])).toBe(false);
  });
});
