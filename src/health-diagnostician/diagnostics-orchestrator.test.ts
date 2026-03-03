import { describe, it, expect } from 'vitest';
import { DiagnosticsOrchestrator } from './diagnostics-orchestrator.js';
import type { AuditSnapshot, DependencyRecord, HealthSignal, RegistryHealth } from '../dependency-auditor/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeSignal(
  name: string,
  ecosystem: DependencyRecord['ecosystem'],
  opts: {
    lastPublishDate?: string | null;
    isArchived?: boolean;
    latestVersion?: string | null;
    pythonRequires?: string;
    version?: string;
  } = {},
): HealthSignal {
  const dep: DependencyRecord = {
    name,
    version: opts.version ?? '1.0.0',
    ecosystem,
    sourceManifest: `/project/${ecosystem === 'npm' ? 'package.json' : 'requirements.txt'}`,
  };
  const meta = opts.pythonRequires ? { pythonRequires: opts.pythonRequires } : undefined;
  const registryHealth: RegistryHealth = {
    ecosystem,
    name,
    latestVersion: opts.latestVersion !== undefined ? opts.latestVersion : '2.0.0',
    lastPublishDate: opts.lastPublishDate !== undefined ? opts.lastPublishDate : daysAgo(30),
    isArchived: opts.isArchived ?? false,
    isDeprecated: false,
    maintainerCount: 3,
    _meta: meta,
  } as RegistryHealth & { _meta?: Record<string, unknown> };
  return { dependency: dep, registryHealth, vulnerabilities: [] };
}

function makeSnapshot(signals: HealthSignal[]): AuditSnapshot {
  return {
    projectRoot: '/project',
    scannedAt: new Date().toISOString(),
    dependencies: signals.map((s) => s.dependency),
    signals,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DiagnosticsOrchestrator.diagnose()', () => {
  it('returns empty DiagnosisReport for empty snapshot', () => {
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot([]));

    expect(report.results).toHaveLength(0);
    expect(report.conflicts).toHaveLength(0);
    expect(report.pythonCompat).toBeNull();
    expect(report.summary.total).toBe(0);
  });

  it('returns one DiagnosisResult per dependency', () => {
    const signals = [
      makeSignal('express', 'npm'),
      makeSignal('lodash', 'npm'),
      makeSignal('react', 'npm'),
    ];
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot(signals));

    expect(report.results).toHaveLength(3);
    expect(report.summary.total).toBe(3);
  });

  it('classifies healthy npm dep published 30 days ago as healthy, P3', () => {
    const signal = makeSignal('express', 'npm', { lastPublishDate: daysAgo(30) });
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot([signal]));

    const result = report.results[0];
    expect(result.classification).toBe('healthy');
    expect(result.severity).toBe('P3');
  });

  it('classifies archived dep as abandoned, P1', () => {
    const signal = makeSignal('old-lib', 'npm', { isArchived: true });
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot([signal]));

    expect(report.results[0].classification).toBe('abandoned');
    expect(report.results[0].severity).toBe('P1');
  });

  it('detects conflict between lodash ^3 and ^4 → one gets conflicting/P0', () => {
    const signals = [
      makeSignal('lodash', 'npm', { version: '^3.0.0' }),
      makeSignal('lodash', 'npm', { version: '^4.0.0' }),
    ];
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot(signals));

    expect(report.conflicts).toHaveLength(1);
    const conflictingResults = report.results.filter(
      (r) => r.classification === 'conflicting',
    );
    expect(conflictingResults.length).toBeGreaterThanOrEqual(1);
    conflictingResults.forEach((r) => expect(r.severity).toBe('P0'));
  });

  it('pythonCompat is null when no pypi deps', () => {
    const signal = makeSignal('express', 'npm');
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot([signal]));

    expect(report.pythonCompat).toBeNull();
  });

  it('pythonCompat is populated when pypi deps with python_requires exist', () => {
    const signal = makeSignal('flask', 'pypi', { pythonRequires: '>=3.9' });
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot([signal]));

    expect(report.pythonCompat).not.toBeNull();
    expect(report.pythonCompat!.compatibleVersions).toContain('3.9');
  });

  it('summary counts are correct', () => {
    const signals = [
      makeSignal('a', 'npm', { lastPublishDate: daysAgo(30) }),    // healthy
      makeSignal('b', 'npm', { lastPublishDate: daysAgo(800) }),   // abandoned
      makeSignal('c', 'npm', { lastPublishDate: daysAgo(400) }),   // stale
    ];
    const orch = new DiagnosticsOrchestrator();
    const report = orch.diagnose(makeSnapshot(signals));

    expect(report.summary.total).toBe(3);
    expect(report.summary.byClassification.healthy).toBe(1);
    expect(report.summary.byClassification.abandoned).toBe(1);
    expect(report.summary.byClassification.stale).toBe(1);
    expect(report.summary.byPriority.P1).toBe(1);
    expect(report.summary.byPriority.P2).toBe(1);
    expect(report.summary.byPriority.P3).toBe(1);
  });
});
