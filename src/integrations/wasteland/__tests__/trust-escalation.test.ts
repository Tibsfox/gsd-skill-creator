/**
 * Trust Tier Escalation Engine Tests
 *
 * Tests the evaluation engine, rule builders, batch scanner,
 * SQL generation, and human-readable reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  buildContributorRules,
  buildMaintainerRules,
  evaluateRule,
  evaluateRig,
  scanForEscalation,
  toPromotionSQL,
  toPromotionReport,
  formatEvaluation,
  type RigRecord,
  type StampSummary,
  type CompletionSummary,
  type EscalationContext,
  type EscalationDataProvider,
  type EscalationEvaluation,
} from '../trust-escalation.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeRig(overrides: Partial<RigRecord> = {}): RigRecord {
  return {
    handle: 'test-rig',
    trust_level: 1,
    rig_type: 'ai',
    registered_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeStamps(overrides: Partial<StampSummary> = {}): StampSummary {
  return {
    stampsReceived: 5,
    stampsIssued: 0,
    avgQualityReceived: 4.0,
    avgReliabilityReceived: 3.5,
    avgCreativityReceived: 3.0,
    uniqueValidators: 3,
    latestStampAt: '2026-02-15T00:00:00Z',
    ...overrides,
  };
}

function makeCompletions(overrides: Partial<CompletionSummary> = {}): CompletionSummary {
  return {
    totalCompletions: 5,
    validatedCompletions: 3,
    pendingCompletions: 2,
    ...overrides,
  };
}

function makeContext(overrides: Partial<EscalationContext> = {}): EscalationContext {
  return {
    rig: makeRig(),
    stamps: makeStamps(),
    completions: makeCompletions(),
    now: new Date('2026-03-01T00:00:00Z'),
    trustLevelChangedAt: null,
    ...overrides,
  };
}

function makeMockProvider(overrides: Partial<EscalationDataProvider> = {}): EscalationDataProvider {
  return {
    getRigs: async () => [],
    getStampSummary: async () => makeStamps(),
    getCompletionSummary: async () => makeCompletions(),
    getTrustLevelChangedAt: async () => null,
    ...overrides,
  };
}

// ============================================================================
// Rule Builders
// ============================================================================

describe('buildContributorRules', () => {
  it('returns rule for level 1 to 2', () => {
    const rule = buildContributorRules();
    expect(rule.fromLevel).toBe(1);
    expect(rule.toLevel).toBe(2);
    expect(rule.criteria).toHaveLength(3);
  });

  it('has stamps_received, avg_quality, and time_registered criteria', () => {
    const rule = buildContributorRules();
    const names = rule.criteria.map(c => c.name);
    expect(names).toEqual(['stamps_received', 'avg_quality', 'time_registered']);
  });
});

describe('buildMaintainerRules', () => {
  it('returns rule for level 2 to 3', () => {
    const rule = buildMaintainerRules();
    expect(rule.fromLevel).toBe(2);
    expect(rule.toLevel).toBe(3);
    expect(rule.criteria).toHaveLength(5);
  });

  it('has all maintainer criteria', () => {
    const rule = buildMaintainerRules();
    const names = rule.criteria.map(c => c.name);
    expect(names).toEqual([
      'stamps_received', 'stamps_issued', 'avg_quality',
      'unique_validators', 'time_at_contributor',
    ]);
  });
});

// ============================================================================
// Evaluation Engine
// ============================================================================

describe('evaluateRule', () => {
  it('marks rig as eligible when all contributor criteria are met', () => {
    const ctx = makeContext();
    const result = evaluateRule(buildContributorRules(), ctx);

    expect(result.eligible).toBe(true);
    expect(result.handle).toBe('test-rig');
    expect(result.currentLevel).toBe(1);
    expect(result.targetLevel).toBe(2);
    expect(result.recommendation).toContain('ELIGIBLE');
    expect(result.criteria.every(c => c.met)).toBe(true);
  });

  it('marks rig as not eligible when stamps are insufficient', () => {
    const ctx = makeContext({
      stamps: makeStamps({ stampsReceived: 1 }),
    });
    const result = evaluateRule(buildContributorRules(), ctx);

    expect(result.eligible).toBe(false);
    expect(result.recommendation).toContain('NOT ELIGIBLE');
    expect(result.recommendation).toContain('stamps_received');
  });

  it('marks rig as not eligible when quality is too low', () => {
    const ctx = makeContext({
      stamps: makeStamps({ avgQualityReceived: 2.0 }),
    });
    const result = evaluateRule(buildContributorRules(), ctx);

    expect(result.eligible).toBe(false);
    expect(result.criteria.find(c => c.name === 'avg_quality')!.met).toBe(false);
  });

  it('marks rig as not eligible when registration is too recent', () => {
    const ctx = makeContext({
      rig: makeRig({ registered_at: '2026-02-28T00:00:00Z' }),
      now: new Date('2026-03-01T00:00:00Z'),
    });
    const result = evaluateRule(buildContributorRules(), ctx);

    expect(result.eligible).toBe(false);
    expect(result.criteria.find(c => c.name === 'time_registered')!.met).toBe(false);
  });

  it('handles null registration date gracefully', () => {
    const ctx = makeContext({
      rig: makeRig({ registered_at: null }),
    });
    const result = evaluateRule(buildContributorRules(), ctx);

    expect(result.eligible).toBe(false);
    const timeResult = result.criteria.find(c => c.name === 'time_registered')!;
    expect(timeResult.met).toBe(false);
    expect(timeResult.actual).toBe('unknown registration date');
  });

  it('handles zero stamps for avg_quality check', () => {
    const ctx = makeContext({
      stamps: makeStamps({ stampsReceived: 0, avgQualityReceived: 0 }),
    });
    const result = evaluateRule(buildContributorRules(), ctx);

    const qualityResult = result.criteria.find(c => c.name === 'avg_quality')!;
    expect(qualityResult.met).toBe(false);
    expect(qualityResult.actual).toBe('no stamps');
  });
});

describe('evaluateRule — maintainer tier', () => {
  it('marks rig as eligible when all maintainer criteria are met', () => {
    const ctx = makeContext({
      rig: makeRig({ trust_level: 2, registered_at: '2025-12-01T00:00:00Z' }),
      stamps: makeStamps({
        stampsReceived: 15,
        stampsIssued: 7,
        avgQualityReceived: 4.5,
        uniqueValidators: 4,
      }),
      trustLevelChangedAt: '2026-01-01T00:00:00Z',
      now: new Date('2026-03-01T00:00:00Z'),
    });
    const result = evaluateRule(buildMaintainerRules(), ctx);

    expect(result.eligible).toBe(true);
    expect(result.targetLevel).toBe(3);
  });

  it('fails when stamps_issued is too low', () => {
    const ctx = makeContext({
      rig: makeRig({ trust_level: 2 }),
      stamps: makeStamps({
        stampsReceived: 15,
        stampsIssued: 2,
        avgQualityReceived: 4.5,
        uniqueValidators: 4,
      }),
      trustLevelChangedAt: '2026-01-01T00:00:00Z',
    });
    const result = evaluateRule(buildMaintainerRules(), ctx);

    expect(result.eligible).toBe(false);
    expect(result.recommendation).toContain('stamps_issued');
  });

  it('fails when time at contributor is too short', () => {
    const ctx = makeContext({
      rig: makeRig({ trust_level: 2 }),
      stamps: makeStamps({
        stampsReceived: 15,
        stampsIssued: 7,
        avgQualityReceived: 4.5,
        uniqueValidators: 4,
      }),
      trustLevelChangedAt: '2026-02-20T00:00:00Z',
      now: new Date('2026-03-01T00:00:00Z'),
    });
    const result = evaluateRule(buildMaintainerRules(), ctx);

    expect(result.eligible).toBe(false);
    expect(result.criteria.find(c => c.name === 'time_at_contributor')!.met).toBe(false);
  });

  it('handles null trustLevelChangedAt', () => {
    const ctx = makeContext({
      rig: makeRig({ trust_level: 2 }),
      stamps: makeStamps({
        stampsReceived: 15,
        stampsIssued: 7,
        avgQualityReceived: 4.5,
        uniqueValidators: 4,
      }),
      trustLevelChangedAt: null,
    });
    const result = evaluateRule(buildMaintainerRules(), ctx);

    const timeResult = result.criteria.find(c => c.name === 'time_at_contributor')!;
    expect(timeResult.met).toBe(false);
    expect(timeResult.actual).toBe('unknown promotion date');
  });
});

// ============================================================================
// evaluateRig routing
// ============================================================================

describe('evaluateRig', () => {
  it('routes level 1 to contributor rules', () => {
    const ctx = makeContext({ rig: makeRig({ trust_level: 1 }) });
    const result = evaluateRig(ctx);

    expect(result).not.toBeNull();
    expect(result!.targetLevel).toBe(2);
  });

  it('routes level 2 to maintainer rules', () => {
    const ctx = makeContext({
      rig: makeRig({ trust_level: 2 }),
      stamps: makeStamps({
        stampsReceived: 15,
        stampsIssued: 7,
        avgQualityReceived: 4.5,
        uniqueValidators: 4,
      }),
      trustLevelChangedAt: '2026-01-01T00:00:00Z',
    });
    const result = evaluateRig(ctx);

    expect(result).not.toBeNull();
    expect(result!.targetLevel).toBe(3);
  });

  it('returns null for level 0 (auto-promote on registration)', () => {
    const ctx = makeContext({ rig: makeRig({ trust_level: 0 }) });
    expect(evaluateRig(ctx)).toBeNull();
  });

  it('returns null for level 3 (max level)', () => {
    const ctx = makeContext({ rig: makeRig({ trust_level: 3 }) });
    expect(evaluateRig(ctx)).toBeNull();
  });
});

// ============================================================================
// Batch Scanner
// ============================================================================

describe('scanForEscalation', () => {
  it('scans rigs and separates eligible from not eligible', async () => {
    const provider = makeMockProvider({
      getRigs: async () => [
        makeRig({ handle: 'rig-a', trust_level: 1, registered_at: '2026-01-01T00:00:00Z' }),
        makeRig({ handle: 'rig-b', trust_level: 1, registered_at: '2026-02-28T00:00:00Z' }),
      ],
      getStampSummary: async (handle) => {
        if (handle === 'rig-a') return makeStamps({ stampsReceived: 5, avgQualityReceived: 4.0 });
        return makeStamps({ stampsReceived: 1, avgQualityReceived: 2.0 });
      },
    });

    const result = await scanForEscalation(provider, 1, new Date('2026-03-01T00:00:00Z'));

    expect(result.eligible).toHaveLength(1);
    expect(result.eligible[0].handle).toBe('rig-a');
    expect(result.notEligible).toHaveLength(1);
    expect(result.notEligible[0].handle).toBe('rig-b');
    expect(result.errors).toHaveLength(0);
    expect(result.scannedAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('captures per-rig errors without failing the scan', async () => {
    const provider = makeMockProvider({
      getRigs: async () => [
        makeRig({ handle: 'rig-ok', trust_level: 1 }),
        makeRig({ handle: 'rig-broken', trust_level: 1 }),
      ],
      getStampSummary: async (handle) => {
        if (handle === 'rig-broken') throw new Error('DoltHub API error: 500');
        return makeStamps();
      },
    });

    const result = await scanForEscalation(provider, 1);

    expect(result.eligible.length + result.notEligible.length).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].handle).toBe('rig-broken');
    expect(result.errors[0].error).toContain('500');
  });

  it('handles getRigs failure gracefully', async () => {
    const provider = makeMockProvider({
      getRigs: async () => { throw new Error('network timeout'); },
    });

    const result = await scanForEscalation(provider, 1);

    expect(result.eligible).toHaveLength(0);
    expect(result.notEligible).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].handle).toBe('*');
    expect(result.errors[0].error).toContain('network timeout');
  });

  it('skips rigs with no escalation path (level 0, level 3)', async () => {
    const provider = makeMockProvider({
      getRigs: async () => [
        makeRig({ handle: 'outsider', trust_level: 0 }),
        makeRig({ handle: 'max-level', trust_level: 3 }),
      ],
    });

    const result = await scanForEscalation(provider, 0);

    expect(result.eligible).toHaveLength(0);
    expect(result.notEligible).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('uses registered_at as fallback when trustLevelChangedAt is null', async () => {
    const provider = makeMockProvider({
      getRigs: async () => [
        makeRig({ handle: 'rig-c', trust_level: 2, registered_at: '2026-01-01T00:00:00Z' }),
      ],
      getStampSummary: async () => makeStamps({
        stampsReceived: 15,
        stampsIssued: 7,
        avgQualityReceived: 4.5,
        uniqueValidators: 4,
      }),
      getTrustLevelChangedAt: async () => null,
    });

    const result = await scanForEscalation(provider, 2, new Date('2026-03-01T00:00:00Z'));

    // registered_at is Jan 1 → 59 days at level 2, meets 30-day requirement
    expect(result.eligible).toHaveLength(1);
    expect(result.eligible[0].handle).toBe('rig-c');
  });
});

// ============================================================================
// SQL Generator
// ============================================================================

describe('toPromotionSQL', () => {
  it('generates UPDATE for eligible rig', () => {
    const evaluation: EscalationEvaluation = {
      handle: 'desert-fox',
      currentLevel: 1,
      targetLevel: 2,
      eligible: true,
      criteria: [
        { name: 'stamps_received', description: '3+ stamps', met: true, actual: '5 stamps', required: '>= 3 stamps' },
      ],
      recommendation: 'ELIGIBLE',
    };

    const sql = toPromotionSQL(evaluation);
    expect(sql).toContain('UPDATE rigs SET trust_level = 2');
    expect(sql).toContain("WHERE handle = 'desert-fox'");
    expect(sql).toContain('AND trust_level = 1');
    expect(sql).toContain('stamps_received: 5 stamps');
  });

  it('generates comment for ineligible rig', () => {
    const evaluation: EscalationEvaluation = {
      handle: 'newbie',
      currentLevel: 1,
      targetLevel: 2,
      eligible: false,
      criteria: [],
      recommendation: 'NOT ELIGIBLE',
    };

    const sql = toPromotionSQL(evaluation);
    expect(sql).toMatch(/^--/);
    expect(sql).toContain('NOT ELIGIBLE');
    expect(sql).toContain('newbie');
  });

  it('escapes single quotes in handles', () => {
    const evaluation: EscalationEvaluation = {
      handle: "o'malley",
      currentLevel: 1,
      targetLevel: 2,
      eligible: true,
      criteria: [],
      recommendation: 'ELIGIBLE',
    };

    const sql = toPromotionSQL(evaluation);
    expect(sql).toContain("o''malley");
    expect(sql).not.toContain("o'malley'");
  });
});

describe('toPromotionReport', () => {
  it('generates header with stats', () => {
    const result = {
      eligible: [],
      notEligible: [{ handle: 'a' } as EscalationEvaluation],
      errors: [],
      scannedAt: '2026-03-01T00:00:00Z',
    };

    const report = toPromotionReport(result);
    expect(report).toContain('Escalation Report');
    expect(report).toContain('Eligible: 0');
    expect(report).toContain('Not eligible: 1');
    expect(report).toContain('No rigs eligible');
  });

  it('includes promotion SQL for eligible rigs', () => {
    const result = {
      eligible: [{
        handle: 'good-rig',
        currentLevel: 1,
        targetLevel: 2,
        eligible: true,
        criteria: [{ name: 'stamps', description: 'test', met: true, actual: '5', required: '3' }],
        recommendation: 'ELIGIBLE',
      }],
      notEligible: [],
      errors: [],
      scannedAt: '2026-03-01T00:00:00Z',
    };

    const report = toPromotionReport(result);
    expect(report).toContain('UPDATE rigs SET trust_level = 2');
    expect(report).toContain('Eligible: 1');
  });
});

// ============================================================================
// Human-Readable Report
// ============================================================================

describe('formatEvaluation', () => {
  it('formats eligible evaluation with all criteria', () => {
    const evaluation: EscalationEvaluation = {
      handle: 'scout',
      currentLevel: 1,
      targetLevel: 2,
      eligible: true,
      criteria: [
        { name: 'stamps_received', description: '3+ stamps', met: true, actual: '5 stamps', required: '>= 3 stamps' },
        { name: 'avg_quality', description: 'Quality >= 3.0', met: true, actual: '4.20', required: '>= 3.0' },
      ],
      recommendation: 'ELIGIBLE',
    };

    const output = formatEvaluation(evaluation);
    expect(output).toContain('ELIGIBLE');
    expect(output).toContain('1 → 2');
    expect(output).toContain('+ 3+ stamps');
    expect(output).toContain('+ Quality >= 3.0');
  });

  it('formats ineligible evaluation with unmet criteria marked', () => {
    const evaluation: EscalationEvaluation = {
      handle: 'newcomer',
      currentLevel: 1,
      targetLevel: 2,
      eligible: false,
      criteria: [
        { name: 'stamps_received', description: '3+ stamps', met: false, actual: '1 stamps', required: '>= 3 stamps' },
        { name: 'avg_quality', description: 'Quality >= 3.0', met: true, actual: '4.00', required: '>= 3.0' },
      ],
      recommendation: 'NOT ELIGIBLE',
    };

    const output = formatEvaluation(evaluation);
    expect(output).toContain('NOT ELIGIBLE');
    expect(output).toContain('- 3+ stamps');
    expect(output).toContain('+ Quality >= 3.0');
  });
});
