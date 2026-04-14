/**
 * Peer model for bidirectional trust relationships.
 *
 * Generalizes the existing unidirectional trust systems (trust-manager.ts
 * handles server→trust, trust-store.ts handles pattern→approval) into a
 * symmetric peer model inspired by Honcho's architecture.
 *
 * In the Honcho model, both humans and AI agents are "peers" with uniform
 * identity and mutual trust attributes. This module implements that pattern:
 *
 *   - A `Peer` is any entity (user, agent, team, service, MCP server)
 *   - A `PeerRelationship` is a bidirectional trust link between two peers
 *   - Trust is asymmetric within a relationship: A may trust B more than B trusts A
 *   - Trust evolves through interactions and can be independently promoted/demoted
 *
 * # Trust Levels
 *
 *   stranger → acquaintance → colleague → trusted → delegate
 *
 * - stranger: no prior interaction, maximum caution
 * - acquaintance: some interaction, basic capabilities allowed
 * - colleague: regular interaction, most capabilities allowed
 * - trusted: established relationship, elevated access
 * - delegate: full delegation authority, can act on behalf of
 *
 * # Key Principle
 *
 * Trust is earned through interaction, not declared. Each successful interaction
 * increments the trust score. Failures or violations reset trust. This maps to
 * our existing trust-store.ts decay model but generalizes it to arbitrary peer pairs.
 *
 * @module memory/peer-trust
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** Peer type classification. */
export type PeerKind = 'user' | 'agent' | 'team' | 'service' | 'mcp-server';

/** Trust levels from lowest to highest. */
export type PeerTrustLevel = 'stranger' | 'acquaintance' | 'colleague' | 'trusted' | 'delegate';

/** All trust levels in promotion order. */
export const PEER_TRUST_LEVELS: readonly PeerTrustLevel[] = [
  'stranger',
  'acquaintance',
  'colleague',
  'trusted',
  'delegate',
] as const;

/** A peer — any entity in the system. */
export interface Peer {
  /** Unique identifier. */
  id: string;
  /** What kind of entity this is. */
  kind: PeerKind;
  /** Human-readable name. */
  displayName: string;
  /** When this peer was first registered. */
  registeredAt: string;
  /** Arbitrary metadata (capabilities, preferences, etc.). */
  metadata: Record<string, unknown>;
}

/** One side of a trust relationship. */
export interface TrustEdge {
  /** Trust level this peer grants to the other. */
  level: PeerTrustLevel;
  /** Number of successful interactions. */
  positiveInteractions: number;
  /** Number of failed or violated interactions. */
  negativeInteractions: number;
  /** When this trust level was last updated. */
  updatedAt: string;
  /** Specific capabilities delegated at this trust level. */
  delegatedCapabilities: string[];
}

/** A bidirectional trust relationship between two peers. */
export interface PeerRelationship {
  /** The two peer IDs in this relationship (sorted lexicographically). */
  peerIds: [string, string];
  /** Trust from peerIds[0] toward peerIds[1]. */
  forward: TrustEdge;
  /** Trust from peerIds[1] toward peerIds[0]. */
  reverse: TrustEdge;
  /** When this relationship was established. */
  establishedAt: string;
  /** Interaction history summary. */
  totalInteractions: number;
}

/** Event types for the trust audit log. */
export type TrustEvent =
  | { type: 'peer_registered'; peerId: string; kind: PeerKind }
  | { type: 'relationship_created'; peerIds: [string, string] }
  | { type: 'trust_promoted'; from: string; to: string; newLevel: PeerTrustLevel; reason: string }
  | { type: 'trust_demoted'; from: string; to: string; newLevel: PeerTrustLevel; reason: string }
  | { type: 'trust_reset'; from: string; to: string; reason: string }
  | { type: 'capability_delegated'; from: string; to: string; capability: string }
  | { type: 'capability_revoked'; from: string; to: string; capability: string };

export interface TrustAuditEntry {
  event: TrustEvent;
  timestamp: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sortedPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

function relationshipKey(a: string, b: string): string {
  const [lo, hi] = sortedPair(a, b);
  return `${lo}:${hi}`;
}

function defaultEdge(now: string): TrustEdge {
  return {
    level: 'stranger',
    positiveInteractions: 0,
    negativeInteractions: 0,
    updatedAt: now,
    delegatedCapabilities: [],
  };
}

function levelIndex(level: PeerTrustLevel): number {
  return PEER_TRUST_LEVELS.indexOf(level);
}

function levelForScore(positive: number, negative: number): PeerTrustLevel {
  const net = positive - negative * 3; // Failures weigh 3x
  if (net < 1) return 'stranger';
  if (net < 3) return 'acquaintance';
  if (net < 8) return 'colleague';
  if (net < 20) return 'trusted';
  return 'delegate';
}

// ─── PeerTrustRegistry ──────────────────────────────────────────────────────

/**
 * In-memory registry of peers and their trust relationships.
 * Bidirectional: trust from A→B is independent of trust from B→A.
 */
export class PeerTrustRegistry {
  private readonly peers = new Map<string, Peer>();
  private readonly relationships = new Map<string, PeerRelationship>();
  private readonly auditLog: TrustAuditEntry[] = [];

  /** Number of registered peers. */
  get peerCount(): number { return this.peers.size; }

  /** Number of relationships. */
  get relationshipCount(): number { return this.relationships.size; }

  /** Full audit log. */
  get audit(): readonly TrustAuditEntry[] { return this.auditLog; }

  // ─── Peer Management ──────────────────────────────────────────────────

  /** Register a new peer. Returns the peer. */
  registerPeer(id: string, kind: PeerKind, displayName: string, metadata: Record<string, unknown> = {}): Peer {
    if (this.peers.has(id)) {
      return this.peers.get(id)!;
    }
    const peer: Peer = {
      id,
      kind,
      displayName,
      registeredAt: new Date().toISOString(),
      metadata,
    };
    this.peers.set(id, peer);
    this.log({ type: 'peer_registered', peerId: id, kind });
    return peer;
  }

  /** Get a peer by ID. */
  getPeer(id: string): Peer | undefined {
    return this.peers.get(id);
  }

  /** List all peers, optionally filtered by kind. */
  listPeers(kind?: PeerKind): Peer[] {
    const all = Array.from(this.peers.values());
    return kind ? all.filter(p => p.kind === kind) : all;
  }

  // ─── Relationship Management ──────────────────────────────────────────

  /**
   * Get or create a relationship between two peers.
   * Both peers must be registered.
   */
  relationship(aId: string, bId: string): PeerRelationship {
    const key = relationshipKey(aId, bId);
    let rel = this.relationships.get(key);
    if (rel) return rel;

    if (!this.peers.has(aId)) throw new Error(`Peer not registered: ${aId}`);
    if (!this.peers.has(bId)) throw new Error(`Peer not registered: ${bId}`);

    const now = new Date().toISOString();
    const peerIds = sortedPair(aId, bId);
    rel = {
      peerIds,
      forward: defaultEdge(now),
      reverse: defaultEdge(now),
      establishedAt: now,
      totalInteractions: 0,
    };
    this.relationships.set(key, rel);
    this.log({ type: 'relationship_created', peerIds });
    return rel;
  }

  /**
   * Get the trust level that `from` grants to `to`.
   * Returns 'stranger' if no relationship exists.
   */
  trustLevel(from: string, to: string): PeerTrustLevel {
    const key = relationshipKey(from, to);
    const rel = this.relationships.get(key);
    if (!rel) return 'stranger';
    const [lo] = rel.peerIds;
    return from === lo ? rel.forward.level : rel.reverse.level;
  }

  /**
   * Get the edge from `from` toward `to`.
   */
  private edge(rel: PeerRelationship, from: string): TrustEdge {
    return from === rel.peerIds[0] ? rel.forward : rel.reverse;
  }

  // ─── Interaction Recording ────────────────────────────────────────────

  /**
   * Record a successful interaction from `from` toward `to`.
   * May promote trust level if the score threshold is crossed.
   */
  recordSuccess(from: string, to: string): PeerTrustLevel {
    const rel = this.relationship(from, to);
    const edge = this.edge(rel, from);
    edge.positiveInteractions++;
    rel.totalInteractions++;

    const newLevel = levelForScore(edge.positiveInteractions, edge.negativeInteractions);
    if (levelIndex(newLevel) > levelIndex(edge.level)) {
      const oldLevel = edge.level;
      edge.level = newLevel;
      edge.updatedAt = new Date().toISOString();
      this.log({ type: 'trust_promoted', from, to, newLevel, reason: `positive interactions: ${edge.positiveInteractions}` });
    }
    return edge.level;
  }

  /**
   * Record a failed interaction from `from` toward `to`.
   * May demote trust level. Failures weigh 3x.
   */
  recordFailure(from: string, to: string): PeerTrustLevel {
    const rel = this.relationship(from, to);
    const edge = this.edge(rel, from);
    edge.negativeInteractions++;
    rel.totalInteractions++;

    const newLevel = levelForScore(edge.positiveInteractions, edge.negativeInteractions);
    if (levelIndex(newLevel) < levelIndex(edge.level)) {
      edge.level = newLevel;
      edge.updatedAt = new Date().toISOString();
      this.log({ type: 'trust_demoted', from, to, newLevel, reason: `failure count: ${edge.negativeInteractions}` });
    }
    return edge.level;
  }

  /**
   * Reset trust from `from` toward `to` back to stranger.
   */
  resetTrust(from: string, to: string, reason: string): void {
    const key = relationshipKey(from, to);
    const rel = this.relationships.get(key);
    if (!rel) return;

    const edge = this.edge(rel, from);
    edge.level = 'stranger';
    edge.positiveInteractions = 0;
    edge.negativeInteractions = 0;
    edge.updatedAt = new Date().toISOString();
    edge.delegatedCapabilities = [];
    this.log({ type: 'trust_reset', from, to, reason });
  }

  // ─── Capability Delegation ────────────────────────────────────────────

  /**
   * Delegate a capability from `from` to `to`.
   * Requires trust level >= 'trusted'.
   */
  delegateCapability(from: string, to: string, capability: string): boolean {
    const level = this.trustLevel(from, to);
    if (levelIndex(level) < levelIndex('trusted')) return false;

    const rel = this.relationship(from, to);
    const edge = this.edge(rel, from);
    if (!edge.delegatedCapabilities.includes(capability)) {
      edge.delegatedCapabilities.push(capability);
      this.log({ type: 'capability_delegated', from, to, capability });
    }
    return true;
  }

  /**
   * Revoke a delegated capability.
   */
  revokeCapability(from: string, to: string, capability: string): void {
    const key = relationshipKey(from, to);
    const rel = this.relationships.get(key);
    if (!rel) return;

    const edge = this.edge(rel, from);
    edge.delegatedCapabilities = edge.delegatedCapabilities.filter(c => c !== capability);
    this.log({ type: 'capability_revoked', from, to, capability });
  }

  /**
   * Check if `to` has been delegated `capability` by `from`.
   */
  hasCapability(from: string, to: string, capability: string): boolean {
    const key = relationshipKey(from, to);
    const rel = this.relationships.get(key);
    if (!rel) return false;
    return this.edge(rel, from).delegatedCapabilities.includes(capability);
  }

  // ─── Queries ──────────────────────────────────────────────────────────

  /**
   * List all peers that `peerId` has a relationship with,
   * along with the trust level in each direction.
   */
  peersOf(peerId: string): Array<{ peer: Peer; trustToward: PeerTrustLevel; trustFrom: PeerTrustLevel }> {
    const result: Array<{ peer: Peer; trustToward: PeerTrustLevel; trustFrom: PeerTrustLevel }> = [];
    for (const [, rel] of this.relationships) {
      if (!rel.peerIds.includes(peerId)) continue;
      const otherId = rel.peerIds[0] === peerId ? rel.peerIds[1] : rel.peerIds[0];
      const other = this.peers.get(otherId);
      if (!other) continue;
      result.push({
        peer: other,
        trustToward: this.trustLevel(peerId, otherId),
        trustFrom: this.trustLevel(otherId, peerId),
      });
    }
    return result;
  }

  /**
   * Find all peers that trust `peerId` at or above a given level.
   */
  trustedBy(peerId: string, minLevel: PeerTrustLevel = 'acquaintance'): Peer[] {
    const minIdx = levelIndex(minLevel);
    const result: Peer[] = [];
    for (const [, rel] of this.relationships) {
      if (!rel.peerIds.includes(peerId)) continue;
      const otherId = rel.peerIds[0] === peerId ? rel.peerIds[1] : rel.peerIds[0];
      const level = this.trustLevel(otherId, peerId);
      if (levelIndex(level) >= minIdx) {
        const peer = this.peers.get(otherId);
        if (peer) result.push(peer);
      }
    }
    return result;
  }

  // ─── Audit ────────────────────────────────────────────────────────────

  private log(event: TrustEvent): void {
    this.auditLog.push({ event, timestamp: new Date().toISOString() });
  }
}
