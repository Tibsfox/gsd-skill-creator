/**
 * Connection Graph
 *
 * Directed graph of foundation relationships: sequential primary path
 * plus cross-connections that reveal deeper structural bonds between
 * mathematical ideas. Includes BFS shortest-path, graph layout, and
 * loop-closed detection.
 */

import type {
  FoundationId,
  FoundationConnection,
  GraphNode,
  GraphEdge,
  LearnerState,
} from '@/types';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types';
import { getFoundation } from '@/core/registry';

// ─── Connection Definitions ───────────────────────────

const SEQUENTIAL_CONNECTIONS: FoundationConnection[] = FOUNDATION_ORDER.slice(0, -1).map(
  (from, i) => ({
    from,
    to: FOUNDATION_ORDER[i + 1],
    relationship: 'sequential',
    strength: 1.0,
    bridgeConcept: `${from} leads naturally into ${FOUNDATION_ORDER[i + 1]}`,
    bidirectional: false,
  }),
);

const CROSS_CONNECTIONS: FoundationConnection[] = [
  {
    from: 'unit-circle',
    to: 'trigonometry',
    relationship: 'definitional',
    strength: 1.0,
    bridgeConcept: 'Trig IS the unit circle in motion',
    bidirectional: true,
  },
  {
    from: 'pythagorean',
    to: 'vector-calculus',
    relationship: 'generalization',
    strength: 0.7,
    bridgeConcept: 'Distance formula generalizes to n-dimensions',
    bidirectional: false,
  },
  {
    from: 'trigonometry',
    to: 'information-theory',
    relationship: 'application',
    strength: 0.6,
    bridgeConcept: 'Fourier analysis connects waves to signals',
    bidirectional: false,
  },
  {
    from: 'set-theory',
    to: 'category-theory',
    relationship: 'abstraction',
    strength: 0.9,
    bridgeConcept: 'Categories generalize sets',
    bidirectional: false,
  },
  {
    from: 'category-theory',
    to: 'information-theory',
    relationship: 'structural',
    strength: 0.5,
    bridgeConcept: 'Functors preserve channel structure',
    bidirectional: false,
  },
  {
    from: 'l-systems',
    to: 'unit-circle',
    relationship: 'cyclic',
    strength: 0.8,
    bridgeConcept: 'Growth patterns loop back — begin again',
    bidirectional: false,
  },
  {
    from: 'vector-calculus',
    to: 'l-systems',
    relationship: 'application',
    strength: 0.6,
    bridgeConcept: 'Gradient fields produce growth patterns',
    bidirectional: false,
  },
  {
    from: 'information-theory',
    to: 'set-theory',
    relationship: 'foundational',
    strength: 0.5,
    bridgeConcept: 'Entropy as measure on probability sets',
    bidirectional: false,
  },
];

/**
 * The complete set of connections includes sequential edges plus
 * cross-connections. Bidirectional connections generate an implicit
 * reverse edge (same metadata, from/to swapped).
 */
function buildAllConnections(): FoundationConnection[] {
  const all: FoundationConnection[] = [...SEQUENTIAL_CONNECTIONS, ...CROSS_CONNECTIONS];

  // Add reverse edges for bidirectional connections
  const reverses: FoundationConnection[] = [];
  for (const c of CROSS_CONNECTIONS) {
    if (c.bidirectional) {
      reverses.push({
        from: c.to,
        to: c.from,
        relationship: c.relationship,
        strength: c.strength,
        bridgeConcept: c.bridgeConcept,
        bidirectional: true,
      });
    }
  }

  return [...all, ...reverses];
}

const ALL_CONNECTIONS = buildAllConnections();

// ─── Adjacency index (lazily built once) ──────────────

type AdjIndex = Map<FoundationId, FoundationConnection[]>;

let _outgoing: AdjIndex | null = null;
let _incoming: AdjIndex | null = null;

function ensureIndices(): void {
  if (_outgoing && _incoming) return;

  _outgoing = new Map<FoundationId, FoundationConnection[]>();
  _incoming = new Map<FoundationId, FoundationConnection[]>();

  for (const id of FOUNDATION_ORDER) {
    _outgoing.set(id, []);
    _incoming.set(id, []);
  }

  for (const c of ALL_CONNECTIONS) {
    _outgoing.get(c.from)!.push(c);
    _incoming.get(c.to)!.push(c);
  }
}

// ─── Public API ───────────────────────────────────────

export function getConnection(from: FoundationId, to: FoundationId): FoundationConnection | null {
  return ALL_CONNECTIONS.find((c) => c.from === from && c.to === to) ?? null;
}

export function getOutgoing(from: FoundationId): FoundationConnection[] {
  ensureIndices();
  return _outgoing!.get(from) ?? [];
}

export function getIncoming(to: FoundationId): FoundationConnection[] {
  ensureIndices();
  return _incoming!.get(to) ?? [];
}

export function getAllConnections(): FoundationConnection[] {
  return [...ALL_CONNECTIONS];
}

/**
 * BFS shortest path from `from` to `to`.
 * Returns the ordered list of foundation IDs in the path (inclusive of both endpoints).
 * Returns an empty array if no path exists.
 */
export function getShortestPath(from: FoundationId, to: FoundationId): FoundationId[] {
  if (from === to) return [from];

  ensureIndices();

  const visited = new Set<FoundationId>();
  const parent = new Map<FoundationId, FoundationId>();
  const queue: FoundationId[] = [from];
  visited.add(from);

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const edge of _outgoing!.get(current) ?? []) {
      if (visited.has(edge.to)) continue;
      parent.set(edge.to, current);

      if (edge.to === to) {
        // Reconstruct path
        const path: FoundationId[] = [to];
        let node = to;
        while (parent.has(node)) {
          node = parent.get(node)!;
          path.unshift(node);
        }
        return path;
      }

      visited.add(edge.to);
      queue.push(edge.to);
    }
  }

  return []; // no path
}

/**
 * Returns all foundations reachable from `id` (via outgoing OR incoming edges)
 * with strength >= minStrength. Excludes `id` itself.
 */
export function getRelatedFoundations(id: FoundationId, minStrength = 0): FoundationId[] {
  ensureIndices();
  const related = new Set<FoundationId>();

  for (const c of _outgoing!.get(id) ?? []) {
    if (c.strength >= minStrength) related.add(c.to);
  }
  for (const c of _incoming!.get(id) ?? []) {
    if (c.strength >= minStrength) related.add(c.from);
  }

  related.delete(id);
  return [...related];
}

/**
 * Produces a circular layout for the 8 foundations.
 * Nodes sit on a circle of radius 300 (arbitrary viz units),
 * edges carry strength and directionality.
 */
export function getGraphLayout(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const RADIUS = 300;
  const CENTER_X = 0;
  const CENTER_Y = 0;
  const count = FOUNDATION_ORDER.length;

  const nodes: GraphNode[] = FOUNDATION_ORDER.map((id, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start at top
    const f = getFoundation(id);
    return {
      id,
      x: CENTER_X + RADIUS * Math.cos(angle),
      y: CENTER_Y + RADIUS * Math.sin(angle),
      label: f.name,
      color: f.color,
    };
  });

  // Deduplicate edges: for bidirectional connections only emit one edge
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const c of ALL_CONNECTIONS) {
    const key = c.bidirectional
      ? [c.from, c.to].sort().join('|')
      : `${c.from}|${c.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      from: c.from,
      to: c.to,
      strength: c.strength,
      bidirectional: c.bidirectional,
    });
  }

  return { nodes, edges };
}

/**
 * The loop is closed when a learner has completed ALL phases of both
 * unit-circle and l-systems — the first and last foundations.
 */
export function isLoopClosed(learnerState: LearnerState): boolean {
  const ucPhases = learnerState.completedPhases['unit-circle'] ?? [];
  const lsPhases = learnerState.completedPhases['l-systems'] ?? [];
  return (
    PHASE_ORDER.every((p) => ucPhases.includes(p)) &&
    PHASE_ORDER.every((p) => lsPhases.includes(p))
  );
}
