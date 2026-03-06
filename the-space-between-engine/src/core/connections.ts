// Connection Graph — Models relationships between the 8 foundations as a directed graph.
// Powers the Telescope view, cross-foundation discovery, and non-linear path suggestions.

import type {
  FoundationId,
  FoundationConnection,
  CrossDomainNode,
  GraphNode,
  GraphEdge,
  LearnerState,
} from '../types/index';

import { FOUNDATION_ORDER } from '../types/index';
import { getFoundation } from './registry';

// ─── Connection Graph ───────────────────────────────────────

export class ConnectionGraph {
  private connections: FoundationConnection[] = [];
  private outgoing: Map<FoundationId, FoundationConnection[]> = new Map();
  private incoming: Map<FoundationId, FoundationConnection[]> = new Map();
  private crossDomainNodes: CrossDomainNode[] = [];

  constructor() {
    // Initialize adjacency maps for all foundations
    for (const id of FOUNDATION_ORDER) {
      this.outgoing.set(id, []);
      this.incoming.set(id, []);
    }
  }

  // ── Mutation (used only during initialization) ──────────

  addConnection(conn: FoundationConnection): void {
    this.connections.push(conn);
    this.outgoing.get(conn.from)!.push(conn);
    this.incoming.get(conn.to)!.push(conn);

    // For bidirectional connections, add the reverse edge
    if (conn.bidirectional) {
      const reverse: FoundationConnection = {
        from: conn.to,
        to: conn.from,
        relationship: conn.relationship,
        strength: conn.strength,
        bridgeConcept: conn.bridgeConcept,
        bidirectional: true,
        connectionType: conn.connectionType,
      };
      this.connections.push(reverse);
      this.outgoing.get(conn.to)!.push(reverse);
      this.incoming.get(conn.from)!.push(reverse);
    }
  }

  addCrossDomainNode(node: CrossDomainNode): void {
    this.crossDomainNodes.push(node);
  }

  // ── Query ───────────────────────────────────────────────

  getConnection(from: FoundationId, to: FoundationId): FoundationConnection | null {
    return this.connections.find(c => c.from === from && c.to === to) ?? null;
  }

  getOutgoing(from: FoundationId): FoundationConnection[] {
    return this.outgoing.get(from) ?? [];
  }

  getIncoming(to: FoundationId): FoundationConnection[] {
    return this.incoming.get(to) ?? [];
  }

  getAllConnections(): FoundationConnection[] {
    return [...this.connections];
  }

  // ── Traversal ───────────────────────────────────────────

  /**
   * BFS shortest path from `from` to `to`.
   * Tie-breaking: when multiple neighbors are at the same BFS depth,
   * prefer the one with lower Foundation.order.
   * Returns the sequence of FoundationIds from `from` to `to` inclusive.
   */
  getShortestPath(from: FoundationId, to: FoundationId): FoundationId[] {
    if (from === to) return [from];

    const visited = new Set<FoundationId>();
    const parent = new Map<FoundationId, FoundationId>();
    const queue: FoundationId[] = [from];
    visited.add(from);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Get neighbors, sorted by foundation order for deterministic tie-breaking
      const neighbors = this.getOutgoing(current)
        .map(c => c.to)
        .filter(n => !visited.has(n))
        .sort((a, b) => FOUNDATION_ORDER.indexOf(a) - FOUNDATION_ORDER.indexOf(b));

      // Deduplicate neighbors (bidirectional edges can produce duplicates)
      const uniqueNeighbors = [...new Set(neighbors)];

      for (const neighbor of uniqueNeighbors) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        parent.set(neighbor, current);

        if (neighbor === to) {
          // Reconstruct path
          const path: FoundationId[] = [to];
          let node: FoundationId = to;
          while (node !== from) {
            node = parent.get(node)!;
            path.unshift(node);
          }
          return path;
        }

        queue.push(neighbor);
      }
    }

    // No path found — return empty array
    return [];
  }

  /**
   * Returns all foundations related to `id` (connected by outgoing or incoming edges),
   * optionally filtered by minimum connection strength.
   */
  getRelatedFoundations(id: FoundationId, minStrength: number = 0): FoundationId[] {
    const related = new Set<FoundationId>();

    for (const conn of this.getOutgoing(id)) {
      if (conn.strength >= minStrength) {
        related.add(conn.to);
      }
    }
    for (const conn of this.getIncoming(id)) {
      if (conn.strength >= minStrength) {
        related.add(conn.from);
      }
    }

    // Sort by foundation order for consistency
    return [...related].sort(
      (a, b) => FOUNDATION_ORDER.indexOf(a) - FOUNDATION_ORDER.indexOf(b)
    );
  }

  // ── Visualization Support ───────────────────────────────

  /**
   * Returns a pre-computed circular layout for the 8 foundations.
   * Foundations are arranged in a circle, evenly spaced.
   */
  getGraphLayout(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const centerX = 400;
    const centerY = 400;
    const radius = 300;

    const nodes: GraphNode[] = FOUNDATION_ORDER.map((id, index) => {
      const angle = (2 * Math.PI * index) / FOUNDATION_ORDER.length - Math.PI / 2;
      const foundation = getFoundation(id);
      return {
        id,
        label: foundation.name,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        color: foundation.color,
      };
    });

    // Deduplicate edges: for bidirectional, only include one edge with bidirectional=true
    const edgeSet = new Set<string>();
    const edges: GraphEdge[] = [];

    for (const conn of this.connections) {
      const key = conn.bidirectional
        ? [conn.from, conn.to].sort().join('--')
        : `${conn.from}->${conn.to}`;

      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({
          from: conn.from,
          to: conn.to,
          strength: conn.strength,
          bidirectional: conn.bidirectional,
        });
      }
    }

    return { nodes, edges };
  }

  // ── Cross-Domain Nodes ──────────────────────────────────

  getCrossDomainNodes(): CrossDomainNode[] {
    return [...this.crossDomainNodes];
  }

  getCrossDomainNode(name: string): CrossDomainNode | null {
    return this.crossDomainNodes.find(n => n.name === name) ?? null;
  }

  // ── Loop Detection ──────────────────────────────────────

  /**
   * The "loop" is closed when the learner has completed both unit-circle (foundation 1)
   * and l-systems (foundation 8), representing the journey coming full circle.
   */
  isLoopClosed(learnerState: LearnerState): boolean {
    const ucPhases = learnerState.completedPhases['unit-circle'] ?? [];
    const lsPhases = learnerState.completedPhases['l-systems'] ?? [];

    const allPhases: string[] = ['wonder', 'see', 'touch', 'understand', 'connect', 'create'];
    const ucComplete = allPhases.every(p => ucPhases.includes(p as any));
    const lsComplete = allPhases.every(p => lsPhases.includes(p as any));

    return ucComplete && lsComplete;
  }
}

// ─── Default Graph Instance ─────────────────────────────────

/**
 * Creates and returns the default ConnectionGraph with all 8 connections
 * and 2 cross-domain nodes pre-initialized.
 */
export function createDefaultGraph(): ConnectionGraph {
  const graph = new ConnectionGraph();

  // ── 8 defined connections ──────────────────────────────

  // 1. Unit Circle <-> Trigonometry (bidirectional, isomorphism, strength 1.0)
  graph.addConnection({
    from: 'unit-circle',
    to: 'trigonometry',
    relationship: 'Trigonometry IS the unit circle in motion — the angle changes over time',
    strength: 1.0,
    bridgeConcept: 'Circular motion becomes wave motion when plotted against time',
    bidirectional: true,
    connectionType: 'isomorphism',
  });

  // 2. Pythagorean -> Vector Calculus (strength 0.85, isomorphism)
  graph.addConnection({
    from: 'pythagorean',
    to: 'vector-calculus',
    relationship: 'The distance formula generalizes the Pythagorean theorem to n dimensions',
    strength: 0.85,
    bridgeConcept: 'Perpendicular components combining into magnitude',
    bidirectional: false,
    connectionType: 'isomorphism',
  });

  // 3. Trigonometry -> Information Theory (strength 0.8, isomorphism)
  graph.addConnection({
    from: 'trigonometry',
    to: 'information-theory',
    relationship: 'Fourier analysis decomposes signals into sine waves — trigonometry IS signal theory',
    strength: 0.8,
    bridgeConcept: 'Fourier decomposition — every signal is a sum of sinusoids',
    bidirectional: false,
    connectionType: 'isomorphism',
  });

  // 4. Set Theory -> Category Theory (strength 0.9, isomorphism)
  graph.addConnection({
    from: 'set-theory',
    to: 'category-theory',
    relationship: 'Categories generalize sets — sets and functions form the prototypical category',
    strength: 0.9,
    bridgeConcept: 'Objects as sets, morphisms as functions — Set is a category',
    bidirectional: false,
    connectionType: 'isomorphism',
  });

  // 5. Category Theory -> Information Theory (strength 0.7, analogy)
  graph.addConnection({
    from: 'category-theory',
    to: 'information-theory',
    relationship: 'Functors preserve channel structure — information channels are categorical morphisms',
    strength: 0.7,
    bridgeConcept: 'Channels as morphisms in a category of information types',
    bidirectional: false,
    connectionType: 'analogy',
  });

  // 6. L-Systems -> Unit Circle (strength 0.75, analogy — "begin again")
  graph.addConnection({
    from: 'l-systems',
    to: 'unit-circle',
    relationship: 'Growth patterns loop back to circular recursion — the journey becomes a circle',
    strength: 0.75,
    bridgeConcept: 'The "begin again" moment — L-System angles live on the unit circle',
    bidirectional: false,
    connectionType: 'analogy',
  });

  // 7. Vector Calculus -> L-Systems (strength 0.65, analogy)
  graph.addConnection({
    from: 'vector-calculus',
    to: 'l-systems',
    relationship: 'Gradient fields produce growth patterns — plants grow along light and gravity vector fields',
    strength: 0.65,
    bridgeConcept: 'Growth direction follows biological vector fields',
    bidirectional: false,
    connectionType: 'analogy',
  });

  // 8. Information Theory -> Set Theory (strength 0.7, isomorphism)
  graph.addConnection({
    from: 'information-theory',
    to: 'set-theory',
    relationship: 'Entropy is a measure on probability sets — information content defined through set measure',
    strength: 0.7,
    bridgeConcept: 'Probability distributions as measures on event sets',
    bidirectional: false,
    connectionType: 'isomorphism',
  });

  // ── Cross-Domain Nodes ─────────────────────────────────

  graph.addCrossDomainNode({
    name: 'birdsong',
    foundations: ['trigonometry', 'information-theory', 'l-systems'],
    description: 'A single thrush teaches three foundations simultaneously: Fourier decomposition of song into frequency components (trigonometry), territory encoding over a noisy channel (information theory), and recursive syllable grammars iterated by rules (L-Systems). When the learner encounters birdsong across multiple wings, the triple connection surfaces as a unit-circle moment.',
  });

  graph.addCrossDomainNode({
    name: 'compass-fox',
    foundations: ['vector-calculus', 'information-theory', 'set-theory'],
    description: 'The compass fox threads through three foundations: sensing the magnetic field as a vector field (vector calculus), the fox\'s nervous system as an information channel encoding field data (information theory), and the fox\'s identity as a persistent pattern — a boundary condition (set theory). The learner IS the fox, navigating by invisible fields.',
  });

  return graph;
}
