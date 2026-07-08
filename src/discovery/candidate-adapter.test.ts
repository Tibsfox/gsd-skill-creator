import { describe, it, expect } from 'vitest';
import { toSkillCandidate, clusterToSkillCandidate } from './candidate-adapter.js';
import type { RankedCandidate } from './pattern-scorer.js';
import type { ClusterCandidate } from './cluster-scorer.js';

const ranked = (over: Partial<RankedCandidate> = {}): RankedCandidate =>
  ({
    patternKey: 'tool:bigram:Read->Edit',
    label: 'Read → Edit',
    type: 'tool-bigram',
    score: 0.82,
    suggestedName: 'read-edit-workflow',
    suggestedDescription: 'Read then edit',
    evidence: {
      projects: ['p1'],
      sessions: ['s1', 's2'],
      totalOccurrences: 12,
      exampleInvocations: [],
      firstSeen: '2026-06-01T00:00:00.000Z',
      lastSeen: '2026-07-01T00:00:00.000Z',
    },
    ...over,
  }) as RankedCandidate;

describe('toSkillCandidate', () => {
  it('maps fields and derives a deterministic id from the pattern key', () => {
    const c = toSkillCandidate(ranked());
    expect(c.id).toBe('disc-tool:bigram:Read->Edit');
    expect(c.type).toBe('workflow'); // bigram → workflow
    expect(c.pattern).toBe('Read → Edit');
    expect(c.occurrences).toBe(12);
    expect(c.confidence).toBe(0.82);
    expect(c.suggestedName).toBe('read-edit-workflow');
    expect(c.evidence.sessionIds).toEqual(['s1', 's2']);
  });

  it('is deterministic — identical input yields the same id (so re-runs dedup)', () => {
    expect(toSkillCandidate(ranked()).id).toBe(toSkillCandidate(ranked()).id);
  });

  it('maps a bash-pattern to type command', () => {
    expect(toSkillCandidate(ranked({ type: 'bash-pattern' })).type).toBe('command');
  });

  it('converts ISO timestamps to epoch millis (0 when unparseable)', () => {
    const c = toSkillCandidate(ranked());
    expect(c.evidence.firstSeen).toBe(Date.parse('2026-06-01T00:00:00.000Z'));
    const bad = toSkillCandidate(
      ranked({ evidence: { ...ranked().evidence, firstSeen: 'not-a-date' } as never }),
    );
    expect(bad.evidence.firstSeen).toBe(0);
  });
});

const cluster = (over: Partial<ClusterCandidate> = {}): ClusterCandidate =>
  ({
    label: 'deploy workflows',
    suggestedName: 'deploy-helper',
    suggestedDescription: 'Helps deploy',
    clusterSize: 5,
    coherence: 0.7,
    score: 0.66,
    scoreBreakdown: {} as never,
    examplePrompts: [],
    evidence: { projects: ['p1'], promptCount: 5, lastSeen: '2026-07-01T00:00:00.000Z' },
    ...over,
  }) as ClusterCandidate;

describe('clusterToSkillCandidate', () => {
  it('maps cluster fields with a cluster-prefixed deterministic id', () => {
    const c = clusterToSkillCandidate(cluster());
    expect(c.id).toBe('disc-cluster-deploy-helper');
    expect(c.type).toBe('workflow');
    expect(c.occurrences).toBe(5);
    expect(c.confidence).toBe(0.66);
    expect(c.evidence.lastSeen).toBe(Date.parse('2026-07-01T00:00:00.000Z'));
    expect(c.evidence.sessionIds).toEqual([]);
  });
});
