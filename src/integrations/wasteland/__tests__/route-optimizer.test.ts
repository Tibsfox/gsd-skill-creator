/**
 * Tests for Route Optimizer — Dijkstra, path reconstruction, route generation.
 */

import { describe, it, expect } from 'vitest';
import { dijkstra, reconstructPath } from '../route-optimizer.js';
import type { TownGraph } from '../types.js';

function makeGraph(): TownGraph {
  return {
    nodes: [
      { townId: 'a', agentCount: 1, throughput: 10, betweennessCentrality: 0 },
      { townId: 'b', agentCount: 1, throughput: 10, betweennessCentrality: 0 },
      { townId: 'c', agentCount: 1, throughput: 10, betweennessCentrality: 0 },
    ],
    edges: [
      { source: 'a', target: 'b', fromTown: 'a', toTown: 'b', handoffCount: 5, avgLatencyMs: 100, volume: 5, successRate: 1, weight: 100 },
      { source: 'b', target: 'c', fromTown: 'b', toTown: 'c', handoffCount: 3, avgLatencyMs: 50, volume: 3, successRate: 1, weight: 50 },
      { source: 'a', target: 'c', fromTown: 'a', toTown: 'c', handoffCount: 1, avgLatencyMs: 500, volume: 1, successRate: 0.5, weight: 1000 },
    ],
  };
}

describe('dijkstra', () => {
  it('finds shortest paths from source', () => {
    const result = dijkstra(makeGraph(), 'a');
    expect(result.distances.get('a')).toBe(0);
    expect(result.distances.get('b')).toBe(100); // a→b weight=100
    expect(result.distances.get('c')).toBe(150); // a→b→c = 100+50 < a→c=1000
  });

  it('returns Infinity for unreachable nodes', () => {
    const graph: TownGraph = {
      nodes: [
        { townId: 'a', agentCount: 1, throughput: 1, betweennessCentrality: 0 },
        { townId: 'z', agentCount: 1, throughput: 1, betweennessCentrality: 0 },
      ],
      edges: [],
    };
    const result = dijkstra(graph, 'a');
    expect(result.distances.get('z')).toBe(Infinity);
  });
});

describe('reconstructPath', () => {
  it('reconstructs shortest path', () => {
    const result = dijkstra(makeGraph(), 'a');
    const path = reconstructPath(result.predecessors, 'a', 'c');
    expect(path).toEqual(['a', 'b', 'c']); // via b, not direct
  });

  it('returns single node for source=target', () => {
    const result = dijkstra(makeGraph(), 'a');
    expect(reconstructPath(result.predecessors, 'a', 'a')).toEqual(['a']);
  });

  it('returns null for unknown target', () => {
    const result = dijkstra(makeGraph(), 'a');
    expect(reconstructPath(result.predecessors, 'a', 'z')).toBeNull();
  });
});
