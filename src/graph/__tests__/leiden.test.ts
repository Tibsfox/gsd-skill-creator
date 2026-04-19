/**
 * M1 Semantic Memory Graph — leiden.ts tests.
 *
 * Covers:
 *   - determinism: identical (graph, seed) → identical partition
 *   - modularity optimization on a hand-crafted two-clique graph
 *   - CF-M1-02: Leiden output matches reference within 2% modularity on an
 *     LFR-style benchmark (generated in-test from hand-planted communities)
 */
import { describe, it, expect } from 'vitest';
import {
  leiden,
  modularity,
  buildWeightedGraph,
  type WeightedGraph,
} from '../leiden.js';

// ─── Test helpers ──────────────────────────────────────────────────────────

function buildFromEdges(
  nodeCount: number,
  edgeList: Array<[number, number, number?]>,
): WeightedGraph {
  const adjacency: Array<Array<{ neighbor: number; weight: number }>> = [];
  for (let i = 0; i < nodeCount; i++) adjacency.push([]);
  let total = 0;
  for (const [i, j, w] of edgeList) {
    const weight = w ?? 1;
    adjacency[i].push({ neighbor: j, weight });
    adjacency[j].push({ neighbor: i, weight });
    total += 2 * weight;
  }
  const nodeIds = Array.from({ length: nodeCount }, (_, i) => `n${i}`);
  return { n: nodeCount, adjacency, totalEdgeWeight: total, nodeIds };
}

/**
 * LFR-style planted-community graph generator:
 *   - k communities of size s
 *   - intra-community edge probability pIn
 *   - inter-community edge probability pOut (much lower)
 * Deterministic via a seeded PRNG.
 */
function generatePlantedGraph(
  k: number,
  s: number,
  pIn: number,
  pOut: number,
  seed: number,
): WeightedGraph {
  let t = seed >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const n = k * s;
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sameComm = Math.floor(i / s) === Math.floor(j / s);
      const p = sameComm ? pIn : pOut;
      if (rand() < p) edges.push([i, j]);
    }
  }
  return buildFromEdges(n, edges);
}

// ─── Core tests ─────────────────────────────────────────────────────────────

describe('leiden — determinism', () => {
  it('identical seed → identical partition', () => {
    const g = generatePlantedGraph(4, 15, 0.4, 0.02, 0xfeedface);
    const r1 = leiden(g, { seed: 7 });
    const r2 = leiden(g, { seed: 7 });
    expect(r1.communities[0].map((c) => c.members)).toEqual(
      r2.communities[0].map((c) => c.members),
    );
  });

  it('different seed may produce different node ordering but must still converge', () => {
    const g = generatePlantedGraph(4, 15, 0.4, 0.02, 0xfeedface);
    const r1 = leiden(g, { seed: 7 });
    const r2 = leiden(g, { seed: 99 });
    // Both should have well-defined modularity above trivial (single cluster).
    expect(r1.modularity).toBeGreaterThan(0.1);
    expect(r2.modularity).toBeGreaterThan(0.1);
  });
});

describe('leiden — modularity optimization', () => {
  it('recovers two cliques connected by one bridge edge', () => {
    // Two 4-cliques (nodes 0-3 and 4-7) bridged by edge (3, 4).
    const intraEdges: Array<[number, number]> = [];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) intraEdges.push([i, j]);
    }
    for (let i = 4; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) intraEdges.push([i, j]);
    }
    intraEdges.push([3, 4]); // bridge
    const g = buildFromEdges(8, intraEdges);

    const result = leiden(g, { seed: 1, resolution: 1.0 });
    const leaves = result.communities[0];

    // Leiden's refinement phase may split a clique further if that improves
    // well-connectedness (Traag 2019 §3). We assert the structural invariant
    // that no community spans both cliques — i.e. every leaf community is a
    // subset of one planted group.
    const groupA = new Set(['n0', 'n1', 'n2', 'n3']);
    const groupB = new Set(['n4', 'n5', 'n6', 'n7']);
    for (const c of leaves) {
      const inA = c.members.every((m) => groupA.has(m));
      const inB = c.members.every((m) => groupB.has(m));
      expect(inA || inB).toBe(true);
    }
    // At least two communities — the bridge edge is preserved as a cross-
    // community edge, not absorbed into a single cluster.
    expect(leaves.length).toBeGreaterThanOrEqual(2);
    expect(leaves.length).toBeLessThanOrEqual(4);

    // Modularity > 0 (positive structure).
    expect(result.modularity).toBeGreaterThan(0.3);
  });

  it('handles an empty graph without crashing', () => {
    const g: WeightedGraph = { n: 0, adjacency: [], totalEdgeWeight: 0, nodeIds: [] };
    const result = leiden(g, { seed: 0 });
    expect(result.modularity).toBe(0);
  });

  it('handles a graph with zero edges', () => {
    const g: WeightedGraph = {
      n: 3,
      adjacency: [[], [], []],
      totalEdgeWeight: 0,
      nodeIds: ['n0', 'n1', 'n2'],
    };
    const result = leiden(g, { seed: 0 });
    expect(result.modularity).toBe(0);
  });
});

describe('leiden — CF-M1-02: within 2% of reference modularity on planted graph', () => {
  it('achieves modularity close to the ground-truth partition', () => {
    const k = 5;
    const s = 20; // 100 nodes
    const pIn = 0.3;
    const pOut = 0.02;
    const g = generatePlantedGraph(k, s, pIn, pOut, 0xdeadbeef);

    // Reference modularity: evaluate the true planted partition.
    const truePartition = Array.from({ length: k * s }, (_, i) => Math.floor(i / s));
    const referenceQ = modularity(g, truePartition, 1.0);

    // Run Leiden.
    const result = leiden(g, { seed: 12345, resolution: 1.0 });
    const ourQ = result.modularity;

    // Within 2% relative modularity on a well-separated planted graph.
    const relDelta = Math.abs(ourQ - referenceQ) / Math.max(referenceQ, 1e-9);
    expect(ourQ).toBeGreaterThan(0.3);
    expect(relDelta).toBeLessThan(0.02);
  });
});

describe('leiden — integration with buildWeightedGraph', () => {
  it('builds a weighted graph from an ingested Graph shape', () => {
    const entities = new Map([
      ['a', { id: 'a' }],
      ['b', { id: 'b' }],
      ['c', { id: 'c' }],
    ]);
    const edges = new Map([
      ['e1', { src: 'a', dst: 'b', weight: 2 }],
      ['e2', { src: 'b', dst: 'c', weight: 1 }],
    ]);
    const wg = buildWeightedGraph({ entities, edges });
    expect(wg.n).toBe(3);
    expect(wg.nodeIds).toEqual(['a', 'b', 'c']);
    // Each directed edge contributes to both sides → total = 2*(2+1) = 6
    expect(wg.totalEdgeWeight).toBe(6);
  });
});

