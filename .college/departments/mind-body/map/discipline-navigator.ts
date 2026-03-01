/**
 * Discipline Navigator for the Mind-Body department.
 *
 * Provides pathfinding between any two disciplines using the connection map.
 * Uses BFS to find shortest paths. Every discipline is reachable from every
 * other (the graph is fully connected via universal connectors).
 *
 * @module departments/mind-body/map/discipline-navigator
 */

import type { MindBodyWingId } from '../types.js';
import { ConnectionMap } from './connection-map.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A navigation path between two disciplines */
export interface NavigationPath {
  /** Starting discipline */
  from: MindBodyWingId;

  /** Destination discipline */
  to: MindBodyWingId;

  /** Intermediate disciplines traversed (empty for direct connections) */
  via: MindBodyWingId[];

  /** Number of hops (1 = direct connection) */
  distance: number;
}

// ─── Navigator ───────────────────────────────────────────────────────────────

const ALL_WINGS: MindBodyWingId[] = [
  'breath', 'meditation', 'yoga', 'pilates',
  'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
];

/**
 * Discipline Navigator -- finds paths between disciplines.
 *
 * Uses BFS over the connection map to find the shortest path between
 * any two disciplines. The graph is guaranteed to be fully connected
 * because breath, relaxation, and philosophy each connect to every
 * other discipline.
 */
export class DisciplineNavigator {
  private connectionMap: ConnectionMap;

  constructor(connectionMap?: ConnectionMap) {
    this.connectionMap = connectionMap ?? new ConnectionMap();
  }

  /**
   * Find the shortest path between two disciplines.
   *
   * Uses BFS to find the shortest path. Returns a NavigationPath with
   * the intermediate disciplines and total distance.
   */
  navigate(from: MindBodyWingId, to: MindBodyWingId): NavigationPath {
    if (from === to) {
      return { from, to, via: [], distance: 0 };
    }

    // BFS
    const visited = new Set<MindBodyWingId>([from]);
    const queue: Array<{ node: MindBodyWingId; path: MindBodyWingId[] }> = [
      { node: from, path: [] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const connections = this.connectionMap.getConnections(current.node);

      for (const conn of connections) {
        if (conn.to === to) {
          // Found destination
          return {
            from,
            to,
            via: current.path,
            distance: current.path.length + 1,
          };
        }

        if (!visited.has(conn.to)) {
          visited.add(conn.to);
          queue.push({
            node: conn.to,
            path: [...current.path, current.node === from ? undefined! : current.node].filter(
              (x): x is MindBodyWingId => x !== undefined,
            ),
          });
        }
      }
    }

    // Should never happen -- graph is fully connected
    throw new Error(`No path found from ${from} to ${to}`);
  }

  /**
   * Get all disciplines reachable from a given discipline.
   *
   * In the Mind-Body map, this always returns all 7 other disciplines
   * because the graph is fully connected.
   */
  getReachable(from: MindBodyWingId): MindBodyWingId[] {
    const visited = new Set<MindBodyWingId>([from]);
    const queue: MindBodyWingId[] = [from];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const connections = this.connectionMap.getConnections(current);

      for (const conn of connections) {
        if (!visited.has(conn.to)) {
          visited.add(conn.to);
          queue.push(conn.to);
        }
      }
    }

    // Remove the starting point from the reachable set
    visited.delete(from);
    return Array.from(visited);
  }
}
