/**
 * Cross-pack connection mapper.
 *
 * Builds a directed graph from enables, related_packs, dependencies, and
 * prerequisite_packs metadata on knowledge packs. Supports incoming/outgoing
 * edge queries for navigation and visualization.
 *
 * Operates on in-memory KnowledgePack[] arrays -- no filesystem I/O.
 */

import type { KnowledgePack } from './types.js';

// ============================================================================
// ConnectionEdge
// ============================================================================

/**
 * A directed edge in the connection graph.
 *
 * - `enables`: pack A enables pack B (A -> B)
 * - `related`: packs are related (conceptual link)
 * - `prerequisite`: pack A is a prerequisite for pack B (A -> B)
 */
export interface ConnectionEdge {
  from: string;
  to: string;
  type: 'enables' | 'related' | 'prerequisite';
  description?: string;
}

// ============================================================================
// ConnectionGraph
// ============================================================================

/**
 * Directed graph of cross-pack connections.
 *
 * Built from enables, related_packs, dependencies, and prerequisite_packs
 * fields on KnowledgePack records. Indexes edges by source and target
 * for efficient incoming/outgoing queries.
 */
export class ConnectionGraph {
  private readonly edges: ConnectionEdge[] = [];
  private readonly outgoing = new Map<string, ConnectionEdge[]>();
  private readonly incoming = new Map<string, ConnectionEdge[]>();
  private readonly nodes: Set<string>;

  constructor(packs: KnowledgePack[]) {
    this.nodes = new Set(packs.map((p) => p.pack_id));

    // Initialize maps for all nodes
    for (const id of this.nodes) {
      this.outgoing.set(id, []);
      this.incoming.set(id, []);
    }

    // Build edges from all relationship types
    for (const pack of packs) {
      // Enables edges: this pack enables others
      for (const targetId of pack.enables ?? []) {
        this.addEdge({
          from: pack.pack_id,
          to: targetId,
          type: 'enables',
        });
      }

      // Related packs: conceptual relationship
      for (const related of pack.related_packs ?? []) {
        this.addEdge({
          from: pack.pack_id,
          to: related.id,
          type: 'related',
          description: related.relationship,
        });
      }

      // Prerequisite edges from dependencies
      for (const depId of pack.dependencies ?? []) {
        this.addEdge({
          from: depId,
          to: pack.pack_id,
          type: 'prerequisite',
        });
      }

      // Prerequisite edges from prerequisite_packs (dedup with dependencies)
      const depsSet = new Set(pack.dependencies ?? []);
      for (const prereqId of pack.prerequisite_packs ?? []) {
        if (!depsSet.has(prereqId)) {
          this.addEdge({
            from: prereqId,
            to: pack.pack_id,
            type: 'prerequisite',
          });
        }
      }
    }
  }

  /** Add an edge and index it in outgoing/incoming maps. */
  private addEdge(edge: ConnectionEdge): void {
    this.edges.push(edge);

    // Index outgoing (from -> edge)
    const out = this.outgoing.get(edge.from);
    if (out) {
      out.push(edge);
    } else {
      this.outgoing.set(edge.from, [edge]);
    }

    // Index incoming (to -> edge)
    const inc = this.incoming.get(edge.to);
    if (inc) {
      inc.push(edge);
    } else {
      this.incoming.set(edge.to, [edge]);
    }
  }

  /** Get all connections (incoming + outgoing) for a pack. */
  getConnections(packId: string): ConnectionEdge[] {
    const out = this.outgoing.get(packId) ?? [];
    const inc = this.incoming.get(packId) ?? [];
    return [...out, ...inc];
  }

  /** Get edges pointing TO this pack (other packs connect to it). */
  getIncoming(packId: string): ConnectionEdge[] {
    return [...(this.incoming.get(packId) ?? [])];
  }

  /** Get edges pointing FROM this pack (it connects to others). */
  getOutgoing(packId: string): ConnectionEdge[] {
    return [...(this.outgoing.get(packId) ?? [])];
  }

  /** Get all edges in the graph. */
  getAllEdges(): ConnectionEdge[] {
    return [...this.edges];
  }

  /** Get all pack IDs in the graph. */
  getNodes(): string[] {
    return [...this.nodes];
  }
}

// ============================================================================
// buildConnectionGraph
// ============================================================================

/**
 * Build a connection graph from a set of knowledge packs.
 *
 * Extracts enables, related_packs, dependencies, and prerequisite_packs
 * from each pack and builds a directed graph for navigation/visualization.
 *
 * @param packs - Array of knowledge packs
 * @returns A ConnectionGraph with all edges indexed
 */
export function buildConnectionGraph(packs: KnowledgePack[]): ConnectionGraph {
  return new ConnectionGraph(packs);
}
