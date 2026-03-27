/**
 * Tests for Town Topology Mapper — graph construction, centrality, bottleneck detection.
 *
 * Covers:
 * - buildTownGraph: node/edge construction from events
 * - computeBetweennessCentrality: Brandes' algorithm
 * - detectBottlenecks: statistical outlier detection
 * - townPartnerships: pairwise quality ranking
 */

import { describe, it, expect } from 'vitest';
import {
  buildTownGraph,
  computeBetweennessCentrality,
  detectBottlenecks,
  townPartnerships,
} from '../town-topology-mapper.js';
import type { ObservationEvent, TownNode, HandoffEdge } from '../types.js';

function makeEvent(overrides: Partial<ObservationEvent> = {}): ObservationEvent {
  return {
    id: 'evt-1',
    timestamp: '2026-03-27T00:00:00Z',
    eventType: 'task-completed',
    agentId: 'agent-1',
    taskId: 'task-1',
    townId: 'town-a',
    metadata: {},
    ...overrides,
  };
}

// ============================================================================
// buildTownGraph
// ============================================================================

describe('buildTownGraph', () => {
  it('builds nodes from task events', () => {
    const events = [
      makeEvent({ townId: 'town-a', agentId: 'a1' }),
      makeEvent({ townId: 'town-a', agentId: 'a2' }),
      makeEvent({ townId: 'town-b', agentId: 'b1' }),
    ];
    const graph = buildTownGraph(events);
    expect(graph.nodes).toHaveLength(2);

    const townA = graph.nodes.find(n => n.townId === 'town-a')!;
    expect(townA.agentCount).toBe(2);
    expect(townA.throughput).toBe(2);
  });

  it('builds edges from transfer events', () => {
    const events = [
      makeEvent({
        eventType: 'task-transferred' as any,
        metadata: { fromTown: 'town-a', toTown: 'town-b', latencyMs: 100 },
      }),
      makeEvent({
        eventType: 'task-transferred' as any,
        metadata: { fromTown: 'town-a', toTown: 'town-b', latencyMs: 200 },
      }),
    ];
    const graph = buildTownGraph(events);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].volume).toBe(2);
    expect(graph.edges[0].avgLatencyMs).toBe(150);
  });

  it('returns empty graph for no events', () => {
    const graph = buildTownGraph([]);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it('tracks failed transfers', () => {
    const events = [
      makeEvent({
        eventType: 'task-transferred' as any,
        metadata: { fromTown: 'a', toTown: 'b', success: false, failureReason: 'timeout' },
      }),
    ];
    const graph = buildTownGraph(events);
    expect(graph.edges[0].successRate).toBe(0);
  });
});

// ============================================================================
// computeBetweennessCentrality
// ============================================================================

describe('computeBetweennessCentrality', () => {
  it('hub node has higher centrality than leaves', () => {
    const nodes: TownNode[] = [
      { townId: 'a', agentCount: 1, throughput: 1, betweennessCentrality: 0 },
      { townId: 'hub', agentCount: 1, throughput: 1, betweennessCentrality: 0 },
      { townId: 'b', agentCount: 1, throughput: 1, betweennessCentrality: 0 },
    ];
    const edges: HandoffEdge[] = [
      { source: 'a', target: 'hub', fromTown: 'a', toTown: 'hub', handoffCount: 5, avgLatencyMs: 100, volume: 5, successRate: 1.0, weight: 100 },
      { source: 'hub', target: 'b', fromTown: 'hub', toTown: 'b', handoffCount: 5, avgLatencyMs: 100, volume: 5, successRate: 1.0, weight: 100 },
    ];
    const centrality = computeBetweennessCentrality(nodes, edges);
    expect(centrality.get('hub')!).toBeGreaterThanOrEqual(centrality.get('a')!);
  });

  it('returns zeros for single node', () => {
    const nodes: TownNode[] = [
      { townId: 'a', agentCount: 1, throughput: 1, betweennessCentrality: 0 },
    ];
    const centrality = computeBetweennessCentrality(nodes, []);
    expect(centrality.get('a')).toBe(0);
  });
});

// ============================================================================
// detectBottlenecks
// ============================================================================

describe('detectBottlenecks', () => {
  it('detects outlier centrality nodes', () => {
    // mean = (0.99 + 0.01*9)/10 = 0.108, stddev small
    // hub at 0.99 is well above mean + 2*stddev
    const graph = {
      nodes: [
        { townId: 'hub', agentCount: 5, throughput: 100, betweennessCentrality: 0.99 },
        ...Array.from({ length: 9 }, (_, i) => ({
          townId: `leaf-${i}`,
          agentCount: 1,
          throughput: 10,
          betweennessCentrality: 0.01,
        })),
      ],
      edges: [],
    };
    const bottlenecks = detectBottlenecks(graph);
    expect(bottlenecks.length).toBeGreaterThanOrEqual(1);
    expect(bottlenecks[0].townId).toBe('hub');
  });

  it('returns empty for empty graph', () => {
    expect(detectBottlenecks({ nodes: [], edges: [] })).toEqual([]);
  });

  it('returns empty when all centralities are equal', () => {
    const graph = {
      nodes: [
        { townId: 'a', agentCount: 1, throughput: 1, betweennessCentrality: 0.5 },
        { townId: 'b', agentCount: 1, throughput: 1, betweennessCentrality: 0.5 },
      ],
      edges: [],
    };
    expect(detectBottlenecks(graph)).toEqual([]);
  });
});

// ============================================================================
// townPartnerships
// ============================================================================

describe('townPartnerships', () => {
  it('ranks partnerships by quality', () => {
    const graph = {
      nodes: [],
      edges: [
        { source: 'a', target: 'b', fromTown: 'a', toTown: 'b', handoffCount: 10, avgLatencyMs: 100, volume: 10, successRate: 0.9, weight: 1 },
        { source: 'b', target: 'c', fromTown: 'b', toTown: 'c', handoffCount: 5, avgLatencyMs: 200, volume: 5, successRate: 0.5, weight: 1 },
      ],
    };
    const partnerships = townPartnerships(graph);
    expect(partnerships).toHaveLength(2);
    expect(partnerships[0].quality).toBe(0.9);
    expect(partnerships[1].quality).toBe(0.5);
  });

  it('returns empty for no edges', () => {
    expect(townPartnerships({ nodes: [], edges: [] })).toEqual([]);
  });
});
