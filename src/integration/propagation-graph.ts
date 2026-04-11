/**
 * Failure Propagation Graph for GSD forensics.
 *
 * Extends forensics from single-failure-point identification to full
 * propagation graph construction. Maps how failures cascade through
 * phases, agents, files, and dependencies.
 *
 * # Model
 *
 * A propagation graph is a directed acyclic graph (DAG) where:
 *   - Nodes are failure events (root cause, intermediate effect, terminal symptom)
 *   - Edges are causal links with propagation type and confidence
 *   - Root nodes have no incoming edges (root causes)
 *   - Leaf nodes have no outgoing edges (terminal symptoms)
 *
 * # Failure Taxonomy (adapted from AgentRx 9-category model)
 *
 *   1. tool-misuse        — wrong tool for the task
 *   2. context-overflow    — context window exhaustion
 *   3. loop-detected       — stuck in a retry loop
 *   4. schema-violation    — output doesn't match expected schema
 *   5. dependency-failure  — upstream dependency failed
 *   6. permission-denied   — tool access blocked
 *   7. timeout             — operation exceeded time limit
 *   8. state-corruption    — inconsistent filesystem/git state
 *   9. scope-drift         — agent deviated from assigned scope
 *
 * @module integration/propagation-graph
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** Failure category from the 9-category taxonomy. */
export type FailureCategory =
  | 'tool-misuse'
  | 'context-overflow'
  | 'loop-detected'
  | 'schema-violation'
  | 'dependency-failure'
  | 'permission-denied'
  | 'timeout'
  | 'state-corruption'
  | 'scope-drift';

/** All failure categories. */
export const FAILURE_CATEGORIES: readonly FailureCategory[] = [
  'tool-misuse', 'context-overflow', 'loop-detected', 'schema-violation',
  'dependency-failure', 'permission-denied', 'timeout', 'state-corruption',
  'scope-drift',
] as const;

/** Severity levels. */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/** Node role in the propagation chain. */
export type NodeRole = 'root-cause' | 'intermediate' | 'symptom';

/** How a failure propagated from one node to another. */
export type PropagationType =
  | 'data-dependency'    // Output of A feeds into B
  | 'file-dependency'    // A writes a file that B reads
  | 'phase-sequence'     // A runs before B in the phase order
  | 'agent-delegation'   // A delegated work to B
  | 'shared-state'       // A and B share mutable state
  | 'git-conflict'       // A's changes conflict with B's
  | 'resource-exhaustion'; // A consumed a resource B needed

/** A node in the propagation graph — a single failure event. */
export interface FailureNode {
  /** Unique node ID. */
  id: string;
  /** What failed. */
  label: string;
  /** Failure category from the taxonomy. */
  category: FailureCategory;
  /** Role in the propagation chain. */
  role: NodeRole;
  /** Severity. */
  severity: Severity;
  /** When this failure was observed (ISO 8601). */
  observedAt: string;
  /** Which phase this failure occurred in. */
  phase?: string;
  /** Which agent was involved. */
  agent?: string;
  /** Files involved. */
  files?: string[];
  /** Human-readable description. */
  description: string;
  /** Evidence supporting this node (git hashes, log lines, etc.). */
  evidence: string[];
}

/** An edge in the propagation graph — a causal link between failures. */
export interface PropagationEdge {
  /** Source node ID (the cause). */
  from: string;
  /** Target node ID (the effect). */
  to: string;
  /** How the failure propagated. */
  type: PropagationType;
  /** Confidence in this causal link (0.0 to 1.0). */
  confidence: number;
  /** Explanation of the causal mechanism. */
  mechanism: string;
}

/** Summary analysis of a propagation graph. */
export interface GraphAnalysis {
  /** Root causes (nodes with no incoming edges). */
  rootCauses: FailureNode[];
  /** Terminal symptoms (nodes with no outgoing edges). */
  terminalSymptoms: FailureNode[];
  /** Critical path: longest chain from root to symptom. */
  criticalPath: FailureNode[];
  /** Blast radius: total nodes reachable from each root cause. */
  blastRadius: Map<string, number>;
  /** Most common failure category. */
  dominantCategory: FailureCategory;
  /** Total depth of the deepest propagation chain. */
  maxDepth: number;
}

// ─── PropagationGraph ───────────────────────────────────────────────────────

/**
 * Directed acyclic graph of failure propagation.
 *
 * Build incrementally: add nodes, then add edges describing how
 * failures cascade. Query for root causes, terminal symptoms,
 * critical paths, and blast radius.
 */
export class PropagationGraph {
  private readonly nodes = new Map<string, FailureNode>();
  private readonly edges: PropagationEdge[] = [];
  private readonly outgoing = new Map<string, PropagationEdge[]>();
  private readonly incoming = new Map<string, PropagationEdge[]>();

  /** Number of nodes. */
  get nodeCount(): number { return this.nodes.size; }

  /** Number of edges. */
  get edgeCount(): number { return this.edges.length; }

  // ─── Construction ─────────────────────────────────────────────────────

  /** Add a failure node. */
  addNode(node: FailureNode): void {
    this.nodes.set(node.id, node);
    if (!this.outgoing.has(node.id)) this.outgoing.set(node.id, []);
    if (!this.incoming.has(node.id)) this.incoming.set(node.id, []);
  }

  /** Add a causal edge between two nodes. */
  addEdge(edge: PropagationEdge): void {
    if (!this.nodes.has(edge.from)) {
      throw new Error(`PropagationGraph: source node '${edge.from}' not found`);
    }
    if (!this.nodes.has(edge.to)) {
      throw new Error(`PropagationGraph: target node '${edge.to}' not found`);
    }
    this.edges.push(edge);
    this.outgoing.get(edge.from)!.push(edge);
    this.incoming.get(edge.to)!.push(edge);
  }

  /** Get a node by ID. */
  getNode(id: string): FailureNode | undefined {
    return this.nodes.get(id);
  }

  /** Get all nodes. */
  allNodes(): FailureNode[] {
    return Array.from(this.nodes.values());
  }

  /** Get all edges. */
  allEdges(): PropagationEdge[] {
    return [...this.edges];
  }

  // ─── Topology queries ─────────────────────────────────────────────────

  /** Root causes: nodes with no incoming edges. */
  rootCauses(): FailureNode[] {
    return Array.from(this.nodes.values()).filter(
      n => (this.incoming.get(n.id)?.length ?? 0) === 0,
    );
  }

  /** Terminal symptoms: nodes with no outgoing edges. */
  terminalSymptoms(): FailureNode[] {
    return Array.from(this.nodes.values()).filter(
      n => (this.outgoing.get(n.id)?.length ?? 0) === 0,
    );
  }

  /** Direct effects of a node. */
  effectsOf(nodeId: string): FailureNode[] {
    const edges = this.outgoing.get(nodeId) ?? [];
    return edges.map(e => this.nodes.get(e.to)!).filter(Boolean);
  }

  /** Direct causes of a node. */
  causesOf(nodeId: string): FailureNode[] {
    const edges = this.incoming.get(nodeId) ?? [];
    return edges.map(e => this.nodes.get(e.from)!).filter(Boolean);
  }

  /**
   * Blast radius: count of all nodes reachable from a given node
   * (transitive closure of outgoing edges).
   */
  blastRadius(nodeId: string): number {
    const visited = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      for (const edge of this.outgoing.get(id) ?? []) {
        if (!visited.has(edge.to)) stack.push(edge.to);
      }
    }
    return visited.size - 1; // Exclude the starting node
  }

  /**
   * All ancestors: nodes that transitively caused this node.
   */
  ancestors(nodeId: string): FailureNode[] {
    const visited = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      for (const edge of this.incoming.get(id) ?? []) {
        if (!visited.has(edge.from)) stack.push(edge.from);
      }
    }
    visited.delete(nodeId);
    return Array.from(visited).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Critical path: longest chain from any root cause to any terminal symptom.
   * Returns the nodes along that path in order.
   */
  criticalPath(): FailureNode[] {
    const roots = this.rootCauses();
    let longest: string[] = [];

    for (const root of roots) {
      const path = this.longestPathFrom(root.id);
      if (path.length > longest.length) longest = path;
    }

    return longest.map(id => this.nodes.get(id)!);
  }

  private longestPathFrom(nodeId: string): string[] {
    const children = this.outgoing.get(nodeId) ?? [];
    if (children.length === 0) return [nodeId];

    let best: string[] = [];
    for (const edge of children) {
      const sub = this.longestPathFrom(edge.to);
      if (sub.length > best.length) best = sub;
    }
    return [nodeId, ...best];
  }

  /**
   * Max depth of the graph (longest path from any root to any leaf).
   */
  maxDepth(): number {
    return this.criticalPath().length - 1;
  }

  // ─── Analysis ─────────────────────────────────────────────────────────

  /** Produce a full analysis of the propagation graph. */
  analyze(): GraphAnalysis {
    const roots = this.rootCauses();
    const symptoms = this.terminalSymptoms();
    const path = this.criticalPath();

    const blast = new Map<string, number>();
    for (const root of roots) {
      blast.set(root.id, this.blastRadius(root.id));
    }

    // Dominant category
    const categoryCounts = new Map<FailureCategory, number>();
    for (const node of this.nodes.values()) {
      categoryCounts.set(node.category, (categoryCounts.get(node.category) ?? 0) + 1);
    }
    let dominant: FailureCategory = 'tool-misuse';
    let maxCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > maxCount) { dominant = cat; maxCount = count; }
    }

    return {
      rootCauses: roots,
      terminalSymptoms: symptoms,
      criticalPath: path,
      blastRadius: blast,
      dominantCategory: dominant,
      maxDepth: path.length > 0 ? path.length - 1 : 0,
    };
  }

  // ─── Role assignment ──────────────────────────────────────────────────

  /**
   * Auto-assign roles based on graph topology.
   * Nodes with no incoming edges → root-cause.
   * Nodes with no outgoing edges → symptom.
   * Everything else → intermediate.
   */
  assignRoles(): void {
    for (const node of this.nodes.values()) {
      const hasIncoming = (this.incoming.get(node.id)?.length ?? 0) > 0;
      const hasOutgoing = (this.outgoing.get(node.id)?.length ?? 0) > 0;

      if (!hasIncoming) node.role = 'root-cause';
      else if (!hasOutgoing) node.role = 'symptom';
      else node.role = 'intermediate';
    }
  }

  // ─── Filtering ────────────────────────────────────────────────────────

  /** Get all nodes of a specific category. */
  nodesByCategory(category: FailureCategory): FailureNode[] {
    return Array.from(this.nodes.values()).filter(n => n.category === category);
  }

  /** Get all nodes of a specific severity. */
  nodeBySeverity(severity: Severity): FailureNode[] {
    return Array.from(this.nodes.values()).filter(n => n.severity === severity);
  }

  /** Get all nodes for a specific phase. */
  nodesByPhase(phase: string): FailureNode[] {
    return Array.from(this.nodes.values()).filter(n => n.phase === phase);
  }

  /** Get all edges of a specific propagation type. */
  edgesByType(type: PropagationType): PropagationEdge[] {
    return this.edges.filter(e => e.type === type);
  }
}

// ─── Builder ────────────────────────────────────────────────────────────────

/** Convenience builder for constructing propagation graphs. */
export class PropagationGraphBuilder {
  private readonly graph = new PropagationGraph();
  private nodeCounter = 0;

  /** Generate a unique node ID. */
  private nextId(): string {
    return `F${++this.nodeCounter}`;
  }

  /** Add a root cause node. */
  rootCause(opts: {
    label: string;
    category: FailureCategory;
    severity: Severity;
    description: string;
    phase?: string;
    agent?: string;
    files?: string[];
    evidence?: string[];
  }): string {
    const id = this.nextId();
    this.graph.addNode({
      id,
      label: opts.label,
      category: opts.category,
      role: 'root-cause',
      severity: opts.severity,
      observedAt: new Date().toISOString(),
      description: opts.description,
      phase: opts.phase,
      agent: opts.agent,
      files: opts.files,
      evidence: opts.evidence ?? [],
    });
    return id;
  }

  /** Add an intermediate or symptom node. */
  effect(opts: {
    label: string;
    category: FailureCategory;
    severity: Severity;
    description: string;
    phase?: string;
    agent?: string;
    files?: string[];
    evidence?: string[];
  }): string {
    const id = this.nextId();
    this.graph.addNode({
      id,
      label: opts.label,
      category: opts.category,
      role: 'intermediate', // Will be reassigned by assignRoles()
      severity: opts.severity,
      observedAt: new Date().toISOString(),
      description: opts.description,
      phase: opts.phase,
      agent: opts.agent,
      files: opts.files,
      evidence: opts.evidence ?? [],
    });
    return id;
  }

  /** Add a causal link. */
  link(from: string, to: string, type: PropagationType, mechanism: string, confidence = 0.9): this {
    this.graph.addEdge({ from, to, type, confidence, mechanism });
    return this;
  }

  /** Finalize: assign roles and return the graph. */
  build(): PropagationGraph {
    this.graph.assignRoles();
    return this.graph;
  }
}
