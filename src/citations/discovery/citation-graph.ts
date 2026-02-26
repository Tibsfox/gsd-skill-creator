/**
 * Citation graph walker with forward and reverse trace.
 *
 * Builds tree structures representing citation chains. Forward trace
 * follows references outward (what does this work cite?). Reverse
 * trace follows provenance inward (what cites this work?).
 *
 * Cycle detection uses a visited set to prevent infinite recursion.
 *
 * @module citations/discovery/citation-graph
 */

import type { CitedWork } from '../types/index.js';
import type { CitationStore } from '../store/citation-db.js';
import type { ProvenanceTracker } from '../store/provenance-chain.js';

// ============================================================================
// Types
// ============================================================================

/** A node in the citation graph tree. */
export interface GraphNode {
  /** The resolved work, or null if not in the store. */
  work: CitedWork | null;
  /** The citation ID for this node. */
  citationId: string;
  /** Child nodes (references or citing works). */
  children: GraphNode[];
  /** Depth from the root node. */
  depth: number;
  /** Whether this work was fully resolved. */
  resolved: boolean;
}

/** Function that returns reference IDs for a given work (injectable for testing). */
export type ReferenceLookupFn = (work: CitedWork) => Promise<string[]>;

// ============================================================================
// CitationGraph
// ============================================================================

export class CitationGraph {
  private readonly store: CitationStore;
  private readonly provenance: ProvenanceTracker;
  private readonly referenceLookup: ReferenceLookupFn;

  /**
   * @param store - Citation store for work lookups.
   * @param provenance - Provenance tracker for reverse trace.
   * @param referenceLookup - Injectable function to find reference IDs
   *   for a given work. Defaults to returning empty array (no external API calls).
   */
  constructor(
    store: CitationStore,
    provenance: ProvenanceTracker,
    referenceLookup?: ReferenceLookupFn,
  ) {
    this.store = store;
    this.provenance = provenance;
    this.referenceLookup = referenceLookup ?? (() => Promise.resolve([]));
  }

  /**
   * Trace forward from a citation: find what it references.
   *
   * 1. Load the root work from the store.
   * 2. Use referenceLookup to find referenced citation IDs.
   * 3. Recursively trace each reference up to the given depth.
   * 4. Track visited set to prevent cycles.
   *
   * @param citationId - The root citation to trace from.
   * @param depth - Maximum traversal depth (default: 3).
   * @returns Tree rooted at the given citation.
   */
  async trace(citationId: string, depth = 3): Promise<GraphNode> {
    const visited = new Set<string>();
    return this.traceRecursive(citationId, depth, 0, visited);
  }

  /**
   * Reverse trace: find what cites the given work.
   *
   * Uses the provenance tracker to find artifacts that reference
   * this citation, then finds other citations in those same artifacts.
   *
   * @param citationId - The citation to reverse-trace.
   * @returns Tree rooted at the given citation with citing works as children.
   */
  async reverseTrace(citationId: string): Promise<GraphNode> {
    const work = await this.store.get(citationId);
    const visited = new Set<string>();
    visited.add(citationId);

    const children: GraphNode[] = [];

    // Find all provenance entries for this citation
    const entries = await this.provenance.getBySource(citationId);

    for (const entry of entries) {
      // For each artifact that references this citation, find other citations
      const coIds = await this.provenance.getByArtifact(entry.artifact_path);
      for (const coId of coIds) {
        if (visited.has(coId)) continue;
        visited.add(coId);

        const coWork = await this.store.get(coId);
        children.push({
          work: coWork,
          citationId: coId,
          children: [],
          depth: 1,
          resolved: coWork !== null,
        });
      }
    }

    return {
      work,
      citationId,
      children,
      depth: 0,
      resolved: work !== null,
    };
  }

  /**
   * Recursive trace with cycle detection.
   */
  private async traceRecursive(
    citationId: string,
    maxDepth: number,
    currentDepth: number,
    visited: Set<string>,
  ): Promise<GraphNode> {
    visited.add(citationId);

    const work = await this.store.get(citationId);
    const children: GraphNode[] = [];

    if (work && currentDepth < maxDepth) {
      // Get references for this work
      const refIds = await this.referenceLookup(work);

      for (const refId of refIds) {
        if (visited.has(refId)) {
          // Cycle detected: add a leaf node but don't recurse
          const refWork = await this.store.get(refId);
          children.push({
            work: refWork,
            citationId: refId,
            children: [],
            depth: currentDepth + 1,
            resolved: refWork !== null,
          });
          continue;
        }

        const child = await this.traceRecursive(refId, maxDepth, currentDepth + 1, visited);
        children.push(child);
      }
    }

    return {
      work,
      citationId,
      children,
      depth: currentDepth,
      resolved: work !== null,
    };
  }
}
