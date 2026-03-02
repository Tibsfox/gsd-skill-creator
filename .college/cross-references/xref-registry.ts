/**
 * XRefRegistry -- index of all cross-reference edges from dependency-graph.yaml.
 *
 * Provides O(1) lookup by source department, target department, or both.
 * All data comes from the static ALL_XREF_EDGES array -- no filesystem reads at runtime.
 *
 * @module cross-references/xref-registry
 */

import { ALL_XREF_EDGES } from './dependency-graph-xrefs.js';
import type { XRefEdge } from './dependency-graph-xrefs.js';

export class XRefRegistry {
  private readonly edges: readonly XRefEdge[];
  private readonly byFrom: Map<string, XRefEdge[]>;
  private readonly byTo: Map<string, XRefEdge[]>;

  constructor() {
    this.edges = ALL_XREF_EDGES;
    this.byFrom = new Map();
    this.byTo = new Map();

    for (const edge of this.edges) {
      if (!this.byFrom.has(edge.from)) this.byFrom.set(edge.from, []);
      if (!this.byTo.has(edge.to)) this.byTo.set(edge.to, []);
      this.byFrom.get(edge.from)!.push(edge);
      this.byTo.get(edge.to)!.push(edge);
    }
  }

  /** Total number of edges in the registry */
  countEdges(): number {
    return this.edges.length;
  }

  /** All edges where source department is 'from' */
  getEdgesFrom(from: string): XRefEdge[] {
    return this.byFrom.get(from) ?? [];
  }

  /** All edges where target department is 'to' */
  getEdgesTo(to: string): XRefEdge[] {
    return this.byTo.get(to) ?? [];
  }

  /**
   * All edges involving a department (as source or target).
   * Used to find all cross-reference partners for a given department.
   */
  getEdgesForDepartment(dept: string): XRefEdge[] {
    const from = this.byFrom.get(dept) ?? [];
    const to = this.byTo.get(dept) ?? [];
    return [...from, ...to];
  }

  /** All unique department IDs referenced in the edge graph */
  getDepartments(): string[] {
    const depts = new Set<string>();
    for (const edge of this.edges) {
      depts.add(edge.from);
      depts.add(edge.to);
    }
    return Array.from(depts).sort();
  }

  /** All edges as a flat array */
  getAll(): readonly XRefEdge[] {
    return this.edges;
  }
}
