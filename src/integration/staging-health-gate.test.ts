import { describe, it, expect } from 'vitest';
import { checkHealthGate, StagingHealthGate } from './staging-health-gate.js';
import type { GateCheckInput } from './staging-health-gate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<GateCheckInput> = {}): GateCheckInput {
  return {
    dryRunPassed: true,
    criticalPathPackages: [],
    packageClassifications: {},
    ...overrides,
  };
}

// ─── checkHealthGate ──────────────────────────────────────────────────────────

describe('checkHealthGate', () => {
  it('allows when dryRunPassed=true and no blocking critical deps', () => {
    const result = checkHealthGate(makeInput({
      dryRunPassed: true,
      criticalPathPackages: ['lodash'],
      packageClassifications: { lodash: 'healthy' },
    }));
    expect(result.decision).toBe('allow');
    expect(result.blockingFindings).toHaveLength(0);
  });

  it('blocks when dryRunPassed=false', () => {
    const result = checkHealthGate(makeInput({ dryRunPassed: false }));
    expect(result.decision).toBe('block');
    expect(result.blockingFindings).toHaveLength(1);
  });

  it('blocks when critical-path package is abandoned', () => {
    const result = checkHealthGate(makeInput({
      criticalPathPackages: ['old-pkg'],
      packageClassifications: { 'old-pkg': 'abandoned' },
    }));
    expect(result.decision).toBe('block');
    expect(result.blockingFindings.some(f => f.includes('old-pkg'))).toBe(true);
    expect(result.blockingFindings.some(f => f.includes('abandoned'))).toBe(true);
  });

  it('blocks when critical-path package is vulnerable', () => {
    const result = checkHealthGate(makeInput({
      criticalPathPackages: ['vuln-pkg'],
      packageClassifications: { 'vuln-pkg': 'vulnerable' },
    }));
    expect(result.decision).toBe('block');
    expect(result.blockingFindings.some(f => f.includes('vulnerable'))).toBe(true);
  });

  it('allows when critical-path package is healthy', () => {
    const result = checkHealthGate(makeInput({
      criticalPathPackages: ['express'],
      packageClassifications: { express: 'healthy' },
    }));
    expect(result.decision).toBe('allow');
  });

  it('allows when critical-path package is aging', () => {
    const result = checkHealthGate(makeInput({
      criticalPathPackages: ['aging-pkg'],
      packageClassifications: { 'aging-pkg': 'aging' },
    }));
    expect(result.decision).toBe('allow');
  });

  it('allows when critical-path package is stale', () => {
    const result = checkHealthGate(makeInput({
      criticalPathPackages: ['stale-pkg'],
      packageClassifications: { 'stale-pkg': 'stale' },
    }));
    expect(result.decision).toBe('allow');
  });

  it('blocks with multiple findings when both dry-run fails and abandoned dep present', () => {
    const result = checkHealthGate(makeInput({
      dryRunPassed: false,
      criticalPathPackages: ['dead-pkg'],
      packageClassifications: { 'dead-pkg': 'abandoned' },
    }));
    expect(result.decision).toBe('block');
    expect(result.blockingFindings).toHaveLength(2);
  });

  it('non-critical abandoned package does not trigger block', () => {
    const result = checkHealthGate(makeInput({
      dryRunPassed: true,
      criticalPathPackages: ['safe-pkg'], // 'non-critical-abandoned' NOT in list
      packageClassifications: {
        'safe-pkg': 'healthy',
        'non-critical-abandoned': 'abandoned', // not in critical path
      },
    }));
    expect(result.decision).toBe('allow');
  });

  it('blockingFindings contains descriptive message for dry-run failure', () => {
    const result = checkHealthGate(makeInput({ dryRunPassed: false }));
    expect(result.blockingFindings[0]).toMatch(/dry-run/i);
  });

  it('blockingFindings contains package name for abandoned dep', () => {
    const result = checkHealthGate(makeInput({
      criticalPathPackages: ['my-abandoned-pkg'],
      packageClassifications: { 'my-abandoned-pkg': 'abandoned' },
    }));
    expect(result.blockingFindings[0]).toContain('my-abandoned-pkg');
  });

  it('decision is allow when blockingFindings is empty', () => {
    const result = checkHealthGate(makeInput());
    expect(result.decision).toBe('allow');
    expect(result.blockingFindings).toHaveLength(0);
  });

  it('decision is block when blockingFindings has entries', () => {
    const result = checkHealthGate(makeInput({ dryRunPassed: false }));
    expect(result.decision).toBe('block');
    expect(result.blockingFindings.length).toBeGreaterThan(0);
  });

  it('checkedAt is valid ISO 8601', () => {
    const result = checkHealthGate(makeInput());
    expect(() => new Date(result.checkedAt)).not.toThrow();
    expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt);
  });

  // ─── Class wrapper ──────────────────────────────────────────────────────────

  it('class wrapper delegates to checkHealthGate', () => {
    const gate = new StagingHealthGate();
    const result = gate.check(makeInput({ dryRunPassed: true }));
    expect(result.decision).toBe('allow');
  });
});
