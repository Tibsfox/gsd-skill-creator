/**
 * Town Topology Mapper — Layer 1, Wave 1
 *
 * Models towns as a directed graph with edges weighted by handoff volume,
 * latency, and success rate. Computes betweenness centrality for bottleneck
 * detection and tracks town capacity.
 */

import type {
  ObservationEvent,
  TownNode,
  HandoffEdge,
  TownGraph,
} from './types.js';

// ============================================================================
// Graph Construction
// ============================================================================

/**
 * Build a town topology graph from observation events.
 * Tracks handoff edges from task-transferred events and
 * builds node metrics from all event types.
 */
export function buildTownGraph(events: ObservationEvent[]): TownGraph {
  const townData = new Map<string, {
    agentIds: Set<string>;
    taskCount: number;
    completedCount: number;
  }>();
  const edgeData = new Map<string, {
    volume: number;
    totalLatencyMs: number;
    successCount: number;
    failureReasons: string[];
  }>();

  for (const event of events) {
    // Track town activity
    if (event.townId) {
      const town = townData.get(event.townId) ?? {
        agentIds: new Set(),
        taskCount: 0,
        completedCount: 0,
      };
      town.agentIds.add(event.agentId);
      town.taskCount++;
      if (event.eventType === 'task-completed') town.completedCount++;
      townData.set(event.townId, town);
    }

    // Track transfer edges
    if (event.eventType === 'task-transferred') {
      const fromTown = event.metadata?.fromTown as string;
      const toTown = event.metadata?.toTown as string;
      if (fromTown && toTown) {
        const edgeKey = `${fromTown}->${toTown}`;
        const edge = edgeData.get(edgeKey) ?? {
          volume: 0,
          totalLatencyMs: 0,
          successCount: 0,
          failureReasons: [],
        };
        edge.volume++;
        edge.totalLatencyMs += (event.metadata?.latencyMs as number) ?? 0;
        if (event.metadata?.success !== false) {
          edge.successCount++;
        } else {
          const reason = (event.metadata?.failureReason as string) ?? 'unknown';
          edge.failureReasons.push(reason);
        }
        edgeData.set(edgeKey, edge);

        // Ensure both towns exist in node data
        if (!townData.has(fromTown)) {
          townData.set(fromTown, { agentIds: new Set(), taskCount: 0, completedCount: 0 });
        }
        if (!townData.has(toTown)) {
          townData.set(toTown, { agentIds: new Set(), taskCount: 0, completedCount: 0 });
        }
      }
    }
  }

  // Build nodes
  const nodes: TownNode[] = Array.from(townData.entries()).map(([townId, data]) => ({
    townId,
    agentCount: data.agentIds.size,
    taskQueueDepth: data.taskCount - data.completedCount,
    throughput: data.completedCount,
    betweennessCentrality: 0, // Computed below
  }));

  // Build edges
  const edges: HandoffEdge[] = Array.from(edgeData.entries()).map(([key, data]) => {
    const [fromTown, toTown] = key.split('->');
    const successRate = data.volume > 0 ? data.successCount / data.volume : 0;
    const avgLatency = data.volume > 0 ? data.totalLatencyMs / data.volume : 0;
    return {
      fromTown,
      toTown,
      volume: data.volume,
      avgLatencyMs: avgLatency,
      successRate,
      failureReasons: data.failureReasons,
      weight: successRate > 0 ? (1 / successRate) * Math.max(avgLatency, 1) : Infinity,
    };
  });

  // Compute betweenness centrality
  const centralityMap = computeBetweennessCentrality(nodes, edges);
  for (const node of nodes) {
    node.betweennessCentrality = centralityMap.get(node.townId) ?? 0;
  }

  return {
    nodes,
    edges,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// Betweenness Centrality (Brandes' Algorithm)
// ============================================================================

/**
 * Compute betweenness centrality for all nodes using Brandes' algorithm.
 * Works on the directed handoff graph.
 */
export function computeBetweennessCentrality(
  nodes: TownNode[],
  edges: HandoffEdge[],
): Map<string, number> {
  const centrality = new Map<string, number>();
  const nodeIds = nodes.map(n => n.townId);

  // Initialize centrality to 0
  for (const id of nodeIds) {
    centrality.set(id, 0);
  }

  // Build adjacency list
  const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
  for (const id of nodeIds) {
    adjacency.set(id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.fromTown)?.push({ to: edge.toTown, weight: edge.weight });
  }

  // Brandes' algorithm: run shortest-path from each source
  for (const source of nodeIds) {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    const delta = new Map<string, number>();

    for (const id of nodeIds) {
      predecessors.set(id, []);
      sigma.set(id, 0);
      dist.set(id, Infinity);
      delta.set(id, 0);
    }

    sigma.set(source, 1);
    dist.set(source, 0);

    // BFS/Dijkstra with queue
    const queue: string[] = [source];
    const visited = new Set<string>();

    while (queue.length > 0) {
      // Find minimum distance node in queue
      let minIdx = 0;
      for (let i = 1; i < queue.length; i++) {
        if ((dist.get(queue[i]) ?? Infinity) < (dist.get(queue[minIdx]) ?? Infinity)) {
          minIdx = i;
        }
      }
      const v = queue.splice(minIdx, 1)[0];

      if (visited.has(v)) continue;
      visited.add(v);
      stack.push(v);

      const vDist = dist.get(v) ?? Infinity;
      const vSigma = sigma.get(v) ?? 0;

      for (const { to: w, weight } of adjacency.get(v) ?? []) {
        const newDist = vDist + weight;
        const wDist = dist.get(w) ?? Infinity;

        if (newDist < wDist) {
          dist.set(w, newDist);
          sigma.set(w, 0);
          predecessors.set(w, []);
          if (!visited.has(w)) {
            queue.push(w);
          }
        }

        if (Math.abs(newDist - (dist.get(w) ?? Infinity)) < 1e-10) {
          sigma.set(w, (sigma.get(w) ?? 0) + vSigma);
          predecessors.get(w)?.push(v);
        }
      }
    }

    // Accumulate
    while (stack.length > 0) {
      const w = stack.pop()!;
      const wSigma = sigma.get(w) ?? 1;
      const wDelta = delta.get(w) ?? 0;

      for (const v of predecessors.get(w) ?? []) {
        const vSigma = sigma.get(v) ?? 1;
        const contribution = (vSigma / wSigma) * (1 + wDelta);
        delta.set(v, (delta.get(v) ?? 0) + contribution);
      }

      if (w !== source) {
        centrality.set(w, (centrality.get(w) ?? 0) + (delta.get(w) ?? 0));
      }
    }
  }

  // Normalize by (n-1)(n-2) for directed graphs
  const n = nodeIds.length;
  if (n > 2) {
    const normFactor = (n - 1) * (n - 2);
    for (const [id, val] of centrality) {
      centrality.set(id, val / normFactor);
    }
  }

  return centrality;
}

// ============================================================================
// Bottleneck Detection
// ============================================================================

/**
 * Detect bottleneck towns — centrality > mean + 2*stddev.
 */
export function detectBottlenecks(graph: TownGraph): TownNode[] {
  if (graph.nodes.length === 0) return [];

  const centralities = graph.nodes.map(n => n.betweennessCentrality);
  const mean = centralities.reduce((a, b) => a + b, 0) / centralities.length;
  const variance = centralities.reduce((a, b) => a + (b - mean) ** 2, 0) / centralities.length;
  const stddev = Math.sqrt(variance);
  const threshold = mean + 2 * stddev;

  return graph.nodes.filter(n => n.betweennessCentrality > threshold);
}

/**
 * Find town partnerships — pairwise quality scores.
 * Returns sorted by quality descending.
 */
export function townPartnerships(graph: TownGraph): Array<{
  towns: [string, string];
  quality: number;
  volume: number;
}> {
  const partnerships: Array<{
    towns: [string, string];
    quality: number;
    volume: number;
  }> = [];

  for (const edge of graph.edges) {
    // Quality = success rate (higher = better)
    partnerships.push({
      towns: [edge.fromTown, edge.toTown],
      quality: edge.successRate,
      volume: edge.volume,
    });
  }

  partnerships.sort((a, b) => b.quality - a.quality);
  return partnerships;
}
