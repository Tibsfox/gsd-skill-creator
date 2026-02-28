/**
 * Dependency resolver for knowledge packs.
 *
 * Computes valid learning orders via Kahn's algorithm topological sort.
 * Detects cycles (including self-references), missing dependencies, and
 * builds a queryable directed graph of prerequisite relationships.
 *
 * All operations work on in-memory KnowledgePack[] arrays -- no filesystem I/O.
 */

import type { KnowledgePack } from './types.js';

// ============================================================================
// DependencyError
// ============================================================================

/**
 * Error thrown when dependency resolution fails due to cycles or
 * missing dependencies.
 */
export class DependencyError extends Error {
  override name = 'DependencyError' as const;

  constructor(
    message: string,
    /** Pack IDs involved in a cycle, if applicable. */
    public readonly cycle?: string[],
    /** Pack IDs referenced but not present in the input set. */
    public readonly missing?: string[],
  ) {
    super(message);
  }
}

// ============================================================================
// DependencyGraph
// ============================================================================

/**
 * Directed graph of pack dependencies with topological ordering.
 *
 * Constructed from a set of KnowledgePack records. The graph merges
 * each pack's `dependencies` and `prerequisite_packs` fields (deduped)
 * into a unified prerequisite relationship.
 */
export class DependencyGraph {
  /** pack -> its direct prerequisites (packs it depends on) */
  private readonly adjacency = new Map<string, Set<string>>();

  /** pack -> packs that depend on it (reverse edges) */
  private readonly reverse = new Map<string, Set<string>>();

  /** Topological order computed by Kahn's algorithm. */
  private readonly order: string[];

  constructor(packs: KnowledgePack[]) {
    const packIds = new Set(packs.map((p) => p.pack_id));

    // Initialize adjacency and reverse maps for every pack
    for (const id of packIds) {
      this.adjacency.set(id, new Set());
      this.reverse.set(id, new Set());
    }

    // Build edges from dependencies + prerequisite_packs (deduped)
    const allMissing: string[] = [];

    for (const pack of packs) {
      const prereqs = new Set([...pack.dependencies, ...pack.prerequisite_packs]);

      for (const dep of prereqs) {
        if (!packIds.has(dep)) {
          allMissing.push(dep);
          continue;
        }
        this.adjacency.get(pack.pack_id)!.add(dep);
        this.reverse.get(dep)!.add(pack.pack_id);
      }
    }

    // Fail early on missing dependencies
    if (allMissing.length > 0) {
      const unique = [...new Set(allMissing)];
      throw new DependencyError(
        `Missing dependencies: ${unique.join(', ')}`,
        undefined,
        unique,
      );
    }

    // Kahn's algorithm: topological sort
    this.order = this.topologicalSort(packIds);
  }

  /**
   * Kahn's algorithm topological sort with cycle detection.
   *
   * Computes in-degree for each node, seeds a queue with zero-in-degree
   * nodes, and processes the queue. If the result is shorter than the
   * input, a cycle exists among the remaining nodes.
   */
  private topologicalSort(packIds: Set<string>): string[] {
    // In-degree = number of prerequisites a pack has
    const inDegree = new Map<string, number>();

    for (const id of packIds) {
      inDegree.set(id, this.adjacency.get(id)!.size);
    }

    // Seed queue with packs that have no prerequisites
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // For each pack that depends on current, reduce its in-degree
      for (const dependent of this.reverse.get(current) ?? []) {
        const newDegree = inDegree.get(dependent)! - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    // If not all nodes processed, remaining nodes form cycles
    if (result.length !== packIds.size) {
      const cycleParticipants = [...packIds].filter(
        (id) => !result.includes(id),
      );
      throw new DependencyError(
        `Circular dependency detected among: ${cycleParticipants.join(', ')}`,
        cycleParticipants,
      );
    }

    return result;
  }

  /** Get direct prerequisites for a pack (packs it depends on). */
  getPrerequisites(packId: string): string[] {
    return [...(this.adjacency.get(packId) ?? [])];
  }

  /** Get packs that directly depend on this one. */
  getDependents(packId: string): string[] {
    return [...(this.reverse.get(packId) ?? [])];
  }

  /** Get the full topological order (prerequisites before dependents). */
  getOrderedList(): string[] {
    return [...this.order];
  }
}

// ============================================================================
// resolveDependencies
// ============================================================================

/**
 * Resolve dependencies for a set of knowledge packs.
 *
 * Builds a DependencyGraph using Kahn's algorithm topological sort.
 * Throws DependencyError on cycles or missing dependencies.
 *
 * @param packs - Array of knowledge packs to resolve
 * @returns A DependencyGraph with topological ordering
 * @throws DependencyError if cycles or missing dependencies are found
 */
export function resolveDependencies(packs: KnowledgePack[]): DependencyGraph {
  return new DependencyGraph(packs);
}
