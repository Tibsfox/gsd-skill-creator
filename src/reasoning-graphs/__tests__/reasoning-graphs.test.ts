/**
 * Reasoning Graphs tests — Phase 715 (v1.49.570).
 *
 * Validates buildJudgmentHistory, traverseEvidence, modalJudgment, and
 * hasJudgmentFlipped across realistic multi-run evidence-graph scenarios.
 *
 * Covers: CONV-20, CONV-21.
 */

import { describe, it, expect } from 'vitest';
import {
  buildJudgmentHistory,
  traverseEvidence,
  modalJudgment,
  hasJudgmentFlipped,
  ALL_JUDGMENTS,
} from '../index.js';
import type { EvidenceNode, ReasoningEdge } from '../index.js';

function e(
  from: string,
  to: string,
  judgment: 'supports' | 'refutes' | 'ambiguous' | 'irrelevant',
  confidence: number,
  runId: string,
  timestamp: string,
): ReasoningEdge {
  return {
    id: `${runId}-${from}-${to}`,
    fromEvidence: from,
    toEvidence: to,
    judgment,
    confidence,
    runId,
    timestamp,
  };
}

function n(id: string): EvidenceNode {
  return {
    id,
    label: id,
    tags: [],
    firstSeen: '2026-04-20T00:00:00.000Z',
    lastSeen: '2026-04-23T00:00:00.000Z',
  };
}

describe('reasoning-graphs: ALL_JUDGMENTS', () => {
  it('enumerates the four judgment labels', () => {
    expect(ALL_JUDGMENTS).toEqual(['supports', 'refutes', 'ambiguous', 'irrelevant']);
  });
});

describe('reasoning-graphs: buildJudgmentHistory', () => {
  it('returns zero history for evidence with no edges', () => {
    const h = buildJudgmentHistory({ evidenceId: 'x', edges: [] });
    expect(h.edges).toHaveLength(0);
    expect(h.averageConfidence).toBe(0);
    expect(h.judgmentDrift).toBe(0);
    expect(h.firstJudgment).toBeNull();
    expect(h.lastJudgment).toBeNull();
  });

  it('filters edges to the target evidence', () => {
    const edges = [
      e('a', 'target', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 'target', 'supports', 0.7, 'r2', '2026-04-21T00:00:00.000Z'),
      e('c', 'other', 'refutes', 0.9, 'r3', '2026-04-22T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 'target', edges });
    expect(h.edges).toHaveLength(2);
    expect(h.byJudgment.supports).toBe(2);
    expect(h.byJudgment.refutes).toBe(0);
  });

  it('computes average confidence across matching edges', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'supports', 0.6, 'r2', '2026-04-21T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(h.averageConfidence).toBeCloseTo(0.7);
  });

  it('computes judgmentDrift = 0 when all edges agree', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'supports', 0.7, 'r2', '2026-04-21T00:00:00.000Z'),
      e('c', 't', 'supports', 0.9, 'r3', '2026-04-22T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(h.judgmentDrift).toBe(0);
  });

  it('computes judgmentDrift > 0 when edges disagree', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'refutes', 0.7, 'r2', '2026-04-21T00:00:00.000Z'),
      e('c', 't', 'refutes', 0.9, 'r3', '2026-04-22T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    // modal = refutes (2/3); drift = 1 - 2/3 = 1/3
    expect(h.judgmentDrift).toBeCloseTo(1 / 3, 3);
  });

  it('tracks first and last judgment timestamps', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'supports', 0.7, 'r2', '2026-04-22T00:00:00.000Z'),
      e('c', 't', 'supports', 0.9, 'r3', '2026-04-21T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(h.firstJudgment).toBe('2026-04-20T00:00:00.000Z');
    expect(h.lastJudgment).toBe('2026-04-22T00:00:00.000Z');
  });
});

describe('reasoning-graphs: traverseEvidence', () => {
  it('returns just the root when no outgoing edges match', () => {
    const r = traverseEvidence('root', [n('root')], []);
    expect(r.visited).toEqual(['root']);
    expect(r.edgesTraversed).toHaveLength(0);
  });

  it('follows edges exceeding confidence threshold', () => {
    const nodes = [n('a'), n('b'), n('c')];
    const edges = [
      e('a', 'b', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 'c', 'supports', 0.7, 'r2', '2026-04-21T00:00:00.000Z'),
    ];
    const r = traverseEvidence('a', nodes, edges, { minConfidence: 0.5 });
    expect(r.visited.sort()).toEqual(['a', 'b', 'c']);
    expect(r.edgesTraversed).toHaveLength(2);
  });

  it('respects maxDepth', () => {
    const nodes = [n('a'), n('b'), n('c'), n('d')];
    const edges = [
      e('a', 'b', 'supports', 0.9, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 'c', 'supports', 0.9, 'r2', '2026-04-21T00:00:00.000Z'),
      e('c', 'd', 'supports', 0.9, 'r3', '2026-04-22T00:00:00.000Z'),
    ];
    const r = traverseEvidence('a', nodes, edges, { maxDepth: 1 });
    expect(r.visited).toContain('a');
    expect(r.visited).toContain('b');
    expect(r.visited).not.toContain('d');
  });

  it('skips edges below the confidence threshold', () => {
    const nodes = [n('a'), n('b')];
    const edges = [e('a', 'b', 'supports', 0.3, 'r1', '2026-04-20T00:00:00.000Z')];
    const r = traverseEvidence('a', nodes, edges, { minConfidence: 0.5 });
    expect(r.visited).toEqual(['a']);
  });

  it('prevents cycles via visited tracking', () => {
    const nodes = [n('a'), n('b')];
    const edges = [
      e('a', 'b', 'supports', 0.9, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 'a', 'refutes', 0.9, 'r2', '2026-04-21T00:00:00.000Z'),
    ];
    const r = traverseEvidence('a', nodes, edges, { maxDepth: 5 });
    expect(r.visited.sort()).toEqual(['a', 'b']);
  });

  it('computes aggregateConfidence as mean of traversed edges', () => {
    const nodes = [n('a'), n('b'), n('c')];
    const edges = [
      e('a', 'b', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('a', 'c', 'supports', 0.6, 'r2', '2026-04-20T00:00:00.000Z'),
    ];
    const r = traverseEvidence('a', nodes, edges);
    expect(r.aggregateConfidence).toBeCloseTo(0.7);
  });
});

describe('reasoning-graphs: modalJudgment', () => {
  it('returns the most-common judgment', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'refutes', 0.7, 'r2', '2026-04-21T00:00:00.000Z'),
      e('c', 't', 'supports', 0.9, 'r3', '2026-04-22T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(modalJudgment(h)).toBe('supports');
  });

  it('returns null when history is empty', () => {
    const h = buildJudgmentHistory({ evidenceId: 't', edges: [] });
    expect(modalJudgment(h)).toBeNull();
  });
});

describe('reasoning-graphs: hasJudgmentFlipped', () => {
  it('returns false for histories with < 2 edges', () => {
    const h = buildJudgmentHistory({ evidenceId: 't', edges: [] });
    expect(hasJudgmentFlipped(h)).toBe(false);
  });

  it('returns false when first and last edges share a judgment', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'refutes', 0.7, 'r2', '2026-04-21T00:00:00.000Z'),
      e('c', 't', 'supports', 0.9, 'r3', '2026-04-22T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(hasJudgmentFlipped(h)).toBe(false);
  });

  it('returns true when first and last edges disagree', () => {
    const edges = [
      e('a', 't', 'supports', 0.8, 'r1', '2026-04-20T00:00:00.000Z'),
      e('b', 't', 'refutes', 0.9, 'r2', '2026-04-22T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(hasJudgmentFlipped(h)).toBe(true);
  });

  it('sorts by timestamp independent of edge insertion order', () => {
    const edges = [
      e('late', 't', 'refutes', 0.9, 'r1', '2026-04-22T00:00:00.000Z'),
      e('early', 't', 'supports', 0.8, 'r2', '2026-04-20T00:00:00.000Z'),
    ];
    const h = buildJudgmentHistory({ evidenceId: 't', edges });
    expect(hasJudgmentFlipped(h)).toBe(true);
  });
});
