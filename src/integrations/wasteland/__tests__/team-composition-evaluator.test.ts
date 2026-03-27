/**
 * Tests for Team Composition Evaluator — coverage, redundancy, gap detection, scoring.
 */

import { describe, it, expect } from 'vitest';
import {
  vectorUnion,
  coverageScore,
  redundancyScore,
  detectGaps,
  scoreTeam,
  suggestTeams,
} from '../team-composition-evaluator.js';
import type { CapabilityVector, ClusterResult } from '../types.js';

function makeVec(agentId: string, dims: Record<string, number>, totalTasks = 50): CapabilityVector {
  return { agentId, dimensions: dims, magnitude: 1, lastUpdated: '', totalTasks, successRate: 0.8 };
}

describe('vectorUnion', () => {
  it('takes max across vectors per dimension', () => {
    const union = vectorUnion([makeVec('a', { build: 0.3, test: 0.9 }), makeVec('b', { build: 0.8, deploy: 0.5 })]);
    expect(union.build).toBe(0.8);
    expect(union.test).toBe(0.9);
    expect(union.deploy).toBe(0.5);
  });

  it('returns empty for no vectors', () => {
    expect(vectorUnion([])).toEqual({});
  });
});

describe('coverageScore', () => {
  it('returns 1 for perfect coverage', () => {
    expect(coverageScore({ a: 1, b: 1 }, { a: 1, b: 1 })).toBe(1);
  });

  it('returns partial for partial coverage', () => {
    expect(coverageScore({ a: 0.5 }, { a: 1 })).toBe(0.5);
  });

  it('returns 1 for empty requirements', () => {
    expect(coverageScore({ a: 1 }, {})).toBe(1);
  });

  it('returns 0 when no dimensions match', () => {
    expect(coverageScore({}, { a: 1 })).toBe(0);
  });
});

describe('redundancyScore', () => {
  it('returns 0 for single member', () => {
    expect(redundancyScore([makeVec('a', { x: 1 })])).toBe(0);
  });

  it('returns high for identical vectors', () => {
    const v = makeVec('a', { x: 0.5, y: 0.5 });
    const v2 = makeVec('b', { x: 0.5, y: 0.5 });
    expect(redundancyScore([v, v2])).toBeCloseTo(1.0);
  });

  it('returns low for orthogonal vectors', () => {
    expect(redundancyScore([makeVec('a', { x: 1 }), makeVec('b', { y: 1 })])).toBeCloseTo(0);
  });
});

describe('detectGaps', () => {
  it('detects uncovered requirements', () => {
    expect(detectGaps({ a: 0.9 }, { a: 1, b: 1 })).toEqual(['b']);
  });

  it('returns empty when all covered', () => {
    expect(detectGaps({ a: 0.5, b: 0.5 }, { a: 1, b: 1 })).toEqual([]);
  });
});

describe('scoreTeam', () => {
  it('returns score with all components', () => {
    const score = scoreTeam('t1', [makeVec('a', { build: 0.9 }), makeVec('b', { test: 0.8 })], { build: 1, test: 1 });
    expect(score.teamId).toBe('t1');
    expect(score.coverageScore).toBeGreaterThan(0);
    expect(score.overallScore).toBeGreaterThan(0);
    expect(score.members).toEqual(['a', 'b']);
  });

  it('confidence scales with task count', () => {
    const low = scoreTeam('t1', [makeVec('a', { x: 1 }, 2)], { x: 1 });
    const high = scoreTeam('t2', [makeVec('b', { x: 1 }, 50)], { x: 1 });
    expect(high.confidence).toBeGreaterThan(low.confidence);
  });
});

describe('suggestTeams', () => {
  it('suggests multiple team strategies', () => {
    const vectors = new Map([
      ['a', makeVec('a', { build: 0.9, test: 0.1 })],
      ['b', makeVec('b', { build: 0.1, test: 0.9 })],
    ]);
    const clusters: ClusterResult[] = [
      { id: 'c1', archetype: 'builder', size: 1, members: ['a'], centroid: { build: 0.9 } },
      { id: 'c2', archetype: 'tester', size: 1, members: ['b'], centroid: { test: 0.9 } },
    ];
    const teams = suggestTeams(clusters, vectors, { build: 1, test: 1 });
    expect(teams.length).toBeGreaterThanOrEqual(1);
    expect(teams[0].overallScore).toBeGreaterThan(0);
  });

  it('returns empty for no vectors', () => {
    expect(suggestTeams([], new Map(), { x: 1 })).toEqual([]);
  });
});
