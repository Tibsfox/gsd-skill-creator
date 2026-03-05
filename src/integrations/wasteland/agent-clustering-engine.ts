/**
 * Agent Clustering Engine — Layer 2, Wave 1
 *
 * HDBSCAN-inspired clustering for agent capability vectors.
 * Detects role archetypes, identifies outlier specialists,
 * tracks drift via Adjusted Rand Index (ARI).
 *
 * Uses a simplified density-based approach suitable for TypeScript
 * without external ML dependencies. Core concepts: mutual reachability
 * distance, minimum spanning tree, cluster stability (persistence).
 */

import type {
  CapabilityVector,
  ClusterResult,
  ClusteringOutput,
} from './types.js';

// ============================================================================
// Distance Metrics
// ============================================================================

/**
 * Euclidean distance between two capability vectors.
 */
export function euclideanDistance(a: Record<string, number>, b: Record<string, number>): number {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sumSquares = 0;
  for (const key of allKeys) {
    const diff = (a[key] ?? 0) - (b[key] ?? 0);
    sumSquares += diff * diff;
  }
  return Math.sqrt(sumSquares);
}

/**
 * Compute pairwise distance matrix for a set of vectors.
 */
export function distanceMatrix(vectors: CapabilityVector[]): number[][] {
  const n = vectors.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDistance(vectors[i].dimensions, vectors[j].dimensions);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

// ============================================================================
// Core Distance (HDBSCAN)
// ============================================================================

/**
 * Compute core distance for each point (distance to k-th nearest neighbor).
 */
export function coreDistances(distances: number[][], minSamples: number): number[] {
  const n = distances.length;
  const cores: number[] = [];
  for (let i = 0; i < n; i++) {
    const sorted = distances[i]
      .map((d, j) => ({ d, j }))
      .filter(x => x.j !== i)
      .sort((a, b) => a.d - b.d);
    cores.push(sorted.length >= minSamples ? sorted[minSamples - 1].d : Infinity);
  }
  return cores;
}

/**
 * Compute mutual reachability distance.
 * mrd(a, b) = max(core_a, core_b, dist(a, b))
 */
export function mutualReachabilityDistance(
  distances: number[][],
  cores: number[],
): number[][] {
  const n = distances.length;
  const mrd: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.max(cores[i], cores[j], distances[i][j]);
      mrd[i][j] = d;
      mrd[j][i] = d;
    }
  }
  return mrd;
}

// ============================================================================
// Minimum Spanning Tree (Prim's)
// ============================================================================

interface MSTPrimEdge {
  from: number;
  to: number;
  weight: number;
}

/**
 * Build MST using Prim's algorithm on the mutual reachability graph.
 */
export function buildMST(mrd: number[][]): MSTPrimEdge[] {
  const n = mrd.length;
  if (n === 0) return [];

  const inMST = new Array(n).fill(false);
  const minEdge = new Array(n).fill(Infinity);
  const minFrom = new Array(n).fill(-1);
  const edges: MSTPrimEdge[] = [];

  inMST[0] = true;
  for (let j = 1; j < n; j++) {
    minEdge[j] = mrd[0][j];
    minFrom[j] = 0;
  }

  for (let iter = 0; iter < n - 1; iter++) {
    let bestIdx = -1;
    let bestWeight = Infinity;
    for (let j = 0; j < n; j++) {
      if (!inMST[j] && minEdge[j] < bestWeight) {
        bestWeight = minEdge[j];
        bestIdx = j;
      }
    }
    if (bestIdx === -1) break;

    inMST[bestIdx] = true;
    edges.push({ from: minFrom[bestIdx], to: bestIdx, weight: bestWeight });

    for (let j = 0; j < n; j++) {
      if (!inMST[j] && mrd[bestIdx][j] < minEdge[j]) {
        minEdge[j] = mrd[bestIdx][j];
        minFrom[j] = bestIdx;
      }
    }
  }

  return edges;
}

// ============================================================================
// HDBSCAN Clustering
// ============================================================================

/**
 * Extract clusters from MST by cutting edges above a threshold.
 * Uses a simplified version of HDBSCAN's cluster extraction.
 *
 * @param minClusterSize Minimum points to form a cluster (default 3)
 * @param minSamples K for core distance (default 2)
 */
export function hdbscanCluster(
  vectors: CapabilityVector[],
  minClusterSize: number = 3,
  minSamples: number = 2,
): ClusteringOutput {
  const n = vectors.length;

  if (n < minClusterSize) {
    return {
      clusters: [],
      outliers: vectors.map(v => v.agentId),
      totalAgents: n,
      lastClustered: new Date().toISOString(),
    };
  }

  // 1. Compute distances
  const dist = distanceMatrix(vectors);

  // 2. Core distances
  const cores = coreDistances(dist, minSamples);

  // 3. Mutual reachability
  const mrd = mutualReachabilityDistance(dist, cores);

  // 4. Build MST
  const mstEdges = buildMST(mrd);

  // 5. Sort MST edges by weight (for hierarchical cutting)
  mstEdges.sort((a, b) => a.weight - b.weight);

  // 6. Single-linkage hierarchy: cut at different levels
  // Use adaptive threshold based on edge weight distribution
  const weights = mstEdges.map(e => e.weight).filter(w => isFinite(w));
  if (weights.length === 0) {
    return {
      clusters: [],
      outliers: vectors.map(v => v.agentId),
      totalAgents: n,
      lastClustered: new Date().toISOString(),
    };
  }

  const medianWeight = weights[Math.floor(weights.length / 2)];
  const cutThreshold = medianWeight * 1.5;

  // 7. Union-Find for cluster assignment
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
    } else {
      parent[rb] = ra;
      rank[ra]++;
    }
  }

  // Add edges below threshold
  for (const edge of mstEdges) {
    if (edge.weight <= cutThreshold) {
      union(edge.from, edge.to);
    }
  }

  // 8. Extract clusters
  const clusterMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const members = clusterMap.get(root) ?? [];
    members.push(i);
    clusterMap.set(root, members);
  }

  const clusters: ClusterResult[] = [];
  const outliers: string[] = [];
  let clusterId = 0;

  for (const [, memberIndices] of clusterMap) {
    if (memberIndices.length >= minClusterSize) {
      // Compute centroid
      const centroid: Record<string, number> = {};
      for (const idx of memberIndices) {
        for (const [key, val] of Object.entries(vectors[idx].dimensions)) {
          centroid[key] = (centroid[key] ?? 0) + val;
        }
      }
      for (const key of Object.keys(centroid)) {
        centroid[key] /= memberIndices.length;
      }

      // Compute persistence (stability metric)
      // Higher persistence = more stable cluster
      const intraDistances: number[] = [];
      for (let i = 0; i < memberIndices.length; i++) {
        for (let j = i + 1; j < memberIndices.length; j++) {
          intraDistances.push(dist[memberIndices[i]][memberIndices[j]]);
        }
      }
      const avgIntraDist = intraDistances.length > 0
        ? intraDistances.reduce((a, b) => a + b, 0) / intraDistances.length
        : 0;
      const persistence = avgIntraDist > 0 ? 1 / (1 + avgIntraDist) : 1;

      // Determine archetype from dominant dimension
      const sortedDims = Object.entries(centroid).sort((a, b) => b[1] - a[1]);
      const archetype = sortedDims.length > 0 ? sortedDims[0][0] : 'generalist';

      clusters.push({
        clusterId: `cluster-${clusterId++}`,
        archetype,
        members: memberIndices.map(i => vectors[i].agentId),
        centroid,
        persistence,
        size: memberIndices.length,
      });
    } else {
      for (const idx of memberIndices) {
        outliers.push(vectors[idx].agentId);
      }
    }
  }

  return {
    clusters,
    outliers,
    totalAgents: n,
    lastClustered: new Date().toISOString(),
  };
}

// ============================================================================
// Adjusted Rand Index (Drift Detection)
// ============================================================================

/**
 * Compute the Adjusted Rand Index between two clustering assignments.
 * ARI = 1.0 means identical, 0.0 means random, negative means worse than random.
 */
export function adjustedRandIndex(
  labels1: Map<string, string>, // agentId -> clusterId
  labels2: Map<string, string>,
): number {
  // Build contingency table
  const agents = new Set([...labels1.keys(), ...labels2.keys()]);
  const clusters1 = new Set(labels1.values());
  const clusters2 = new Set(labels2.values());

  const contingency = new Map<string, Map<string, number>>();
  for (const c1 of clusters1) {
    contingency.set(c1, new Map());
    for (const c2 of clusters2) {
      contingency.get(c1)!.set(c2, 0);
    }
  }

  for (const agent of agents) {
    const c1 = labels1.get(agent);
    const c2 = labels2.get(agent);
    if (c1 && c2) {
      const row = contingency.get(c1);
      if (row) {
        row.set(c2, (row.get(c2) ?? 0) + 1);
      }
    }
  }

  // Compute ARI
  const n = agents.size;
  if (n <= 1) return 1.0;

  let sumNij2 = 0;
  const rowSums: number[] = [];
  const colSums = new Map<string, number>();

  for (const c2 of clusters2) {
    colSums.set(c2, 0);
  }

  for (const [, row] of contingency) {
    let rowSum = 0;
    for (const [c2, val] of row) {
      sumNij2 += val * (val - 1) / 2;
      rowSum += val;
      colSums.set(c2, (colSums.get(c2) ?? 0) + val);
    }
    rowSums.push(rowSum);
  }

  const sumA = rowSums.reduce((s, r) => s + r * (r - 1) / 2, 0);
  const sumB = Array.from(colSums.values()).reduce((s, c) => s + c * (c - 1) / 2, 0);
  const nC2 = n * (n - 1) / 2;

  const expectedIndex = (sumA * sumB) / nC2;
  const maxIndex = (sumA + sumB) / 2;

  if (maxIndex === expectedIndex) return 1.0;
  return (sumNij2 - expectedIndex) / (maxIndex - expectedIndex);
}
