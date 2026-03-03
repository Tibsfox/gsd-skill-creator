import { describe, it, expect } from 'vitest';
import { scoreSignal, SeverityScorer } from './severity-scorer.js';
import type { HealthSignal, DependencyRecord, RegistryHealth, OsvVulnerability } from '../dependency-auditor/types.js';
import type { HealthClassification } from './types.js';
import type { ConflictFinding } from './conflict-detector.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSignal(name = 'test-pkg', latestVersion: string | null = '2.0.0', vulns: OsvVulnerability[] = []): HealthSignal {
  const dep: DependencyRecord = {
    name,
    version: '1.0.0',
    ecosystem: 'npm',
    sourceManifest: '/project/package.json',
  };
  const registryHealth: RegistryHealth = {
    ecosystem: 'npm',
    name,
    latestVersion,
    lastPublishDate: '2024-01-01T00:00:00.000Z',
    isArchived: false,
    isDeprecated: false,
    maintainerCount: 3,
  };
  return { dependency: dep, registryHealth, vulnerabilities: vulns };
}

function makeVuln(severity: OsvVulnerability['severity']): OsvVulnerability {
  return { id: 'GHSA-test', summary: 'Test vuln', severity, aliases: [] };
}

function makeConflict(pkg: string): ConflictFinding {
  return {
    packageA: pkg,
    packageB: pkg,
    ecosystem: 'npm',
    rangeA: '^3.0.0',
    rangeB: '^4.0.0',
    explanation: 'Conflicting ranges',
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('scoreSignal', () => {
  it('conflicting classification → P0', () => {
    expect(scoreSignal(makeSignal(), 'conflicting', [])).toBe('P0');
  });

  it('conflict finding for this dep → P0', () => {
    const signal = makeSignal('lodash');
    const conflicts: ConflictFinding[] = [makeConflict('lodash')];
    expect(scoreSignal(signal, 'stale', conflicts)).toBe('P0');
  });

  it('CRITICAL vuln + no latest version → P0', () => {
    const signal = makeSignal('pkg', null, [makeVuln('CRITICAL')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P0');
  });

  it('HIGH vuln + no latest version → P0', () => {
    const signal = makeSignal('pkg', null, [makeVuln('HIGH')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P0');
  });

  it('CRITICAL vuln + patch available → P1', () => {
    const signal = makeSignal('pkg', '2.0.0', [makeVuln('CRITICAL')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P1');
  });

  it('HIGH vuln + patch available → P1', () => {
    const signal = makeSignal('pkg', '2.0.0', [makeVuln('HIGH')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P1');
  });

  it('abandoned classification → P1', () => {
    expect(scoreSignal(makeSignal(), 'abandoned', [])).toBe('P1');
  });

  it('stale classification → P2', () => {
    expect(scoreSignal(makeSignal(), 'stale', [])).toBe('P2');
  });

  it('MEDIUM vuln → P2', () => {
    const signal = makeSignal('pkg', '2.0.0', [makeVuln('MEDIUM')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P2');
  });

  it('aging classification → P3', () => {
    expect(scoreSignal(makeSignal(), 'aging', [])).toBe('P3');
  });

  it('healthy classification → P3', () => {
    expect(scoreSignal(makeSignal(), 'healthy', [])).toBe('P3');
  });

  it('LOW vuln → P3', () => {
    const signal = makeSignal('pkg', '2.0.0', [makeVuln('LOW')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P3');
  });

  it('UNKNOWN vuln → P3', () => {
    const signal = makeSignal('pkg', '2.0.0', [makeVuln('UNKNOWN')]);
    expect(scoreSignal(signal, 'vulnerable', [])).toBe('P3');
  });
});

describe('SeverityScorer class', () => {
  it('score() returns same result as scoreSignal()', () => {
    const signal = makeSignal('pkg', null, [makeVuln('CRITICAL')]);
    const scorer = new SeverityScorer();
    expect(scorer.score(signal, 'vulnerable', [])).toBe(scoreSignal(signal, 'vulnerable', []));
  });
});
