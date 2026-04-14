/**
 * Tests for FailureLibrary — learnable failure patterns for skills.
 */

import { describe, it, expect } from 'vitest';
import { FailureLibrary } from '../failure-library.js';
import type { FailurePattern } from '../failure-library.js';

// ─── Helper ─────────────────────────────────────────────────────────────────

function makePattern(name: string, overrides: Partial<Omit<FailurePattern, 'id' | 'occurrenceCount' | 'firstSeen' | 'lastSeen' | 'mitigated'>> = {}) {
  return {
    name,
    category: overrides.category ?? 'tool-misuse' as const,
    severity: overrides.severity ?? 'medium' as const,
    symptom: overrides.symptom ?? 'test symptom',
    rootCause: overrides.rootCause ?? 'test root cause',
    detectionSignals: overrides.detectionSignals ?? ['signal-1'],
    mitigations: overrides.mitigations ?? ['mitigation-1'],
    affectedPhases: overrides.affectedPhases ?? [],
    affectedAgents: overrides.affectedAgents ?? [],
    filePatterns: overrides.filePatterns ?? [],
    keywords: overrides.keywords ?? [],
    blastRadius: overrides.blastRadius ?? 1,
    sourceNodeId: overrides.sourceNodeId,
  };
}

// ─── Recording ──────────────────────────────────────────────────────────────

describe('FailureLibrary recording', () => {
  it('starts empty', () => {
    const lib = new FailureLibrary();
    expect(lib.size).toBe(0);
  });

  it('records a new pattern', () => {
    const lib = new FailureLibrary();
    const id = lib.record(makePattern('Context overflow in executor'));
    expect(id).toBe('FP-1');
    expect(lib.size).toBe(1);
    expect(lib.get(id)?.name).toBe('Context overflow in executor');
    expect(lib.get(id)?.occurrenceCount).toBe(1);
  });

  it('increments occurrence on duplicate name', () => {
    const lib = new FailureLibrary();
    lib.record(makePattern('Loop detected'));
    const id2 = lib.record(makePattern('Loop detected'));
    expect(lib.size).toBe(1); // Still 1 pattern
    expect(lib.get(id2)?.occurrenceCount).toBe(2);
  });

  it('records occurrence by ID', () => {
    const lib = new FailureLibrary();
    const id = lib.record(makePattern('Schema mismatch'));
    lib.recordOccurrence(id);
    lib.recordOccurrence(id);
    expect(lib.get(id)?.occurrenceCount).toBe(3);
  });

  it('marks patterns as mitigated', () => {
    const lib = new FailureLibrary();
    const id = lib.record(makePattern('Bad pattern'));
    expect(lib.get(id)?.mitigated).toBe(false);
    lib.markMitigated(id);
    expect(lib.get(id)?.mitigated).toBe(true);
  });
});

// ─── Retrieval ──────────────────────────────────────────────────────────────

describe('FailureLibrary retrieval', () => {
  function populatedLib(): FailureLibrary {
    const lib = new FailureLibrary();
    lib.record(makePattern('Context overflow', {
      category: 'context-overflow',
      severity: 'critical',
      affectedPhases: ['phase-3', 'phase-5'],
      affectedAgents: ['gsd-executor'],
      keywords: ['context', 'overflow', 'token'],
    }));
    lib.record(makePattern('Schema drift', {
      category: 'schema-violation',
      severity: 'high',
      affectedPhases: ['phase-3'],
      affectedAgents: ['gsd-planner'],
      keywords: ['schema', 'validation', 'drift'],
    }));
    lib.record(makePattern('Stale lock file', {
      category: 'state-corruption',
      severity: 'low',
      affectedPhases: ['phase-1'],
      affectedAgents: ['gsd-executor'],
      filePatterns: ['.lock', 'package-lock.json'],
      keywords: ['lock', 'stale', 'file'],
    }));
    // Record extra occurrences to test frequency sorting
    lib.recordOccurrence('FP-1');
    lib.recordOccurrence('FP-1');
    lib.recordOccurrence('FP-1');
    return lib;
  }

  it('retrieves by category', () => {
    const lib = populatedLib();
    expect(lib.forCategory('context-overflow').length).toBe(1);
    expect(lib.forCategory('schema-violation').length).toBe(1);
    expect(lib.forCategory('timeout').length).toBe(0);
  });

  it('retrieves by agent', () => {
    const lib = populatedLib();
    expect(lib.forAgent('gsd-executor').length).toBe(2);
    expect(lib.forAgent('gsd-planner').length).toBe(1);
  });

  it('retrieves by phase', () => {
    const lib = populatedLib();
    expect(lib.forPhase('phase-3').length).toBe(2);
    expect(lib.forPhase('phase-1').length).toBe(1);
    expect(lib.forPhase('phase-99').length).toBe(0);
  });

  it('returns most frequent first', () => {
    const lib = populatedLib();
    const top = lib.mostFrequent(3);
    expect(top[0].name).toBe('Context overflow');
    expect(top[0].occurrenceCount).toBe(4);
  });

  it('returns unmitigated sorted by severity', () => {
    const lib = populatedLib();
    const unm = lib.unmitigated();
    expect(unm[0].severity).toBe('critical');
    expect(unm[1].severity).toBe('high');
    expect(unm[2].severity).toBe('low');
  });

  it('keyword search works', () => {
    const lib = populatedLib();
    expect(lib.search('overflow').length).toBe(1);
    expect(lib.search('schema').length).toBe(1);
    expect(lib.search('lock').length).toBe(1);
    expect(lib.search('nonexistent').length).toBe(0);
  });
});

// ─── Context matching ───────────────────────────────────────────────────────

describe('FailureLibrary context matching', () => {
  function populatedLib(): FailureLibrary {
    const lib = new FailureLibrary();
    lib.record(makePattern('Context overflow in phase-3', {
      category: 'context-overflow',
      severity: 'critical',
      affectedPhases: ['phase-3'],
      affectedAgents: ['gsd-executor'],
      keywords: ['context', 'overflow', 'token', 'limit'],
      blastRadius: 5,
    }));
    lib.record(makePattern('Schema validation failure', {
      category: 'schema-violation',
      severity: 'high',
      affectedPhases: ['phase-2'],
      affectedAgents: ['gsd-planner'],
      keywords: ['schema', 'validation'],
      blastRadius: 2,
    }));
    // Make first pattern frequent
    for (let i = 0; i < 5; i++) lib.recordOccurrence('FP-1');
    return lib;
  }

  it('matches by phase', () => {
    const lib = populatedLib();
    const matches = lib.matchContext({ phase: 'phase-3' });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].pattern.name).toBe('Context overflow in phase-3');
    expect(matches[0].matchReasons).toContain('affects phase "phase-3"');
  });

  it('matches by agent', () => {
    const lib = populatedLib();
    const matches = lib.matchContext({ agent: 'gsd-executor' });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].pattern.affectedAgents).toContain('gsd-executor');
  });

  it('matches by keywords', () => {
    const lib = populatedLib();
    const matches = lib.matchContext({ keywords: ['token', 'limit'] });
    expect(matches.length).toBeGreaterThan(0);
  });

  it('combined context scores higher', () => {
    const lib = populatedLib();
    const phaseOnly = lib.matchContext({ phase: 'phase-3' });
    const combined = lib.matchContext({ phase: 'phase-3', agent: 'gsd-executor' });
    expect(combined[0].relevance).toBeGreaterThan(phaseOnly[0].relevance);
  });

  it('returns empty for no-match context at strict threshold', () => {
    const lib = populatedLib();
    // Use strict threshold — frequency/severity boosts alone shouldn't match
    const matches = lib.matchContext({ phase: 'phase-99', agent: 'unknown' }, 0.3);
    expect(matches.length).toBe(0);
  });

  it('respects minRelevance threshold', () => {
    const lib = populatedLib();
    const loose = lib.matchContext({ phase: 'phase-3' }, 0.1);
    const strict = lib.matchContext({ phase: 'phase-3' }, 0.5);
    expect(loose.length).toBeGreaterThanOrEqual(strict.length);
  });
});

// ─── Serialization ──────────────────────────────────────────────────────────

describe('FailureLibrary serialization', () => {
  it('round-trips through export/import', () => {
    const lib1 = new FailureLibrary();
    lib1.record(makePattern('Pattern A', { category: 'timeout' }));
    lib1.record(makePattern('Pattern B', { category: 'loop-detected' }));

    const exported = lib1.export();
    expect(exported.length).toBe(2);

    const lib2 = new FailureLibrary();
    lib2.import(exported);
    expect(lib2.size).toBe(2);
    expect(lib2.forCategory('timeout').length).toBe(1);
    expect(lib2.forCategory('loop-detected').length).toBe(1);
  });
});

// ─── Statistics ─────────────────────────────────────────────────────────────

describe('FailureLibrary statistics', () => {
  it('computes correct stats', () => {
    const lib = new FailureLibrary();
    lib.record(makePattern('A', { category: 'timeout', severity: 'critical', blastRadius: 3 }));
    lib.record(makePattern('B', { category: 'timeout', severity: 'high', blastRadius: 1 }));
    lib.record(makePattern('C', { category: 'loop-detected', severity: 'low', blastRadius: 2 }));
    lib.markMitigated('FP-1');

    const s = lib.stats();
    expect(s.totalPatterns).toBe(3);
    expect(s.byCategory['timeout']).toBe(2);
    expect(s.byCategory['loop-detected']).toBe(1);
    expect(s.bySeverity['critical']).toBe(1);
    expect(s.mitigated).toBe(1);
    expect(s.unmitigated).toBe(2);
    expect(s.totalOccurrences).toBe(3);
    expect(s.avgBlastRadius).toBe(2);
  });
});
