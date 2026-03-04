import { describe, it, expect } from 'vitest';
import {
  deriveTier,
  deriveStatus,
  buildRecommendations,
  generateModelGuidance,
  generateMultiModelReport,
  MARGINAL_PASS_RATE_THRESHOLD,
  ModelGuidanceSchema,
  MultiModelReportSchema,
} from './multi-model-optimizer.js';

// ============================================================================
// MARGINAL_PASS_RATE_THRESHOLD (IMP-03)
// ============================================================================

describe('MARGINAL_PASS_RATE_THRESHOLD (IMP-03)', () => {
  it('exports 0.50', () => {
    expect(MARGINAL_PASS_RATE_THRESHOLD).toBe(0.50);
  });
});

// ============================================================================
// deriveTier
// ============================================================================

describe('deriveTier', () => {
  it('returns local-small for context < 8192', () => {
    expect(deriveTier(4096)).toBe('local-small');
    expect(deriveTier(0)).toBe('local-small');
    expect(deriveTier(8191)).toBe('local-small');
  });

  it('returns local-large for 8192 <= context < 100000', () => {
    expect(deriveTier(8192)).toBe('local-large');
    expect(deriveTier(50000)).toBe('local-large');
    expect(deriveTier(99999)).toBe('local-large');
  });

  it('returns cloud for context >= 100000', () => {
    expect(deriveTier(100000)).toBe('cloud');
    expect(deriveTier(200000)).toBe('cloud');
  });
});

// ============================================================================
// deriveStatus
// ============================================================================

describe('deriveStatus', () => {
  it('returns passing for passRate >= 0.75', () => {
    expect(deriveStatus(0.75)).toBe('passing');
    expect(deriveStatus(1.0)).toBe('passing');
  });

  it('returns marginal for 0.50 <= passRate < 0.75', () => {
    expect(deriveStatus(0.50)).toBe('marginal');
    expect(deriveStatus(0.74)).toBe('marginal');
  });

  it('returns failing for passRate < 0.50', () => {
    expect(deriveStatus(0.49)).toBe('failing');
    expect(deriveStatus(0.0)).toBe('failing');
  });
});

// ============================================================================
// buildRecommendations
// ============================================================================

describe('buildRecommendations', () => {
  it('returns 3 recommendations for local-small + failing', () => {
    const recs = buildRecommendations('local-small', 'failing');
    expect(recs).toHaveLength(3);
    expect(recs[0]).toContain('larger context model');
  });

  it('returns 2 recommendations for local-small + marginal', () => {
    const recs = buildRecommendations('local-small', 'marginal');
    expect(recs).toHaveLength(2);
    expect(recs[0]).toContain('small context window');
  });

  it('returns 2 recommendations for cloud + passing', () => {
    const recs = buildRecommendations('cloud', 'passing');
    expect(recs).toHaveLength(2);
    expect(recs[1]).toContain('local model');
  });

  it('returns 2 recommendations for cloud + failing', () => {
    const recs = buildRecommendations('cloud', 'failing');
    expect(recs).toHaveLength(2);
    expect(recs[1]).toContain('check eval setup');
  });

  it('covers all 9 tier+status combinations', () => {
    const tiers = ['local-small', 'local-large', 'cloud'] as const;
    const statuses = ['passing', 'failing', 'marginal'] as const;

    for (const tier of tiers) {
      for (const status of statuses) {
        const recs = buildRecommendations(tier, status);
        expect(recs.length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// generateModelGuidance
// ============================================================================

describe('generateModelGuidance', () => {
  it('generates guidance for a local-small failing chip', () => {
    const guidance = generateModelGuidance('tiny-llama', 0.30, 4096);
    expect(guidance.chipName).toBe('tiny-llama');
    expect(guidance.tier).toBe('local-small');
    expect(guidance.status).toBe('failing');
    expect(guidance.passRate).toBe(0.30);
    expect(guidance.recommendations.length).toBeGreaterThan(0);
  });

  it('generates guidance for a cloud passing chip', () => {
    const guidance = generateModelGuidance('claude-3', 0.95, 200000);
    expect(guidance.tier).toBe('cloud');
    expect(guidance.status).toBe('passing');
  });

  it('generates guidance for a local-large marginal chip', () => {
    const guidance = generateModelGuidance('mistral-7b', 0.60, 32768);
    expect(guidance.tier).toBe('local-large');
    expect(guidance.status).toBe('marginal');
  });

  it('validates against ModelGuidanceSchema', () => {
    const guidance = generateModelGuidance('test-chip', 0.80, 128000);
    expect(() => ModelGuidanceSchema.parse(guidance)).not.toThrow();
  });
});

// ============================================================================
// generateMultiModelReport
// ============================================================================

describe('generateMultiModelReport', () => {
  it('two chips produce two guidance entries (MESH-06)', () => {
    const report = generateMultiModelReport('eval-skill', [
      { chipName: 'gpt-4', passRate: 0.90, contextLength: 128000 },
      { chipName: 'llama-7b', passRate: 0.40, contextLength: 4096 },
    ]);

    expect(report.guidances).toHaveLength(2);
    expect(report.guidances[0].chipName).toBe('gpt-4');
    expect(report.guidances[1].chipName).toBe('llama-7b');
  });

  it('produces distinct recommendations per chip', () => {
    const report = generateMultiModelReport('test-skill', [
      { chipName: 'cloud-model', passRate: 0.95, contextLength: 200000 },
      { chipName: 'local-tiny', passRate: 0.30, contextLength: 2048 },
    ]);

    expect(report.guidances[0].recommendations).not.toEqual(
      report.guidances[1].recommendations,
    );
  });

  it('builds summary with correct counts', () => {
    const report = generateMultiModelReport('skill-x', [
      { chipName: 'a', passRate: 0.90, contextLength: 200000 }, // passing
      { chipName: 'b', passRate: 0.60, contextLength: 32768 },  // marginal
      { chipName: 'c', passRate: 0.30, contextLength: 4096 },   // failing
    ]);

    expect(report.summary).toBe('3 models evaluated: 1 passing, 1 marginal, 1 failing');
  });

  it('handles single chip', () => {
    const report = generateMultiModelReport('solo-skill', [
      { chipName: 'only-one', passRate: 0.80, contextLength: 128000 },
    ]);

    expect(report.guidances).toHaveLength(1);
    expect(report.summary).toContain('1 models evaluated');
  });

  it('validates against MultiModelReportSchema', () => {
    const report = generateMultiModelReport('schema-test', [
      { chipName: 'test', passRate: 0.75, contextLength: 128000 },
    ]);
    expect(() => MultiModelReportSchema.parse(report)).not.toThrow();
  });

  it('includes skillName in report', () => {
    const report = generateMultiModelReport('my-skill', [
      { chipName: 'test', passRate: 0.80, contextLength: 128000 },
    ]);
    expect(report.skillName).toBe('my-skill');
  });
});

// ============================================================================
// IMP-06 purity
// ============================================================================

describe('IMP-06 purity', () => {
  it('multi-model-optimizer.ts exports pure functions', () => {
    expect(deriveTier).toBeInstanceOf(Function);
    expect(deriveStatus).toBeInstanceOf(Function);
    expect(buildRecommendations).toBeInstanceOf(Function);
    expect(generateModelGuidance).toBeInstanceOf(Function);
    expect(generateMultiModelReport).toBeInstanceOf(Function);
  });
});
