// === Weighted Path Finder ===
//
// Discovers shortest valid paths between any two primitives in the dependency
// graph using Dijkstra's algorithm with a weighted cost model incorporating
// edge type, domain distance, and abstraction jump.
//
// The path finder is the navigation engine for MFE — composition and problem
// decomposition use it to find efficient solution routes through the DAG.

import type { DependencyType, DomainId } from '../../core/types/mfe-types.js';
import type { DependencyGraph, GraphEdge, GraphNode } from './dependency-graph.js';

// === Public Types ===

export interface PathStep {
  from: string;
  to: string;
  edge: GraphEdge;
  fromDomain: DomainId;
  toDomain: DomainId;
  stepCost: number;
}

export interface PathResult {
  steps: PathStep[];
  totalCost: number;
  domainsSpanned: DomainId[];
  nodeCount: number;
}

export interface CostWeights {
  edgeTypeWeight: number;
  domainDistanceWeight: number;
  abstractionJumpWeight: number;
}

// === Default Weights ===

const DEFAULT_WEIGHTS: CostWeights = {
  edgeTypeWeight: 1.0,
  domainDistanceWeight: 1.0,
  abstractionJumpWeight: 1.0,
};

// === Edge Type Cost Map ===

const EDGE_TYPE_COSTS: Record<DependencyType, number> = {
  requires: 1.0,
  equivalent: 1.0,
  specializes: 2.0,
  generalizes: 2.0,
  applies: 3.0,
  motivates: 4.0,
};

// === Cost Computation ===

function computeEdgeCost(
  edge: GraphEdge,
  sourceNode: GraphNode,
  targetNode: GraphNode,
  weights: CostWeights,
): number {
  // Edge type cost
  const edgeTypeCost = EDGE_TYPE_COSTS[edge.type] ?? 3.0;

  // Domain distance: Euclidean distance between plane positions
  const srcPos = sourceNode.primitive.planePosition;
  const tgtPos = targetNode.primitive.planePosition;
  const domainDistance = Math.sqrt(
    (srcPos.real - tgtPos.real) ** 2 +
    (srcPos.imaginary - tgtPos.imaginary) ** 2,
  );

  // Abstraction jump: absolute difference in imaginary coordinates
  const abstractionJump = Math.abs(srcPos.imaginary - tgtPos.imaginary);

  // Weighted sum
  const baseCost =
    edgeTypeCost * weights.edgeTypeWeight +
    domainDistance * weights.domainDistanceWeight +
    abstractionJump * weights.abstractionJumpWeight;

  // Strength discount: strength 1.0 = cost * 1.0, strength 0.5 = cost * 1.5
  const strengthMultiplier = 2.0 - edge.strength;

  return baseCost * strengthMultiplier;
}

// === Priority Queue (min-heap via sorted array for ~500 node graphs) ===

interface PQEntry {
  id: string;
  cost: number;
}

class MinPriorityQueue {
  private entries: PQEntry[] = [];

  push(id: string, cost: number): void {
    this.entries.push({ id, cost });
    this.entries.sort((a, b) => a.cost - b.cost);
  }

  pop(): PQEntry | undefined {
    return this.entries.shift();
  }

  get isEmpty(): boolean {
    return this.entries.length === 0;
  }
}

// === Path Finder ===

export function findShortestPath(
  graph: DependencyGraph,
  sourceId: string,
  targetId: string,
  weights?: Partial<CostWeights>,
): PathResult | null {
  // Validate nodes exist
  if (!graph.hasNode(sourceId) || !graph.hasNode(targetId)) {
    return null;
  }

  // Self-path: zero cost
  if (sourceId === targetId) {
    const node = graph.getNode(sourceId)!;
    return {
      steps: [],
      totalCost: 0,
      domainsSpanned: [node.domain],
      nodeCount: 1,
    };
  }

  const resolvedWeights: CostWeights = {
    ...DEFAULT_WEIGHTS,
    ...weights,
  };

  // Build reverse adjacency for bidirectional search capability.
  // Forward edges: source -> target ("source depends on target")
  // Reverse edges: target -> source (allows traversal in both directions)
  const reverseAdj = new Map<string, GraphEdge[]>();
  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    reverseAdj.set(node.id, []);
  }
  for (const node of allNodes) {
    const neighbors = graph.getNeighbors(node.id);
    for (const edge of neighbors) {
      const existing = reverseAdj.get(edge.target);
      if (existing) {
        // Create a reverse edge (swap source and target for traversal)
        existing.push({
          source: edge.target,
          target: edge.source,
          type: edge.type,
          strength: edge.strength,
          description: edge.description,
        });
      }
    }
  }

  // Try forward search first, then reverse if forward fails
  const forwardResult = dijkstra(graph, sourceId, targetId, resolvedWeights, false);
  if (forwardResult !== null) {
    return forwardResult;
  }

  // Try reverse search (using reverse adjacency)
  const reverseResult = dijkstraWithAdj(graph, reverseAdj, sourceId, targetId, resolvedWeights);
  return reverseResult;
}

function dijkstra(
  graph: DependencyGraph,
  sourceId: string,
  targetId: string,
  weights: CostWeights,
  _reverse: boolean,
): PathResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edge: GraphEdge } | null>();
  const pq = new MinPriorityQueue();

  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  dist.set(sourceId, 0);
  pq.push(sourceId, 0);

  while (!pq.isEmpty) {
    const current = pq.pop()!;

    if (current.cost > (dist.get(current.id) ?? Infinity)) {
      continue; // Stale entry
    }

    if (current.id === targetId) {
      break; // Found shortest path
    }

    const neighbors = graph.getNeighbors(current.id);
    for (const edge of neighbors) {
      const sourceNode = graph.getNode(edge.source)!;
      const targetNode = graph.getNode(edge.target)!;
      const edgeCost = computeEdgeCost(edge, sourceNode, targetNode, weights);
      const newDist = current.cost + edgeCost;

      if (newDist < (dist.get(edge.target) ?? Infinity)) {
        dist.set(edge.target, newDist);
        prev.set(edge.target, { nodeId: current.id, edge });
        pq.push(edge.target, newDist);
      }
    }
  }

  // Reconstruct path
  if (dist.get(targetId) === Infinity) {
    return null; // Target unreachable
  }

  return reconstructPath(graph, sourceId, targetId, dist, prev, weights);
}

function dijkstraWithAdj(
  graph: DependencyGraph,
  adjList: Map<string, GraphEdge[]>,
  sourceId: string,
  targetId: string,
  weights: CostWeights,
): PathResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edge: GraphEdge } | null>();
  const pq = new MinPriorityQueue();

  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  dist.set(sourceId, 0);
  pq.push(sourceId, 0);

  while (!pq.isEmpty) {
    const current = pq.pop()!;

    if (current.cost > (dist.get(current.id) ?? Infinity)) {
      continue;
    }

    if (current.id === targetId) {
      break;
    }

    const neighbors = adjList.get(current.id) ?? [];
    for (const edge of neighbors) {
      const sourceNode = graph.getNode(edge.source)!;
      const targetNode = graph.getNode(edge.target)!;
      const edgeCost = computeEdgeCost(edge, sourceNode, targetNode, weights);
      const newDist = current.cost + edgeCost;

      if (newDist < (dist.get(edge.target) ?? Infinity)) {
        dist.set(edge.target, newDist);
        prev.set(edge.target, { nodeId: current.id, edge });
        pq.push(edge.target, newDist);
      }
    }
  }

  if (dist.get(targetId) === Infinity) {
    return null;
  }

  return reconstructPath(graph, sourceId, targetId, dist, prev, weights);
}

function reconstructPath(
  graph: DependencyGraph,
  sourceId: string,
  targetId: string,
  dist: Map<string, number>,
  prev: Map<string, { nodeId: string; edge: GraphEdge } | null>,
  weights: CostWeights,
): PathResult {
  const steps: PathStep[] = [];
  let current = targetId;

  while (current !== sourceId) {
    const prevEntry = prev.get(current);
    if (!prevEntry) break;

    const fromNode = graph.getNode(prevEntry.nodeId)!;
    const toNode = graph.getNode(current)!;
    const edgeCost = computeEdgeCost(prevEntry.edge, fromNode, toNode, weights);

    steps.unshift({
      from: prevEntry.nodeId,
      to: current,
      edge: prevEntry.edge,
      fromDomain: fromNode.domain,
      toDomain: toNode.domain,
      stepCost: edgeCost,
    });

    current = prevEntry.nodeId;
  }

  // Compute domainsSpanned: deduplicated list of all domains touched
  const domainSet = new Set<DomainId>();
  if (steps.length > 0) {
    domainSet.add(steps[0].fromDomain);
    for (const step of steps) {
      domainSet.add(step.toDomain);
    }
  } else {
    const node = graph.getNode(sourceId);
    if (node) domainSet.add(node.domain);
  }

  // Compute nodeCount: unique nodes in path
  const nodeSet = new Set<string>();
  if (steps.length > 0) {
    nodeSet.add(steps[0].from);
    for (const step of steps) {
      nodeSet.add(step.to);
    }
  } else {
    nodeSet.add(sourceId);
  }

  return {
    steps,
    totalCost: steps.reduce((acc, step) => acc + step.stepCost, 0),
    domainsSpanned: Array.from(domainSet),
    nodeCount: nodeSet.size,
  };
}
