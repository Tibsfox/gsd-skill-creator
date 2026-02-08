/**
 * DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 *
 * Clusters points based on density using a custom distance function.
 * Points in dense regions form clusters; isolated points are classified as noise.
 *
 * Performance: O(n^2) regionQuery -- acceptable for prompt corpora of 20-500 points.
 */

import { cosineSimilarity } from '../embeddings/cosine-similarity.js';

/**
 * Result of DBSCAN clustering.
 *
 * - clusters[i] contains indices of points in cluster i
 * - noise contains indices of noise points
 * - Every input index appears exactly once (either in a cluster or in noise)
 */
export interface DbscanResult {
  clusters: number[][];
  noise: number[];
}

/**
 * Cosine distance between two vectors.
 *
 * Wraps cosineSimilarity: distance = 1 - similarity.
 * - 0: identical direction
 * - 1: orthogonal
 * - 2: opposite direction
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

// Label constants
const UNVISITED = -1;
const NOISE = -2;

/**
 * Find all points within epsilon distance of the point at the given index.
 */
function regionQuery(
  points: number[][],
  idx: number,
  epsilon: number,
  distanceFn: (a: number[], b: number[]) => number,
): number[] {
  const neighbors: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (distanceFn(points[idx], points[i]) <= epsilon) {
      neighbors.push(i);
    }
  }
  return neighbors;
}

/**
 * DBSCAN clustering algorithm.
 *
 * @param points - Array of feature vectors to cluster
 * @param epsilon - Maximum distance for two points to be considered neighbors
 * @param minPts - Minimum number of points required to form a dense region (core point)
 * @param distanceFn - Distance function between two points
 * @returns Clustering result with cluster assignments and noise indices
 */
export function dbscan(
  points: number[][],
  epsilon: number,
  minPts: number,
  distanceFn: (a: number[], b: number[]) => number,
): DbscanResult {
  const n = points.length;
  if (n === 0) {
    return { clusters: [], noise: [] };
  }

  // Labels: UNVISITED (-1), NOISE (-2), or cluster ID (>= 0)
  const labels = new Int32Array(n).fill(UNVISITED);
  let clusterId = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) {
      continue;
    }

    const neighbors = regionQuery(points, i, epsilon, distanceFn);

    if (neighbors.length < minPts) {
      labels[i] = NOISE;
      continue;
    }

    // Start a new cluster
    const currentCluster = clusterId;
    clusterId++;
    labels[i] = currentCluster;

    // Seed list: neighbors to expand (excluding the point itself)
    const seeds = neighbors.filter((idx) => idx !== i);
    const seedsSet = new Set(seeds); // O(1) membership checking
    let seedIdx = 0;

    while (seedIdx < seeds.length) {
      const q = seeds[seedIdx];
      seedIdx++;

      // Border point: was marked noise, reassign to this cluster
      if (labels[q] === NOISE) {
        labels[q] = currentCluster;
      }

      // Already processed (assigned to a cluster)
      if (labels[q] !== UNVISITED) {
        continue;
      }

      // Assign to current cluster
      labels[q] = currentCluster;

      // Find q's neighbors
      const qNeighbors = regionQuery(points, q, epsilon, distanceFn);
      if (qNeighbors.length >= minPts) {
        // q is a core point -- add its neighbors to seed list
        for (const neighbor of qNeighbors) {
          if (labels[neighbor] === UNVISITED || labels[neighbor] === NOISE) {
            if (!seedsSet.has(neighbor)) {
              seeds.push(neighbor);
              seedsSet.add(neighbor);
            }
          }
        }
      }
    }
  }

  // Collect results
  const clusterMap = new Map<number, number[]>();
  const noise: number[] = [];

  for (let i = 0; i < n; i++) {
    if (labels[i] === NOISE) {
      noise.push(i);
    } else {
      const cid = labels[i];
      if (!clusterMap.has(cid)) {
        clusterMap.set(cid, []);
      }
      clusterMap.get(cid)!.push(i);
    }
  }

  // Sort cluster IDs for deterministic output
  const clusters: number[][] = [];
  const sortedKeys = [...clusterMap.keys()].sort((a, b) => a - b);
  for (const key of sortedKeys) {
    clusters.push(clusterMap.get(key)!);
  }

  return { clusters, noise };
}
