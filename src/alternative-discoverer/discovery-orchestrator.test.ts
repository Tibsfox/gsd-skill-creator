import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoverAlternatives, DiscoveryOrchestrator } from './discovery-orchestrator.js';
import type { DiagnosisReport, DiagnosisResult } from '../health-diagnostician/types.js';
import type { RegistryHealth } from '../dependency-auditor/types.js';
import type { UsageAnalysisInput } from './internalization-flagger.js';

// ─── Mock the strategy modules ─────────────────────────────────────────────────

vi.mock('./successor-detector.js', () => ({
  detectSuccessors: vi.fn().mockReturnValue([]),
}));

vi.mock('./fork-finder.js', () => ({
  findForks: vi.fn().mockResolvedValue([]),
}));

vi.mock('./equivalent-searcher.js', () => ({
  searchEquivalents: vi.fn().mockResolvedValue([]),
}));

vi.mock('./internalization-flagger.js', () => ({
  flagInternalizationCandidates: vi.fn().mockReturnValue([]),
}));

import { detectSuccessors } from './successor-detector.js';
import { findForks } from './fork-finder.js';
import { searchEquivalents } from './equivalent-searcher.js';
import { flagInternalizationCandidates } from './internalization-flagger.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResult(name: string, classification: DiagnosisResult['classification']): DiagnosisResult {
  return {
    signal: {
      dependency: { name, version: '1.0.0', ecosystem: 'npm', sourceManifest: '/pkg.json' },
      registryHealth: {
        ecosystem: 'npm',
        name,
        latestVersion: '1.0.0',
        lastPublishDate: null,
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

function makeReport(results: DiagnosisResult[]): DiagnosisReport {
  return {
    results,
    pythonCompat: null,
    conflicts: [],
    summary: {
      total: results.length,
      byClassification: {
        healthy: 0, aging: 0, stale: 0, abandoned: 0, vulnerable: 0, conflicting: 0,
      },
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
    },
  };
}

function makeAlternative(pkgName: string, altName: string, confidence: number, relationship: 'successor' | 'fork' | 'equivalent' | 'internalization-candidate' = 'successor') {
  return {
    originalPackage: pkgName,
    originalEcosystem: 'npm' as const,
    relationship,
    alternativeName: altName,
    evidenceSummary: 'test evidence',
    apiCompatibility: 'unknown' as const,
    migrationEffort: 'low' as const,
    confidenceScore: confidence,
    sourceUrl: null,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('discoverAlternatives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(detectSuccessors).mockReturnValue([]);
    vi.mocked(findForks).mockResolvedValue([]);
    vi.mocked(searchEquivalents).mockResolvedValue([]);
    vi.mocked(flagInternalizationCandidates).mockReturnValue([]);
  });

  it('returns empty DiscoveryReport for empty diagnosis report', async () => {
    const report = makeReport([]);
    const result = await discoverAlternatives(report, []);
    expect(result.results.size).toBe(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.packagesWithAlternatives).toBe(0);
    // No strategy calls
    expect(detectSuccessors).not.toHaveBeenCalled();
    expect(findForks).not.toHaveBeenCalled();
  });

  it('skips healthy deps — no strategy calls for healthy', async () => {
    const report = makeReport([makeResult('healthy-pkg', 'healthy')]);
    const result = await discoverAlternatives(report, []);
    expect(result.results.size).toBe(0);
    expect(detectSuccessors).not.toHaveBeenCalled();
    expect(findForks).not.toHaveBeenCalled();
    expect(searchEquivalents).not.toHaveBeenCalled();
  });

  it('processes stale dep with all strategies', async () => {
    const staleDep = makeResult('stale-pkg', 'stale');
    const report = makeReport([staleDep]);
    const alt = makeAlternative('stale-pkg', 'new-pkg', 0.9, 'successor');
    vi.mocked(detectSuccessors).mockReturnValueOnce([alt]);
    const result = await discoverAlternatives(report, []);
    expect(result.results.has('stale-pkg')).toBe(true);
    expect(result.results.get('stale-pkg')).toHaveLength(1);
    expect(result.summary.total).toBe(1);
    expect(result.summary.packagesWithAlternatives).toBe(1);
  });

  it('deduplicates alternatives with same alternativeName — keeps highest confidence', async () => {
    const staleDep = makeResult('stale-pkg', 'stale');
    const report = makeReport([staleDep]);
    // Both strategies return the same alternativeName
    const alt1 = makeAlternative('stale-pkg', 'same-alt', 0.7, 'successor');
    const alt2 = makeAlternative('stale-pkg', 'same-alt', 0.9, 'equivalent');
    vi.mocked(detectSuccessors).mockReturnValueOnce([alt1]);
    vi.mocked(searchEquivalents).mockResolvedValueOnce([alt2]);
    const result = await discoverAlternatives(report, []);
    const alts = result.results.get('stale-pkg')!;
    const deduplicated = alts.filter(a => a.alternativeName === 'same-alt');
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].confidenceScore).toBe(0.9);
  });

  it('swallows strategy errors — other strategies still run', async () => {
    const staleDep = makeResult('stale-pkg', 'stale');
    const report = makeReport([staleDep]);
    vi.mocked(findForks).mockRejectedValueOnce(new Error('API down'));
    const alt = makeAlternative('stale-pkg', 'good-alt', 0.8, 'successor');
    vi.mocked(detectSuccessors).mockReturnValueOnce([alt]);
    const result = await discoverAlternatives(report, []);
    // findForks threw, but detectSuccessors result is still present
    expect(result.results.get('stale-pkg')).toHaveLength(1);
    expect(result.results.get('stale-pkg')![0].alternativeName).toBe('good-alt');
  });

  it('merges internalization candidates into correct dep results', async () => {
    const staleDep = makeResult('tiny-pkg', 'stale');
    const report = makeReport([staleDep]);
    const internAlt = makeAlternative('tiny-pkg', 'tiny-pkg-internal', 0.9, 'internalization-candidate');
    vi.mocked(flagInternalizationCandidates).mockReturnValueOnce([internAlt]);
    const usages: UsageAnalysisInput[] = [{
      packageName: 'tiny-pkg',
      ecosystem: 'npm',
      totalExports: 10,
      usedExports: ['fn1'],
      isAlgorithmic: true,
      hasAbsorptionBarriers: false,
    }];
    const result = await discoverAlternatives(report, usages);
    const alts = result.results.get('tiny-pkg')!;
    expect(alts.some(a => a.relationship === 'internalization-candidate')).toBe(true);
  });

  it('summary.total counts all AlternativeReport items across all packages', async () => {
    const dep1 = makeResult('pkg-a', 'stale');
    const dep2 = makeResult('pkg-b', 'abandoned');
    const report = makeReport([dep1, dep2]);
    vi.mocked(detectSuccessors)
      .mockReturnValueOnce([makeAlternative('pkg-a', 'alt-a1', 0.9)])
      .mockReturnValueOnce([]);
    vi.mocked(searchEquivalents)
      .mockResolvedValueOnce([makeAlternative('pkg-a', 'alt-a2', 0.5, 'equivalent')])
      .mockResolvedValueOnce([makeAlternative('pkg-b', 'alt-b1', 0.4, 'equivalent')]);
    const result = await discoverAlternatives(report, []);
    expect(result.summary.total).toBe(3); // 2 for pkg-a, 1 for pkg-b
  });

  it('summary.byRelationship counts each relationship type correctly', async () => {
    const dep = makeResult('stale-pkg', 'stale');
    const report = makeReport([dep]);
    vi.mocked(detectSuccessors).mockReturnValueOnce([
      makeAlternative('stale-pkg', 'new-pkg', 0.9, 'successor'),
    ]);
    vi.mocked(searchEquivalents).mockResolvedValueOnce([
      makeAlternative('stale-pkg', 'equiv-pkg', 0.5, 'equivalent'),
    ]);
    const result = await discoverAlternatives(report, []);
    expect(result.summary.byRelationship.successor).toBe(1);
    expect(result.summary.byRelationship.equivalent).toBe(1);
    expect(result.summary.byRelationship.fork).toBe(0);
    expect(result.summary.byRelationship['internalization-candidate']).toBe(0);
  });

  it('summary.packagesWithAlternatives = count of packages with at least one alternative', async () => {
    const dep1 = makeResult('pkg-a', 'stale');
    const dep2 = makeResult('pkg-b', 'abandoned');
    const report = makeReport([dep1, dep2]);
    // pkg-a has alternatives, pkg-b does not
    vi.mocked(detectSuccessors).mockReturnValueOnce([makeAlternative('pkg-a', 'alt-a', 0.9)]);
    const result = await discoverAlternatives(report, []);
    expect(result.summary.packagesWithAlternatives).toBe(1);
  });

  it('DiscoveryOrchestrator class wraps discoverAlternatives', async () => {
    const orchestrator = new DiscoveryOrchestrator();
    const report = makeReport([]);
    const result = await orchestrator.discover(report, []);
    expect(result.results.size).toBe(0);
  });

  it('DiscoveryOrchestrator strategy toggles work', async () => {
    const staleDep = makeResult('stale-pkg', 'stale');
    const report = makeReport([staleDep]);
    const alt = makeAlternative('stale-pkg', 'fork-pkg', 0.7, 'fork');
    vi.mocked(findForks).mockResolvedValue([alt]);
    // Disable all except fork
    const orchestrator = new DiscoveryOrchestrator({
      enableSuccessorDetection: false,
      enableForkFinding: true,
      enableEquivalentSearch: false,
      enableInternalizationFlagging: false,
    });
    await orchestrator.discover(report, []);
    expect(detectSuccessors).not.toHaveBeenCalled();
    expect(findForks).toHaveBeenCalled();
    expect(searchEquivalents).not.toHaveBeenCalled();
    expect(flagInternalizationCandidates).not.toHaveBeenCalled();
  });
});
