/**
 * Cross-Discipline Connection Map for the Mind-Body department.
 *
 * Encodes all bidirectional relationships between the 8 discipline wings
 * as specified in the vision document. Three universal connectors
 * (Breath, Relaxation, Philosophy) link to every other module.
 * Specific connections capture historical, complementary, and
 * shared-roots relationships.
 *
 * @module departments/mind-body/map/connection-map
 */

import type { MindBodyWingId } from '../types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Connection type describing the nature of the relationship */
export type ConnectionType = 'foundational' | 'complementary' | 'shared-roots' | 'philosophical';

/** A single connection between two disciplines */
export interface Connection {
  /** Source discipline */
  from: MindBodyWingId;

  /** Target discipline */
  to: MindBodyWingId;

  /** Nature of the relationship */
  type: ConnectionType;

  /** Human-readable description of the connection */
  description: string;

  /** All connections are bidirectional */
  bidirectional: true;
}

// ─── Raw Connection Data ─────────────────────────────────────────────────────

/** Helper to create a bidirectional connection pair */
function biConnect(
  from: MindBodyWingId,
  to: MindBodyWingId,
  type: ConnectionType,
  description: string,
): [Connection, Connection] {
  return [
    { from, to, type, description, bidirectional: true },
    { from: to, to: from, type, description, bidirectional: true },
  ];
}

const ALL_WINGS: MindBodyWingId[] = [
  'breath', 'meditation', 'yoga', 'pilates',
  'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
];

/**
 * Build the complete connection set from the vision document.
 *
 * Universal connectors (breath, relaxation, philosophy) connect to everything.
 * Specific connections capture unique relationships between disciplines.
 */
function buildConnections(): Connection[] {
  const connections: Connection[] = [];

  // ── Breath: foundational connection to every other module ──
  for (const wing of ALL_WINGS.filter((w) => w !== 'breath')) {
    const [fwd, rev] = biConnect(
      'breath',
      wing,
      'foundational',
      `Breath is the universal foundation -- every ${wing} practice begins and ends with the breath.`,
    );
    connections.push(fwd, rev);
  }

  // ── Relaxation: connects to every other practice module ──
  for (const wing of ALL_WINGS.filter((w) => w !== 'relaxation')) {
    // Skip if already connected via breath
    if (wing === 'breath') continue;
    const [fwd, rev] = biConnect(
      'relaxation',
      wing,
      'complementary',
      `Recovery is an essential component of every ${wing} practice -- not optional, but integral.`,
    );
    connections.push(fwd, rev);
  }

  // ── Philosophy: philosophical thread through every module ──
  for (const wing of ALL_WINGS.filter((w) => w !== 'philosophy')) {
    // Skip if already connected
    if (wing === 'breath' || wing === 'relaxation') continue;
    const [fwd, rev] = biConnect(
      'philosophy',
      wing,
      'philosophical',
      `The philosophical traditions underlying ${wing} -- from Zen to Taoism to the Yoga Sutras -- give depth and context to the physical practice.`,
    );
    connections.push(fwd, rev);
  }

  // ── Specific cross-discipline connections ──

  // Meditation <-> Martial Arts: historically inseparable
  const [medMa1, medMa2] = biConnect(
    'meditation',
    'martial-arts',
    'shared-roots',
    'Meditation and martial arts are historically inseparable -- the Shaolin Temple combined both from the beginning.',
  );
  connections.push(medMa1, medMa2);

  // Yoga <-> Pilates: complementary physical practices
  const [yogaPil1, yogaPil2] = biConnect(
    'yoga',
    'pilates',
    'complementary',
    'Yoga and Pilates complement each other -- flexibility and breath-movement from yoga, core stability and precision from Pilates.',
  );
  connections.push(yogaPil1, yogaPil2);

  // Yoga <-> Tai Chi: both link breath to movement
  const [yogaTc1, yogaTc2] = biConnect(
    'yoga',
    'tai-chi',
    'complementary',
    'Both yoga and tai chi link breath to movement -- vinyasa and tai chi forms share the principle of breath-synchronized motion.',
  );
  connections.push(yogaTc1, yogaTc2);

  // Martial Arts <-> Tai Chi: same roots
  const [maTc1, maTc2] = biConnect(
    'martial-arts',
    'tai-chi',
    'shared-roots',
    'Martial arts and tai chi share the same roots -- tai chi is a martial art practiced slowly to develop sensitivity and internal power.',
  );
  connections.push(maTc1, maTc2);

  return connections;
}

// ─── ConnectionMap Class ─────────────────────────────────────────────────────

/**
 * The cross-discipline connection map.
 *
 * Provides lookup of connections between any pair of Mind-Body disciplines.
 * All connections are bidirectional. Three universal connectors (breath,
 * relaxation, philosophy) link to every other module.
 */
export class ConnectionMap {
  private connections: Map<MindBodyWingId, Connection[]>;

  constructor() {
    this.connections = new Map();

    // Initialize empty arrays for all wings
    for (const wing of ALL_WINGS) {
      this.connections.set(wing, []);
    }

    // Build and index all connections
    const allConns = buildConnections();
    for (const conn of allConns) {
      const existing = this.connections.get(conn.from);
      if (existing) {
        // Deduplicate: don't add if this from->to pair already exists
        if (!existing.some((c) => c.to === conn.to)) {
          existing.push(conn);
        }
      }
    }
  }

  /**
   * Get all connections for a discipline.
   */
  getConnections(wingId: MindBodyWingId): Connection[] {
    const conns = this.connections.get(wingId);
    if (!conns) {
      throw new Error(`Unknown discipline: ${wingId}`);
    }
    return [...conns];
  }

  /**
   * Check if two disciplines are directly connected.
   */
  areConnected(a: MindBodyWingId, b: MindBodyWingId): boolean {
    const conns = this.connections.get(a);
    if (!conns) return false;
    return conns.some((c) => c.to === b);
  }

  /**
   * Get all connections as a Map.
   */
  getAllConnections(): Map<MindBodyWingId, Connection[]> {
    const result = new Map<MindBodyWingId, Connection[]>();
    for (const [wingId, conns] of this.connections.entries()) {
      result.set(wingId, [...conns]);
    }
    return result;
  }
}
