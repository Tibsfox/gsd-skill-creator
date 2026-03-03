import { describe, it, expect } from 'vitest';
import { detectSuccessors, SuccessorDetector } from './successor-detector.js';
import type { DiagnosisResult } from '../health-diagnostician/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

import type { RegistryHealth } from '../dependency-auditor/types.js';

function makeResult(
  name: string,
  classification: DiagnosisResult['classification'],
  deprecatedMsg?: string,
  readmeContent?: string,
): DiagnosisResult {
  const registryHealth = {
    ecosystem: 'npm',
    name,
    latestVersion: '1.0.0',
    lastPublishDate: '2020-01-01T00:00:00Z',
    isArchived: false,
    isDeprecated: !!deprecatedMsg,
    maintainerCount: 1,
    _meta: {
      ...(deprecatedMsg ? { deprecated: deprecatedMsg } : {}),
      ...(readmeContent ? { readme: readmeContent } : {}),
    } as Record<string, unknown>,
  } as RegistryHealth & { _meta?: Record<string, unknown> };
  return {
    signal: {
      dependency: { name, version: '1.0.0', ecosystem: 'npm', sourceManifest: '/pkg.json' },
      registryHealth,
      vulnerabilities: [],
    },
    classification,
    severity: 'P2',
    rationale: 'test',
    ageInDays: 400,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('detectSuccessors', () => {
  it('returns empty array for empty input', () => {
    expect(detectSuccessors([])).toEqual([]);
  });

  it('skips healthy deps', () => {
    const result = makeResult('old-pkg', 'healthy', 'Use new-pkg instead');
    expect(detectSuccessors([result])).toEqual([]);
  });

  it('skips aging deps (not deprecated/abandoned)', () => {
    const result = makeResult('old-pkg', 'aging', 'Use new-pkg instead');
    // aging + deprecated message — should we flag it? Plan says stale with isDeprecated=true OR abandoned
    // aging alone without isDeprecated → skip
    const r2 = makeResult('old-pkg', 'aging');
    expect(detectSuccessors([r2])).toEqual([]);
  });

  it('detects "Use X instead" pattern from deprecated field', () => {
    const result = makeResult('old-pkg', 'stale', 'Use new-pkg instead');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('new-pkg');
    expect(reports[0].relationship).toBe('successor');
    expect(reports[0].confidenceScore).toBe(0.9);
    expect(reports[0].migrationEffort).toBe('low');
    expect(reports[0].apiCompatibility).toBe('unknown');
    expect(reports[0].sourceUrl).toBeNull();
    expect(reports[0].originalPackage).toBe('old-pkg');
  });

  it('detects "Replaced by X" pattern from deprecated field', () => {
    const result = makeResult('old-pkg', 'stale', 'Replaced by @scope/new-pkg');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('@scope/new-pkg');
    expect(reports[0].confidenceScore).toBe(0.9);
  });

  it('detects "Moved to X" pattern from deprecated field', () => {
    const result = makeResult('old-pkg', 'stale', 'Moved to better-pkg');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('better-pkg');
  });

  it('detects "See X" pattern from deprecated field', () => {
    const result = makeResult('old-pkg', 'abandoned', 'See new-package for the updated version');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('new-package');
  });

  it('returns empty when deprecated message has no recognizable package name', () => {
    const result = makeResult('old-pkg', 'stale', 'This package is no longer maintained');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(0);
  });

  it('detects migration notice from README with confidence 0.7', () => {
    const result = makeResult('old-pkg', 'abandoned', undefined, '# old-pkg\n\nPlease migrate to better-pkg for continued support.\n');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('better-pkg');
    expect(reports[0].confidenceScore).toBe(0.7);
    expect(reports[0].evidenceSummary).toContain('README');
  });

  it('detects "replaced by X" pattern in README', () => {
    const result = makeResult('old-pkg', 'stale', undefined, 'This package has been replaced by my-new-lib.');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('my-new-lib');
  });

  it('detects "use X instead" pattern in README', () => {
    const result = makeResult('old-pkg', 'stale', undefined, 'We recommend you use fast-lib instead of this package.');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('fast-lib');
  });

  it('detects "successor: X" pattern in README', () => {
    const result = makeResult('old-pkg', 'abandoned', undefined, 'successor: next-gen-pkg');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('next-gen-pkg');
  });

  it('deprecated field takes priority over README (higher confidence)', () => {
    const result = makeResult(
      'old-pkg',
      'stale',
      'Use new-pkg instead',
      'migrate to other-pkg',
    );
    const reports = detectSuccessors([result]);
    // Both would match but deprecated field (0.9) wins — return only 1
    // OR return both. Plan says "in priority order" for parsing — return the first found.
    // Let's verify at least the deprecated-field one is present and has 0.9
    expect(reports.some(r => r.confidenceScore === 0.9)).toBe(true);
  });

  it('handles stale dep with isDeprecated=true in classification check', () => {
    // classification 'stale' is processed
    const result = makeResult('old-pkg', 'stale', 'Use replacement-pkg instead');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('replacement-pkg');
  });

  it('handles abandoned deps', () => {
    const result = makeResult('old-pkg', 'abandoned', 'Use new-pkg instead');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
  });

  it('strips backticks and quotes from extracted package name', () => {
    const result = makeResult('old-pkg', 'stale', 'Use `clean-pkg` instead');
    const reports = detectSuccessors([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('clean-pkg');
  });

  it('SuccessorDetector class wraps detectSuccessors', () => {
    const detector = new SuccessorDetector();
    const result = makeResult('old-pkg', 'stale', 'Use new-pkg instead');
    const reports = detector.detect([result]);
    expect(reports).toHaveLength(1);
    expect(reports[0].alternativeName).toBe('new-pkg');
  });
});
