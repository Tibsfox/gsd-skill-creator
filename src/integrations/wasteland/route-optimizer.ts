/**
 * Route Optimizer — Layer 2, Wave 2
 *
 * Dijkstra's algorithm for optimal town routing, bottleneck alerting
 * via centrality detection, A/B route testing, and town partnership scoring.
 */

import type {
  TownGraph,
  HandoffEdge,
  RoutingRule,
} from './types.js';

// ============================================================================
// Dijkstra's Algorithm
// ============================================================================

/** Dijkstra result for a single source */
export interface DijkstraResult {
  distances: Map<string, number>;
  predecessors: Map<string, string | null>;
}

/**
 * Run Dijkstra's algorithm from a source town.
 * Edge weights = (1/successRate) * avgLatencyMs, so lower = better.
 */
export function dijkstra(graph: TownGraph, source: string): DijkstraResult {
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  const visited = new Set<string>();

  // Build adjacency list
  const adjacency = new Map<string, HandoffEdge[]>();
  for (const node of graph.nodes) {
    adjacency.set(node.townId, []);
    distances.set(node.townId, Infinity);
    predecessors.set(node.townId, null);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.fromTown)?.push(edge);
  }

  distances.set(source, 0);

  // Priority queue (simplified with linear scan)
  const unvisited = new Set(graph.nodes.map(n => n.townId));

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current: string | null = null;
    let minDist = Infinity;
    for (const node of unvisited) {
      const d = distances.get(node) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        current = node;
      }
    }

    if (current === null || minDist === Infinity) break;

    unvisited.delete(current);
    visited.add(current);

    // Relax edges
    for (const edge of adjacency.get(current) ?? []) {
      if (visited.has(edge.toTown)) continue;
      const newDist = minDist + edge.weight;
      if (newDist < (distances.get(edge.toTown) ?? Infinity)) {
        distances.set(edge.toTown, newDist);
        predecessors.set(edge.toTown, current);
      }
    }
  }

  return { distances, predecessors };
}

/**
 * Reconstruct the shortest path from source to target.
 * Returns null if no path exists (disconnected graph).
 */
export function reconstructPath(
  predecessors: Map<string, string | null>,
  source: string,
  target: string,
): string[] | null {
  if (!predecessors.has(target)) return null;

  const path: string[] = [];
  let current: string | null = target;

  while (current !== null) {
    path.unshift(current);
    if (current === source) return path;
    current = predecessors.get(current) ?? null;
  }

  // If we didn't reach source, path doesn't exist
  return null;
}

// ============================================================================
// Route Generation
// ============================================================================

/**
 * Find optimal route between two towns.
 * Returns null for disconnected town pairs.
 */
export function findOptimalRoute(
  graph: TownGraph,
  from: string,
  to: string,
): { route: string[]; weight: number; latencyEstimateMs: number; successRateEstimate: number } | null {
  const result = dijkstra(graph, from);
  const path = reconstructPath(result.predecessors, from, to);

  if (!path || path.length < 2) return null;

  // Compute route metrics
  let totalLatency = 0;
  let totalSuccessRate = 1.0;
  const edgeMap = new Map<string, HandoffEdge>();
  for (const edge of graph.edges) {
    edgeMap.set(`${edge.fromTown}->${edge.toTown}`, edge);
  }

  for (let i = 0; i < path.length - 1; i++) {
    const edge = edgeMap.get(`${path[i]}->${path[i + 1]}`);
    if (edge) {
      totalLatency += edge.avgLatencyMs;
      totalSuccessRate *= edge.successRate;
    }
  }

  return {
    route: path,
    weight: result.distances.get(to) ?? Infinity,
    latencyEstimateMs: totalLatency,
    successRateEstimate: totalSuccessRate,
  };
}

/**
 * Generate routing rules for a task type across all town pairs.
 */
export function generateRoutingRules(
  graph: TownGraph,
  taskType: string,
): RoutingRule[] {
  const rules: RoutingRule[] = [];
  let ruleIdx = 0;

  for (const source of graph.nodes) {
    for (const target of graph.nodes) {
      if (source.townId === target.townId) continue;

      const optimal = findOptimalRoute(graph, source.townId, target.townId);
      if (optimal) {
        rules.push({
          id: `route-${ruleIdx++}`,
          taskType,
          route: optimal.route,
          weight: optimal.weight,
          latencyEstimateMs: optimal.latencyEstimateMs,
          successRateEstimate: optimal.successRateEstimate,
          abTestActive: false,
        });
      }
    }
  }

  return rules;
}

// ============================================================================
// A/B Route Testing
// ============================================================================

/** A/B test state for a routing rule */
export interface ABRouteTest {
  ruleId: string;
  controlRoute: string[];
  treatmentRoute: string[];
  controlSamples: number;
  treatmentSamples: number;
  controlSuccessRate: number;
  treatmentSuccessRate: number;
  controlLatencyMs: number;
  treatmentLatencyMs: number;
  minSamplesPerArm: number;
  isComplete: boolean;
}

/**
 * Create an A/B route test comparing old and new routes.
 */
export function createABRouteTest(
  ruleId: string,
  controlRoute: string[],
  treatmentRoute: string[],
  minSamples: number = 10,
): ABRouteTest {
  return {
    ruleId,
    controlRoute,
    treatmentRoute,
    controlSamples: 0,
    treatmentSamples: 0,
    controlSuccessRate: 0,
    treatmentSuccessRate: 0,
    controlLatencyMs: 0,
    treatmentLatencyMs: 0,
    minSamplesPerArm: minSamples,
    isComplete: false,
  };
}

/**
 * Record an observation for an A/B test.
 * Assigns to control or treatment (50/50 split).
 */
export function recordABObservation(
  test: ABRouteTest,
  success: boolean,
  latencyMs: number,
  arm: 'control' | 'treatment',
): ABRouteTest {
  const updated = { ...test };

  if (arm === 'control') {
    const n = updated.controlSamples;
    updated.controlSuccessRate = (updated.controlSuccessRate * n + (success ? 1 : 0)) / (n + 1);
    updated.controlLatencyMs = (updated.controlLatencyMs * n + latencyMs) / (n + 1);
    updated.controlSamples = n + 1;
  } else {
    const n = updated.treatmentSamples;
    updated.treatmentSuccessRate = (updated.treatmentSuccessRate * n + (success ? 1 : 0)) / (n + 1);
    updated.treatmentLatencyMs = (updated.treatmentLatencyMs * n + latencyMs) / (n + 1);
    updated.treatmentSamples = n + 1;
  }

  updated.isComplete =
    updated.controlSamples >= test.minSamplesPerArm &&
    updated.treatmentSamples >= test.minSamplesPerArm;

  return updated;
}

// ============================================================================
// Bottleneck Alerting
// ============================================================================

/** Bottleneck alert */
export interface BottleneckAlert {
  townId: string;
  centrality: number;
  threshold: number;
  recommendation: string;
}

/**
 * Generate bottleneck alerts for towns exceeding centrality threshold.
 */
export function generateBottleneckAlerts(
  graph: TownGraph,
  stdDevMultiplier: number = 2,
): BottleneckAlert[] {
  const centralities = graph.nodes.map(n => n.betweennessCentrality);
  if (centralities.length === 0) return [];

  const mean = centralities.reduce((a, b) => a + b, 0) / centralities.length;
  const variance = centralities.reduce((a, b) => a + (b - mean) ** 2, 0) / centralities.length;
  const stddev = Math.sqrt(variance);
  const threshold = mean + stdDevMultiplier * stddev;

  return graph.nodes
    .filter(n => n.betweennessCentrality > threshold)
    .map(n => ({
      townId: n.townId,
      centrality: n.betweennessCentrality,
      threshold,
      recommendation: `Town ${n.townId} has centrality ${n.betweennessCentrality.toFixed(3)} ` +
        `(threshold: ${threshold.toFixed(3)}). Consider route diversification or agent pre-positioning.`,
    }));
}
