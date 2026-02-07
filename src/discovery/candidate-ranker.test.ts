/**
 * TDD tests for candidate ranking, evidence assembly, and deduplication.
 *
 * Tests rankCandidates (sorting, capping, description generation),
 * assembleEvidence (projects, sessions, timestamps, invocations), and
 * deduplicateAgainstExisting (name match, keyword overlap, minimum-results).
 */

import { describe, it, expect } from 'vitest';
import {
  rankCandidates,
  assembleEvidence,
  deduplicateAgainstExisting,
} from './candidate-ranker.js';
import type { ExistingSkill } from './candidate-ranker.js';
import type { PatternOccurrence } from './pattern-aggregator.js';

// ============================================================================
// Helpers
// ============================================================================

function makeOccurrence(overrides: Partial<PatternOccurrence> = {}): PatternOccurrence {
  const sessionIds = overrides.sessionIds ?? new Set(['s1', 's2', 's3']);
  const projectSlugs = overrides.projectSlugs ?? new Set(['p1', 'p2']);
  const perSessionCounts = overrides.perSessionCounts ?? new Map([
    ['s1', 3], ['s2', 2], ['s3', 1],
  ]);

  return {
    totalCount: overrides.totalCount ?? 6,
    sessionCount: overrides.sessionCount ?? 3,
    projectCount: overrides.projectCount ?? 2,
    sessionIds,
    projectSlugs,
    perSessionCounts,
  };
}

function makeTimestamps(entries: Array<[string, number]>): Map<string, number> {
  return new Map(entries);
}

// ============================================================================
// assembleEvidence
// ============================================================================

describe('assembleEvidence', () => {
  const now = Date.now();

  it('extracts projects from PatternOccurrence.projectSlugs sorted alphabetically', () => {
    const occ = makeOccurrence({
      projectSlugs: new Set(['zeta', 'alpha', 'mango']),
    });
    const timestamps = makeTimestamps([['s1', now]]);

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.projects).toEqual(['alpha', 'mango', 'zeta']);
  });

  it('extracts sessions sorted by timestamp descending (most recent first)', () => {
    const occ = makeOccurrence({
      sessionIds: new Set(['s1', 's2', 's3']),
    });
    const timestamps = makeTimestamps([
      ['s1', now - 3000],
      ['s2', now - 1000],  // most recent
      ['s3', now - 2000],
    ]);

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.sessions).toEqual(['s2', 's3', 's1']);
  });

  it('caps sessions at 10', () => {
    const ids = Array.from({ length: 15 }, (_, i) => `s${i}`);
    const occ = makeOccurrence({
      sessionIds: new Set(ids),
      sessionCount: 15,
    });
    const timestamps = makeTimestamps(ids.map((id, i) => [id, now - i * 1000]));

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.sessions).toHaveLength(10);
  });

  it('sets totalOccurrences from totalCount', () => {
    const occ = makeOccurrence({ totalCount: 42 });
    const timestamps = makeTimestamps([['s1', now]]);

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.totalOccurrences).toBe(42);
  });

  it('generates exampleInvocations for tool:bigram key', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([['s1', now]]);

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.exampleInvocations).toEqual(['Read -> Edit']);
  });

  it('generates exampleInvocations for tool:trigram key', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([['s1', now]]);

    const evidence = assembleEvidence('tool:trigram:Glob->Read->Edit', occ, timestamps);
    expect(evidence.exampleInvocations).toEqual(['Glob -> Read -> Edit']);
  });

  it('generates exampleInvocations for bash key', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([['s1', now]]);

    const evidence = assembleEvidence('bash:git-workflow', occ, timestamps);
    expect(evidence.exampleInvocations).toEqual(['git-workflow']);
  });

  it('computes lastSeen and firstSeen as ISO strings from session timestamps', () => {
    const t1 = new Date('2026-01-01T00:00:00Z').getTime();
    const t2 = new Date('2026-01-15T00:00:00Z').getTime();
    const t3 = new Date('2026-01-10T00:00:00Z').getTime();
    const occ = makeOccurrence({
      sessionIds: new Set(['s1', 's2', 's3']),
    });
    const timestamps = makeTimestamps([['s1', t1], ['s2', t2], ['s3', t3]]);

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.lastSeen).toBe(new Date(t2).toISOString());
    expect(evidence.firstSeen).toBe(new Date(t1).toISOString());
  });

  it('handles missing timestamps gracefully', () => {
    const occ = makeOccurrence({
      sessionIds: new Set(['s1', 's2']),
    });
    const timestamps = makeTimestamps([]); // no timestamps

    const evidence = assembleEvidence('tool:bigram:Read->Edit', occ, timestamps);
    expect(evidence.lastSeen).toBe('');
    expect(evidence.firstSeen).toBe('');
  });
});

// ============================================================================
// deduplicateAgainstExisting
// ============================================================================

describe('deduplicateAgainstExisting', () => {
  function makeCandidate(name: string, description: string) {
    return {
      patternKey: `tool:bigram:${name}`,
      label: `${name} workflow`,
      type: 'tool-bigram' as const,
      score: 0.8,
      scoreBreakdown: { frequency: 0.3, crossProject: 0.2, recency: 0.2, consistency: 0.1 },
      evidence: {
        projects: ['p1'],
        sessions: ['s1'],
        totalOccurrences: 5,
        exampleInvocations: ['example'],
        lastSeen: '2026-01-15T00:00:00.000Z',
        firstSeen: '2026-01-01T00:00:00.000Z',
      },
      suggestedName: name,
      suggestedDescription: description,
    };
  }

  it('filters candidate with exact name match', () => {
    const candidates = [
      makeCandidate('read-edit-workflow', 'Guides Read -> Edit workflow.'),
      makeCandidate('glob-read-workflow', 'Guides Glob -> Read workflow.'),
    ];
    const existingSkills: ExistingSkill[] = [
      { name: 'read-edit-workflow', description: 'An existing skill for reading and editing.' },
    ];

    const { filtered, removed } = deduplicateAgainstExisting(candidates, existingSkills, 0.5);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].suggestedName).toBe('glob-read-workflow');
    expect(removed).toHaveLength(1);
    expect(removed[0].suggestedName).toBe('read-edit-workflow');
    expect(removed[0].matchedExistingSkill).toBe('read-edit-workflow');
  });

  it('filters candidate with keyword overlap above threshold', () => {
    const candidates = [
      makeCandidate('my-skill', 'Guides reading files and editing code in projects'),
      makeCandidate('unrelated-skill', 'Guides running tests and building packages'),
    ];
    const existingSkills: ExistingSkill[] = [
      { name: 'different-name', description: 'Guides reading files and editing code in projects' },
    ];

    const { filtered, removed } = deduplicateAgainstExisting(candidates, existingSkills, 0.5);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].suggestedName).toBe('unrelated-skill');
    expect(removed).toHaveLength(1);
    expect(removed[0].suggestedName).toBe('my-skill');
  });

  it('does NOT filter candidate with keyword overlap below threshold', () => {
    const candidates = [
      makeCandidate('my-skill', 'Guides reading files'),
    ];
    const existingSkills: ExistingSkill[] = [
      { name: 'other-skill', description: 'Running tests and building packages' },
    ];

    const { filtered } = deduplicateAgainstExisting(candidates, existingSkills, 0.5);
    expect(filtered).toHaveLength(1);
  });

  it('does not filter when no existing skills provided', () => {
    const candidates = [
      makeCandidate('my-skill', 'Some description'),
    ];

    const { filtered, removed } = deduplicateAgainstExisting(candidates, [], 0.5);
    expect(filtered).toHaveLength(1);
    expect(removed).toHaveLength(0);
  });

  it('returns all candidates with annotation if ALL would be deduplicated (minimum-results guarantee)', () => {
    const candidates = [
      makeCandidate('skill-a', 'Guides reading and editing files'),
      makeCandidate('skill-b', 'Guides reading and editing code'),
    ];
    const existingSkills: ExistingSkill[] = [
      { name: 'skill-a', description: 'reading and editing' },
      { name: 'skill-b', description: 'reading and editing' },
    ];

    const { filtered, removed } = deduplicateAgainstExisting(candidates, existingSkills, 0.5);
    // All candidates returned as filtered (not empty) when all would be removed
    expect(filtered).toHaveLength(2);
    expect(removed).toHaveLength(0);
  });
});

// ============================================================================
// rankCandidates
// ============================================================================

describe('rankCandidates', () => {
  const now = Date.now();

  it('returns candidates sorted by score descending', () => {
    const patterns = new Map<string, PatternOccurrence>();

    // Low-scoring: 1 project, 1 session, old
    patterns.set('tool:bigram:Read->Edit', makeOccurrence({
      totalCount: 2,
      sessionCount: 1,
      projectCount: 1,
      sessionIds: new Set(['s1']),
      projectSlugs: new Set(['p1']),
      perSessionCounts: new Map([['s1', 2]]),
    }));

    // High-scoring: many projects, sessions, recent
    patterns.set('tool:bigram:Glob->Read', makeOccurrence({
      totalCount: 50,
      sessionCount: 8,
      projectCount: 6,
      sessionIds: new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']),
      projectSlugs: new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']),
      perSessionCounts: new Map([['s1', 10], ['s2', 8], ['s3', 7], ['s4', 6], ['s5', 5], ['s6', 5], ['s7', 5], ['s8', 4]]),
    }));

    const timestamps = makeTimestamps([
      ['s1', now - 86400000],  // 1 day ago
      ['s2', now - 2 * 86400000],
      ['s3', now - 3 * 86400000],
      ['s4', now - 5 * 86400000],
      ['s5', now - 7 * 86400000],
      ['s6', now - 10 * 86400000],
      ['s7', now - 14 * 86400000],
      ['s8', now - 20 * 86400000],
    ]);

    const result = rankCandidates(patterns, 10, 20, timestamps, { now });
    expect(result.length).toBe(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[0].patternKey).toBe('tool:bigram:Glob->Read');
  });

  it('applies default maxCandidates of 20', () => {
    const patterns = new Map<string, PatternOccurrence>();
    // Generate 25 patterns
    for (let i = 0; i < 25; i++) {
      patterns.set(`tool:bigram:Tool${i}->Edit`, makeOccurrence({
        totalCount: 25 - i,
        sessionCount: 1,
        projectCount: 1,
        sessionIds: new Set([`s${i}`]),
        projectSlugs: new Set(['p1']),
        perSessionCounts: new Map([[`s${i}`, 25 - i]]),
      }));
    }
    const timestamps = makeTimestamps(
      Array.from({ length: 25 }, (_, i) => [`s${i}`, now - i * 86400000] as [string, number]),
    );

    const result = rankCandidates(patterns, 10, 100, timestamps, { now });
    expect(result.length).toBe(20);
  });

  it('respects custom maxCandidates', () => {
    const patterns = new Map<string, PatternOccurrence>();
    for (let i = 0; i < 10; i++) {
      patterns.set(`tool:bigram:Tool${i}->Edit`, makeOccurrence({
        totalCount: 10 - i,
        sessionCount: 1,
        projectCount: 1,
        sessionIds: new Set([`s${i}`]),
        projectSlugs: new Set(['p1']),
        perSessionCounts: new Map([[`s${i}`, 10 - i]]),
      }));
    }
    const timestamps = makeTimestamps(
      Array.from({ length: 10 }, (_, i) => [`s${i}`, now - i * 86400000] as [string, number]),
    );

    const result = rankCandidates(patterns, 10, 100, timestamps, { maxCandidates: 5, now });
    expect(result.length).toBe(5);
  });

  it('populates evidence on each candidate', () => {
    const patterns = new Map<string, PatternOccurrence>();
    patterns.set('tool:bigram:Read->Edit', makeOccurrence({
      projectSlugs: new Set(['alpha', 'beta']),
      sessionIds: new Set(['s1', 's2']),
    }));
    const timestamps = makeTimestamps([['s1', now - 1000], ['s2', now - 2000]]);

    const result = rankCandidates(patterns, 5, 10, timestamps, { now });
    expect(result[0].evidence.projects).toEqual(['alpha', 'beta']);
    expect(result[0].evidence.sessions.length).toBeGreaterThan(0);
    expect(result[0].evidence.totalOccurrences).toBe(6);
  });

  it('populates suggestedName and suggestedDescription', () => {
    const patterns = new Map<string, PatternOccurrence>();
    patterns.set('tool:bigram:Read->Edit', makeOccurrence());
    const timestamps = makeTimestamps([['s1', now], ['s2', now], ['s3', now]]);

    const result = rankCandidates(patterns, 5, 10, timestamps, { now });
    expect(result[0].suggestedName).toBe('read-edit-workflow');
    expect(result[0].suggestedDescription).toBeTruthy();
  });

  it('suggestedDescription contains activation-triggering phrase "Use when"', () => {
    const patterns = new Map<string, PatternOccurrence>();
    patterns.set('tool:bigram:Read->Edit', makeOccurrence());
    const timestamps = makeTimestamps([['s1', now], ['s2', now], ['s3', now]]);

    const result = rankCandidates(patterns, 5, 10, timestamps, { now });
    expect(result[0].suggestedDescription).toContain('Use when');
  });

  it('generates human-readable label for tool patterns', () => {
    const patterns = new Map<string, PatternOccurrence>();
    patterns.set('tool:bigram:Read->Edit', makeOccurrence());
    const timestamps = makeTimestamps([['s1', now], ['s2', now], ['s3', now]]);

    const result = rankCandidates(patterns, 5, 10, timestamps, { now });
    expect(result[0].label).toBe('Read -> Edit workflow');
  });

  it('generates human-readable label for bash patterns', () => {
    const patterns = new Map<string, PatternOccurrence>();
    patterns.set('bash:git-workflow', makeOccurrence());
    const timestamps = makeTimestamps([['s1', now], ['s2', now], ['s3', now]]);

    const result = rankCandidates(patterns, 5, 10, timestamps, { now });
    expect(result[0].label).toBe('Git-workflow commands');
  });

  it('applies deduplication when existingSkills provided', () => {
    const patterns = new Map<string, PatternOccurrence>();
    patterns.set('tool:bigram:Read->Edit', makeOccurrence({
      totalCount: 50,
      sessionCount: 5,
      projectCount: 4,
      sessionIds: new Set(['s1', 's2', 's3', 's4', 's5']),
      projectSlugs: new Set(['p1', 'p2', 'p3', 'p4']),
    }));
    patterns.set('tool:bigram:Glob->Read', makeOccurrence({
      totalCount: 30,
      sessionCount: 3,
      projectCount: 2,
      sessionIds: new Set(['s1', 's2', 's3']),
      projectSlugs: new Set(['p1', 'p2']),
    }));
    const timestamps = makeTimestamps([
      ['s1', now], ['s2', now], ['s3', now], ['s4', now], ['s5', now],
    ]);

    const existingSkills: ExistingSkill[] = [
      { name: 'read-edit-workflow', description: 'Reading and editing files' },
    ];

    const result = rankCandidates(patterns, 10, 20, timestamps, { existingSkills, now });
    // read-edit-workflow should be filtered
    expect(result.every(c => c.suggestedName !== 'read-edit-workflow')).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].suggestedName).toBe('glob-read-workflow');
  });

  it('returns empty array for empty pattern map', () => {
    const patterns = new Map<string, PatternOccurrence>();
    const timestamps = makeTimestamps([]);

    const result = rankCandidates(patterns, 0, 0, timestamps, { now });
    expect(result).toEqual([]);
  });
});
