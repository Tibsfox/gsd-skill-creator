/**
 * Tests for Task Sequence Analyzer — n-gram patterns, PrefixSpan, rework detection.
 *
 * Covers:
 * - groupByCaseId: event grouping by task prefix
 * - extractSequences / extractNgrams: sequence extraction
 * - countNgrams: frequency counting with support threshold
 * - prefixSpan: sequential pattern mining
 * - detectRework: repeated task type detection
 * - scorePatterns / analyzeSequences: full pipeline
 */

import { describe, it, expect } from 'vitest';
import {
  groupByCaseId,
  extractSequences,
  extractNgrams,
  countNgrams,
  prefixSpan,
  detectRework,
  scorePatterns,
  analyzeSequences,
} from '../task-sequence-analyzer.js';
import type { ObservationEvent } from '../types.js';

function makeEvent(taskId: string, taskType: string, eventType: string = 'task-completed', ts?: string): ObservationEvent {
  return {
    id: `evt-${taskId}`,
    timestamp: ts ?? '2026-03-27T00:00:00Z',
    eventType: eventType as any,
    agentId: 'agent-1',
    taskId,
    townId: 'town-1',
    metadata: { taskType },
  };
}

// ============================================================================
// groupByCaseId
// ============================================================================

describe('groupByCaseId', () => {
  it('groups by task ID prefix', () => {
    const events = [
      makeEvent('req-01-plan', 'plan', 'task-completed', '2026-03-27T01:00:00Z'),
      makeEvent('req-01-build', 'build', 'task-completed', '2026-03-27T02:00:00Z'),
      makeEvent('req-02-plan', 'plan', 'task-completed', '2026-03-27T03:00:00Z'),
    ];
    const cases = groupByCaseId(events);
    expect(cases.size).toBe(2);
    expect(cases.get('req-01')).toHaveLength(2);
    expect(cases.get('req-02')).toHaveLength(1);
  });

  it('sorts each case by timestamp', () => {
    const events = [
      makeEvent('req-01-build', 'build', 'task-completed', '2026-03-27T02:00:00Z'),
      makeEvent('req-01-plan', 'plan', 'task-completed', '2026-03-27T01:00:00Z'),
    ];
    const cases = groupByCaseId(events);
    const seq = cases.get('req-01')!;
    expect(seq[0].taskId).toBe('req-01-plan');
    expect(seq[1].taskId).toBe('req-01-build');
  });

  it('ignores non-task events', () => {
    const events = [makeEvent('req-01-x', 'x', 'scan-complete')];
    expect(groupByCaseId(events).size).toBe(0);
  });
});

// ============================================================================
// extractNgrams
// ============================================================================

describe('extractNgrams', () => {
  it('extracts bigrams', () => {
    expect(extractNgrams(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['b', 'c']]);
  });

  it('extracts trigrams', () => {
    expect(extractNgrams(['a', 'b', 'c', 'd'], 3)).toEqual([['a', 'b', 'c'], ['b', 'c', 'd']]);
  });

  it('returns empty for sequence shorter than n', () => {
    expect(extractNgrams(['a'], 2)).toEqual([]);
  });
});

// ============================================================================
// countNgrams
// ============================================================================

describe('countNgrams', () => {
  it('counts n-gram support across sequences', () => {
    const sequences = [
      ['plan', 'build', 'test'],
      ['plan', 'build', 'deploy'],
      ['plan', 'build', 'test'],
    ];
    const counts = countNgrams(sequences, 2, 3, 2);
    const planBuild = counts.get('plan -> build');
    expect(planBuild).toBeDefined();
    expect(planBuild!.count).toBe(3);
  });

  it('filters by minimum support', () => {
    const sequences = [['a', 'b', 'c'], ['x', 'y', 'z']];
    const counts = countNgrams(sequences, 2, 3, 2);
    expect(counts.size).toBe(0); // each n-gram appears only once
  });
});

// ============================================================================
// prefixSpan
// ============================================================================

describe('prefixSpan', () => {
  it('finds frequent sequential patterns', () => {
    const sequences = [
      ['plan', 'build', 'test'],
      ['plan', 'build', 'deploy'],
      ['plan', 'review'],
    ];
    const results = prefixSpan(sequences, 2);
    const planPattern = results.find(r => r.pattern.length === 1 && r.pattern[0] === 'plan');
    expect(planPattern).toBeDefined();
    expect(planPattern!.support).toBe(3);
  });

  it('grows patterns recursively', () => {
    const sequences = [
      ['a', 'b', 'c'],
      ['a', 'b', 'c'],
    ];
    const results = prefixSpan(sequences, 2);
    const abc = results.find(r => r.pattern.join(',') === 'a,b,c');
    expect(abc).toBeDefined();
    expect(abc!.support).toBe(2);
  });

  it('returns empty for no frequent patterns', () => {
    expect(prefixSpan([['a'], ['b']], 2)).toEqual([]);
  });
});

// ============================================================================
// detectRework
// ============================================================================

describe('detectRework', () => {
  it('detects repeated task types', () => {
    const result = detectRework(['plan', 'build', 'plan', 'build']);
    expect(result.hasRework).toBe(true);
    expect(result.reworkTypes).toContain('plan');
    expect(result.reworkTypes).toContain('build');
  });

  it('returns false for no rework', () => {
    expect(detectRework(['plan', 'build', 'test']).hasRework).toBe(false);
  });
});

// ============================================================================
// scorePatterns
// ============================================================================

describe('scorePatterns', () => {
  it('scores by frequency * success rate', () => {
    const counts = new Map([
      ['a -> b', { sequence: ['a', 'b'], count: 5 }],
      ['c -> d', { sequence: ['c', 'd'], count: 3 }],
    ]);
    const rates = new Map([['a -> b', 0.8], ['c -> d', 0.9]]);
    const patterns = scorePatterns(counts, rates, 10);

    expect(patterns).toHaveLength(2);
    expect(patterns[0].score).toBe(0.5 * 0.8); // 5/10 * 0.8
  });

  it('marks rework in scored patterns', () => {
    const counts = new Map([
      ['a -> b -> a', { sequence: ['a', 'b', 'a'], count: 2 }],
    ]);
    const patterns = scorePatterns(counts, new Map(), 10);
    expect(patterns[0].reworkDetected).toBe(true);
  });
});

// ============================================================================
// analyzeSequences
// ============================================================================

describe('analyzeSequences', () => {
  it('runs full pipeline and returns top patterns', () => {
    const events = [
      makeEvent('req-01-plan', 'plan', 'task-completed', '2026-03-27T01:00:00Z'),
      makeEvent('req-01-build', 'build', 'task-completed', '2026-03-27T02:00:00Z'),
      makeEvent('req-02-plan', 'plan', 'task-completed', '2026-03-27T03:00:00Z'),
      makeEvent('req-02-build', 'build', 'task-completed', '2026-03-27T04:00:00Z'),
    ];
    const patterns = analyzeSequences(events, { minSupport: 2 });
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].sequence).toContain('plan');
  });

  it('returns empty for no events', () => {
    expect(analyzeSequences([])).toEqual([]);
  });

  it('respects topN limit', () => {
    const events = [
      makeEvent('req-01-a', 'a', 'task-completed', '2026-03-27T01:00:00Z'),
      makeEvent('req-01-b', 'b', 'task-completed', '2026-03-27T02:00:00Z'),
      makeEvent('req-02-a', 'a', 'task-completed', '2026-03-27T03:00:00Z'),
      makeEvent('req-02-b', 'b', 'task-completed', '2026-03-27T04:00:00Z'),
    ];
    const patterns = analyzeSequences(events, { topN: 1 });
    expect(patterns.length).toBeLessThanOrEqual(1);
  });
});
