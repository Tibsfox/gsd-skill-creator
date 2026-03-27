import { describe, it, expect } from 'vitest';
import { dbscan, cosineDistance } from './dbscan.js';
import type { DbscanResult } from './dbscan.js';

describe('cosineDistance', () => {
  it('returns 0 for identical normalized vectors', () => {
    const v = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];
    expect(cosineDistance(v, v)).toBeCloseTo(0, 10);
  });

  it('returns ~2 for opposite vectors', () => {
    const v = [1, 0, 0];
    const neg = [-1, 0, 0];
    expect(cosineDistance(v, neg)).toBeCloseTo(2, 10);
  });

  it('returns ~1 for orthogonal vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineDistance(a, b)).toBeCloseTo(1, 10);
  });

  it('is symmetric', () => {
    const a = [0.5, 0.3, 0.8];
    const b = [0.1, 0.9, 0.2];
    expect(cosineDistance(a, b)).toBeCloseTo(cosineDistance(b, a), 10);
  });
});

describe('dbscan', () => {
  // Helper: generate a tight cluster of n points around a center
  function makeCluster(center: number[], n: number, spread: number): number[][] {
    const points: number[][] = [];
    for (let i = 0; i < n; i++) {
      const point = center.map((c, idx) => c + (i * spread * ((idx + 1) % 3 === 0 ? -1 : 1)) / n);
      points.push(point);
    }
    return points;
  }

  it('returns empty results for empty input', () => {
    const result = dbscan([], 0.3, 3, cosineDistance);
    expect(result.clusters).toEqual([]);
    expect(result.noise).toEqual([]);
  });

  it('marks single point as noise when minPts=2', () => {
    const result = dbscan([[1, 0, 0]], 0.3, 2, cosineDistance);
    expect(result.clusters).toEqual([]);
    expect(result.noise).toEqual([0]);
  });

  it('clusters all identical points into one cluster', () => {
    const point = [0.5, 0.5, 0.5];
    const points = [point, [...point], [...point], [...point]];
    const result = dbscan(points, 0.1, 2, cosineDistance);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0]).toHaveLength(4);
    expect(result.noise).toEqual([]);
  });

  it('marks all far-apart points as noise', () => {
    // Orthogonal unit vectors -- cosine distance ~1 between each pair
    const points = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = dbscan(points, 0.01, 3, cosineDistance);
    expect(result.clusters).toEqual([]);
    expect(result.noise).toHaveLength(3);
  });

  it('finds 3 tight clusters of 4 points each', () => {
    // Three clusters along different axes -- well-separated in cosine space
    const c1 = [[1, 0.01, 0], [1, 0.02, 0], [1, 0.03, 0], [1, 0.04, 0]];
    const c2 = [[0, 1, 0.01], [0, 1, 0.02], [0, 1, 0.03], [0, 1, 0.04]];
    const c3 = [[0.01, 0, 1], [0.02, 0, 1], [0.03, 0, 1], [0.04, 0, 1]];
    const points = [...c1, ...c2, ...c3];

    const result = dbscan(points, 0.3, 3, cosineDistance);
    expect(result.clusters).toHaveLength(3);
    expect(result.noise).toEqual([]);

    // Each cluster should have exactly 4 points
    for (const cluster of result.clusters) {
      expect(cluster).toHaveLength(4);
    }
  });

  it('finds 3 clusters + identifies 2 outliers as noise', () => {
    const c1 = [[1, 0.01, 0], [1, 0.02, 0], [1, 0.03, 0], [1, 0.04, 0]];
    const c2 = [[0, 1, 0.01], [0, 1, 0.02], [0, 1, 0.03], [0, 1, 0.04]];
    const c3 = [[0.01, 0, 1], [0.02, 0, 1], [0.03, 0, 1], [0.04, 0, 1]];
    // Two outliers equidistant from all clusters
    const outliers = [[0.577, 0.577, 0.577], [-0.577, 0.577, -0.577]];
    const points = [...c1, ...c2, ...c3, ...outliers];

    const result = dbscan(points, 0.3, 3, cosineDistance);
    expect(result.clusters).toHaveLength(3);
    expect(result.noise).toHaveLength(2);
    // Outlier indices should be the last two
    expect(result.noise).toContain(12);
    expect(result.noise).toContain(13);
  });

  it('assigns border points to cluster (not noise)', () => {
    // 3 core points very close together + 1 border point slightly further
    const core = [[1, 0, 0], [1, 0.01, 0], [1, 0.02, 0]];
    // Border point: close enough to core but doesn't have minPts neighbors itself
    const border = [[1, 0.15, 0]];
    const points = [...core, ...border];

    const result = dbscan(points, 0.3, 3, cosineDistance);
    // All points should be in one cluster (border included)
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0]).toHaveLength(4);
    expect(result.noise).toEqual([]);
  });

  it('every input index appears exactly once (clusters + noise)', () => {
    const points = [
      [1, 0, 0], [1, 0.01, 0], [1, 0.02, 0],
      [0, 1, 0], [0, 1, 0.01],
      [0.5, 0.5, 0.5],
    ];
    const result = dbscan(points, 0.3, 3, cosineDistance);

    const allIndices = new Set<number>();
    for (const cluster of result.clusters) {
      for (const idx of cluster) {
        expect(allIndices.has(idx)).toBe(false); // no duplicates
        allIndices.add(idx);
      }
    }
    for (const idx of result.noise) {
      expect(allIndices.has(idx)).toBe(false); // no duplicates
      allIndices.add(idx);
    }
    // Every index accounted for
    expect(allIndices.size).toBe(points.length);
    for (let i = 0; i < points.length; i++) {
      expect(allIndices.has(i)).toBe(true);
    }
  });

  it('uses provided distance function (Euclidean)', () => {
    const euclidean = (a: number[], b: number[]): number => {
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
      }
      return Math.sqrt(sum);
    };

    // Two tight Euclidean clusters
    const points = [[0, 0], [0.1, 0], [0, 0.1], [10, 10], [10.1, 10], [10, 10.1]];
    const result = dbscan(points, 0.5, 2, euclidean);
    expect(result.clusters).toHaveLength(2);
    expect(result.noise).toEqual([]);
  });
});
