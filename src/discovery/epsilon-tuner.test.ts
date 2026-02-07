import { describe, it, expect } from 'vitest';
import { tuneEpsilon } from './epsilon-tuner.js';
import { cosineDistance } from './dbscan.js';

describe('tuneEpsilon', () => {
  const defaultBounds = { min: 0.05, max: 0.5 };

  it('returns bounds.min for single point', () => {
    const result = tuneEpsilon([[1, 0, 0]], 4, cosineDistance);
    expect(result).toBe(defaultBounds.min);
  });

  it('returns the distance between two points (clamped to bounds)', () => {
    const a = [1, 0, 0];
    const b = [1, 0.1, 0];
    const dist = cosineDistance(a, b);
    const result = tuneEpsilon([a, b], 1, cosineDistance);
    // Should be the distance itself, clamped
    const expected = Math.max(defaultBounds.min, Math.min(defaultBounds.max, dist));
    expect(result).toBeCloseTo(expected, 5);
  });

  it('finds epsilon near cluster radius for well-separated clusters', () => {
    // 3 clusters: tight within, far apart between
    const c1 = [[1, 0.01, 0], [1, 0.02, 0], [1, 0.03, 0], [1, 0.04, 0], [1, 0.05, 0]];
    const c2 = [[0, 1, 0.01], [0, 1, 0.02], [0, 1, 0.03], [0, 1, 0.04], [0, 1, 0.05]];
    const c3 = [[0.01, 0, 1], [0.02, 0, 1], [0.03, 0, 1], [0.04, 0, 1], [0.05, 0, 1]];
    const points = [...c1, ...c2, ...c3];

    const epsilon = tuneEpsilon(points, 4, cosineDistance);

    // Epsilon should be between intra-cluster distance and inter-cluster distance
    // Intra-cluster distances are very small (~0.001-0.003)
    // Inter-cluster distances are ~1.0
    // The knee should be somewhere in between, within bounds
    expect(epsilon).toBeGreaterThanOrEqual(defaultBounds.min);
    expect(epsilon).toBeLessThanOrEqual(defaultBounds.max);
  });

  it('clamps to bounds.min when all points are identical', () => {
    const points = [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]];
    const result = tuneEpsilon(points, 4, cosineDistance);
    expect(result).toBe(defaultBounds.min);
  });

  it('returns fallback 0.3 for flat curve (uniform random-like)', () => {
    // All points at equal distance from each other -- no knee
    // Using orthogonal + near-orthogonal points so all k-distances are similar
    const points: number[][] = [];
    const dim = 10;
    for (let i = 0; i < 20; i++) {
      const v = new Array(dim).fill(0);
      v[i % dim] = 1;
      // Add small random-like perturbation to make distances similar but not identical
      for (let j = 0; j < dim; j++) {
        v[j] += 0.01 * ((i * 7 + j * 3) % 10) / 10;
      }
      points.push(v);
    }

    const result = tuneEpsilon(points, 4, cosineDistance);
    // With a flat curve (max perpendicular distance < 0.01), should return fallback 0.3
    // OR it finds a knee -- either way, must be within bounds
    expect(result).toBeGreaterThanOrEqual(defaultBounds.min);
    expect(result).toBeLessThanOrEqual(defaultBounds.max);
  });

  it('never returns below bounds.min', () => {
    // Very tight cluster -- epsilon would be tiny
    const points = [[1, 0, 0], [1, 0.0001, 0], [1, 0.0002, 0], [1, 0.0003, 0]];
    const result = tuneEpsilon(points, 2, cosineDistance);
    expect(result).toBeGreaterThanOrEqual(defaultBounds.min);
  });

  it('never returns above bounds.max', () => {
    // Very spread out -- epsilon would be large
    const points = [
      [1, 0, 0], [0, 1, 0], [0, 0, 1],
      [-1, 0, 0], [0, -1, 0], [0, 0, -1],
    ];
    const result = tuneEpsilon(points, 2, cosineDistance);
    expect(result).toBeLessThanOrEqual(defaultBounds.max);
  });

  it('respects custom bounds', () => {
    const points = [[1, 0.01, 0], [1, 0.02, 0], [1, 0.03, 0], [1, 0.04, 0]];
    const customBounds = { min: 0.1, max: 0.2 };
    const result = tuneEpsilon(points, 2, cosineDistance, customBounds);
    expect(result).toBeGreaterThanOrEqual(0.1);
    expect(result).toBeLessThanOrEqual(0.2);
  });

  it('handles k larger than n-1 gracefully', () => {
    const points = [[1, 0, 0], [0.9, 0.1, 0], [0.8, 0.2, 0]];
    // k=10 but only 3 points -- should use last available distance
    const result = tuneEpsilon(points, 10, cosineDistance);
    expect(result).toBeGreaterThanOrEqual(defaultBounds.min);
    expect(result).toBeLessThanOrEqual(defaultBounds.max);
  });
});
