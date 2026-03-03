import { describe, it, expect } from 'vitest';
import { classifySignal } from './classifier.js';
import type { HealthSignal, DependencyRecord, RegistryHealth, OsvVulnerability } from '../dependency-auditor/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function makeSignal(overrides: {
  name?: string;
  ecosystem?: DependencyRecord['ecosystem'];
  lastPublishDate?: string | null;
  isArchived?: boolean;
  isDeprecated?: boolean;
  maintainerCount?: number | null;
  latestVersion?: string | null;
  vulns?: OsvVulnerability[];
  _conflict?: boolean;
}): HealthSignal {
  const {
    name = 'test-pkg',
    ecosystem = 'npm',
    lastPublishDate = daysAgo(30),
    isArchived = false,
    isDeprecated = false,
    maintainerCount = 3,
    latestVersion = '2.0.0',
    vulns = [],
    _conflict = false,
  } = overrides;

  const dep: DependencyRecord = {
    name,
    version: '1.0.0',
    ecosystem,
    sourceManifest: '/project/package.json',
  };

  const registryHealth: RegistryHealth = {
    ecosystem,
    name,
    latestVersion,
    lastPublishDate,
    isArchived,
    isDeprecated,
    maintainerCount,
    _conflict,
  } as RegistryHealth & { _conflict?: boolean };

  return { dependency: dep, registryHealth, vulnerabilities: vulns };
}

function makeVuln(severity: OsvVulnerability['severity']): OsvVulnerability {
  return { id: 'GHSA-test', summary: 'Test vuln', severity, aliases: [] };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('classifySignal', () => {
  it('classifies as healthy when published 30 days ago with no vulns (npm)', () => {
    const result = classifySignal(makeSignal({ lastPublishDate: daysAgo(30) }));
    expect(result.classification).toBe('healthy');
    expect(result.severity).toBe('P3');
    expect(result.ageInDays).toBeCloseTo(30, 0);
  });

  it('classifies as aging when published 200 days ago (npm agingDays=180)', () => {
    const result = classifySignal(makeSignal({ lastPublishDate: daysAgo(200) }));
    expect(result.classification).toBe('aging');
    expect(result.severity).toBe('P3');
  });

  it('classifies as stale when published 400 days ago (npm staleDays=365)', () => {
    const result = classifySignal(makeSignal({ lastPublishDate: daysAgo(400) }));
    expect(result.classification).toBe('stale');
    expect(result.severity).toBe('P2');
  });

  it('classifies as abandoned when published 800 days ago (npm abandonedDays=730)', () => {
    const result = classifySignal(makeSignal({ lastPublishDate: daysAgo(800) }));
    expect(result.classification).toBe('abandoned');
    expect(result.severity).toBe('P1');
  });

  it('classifies as abandoned when isArchived=true regardless of publish date', () => {
    const result = classifySignal(makeSignal({ isArchived: true, lastPublishDate: daysAgo(10) }));
    expect(result.classification).toBe('abandoned');
    expect(result.severity).toBe('P1');
  });

  it('classifies as vulnerable with P0 when CRITICAL vuln and no latestVersion', () => {
    const result = classifySignal(makeSignal({
      vulns: [makeVuln('CRITICAL')],
      latestVersion: null,
      lastPublishDate: daysAgo(30),
    }));
    expect(result.classification).toBe('vulnerable');
    expect(result.severity).toBe('P0');
  });

  it('classifies as vulnerable with P1 when CRITICAL vuln but patch available', () => {
    const result = classifySignal(makeSignal({
      vulns: [makeVuln('CRITICAL')],
      latestVersion: '2.0.0',
      lastPublishDate: daysAgo(30),
    }));
    expect(result.classification).toBe('vulnerable');
    expect(result.severity).toBe('P1');
  });

  it('classifies as vulnerable with P2 when MEDIUM vuln', () => {
    const result = classifySignal(makeSignal({
      vulns: [makeVuln('MEDIUM')],
      lastPublishDate: daysAgo(30),
    }));
    expect(result.classification).toBe('vulnerable');
    expect(result.severity).toBe('P2');
  });

  it('classifies as vulnerable with P3 when LOW vuln', () => {
    const result = classifySignal(makeSignal({
      vulns: [makeVuln('LOW')],
      lastPublishDate: daysAgo(30),
    }));
    expect(result.classification).toBe('vulnerable');
    expect(result.severity).toBe('P3');
  });

  it('classifies as healthy when lastPublishDate is null (cannot determine age)', () => {
    const result = classifySignal(makeSignal({ lastPublishDate: null }));
    expect(result.classification).toBe('healthy');
    expect(result.ageInDays).toBeNull();
  });

  it('uses ecosystem-aware thresholds: 400 days on conda is aging (not stale)', () => {
    // conda staleDays=730, agingDays=365 — 400 days is between aging and stale
    const result = classifySignal(makeSignal({
      ecosystem: 'conda',
      lastPublishDate: daysAgo(400),
    }));
    expect(result.classification).toBe('aging');
  });

  it('400 days on npm is stale (staleDays=365)', () => {
    const result = classifySignal(makeSignal({
      ecosystem: 'npm',
      lastPublishDate: daysAgo(400),
    }));
    expect(result.classification).toBe('stale');
  });

  it('classifies as conflicting when _conflict flag is set (highest priority)', () => {
    const result = classifySignal(makeSignal({
      _conflict: true,
      vulns: [makeVuln('CRITICAL')], // vulnerable would normally win without conflict priority
      lastPublishDate: daysAgo(30),
    }));
    expect(result.classification).toBe('conflicting');
    expect(result.severity).toBe('P0');
  });

  it('deprecated package without vulns is classified as stale', () => {
    const result = classifySignal(makeSignal({
      isDeprecated: true,
      lastPublishDate: daysAgo(30),
    }));
    expect(result.classification).toBe('stale');
    expect(result.severity).toBe('P2');
  });

  it('rationale string is non-empty and descriptive', () => {
    const result = classifySignal(makeSignal({ lastPublishDate: daysAgo(400) }));
    expect(result.rationale.length).toBeGreaterThan(10);
    expect(result.rationale).toContain('stale');
  });
});
