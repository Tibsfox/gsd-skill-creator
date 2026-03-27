// === Dependency Graph Engine ===
//
// Ingests domain and dependency JSON data, constructs a validated directed
// acyclic graph as an adjacency list, enforces referential integrity (SAFE-02),
// and blocks on cycle detection (SAFE-01).
//
// The DAG is the core data structure for the MFE — path finding, composition,
// and verification all depend on a sound, validated graph.

import type {
  MathematicalPrimitive,
  DependencyType,
  DomainId,
  RegistrySummary,
  DomainSummary,
} from '../types/mfe-types.js';

// === Public Types ===

export interface GraphNode {
  id: string;
  primitive: MathematicalPrimitive;
  domain: DomainId;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: DependencyType;
  strength: number;
  description: string;
}

export interface GraphBuildError {
  type: 'integrity' | 'cycle';
  message: string;
  details: string[];
}

export type GraphBuildResult =
  | { ok: true; graph: DependencyGraph; errors: [] }
  | { ok: false; graph: null; errors: GraphBuildError[] };

export interface DomainDataFile {
  domain: DomainId;
  version: string;
  primitives: MathematicalPrimitive[];
}

export interface DependencyDataFile {
  version: string;
  scope: string;
  edges: ExternalEdge[];
}

export interface ExternalEdge {
  source: string;
  target: string;
  type: DependencyType;
  strength: number;
  description: string;
}

// === DependencyGraph Class ===

export class DependencyGraph {
  private readonly nodes: Map<string, GraphNode>;
  private readonly adjacencyList: Map<string, GraphEdge[]>;
  private readonly _topologicalOrder: string[];

  private constructor(
    nodes: Map<string, GraphNode>,
    adjacencyList: Map<string, GraphEdge[]>,
    topologicalOrder: string[],
  ) {
    this.nodes = nodes;
    this.adjacencyList = adjacencyList;
    this._topologicalOrder = topologicalOrder;
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    let count = 0;
    Array.from(this.adjacencyList.values()).forEach(edges => {
      count += edges.length;
    });
    return count;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getNeighbors(id: string): GraphEdge[] {
    return this.adjacencyList.get(id) ?? [];
  }

  getTopologicalOrder(): string[] {
    return Array.from(this._topologicalOrder);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  getSummary(): RegistrySummary {
    // Aggregate domain summaries
    const domainMap = new Map<DomainId, MathematicalPrimitive[]>();
    Array.from(this.nodes.values()).forEach(node => {
      const existing = domainMap.get(node.domain) ?? [];
      existing.push(node.primitive);
      domainMap.set(node.domain, existing);
    });

    const domains: DomainSummary[] = [];
    let totalCompositionRules = 0;

    Array.from(domainMap.entries()).forEach(([domainId, primitives]) => {
      let domainRuleCount = 0;
      for (const p of primitives) {
        domainRuleCount += p.compositionRules.length;
      }
      totalCompositionRules += domainRuleCount;

      domains.push({
        id: domainId,
        name: domainId.charAt(0).toUpperCase() + domainId.slice(1),
        primitiveCount: primitives.length,
        topPrimitives: primitives.slice(0, 5).map(p => p.id),
        activationPatterns: [],
        planeRegion: { center: { real: 0, imaginary: 0 }, radius: 0 },
      });
    });

    const graphDepth = this.computeGraphDepth();

    return {
      version: '1.35.0',
      totalPrimitives: this.nodeCount,
      totalEdges: this.edgeCount,
      totalCompositionRules,
      domains,
      graphDepth,
    };
  }

  private computeGraphDepth(): number {
    // Compute longest path in the DAG via dynamic programming.
    // Process in reverse topological order (dependents before dependencies)
    // so that each node's children are already computed.
    const longestFrom = new Map<string, number>();
    const reversedOrder = Array.from(this._topologicalOrder).reverse();

    for (const nodeId of reversedOrder) {
      const neighbors = this.adjacencyList.get(nodeId) ?? [];
      let maxChildDepth = 0;
      for (const edge of neighbors) {
        const childDepth = longestFrom.get(edge.target) ?? 0;
        maxChildDepth = Math.max(maxChildDepth, childDepth + 1);
      }
      longestFrom.set(nodeId, maxChildDepth);
    }

    let maxDepth = 0;
    Array.from(longestFrom.values()).forEach(d => {
      maxDepth = Math.max(maxDepth, d);
    });

    return maxDepth;
  }

  /** @internal Used by buildGraph to construct instances */
  static _create(
    nodes: Map<string, GraphNode>,
    adjacencyList: Map<string, GraphEdge[]>,
    topologicalOrder: string[],
  ): DependencyGraph {
    return new DependencyGraph(nodes, adjacencyList, topologicalOrder);
  }
}

// === buildGraph Function ===

export function buildGraph(
  domainData: DomainDataFile[],
  dependencyData: DependencyDataFile[],
): GraphBuildResult {
  // Step 1: Build node map from all domain files
  const nodes = new Map<string, GraphNode>();
  const adjacencyList = new Map<string, GraphEdge[]>();

  for (const domainFile of domainData) {
    for (const primitive of domainFile.primitives) {
      nodes.set(primitive.id, {
        id: primitive.id,
        primitive,
        domain: primitive.domain,
      });
      adjacencyList.set(primitive.id, []);
    }
  }

  // Step 2: Collect all edges (inline dependencies + external dependency files)
  const allEdges: GraphEdge[] = [];

  Array.from(nodes.values()).forEach(node => {
    for (const dep of node.primitive.dependencies) {
      allEdges.push({
        source: node.id,
        target: dep.target,
        type: dep.type,
        strength: dep.strength,
        description: dep.description,
      });
    }
  });

  for (const depFile of dependencyData) {
    for (const extEdge of depFile.edges) {
      allEdges.push({
        source: extEdge.source,
        target: extEdge.target,
        type: extEdge.type,
        strength: extEdge.strength,
        description: extEdge.description,
      });
    }
  }

  // Step 3: Referential integrity check (SAFE-02)
  const integrityErrors: GraphBuildError[] = [];

  for (const edge of allEdges) {
    const missingIds: string[] = [];

    if (!nodes.has(edge.source)) {
      missingIds.push(edge.source);
    }
    if (!nodes.has(edge.target)) {
      missingIds.push(edge.target);
    }

    if (missingIds.length > 0) {
      integrityErrors.push({
        type: 'integrity',
        message: `Referential integrity violation: edge ${edge.source} -> ${edge.target} references non-existent node(s): ${missingIds.join(', ')}`,
        details: missingIds,
      });
    }
  }

  if (integrityErrors.length > 0) {
    return { ok: false, graph: null, errors: integrityErrors };
  }

  // Populate adjacency list with validated edges
  for (const edge of allEdges) {
    const existing = adjacencyList.get(edge.source)!;
    existing.push(edge);
  }

  // Step 4: Cycle detection via Kahn's algorithm (SAFE-01)
  //
  // Edge direction: source -> target means "source depends on target"
  // In-degree of X = number of edges where X is the target
  // Nodes with in-degree 0 = nothing points to them = leaf consumers
  const inDegree = new Map<string, number>();
  Array.from(nodes.keys()).forEach(id => {
    inDegree.set(id, 0);
  });

  Array.from(adjacencyList.values()).forEach(edges => {
    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  });

  // Start with nodes that have no incoming edges
  const queue: string[] = [];
  Array.from(inDegree.entries()).forEach(([id, degree]) => {
    if (degree === 0) {
      queue.push(id);
    }
  });

  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);

    const outEdges = adjacencyList.get(current) ?? [];
    for (const edge of outEdges) {
      const newDegree = (inDegree.get(edge.target) ?? 1) - 1;
      inDegree.set(edge.target, newDegree);
      if (newDegree === 0) {
        queue.push(edge.target);
      }
    }
  }

  if (topologicalOrder.length < nodes.size) {
    // Cycle detected: nodes not in topological order are in cycles
    const sortedSet = new Set(topologicalOrder);
    const inCycle = Array.from(nodes.keys()).filter(id => !sortedSet.has(id));

    return {
      ok: false,
      graph: null,
      errors: [
        {
          type: 'cycle',
          message: `Cycle detected: ${inCycle.length} nodes involved in cycle(s)`,
          details: inCycle,
        },
      ],
    };
  }

  // Step 5: Build and return the graph
  // Kahn's with our edge direction produces dependents-first order.
  // Reverse to get dependencies-first (every node appears before its dependents).
  const reversedOrder = Array.from(topologicalOrder).reverse();

  const graph = DependencyGraph._create(nodes, adjacencyList, reversedOrder);

  return { ok: true, graph, errors: [] as [] };
}
