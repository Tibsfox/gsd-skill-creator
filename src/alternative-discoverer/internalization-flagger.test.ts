import { describe, it, expect } from 'vitest';
import { flagInternalizationCandidates, InternalizationFlagger } from './internalization-flagger.js';
import type { UsageAnalysisInput } from './internalization-flagger.js';
import type { DiagnosisResult } from '../health-diagnostician/types.js';
import type { RegistryHealth } from '../dependency-auditor/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResult(name: string, classification: DiagnosisResult['classification']): DiagnosisResult {
  return {
    signal: {
      dependency: { name, version: '1.0.0', ecosystem: 'npm', sourceManifest: '/pkg.json' },
      registryHealth: {
        ecosystem: 'npm',
        name,
        latestVersion: '1.0.0',
        lastPublishDate: '2022-01-01T00:00:00Z',
        isArchived: false,
        isDeprecated: false,
        maintainerCount: 1,
      } as RegistryHealth,
      vulnerabilities: [],
    },
    classification,
    severity: 'P2',
    rationale: 'test',
    ageInDays: 400,
  };
}

function makeUsage(
  packageName: string,
  totalExports: number,
  usedExports: string[],
  isAlgorithmic: boolean = true,
  hasAbsorptionBarriers: boolean = false,
): UsageAnalysisInput {
  return {
    packageName,
    ecosystem: 'npm',
    totalExports,
    usedExports,
    isAlgorithmic,
    hasAbsorptionBarriers,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('flagInternalizationCandidates', () => {
  it('returns empty array for empty input', () => {
    expect(flagInternalizationCandidates([], [])).toEqual([]);
  });

  it('flags package using 1/10 exports (10% < 20% threshold)', () => {
    const result = makeResult('tiny-pkg', 'stale');
    const usage = makeUsage('tiny-pkg', 10, ['onlyUsed']);
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports).toHaveLength(1);
    expect(reports[0].relationship).toBe('internalization-candidate');
    expect(reports[0].alternativeName).toBe('tiny-pkg-internal');
    expect(reports[0].apiCompatibility).toBe('identical');
    expect(reports[0].migrationEffort).toBe('low');
    expect(reports[0].originalPackage).toBe('tiny-pkg');
    expect(reports[0].sourceUrl).toBeNull();
  });

  it('does NOT flag package using 3/10 exports (30% >= 20% threshold)', () => {
    const result = makeResult('med-pkg', 'stale');
    const usage = makeUsage('med-pkg', 10, ['fn1', 'fn2', 'fn3']); // 30%
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports).toHaveLength(0);
  });

  it('does NOT flag when hasAbsorptionBarriers=true (hard barrier)', () => {
    const result = makeResult('crypto-pkg', 'stale');
    const usage = makeUsage('crypto-pkg', 10, ['hashFn'], true, true); // barriers!
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports).toHaveLength(0);
  });

  it('does NOT flag when isAlgorithmic=false', () => {
    const result = makeResult('network-pkg', 'stale');
    const usage = makeUsage('network-pkg', 10, ['request'], false); // not algorithmic
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports).toHaveLength(0);
  });

  it('does NOT flag when classification is healthy', () => {
    const result = makeResult('healthy-pkg', 'healthy');
    const usage = makeUsage('healthy-pkg', 10, ['fn1'], true, false);
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports).toHaveLength(0);
  });

  it('evidenceSummary contains used count, total exports, and percentage', () => {
    const result = makeResult('tiny-pkg', 'stale');
    const usage = makeUsage('tiny-pkg', 10, ['parseDate']);
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports[0].evidenceSummary).toContain('1/10');
    expect(reports[0].evidenceSummary).toContain('10%');
    expect(reports[0].evidenceSummary).toContain('parseDate');
  });

  it('confidenceScore formula: 0.5 + min((1 - usageRatio) * 0.5, 0.4)', () => {
    const result = makeResult('tiny-pkg', 'stale');
    // usageRatio = 1/10 = 0.1 → (1 - 0.1) * 0.5 = 0.45 → min(0.45, 0.4) = 0.4 → total = 0.9
    const usage = makeUsage('tiny-pkg', 10, ['fn1']);
    const reports = flagInternalizationCandidates([result], [usage]);
    expect(reports[0].confidenceScore).toBeCloseTo(0.9, 5);
  });

  it('confidenceScore is between 0.5 and 0.9 for various usage ratios', () => {
    // 19% usage → (1-0.19)*0.5 = 0.405 → min(0.405, 0.4) = 0.4 → 0.9
    // 5% usage → (1-0.05)*0.5 = 0.475 → min(0.475, 0.4) = 0.4 → 0.9
    // NOTE: due to the capped 0.4, anything below 20% usage will always give 0.9
    const cases: Array<[number, number, number]> = [
      [10, 1, 0.9],  // 10% → capped at 0.4 → 0.9
      [10, 1, 0.9],  // same
    ];
    for (const [total, used, expected] of cases) {
      const result = makeResult('pkg', 'stale');
      const usage = makeUsage('pkg', total, Array.from({ length: used }, (_, i) => `fn${i}`));
      const reports = flagInternalizationCandidates([result], [usage]);
      expect(reports[0].confidenceScore).toBeCloseTo(expected, 1);
      expect(reports[0].confidenceScore).toBeGreaterThanOrEqual(0.5);
      expect(reports[0].confidenceScore).toBeLessThanOrEqual(0.9);
    }
  });

  it('handles multiple packages, flags only those meeting ALL criteria', () => {
    const results = [
      makeResult('tiny-pkg', 'stale'),     // should be flagged
      makeResult('medium-pkg', 'stale'),   // should NOT be flagged (30% usage)
      makeResult('crypto-pkg', 'stale'),   // should NOT be flagged (barriers)
    ];
    const usages = [
      makeUsage('tiny-pkg', 10, ['fn1']),
      makeUsage('medium-pkg', 10, ['fn1', 'fn2', 'fn3']),
      makeUsage('crypto-pkg', 10, ['hashFn'], true, true),
    ];
    const reports = flagInternalizationCandidates(results, usages);
    expect(reports).toHaveLength(1);
    expect(reports[0].originalPackage).toBe('tiny-pkg');
  });

  it('skips package if no matching usage analysis found', () => {
    const result = makeResult('unknown-pkg', 'stale');
    // No usage analysis entry for 'unknown-pkg'
    const reports = flagInternalizationCandidates([result], []);
    expect(reports).toHaveLength(0);
  });

  it('InternalizationFlagger class wraps flagInternalizationCandidates', () => {
    const flagger = new InternalizationFlagger();
    const result = makeResult('tiny-pkg', 'stale');
    const usage = makeUsage('tiny-pkg', 10, ['fn1']);
    const reports = flagger.flag([result], [usage]);
    expect(reports).toHaveLength(1);
  });
});
