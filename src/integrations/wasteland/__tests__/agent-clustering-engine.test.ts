/**
 * Tests for Agent Clustering Engine — distance metrics, core distances, clustering.
 */

import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  distanceMatrix,
  coreDistances,
  mutualReachabilityDistance,
} from '../agent-clustering-engine.js';
import type { CapabilityVector } from '../types.js';

function makeVec(dims: Record<string, number>): CapabilityVector {
  return { agentId: 'a', dimensions: dims, magnitude: 1, lastUpdated: '', totalTasks: 10, successRate: 0.8 };
}

describe('euclideanDistance', () => {
  it('returns 0 for identical vectors', () => {
    expect(euclideanDistance({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(0);
  });

  it('computes correct distance', () => {
    expect(euclideanDistance({ a: 0 }, { a: 3 })).toBe(3);
    expect(euclideanDistance({ a: 3, b: 4 }, { a: 0, b: 0 })).toBe(5);
  });

  it('handles different key sets', () => {
    // {a:1} vs {b:1} → sqrt(1+1) = sqrt(2)
    expect(euclideanDistance({ a: 1 }, { b: 1 })).toBeCloseTo(Math.SQRT2);
  });
});

describe('distanceMatrix', () => {
  it('builds symmetric matrix', () => {
    const vecs = [makeVec({ x: 0 }), makeVec({ x: 1 }), makeVec({ x: 3 })];
    const matrix = distanceMatrix(vecs);
    expect(matrix).toHaveLength(3);
    expect(matrix[0][1]).toBeCloseTo(1);
    expect(matrix[1][0]).toBeCloseTo(1);
    expect(matrix[0][2]).toBeCloseTo(3);
    expect(matrix[0][0]).toBe(0);
  });

  it('returns empty for no vectors', () => {
    expect(distanceMatrix([])).toEqual([]);
  });
});

describe('coreDistances', () => {
  it('returns k-th nearest neighbor distance', () => {
    // 3 points: 0, 1, 3 → for k=1, core distances are: 1, 1, 2
    const matrix = [[0, 1, 3], [1, 0, 2], [3, 2, 0]];
    const cores = coreDistances(matrix, 1);
    expect(cores[0]).toBe(1); // nearest to 0 is 1 (dist=1)
    expect(cores[1]).toBe(1); // nearest to 1 is 0 (dist=1)
    expect(cores[2]).toBe(2); // nearest to 3 is 1 (dist=2)
  });

  it('returns Infinity when not enough neighbors', () => {
    const matrix = [[0, 1], [1, 0]];
    const cores = coreDistances(matrix, 5); // only 1 neighbor available
    expect(cores[0]).toBe(Infinity);
  });
});

describe('mutualReachabilityDistance', () => {
  it('computes max of core distances and pairwise distance', () => {
    const distances = [[0, 1, 5], [1, 0, 3], [5, 3, 0]];
    const cores = [1, 1, 3]; // k=1 core distances
    const mrd = mutualReachabilityDistance(distances, cores);

    // mrd(0,1) = max(core[0]=1, core[1]=1, dist=1) = 1
    expect(mrd[0][1]).toBe(1);
    // mrd(0,2) = max(core[0]=1, core[2]=3, dist=5) = 5
    expect(mrd[0][2]).toBe(5);
    // mrd(1,2) = max(core[1]=1, core[2]=3, dist=3) = 3
    expect(mrd[1][2]).toBe(3);
  });
});
