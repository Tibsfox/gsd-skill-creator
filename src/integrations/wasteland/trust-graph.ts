/**
 * Trust Graph Intelligence — w-wl-graph
 *
 * The algorithms that understand the SHAPE of trust. Not just "how much"
 * but "what kind" — is the trust mutual, one-sided, bridging, bonded
 * across multiple contexts?
 *
 * All graph algorithms are ego-local: 2-hop maximum, O(k²) where k is
 * the number of direct connections. No global graph traversal. This is
 * a hard constraint — it ensures privacy (you only see what touches you)
 * and scalability (campfire to planet).
 *
 * The system is structurally isomorphic to mycorrhizal networks:
 * point-to-point bilateral flows, private channels, resource-dependent
 * strengthening, persistence after termination. The graph intelligence
 * makes this structure legible without exposing it.
 *
 * Naming conventions (locked):
 *   relationship — one bilateral connection with one contract
 *   bond — multi-context compound (2+ active relationships between same pair)
 *   bridge — path of length 2 through a high-trust intermediate rig
 *
 * @module trust-graph
 */

import type {
  TrustVector,
  TrustContractType,
  TrustRelationship,
} from './trust-relationship.js';
import {
  computeHarmony,
  isContractActive,
} from './trust-relationship.js';

// ============================================================================
// Asymmetry Classifier
// ============================================================================

/**
 * The 5 categories of relationship asymmetry.
 *
 * These describe the character of the connection — not judgment, just
 * observation. Every category is normal and healthy in context.
 */
export type AsymmetryCategory =
  | 'mutual'              // both sides similar in strength and character
  | 'one-sided'           // one side significantly stronger than the other
  | 'character-mismatch'  // similar strength but different character (angle divergence)
  | 'bridge-potential'    // one or both sides have many other connections
  | 'multi-context';      // 2+ active contracts between the same pair

/** Result of classifying a relationship's asymmetry. */
export interface AsymmetryResult {
  category: AsymmetryCategory;
  /** Ratio of smaller to larger magnitude (0–1, 1 = perfectly equal). */
  magnitudeRatio: number;
  /** Absolute angle difference in radians (0 = identical character). */
  angleDelta: number;
  /** Overall harmony score (0–1). */
  harmony: number;
}

/** Thresholds for asymmetry classification. */
const ASYMMETRY_THRESHOLDS = {
  /** Below this magnitude ratio, the connection is one-sided. */
  oneSidedRatio: 0.5,
  /** Above this angle delta (radians), the character is mismatched. */
  characterMismatchAngle: Math.PI / 6, // 30 degrees
  /** Above this harmony, the connection is mutual. */
  mutualHarmony: 0.7,
};

/**
 * Classify the asymmetry of a single trust relationship.
 *
 * The classifier examines how similar the two sides are — in strength
 * (magnitude ratio) and in character (angle delta). These are independent
 * axes: two people can trust each other deeply but for different reasons
 * (character mismatch), or one can trust far more than the other
 * (one-sided).
 */
export function classifyAsymmetry(rel: TrustRelationship): AsymmetryResult {
  const { magnitudeRatio, angleDelta, harmony } = computeHarmony(rel);

  let category: AsymmetryCategory;

  if (magnitudeRatio < ASYMMETRY_THRESHOLDS.oneSidedRatio) {
    category = 'one-sided';
  } else if (angleDelta > ASYMMETRY_THRESHOLDS.characterMismatchAngle) {
    category = 'character-mismatch';
  } else if (harmony >= ASYMMETRY_THRESHOLDS.mutualHarmony) {
    category = 'mutual';
  } else {
    // Moderate asymmetry — neither clearly one-sided nor clearly mutual
    category = 'one-sided';
  }

  return { category, magnitudeRatio, angleDelta, harmony };
}

/**
 * Classify a pair of rigs considering ALL their active relationships.
 *
 * If the pair has 2+ active relationships (a bond), the category is
 * 'multi-context'. Otherwise, delegates to single-relationship classification.
 */
export function classifyPair(
  relationships: TrustRelationship[],
  now: Date = new Date(),
): AsymmetryResult {
  const active = relationships.filter(r => isContractActive(r.contract, now));

  if (active.length === 0) {
    return { category: 'mutual', magnitudeRatio: 1, angleDelta: 0, harmony: 1 };
  }

  if (active.length >= 2) {
    // Multi-context bond — 2+ active contracts between the same pair.
    // Compute aggregate harmony across all relationships.
    let totalHarmony = 0;
    let totalMagRatio = 0;
    let totalAngleDelta = 0;
    for (const rel of active) {
      const h = computeHarmony(rel);
      totalHarmony += h.harmony;
      totalMagRatio += h.magnitudeRatio;
      totalAngleDelta += h.angleDelta;
    }
    return {
      category: 'multi-context',
      magnitudeRatio: totalMagRatio / active.length,
      angleDelta: totalAngleDelta / active.length,
      harmony: totalHarmony / active.length,
    };
  }

  return classifyAsymmetry(active[0]);
}

// ============================================================================
// Multi-Context Bond Detection
// ============================================================================

/** A bond between two rigs — 2+ active relationships with different contexts. */
export interface Bond {
  /** One side of the bond. */
  handleA: string;
  /** Other side of the bond. */
  handleB: string;
  /** Number of active relationships in this bond. */
  activeCount: number;
  /** Unique contract types across all active relationships. */
  uniqueTypes: TrustContractType[];
  /** All active relationships that form this bond. */
  relationships: TrustRelationship[];
}

/**
 * Detect multi-context bonds for a rig.
 *
 * A bond is 2+ active relationships between the same pair of rigs.
 * The more unique contract types, the more independent the evidence
 * of trust. Work + furry community + burns = qualitatively different
 * from three ephemeral game sessions.
 */
export function detectBonds(
  handle: string,
  relationships: TrustRelationship[],
  now: Date = new Date(),
): Bond[] {
  const active = relationships.filter(r => isContractActive(r.contract, now));

  // Group by the OTHER rig in the relationship
  const peerMap = new Map<string, TrustRelationship[]>();
  for (const rel of active) {
    const peer = rel.from === handle ? rel.to : rel.from;
    const existing = peerMap.get(peer) ?? [];
    existing.push(rel);
    peerMap.set(peer, existing);
  }

  // Only pairs with 2+ active relationships qualify as bonds
  const bonds: Bond[] = [];
  for (const [peer, rels] of peerMap) {
    if (rels.length >= 2) {
      const types = new Set<TrustContractType>();
      for (const rel of rels) {
        types.add(rel.contract.type);
      }
      bonds.push({
        handleA: handle,
        handleB: peer,
        activeCount: rels.length,
        uniqueTypes: [...types],
        relationships: rels,
      });
    }
  }

  return bonds;
}

// ============================================================================
// Bridge Potential
// ============================================================================

/** A potential bridge — introduction path through an intermediate rig. */
export interface BridgePath {
  /** The rig seeking introduction. */
  from: string;
  /** The intermediate rig (the bridge). */
  through: string;
  /** The rig who could be introduced. */
  to: string;
  /** Bridge potential score (0–1). Higher = stronger introduction potential. */
  potential: number;
  /** The contract type of the from→through relationship. */
  fromBondType: TrustContractType;
  /** The contract type of the through→to relationship. */
  toBondType: TrustContractType;
}

/**
 * Bond type weight — how much introduction potential does each type carry?
 *
 * Family bonds carry the most introduction weight. A coworker's sister
 * (permanent bond) is a stronger introduction than a coworker's acquaintance
 * (ephemeral bond).
 */
const BOND_TYPE_WEIGHT: Record<TrustContractType, number> = {
  permanent: 1.0,
  'long-term': 0.8,
  'event-scoped': 0.6,
  'project-scoped': 0.5,
  ephemeral: 0.3,
};

/**
 * Compute bridge potential for a rig — who could be introduced to whom?
 *
 * Bridge potential is INTRODUCTION potential, not trust. The graph says
 * "these two should meet." The meeting creates trust. The formula is
 * multiplicative:
 *
 *   potential = mag(A→B) × mag(B→C) × bondType(A→B) × bondType(B→C)
 *
 * Constraints:
 *   - 2-hop max (ego-local only)
 *   - O(k²) where k is direct connections
 *   - Does not suggest introductions for rigs already directly connected
 *   - Uses the trust vector pointing TOWARD the bridge rig for each leg
 *
 * @param focus — the rig computing their bridge potential
 * @param hop1 — all active relationships for the focus rig
 * @param hop2Map — for each neighbor, their active relationships
 */
export function computeBridgePotential(
  focus: string,
  hop1: TrustRelationship[],
  hop2Map: Map<string, TrustRelationship[]>,
): BridgePath[] {
  const bridges: BridgePath[] = [];

  // Set of rigs already directly connected to focus (no bridge needed)
  const directPeers = new Set<string>();
  for (const rel of hop1) {
    directPeers.add(rel.from === focus ? rel.to : rel.from);
  }

  for (const rel1 of hop1) {
    const bridge = rel1.from === focus ? rel1.to : rel1.from;

    // Magnitude of focus's trust toward the bridge
    const mag1 = rel1.from === focus
      ? rel1.fromVector.magnitude
      : rel1.toVector.magnitude;

    const hop2Rels = hop2Map.get(bridge) ?? [];

    for (const rel2 of hop2Rels) {
      const target = rel2.from === bridge ? rel2.to : rel2.from;

      // Skip self-loops and already-connected rigs
      if (target === focus || directPeers.has(target)) continue;

      // Magnitude of bridge's trust toward the target
      const mag2 = rel2.from === bridge
        ? rel2.fromVector.magnitude
        : rel2.toVector.magnitude;

      const potential =
        mag1 *
        mag2 *
        BOND_TYPE_WEIGHT[rel1.contract.type] *
        BOND_TYPE_WEIGHT[rel2.contract.type];

      bridges.push({
        from: focus,
        through: bridge,
        to: target,
        potential,
        fromBondType: rel1.contract.type,
        toBondType: rel2.contract.type,
      });
    }
  }

  // Sort by potential descending — strongest introductions first
  bridges.sort((a, b) => b.potential - a.potential);

  return bridges;
}

// ============================================================================
// Graph Diversity
// ============================================================================

/** Graph diversity score for a rig's ego-network. */
export interface GraphDiversity {
  /** Number of unique contract types across active relationships. */
  uniqueTypeCount: number;
  /** The types present. */
  typesPresent: TrustContractType[];
  /** Diversity score: uniqueTypes / 5 (there are 5 contract types). */
  score: number;
  /** Number of active direct connections. */
  activeConnectionCount: number;
}

/** Total number of contract types in the system. */
const CONTRACT_TYPE_COUNT = 5;

/**
 * Compute graph diversity for a rig's ego-network.
 *
 * Diversity measures how many KINDS of trust a rig participates in.
 * A rig with permanent (family), event-scoped (burn friends), and
 * project-scoped (collaborators) connections has a diversity of 3/5 = 0.6.
 *
 * Graph diversity over head count — 10 ephemeral connections score lower
 * than 3 connections across 3 different types. The SHAPE matters, not
 * the count.
 *
 * Sam's fix: denominator is 5 (number of contract types), not 4.
 */
export function computeGraphDiversity(
  handle: string,
  relationships: TrustRelationship[],
  now: Date = new Date(),
): GraphDiversity {
  const active = relationships.filter(r => isContractActive(r.contract, now));

  const types = new Set<TrustContractType>();
  const peers = new Set<string>();

  for (const rel of active) {
    types.add(rel.contract.type);
    peers.add(rel.from === handle ? rel.to : rel.from);
  }

  const typesPresent = [...types] as TrustContractType[];

  return {
    uniqueTypeCount: types.size,
    typesPresent,
    score: types.size / CONTRACT_TYPE_COUNT,
    activeConnectionCount: peers.size,
  };
}

// ============================================================================
// Old Growth Readiness Assessment
// ============================================================================

/** Assessment of a rig's readiness for Old Growth (level 3) promotion. */
export interface OldGrowthAssessment {
  /** Graph diversity score (0–1). */
  diversityScore: number;
  /** Escalation bonus from interpersonal trust (0–1). */
  escalationBonus: number;
  /** Number of active connections. */
  connectionCount: number;
  /** Number of multi-context bonds. */
  bondCount: number;
  /** Whether the minimum diversity threshold is met. */
  diversityMet: boolean;
  /** Whether the minimum connection threshold is met. */
  connectionsMet: boolean;
  /** Overall readiness: all criteria met. */
  ready: boolean;
}

/** Minimum graph diversity score for Old Growth consideration. */
const MIN_OLD_GROWTH_DIVERSITY = 0.4; // at least 2 contract types

/**
 * Minimum active connections for Old Growth consideration.
 * Logarithmic floor: max(3, floor(log2(activeRigs))).
 * When activeRigs is unknown, defaults to 3.
 */
export function oldGrowthConnectionFloor(activeRigs?: number): number {
  if (!activeRigs || activeRigs < 8) return 3;
  return Math.max(3, Math.floor(Math.log2(activeRigs)));
}

/**
 * Assess a rig's readiness for Old Growth promotion.
 *
 * This does NOT replace the stamp-based escalation engine — it
 * supplements it. A rig must ALSO meet the stamp criteria (10+ stamps,
 * 5+ issued, quality >= 4.0, etc.). The graph assessment adds:
 *   - Minimum graph diversity (at least 2 contract types)
 *   - Minimum active connections (logarithmic floor)
 *   - Escalation bonus as tiebreaker for borderline cases
 *
 * The bonus helps borderline rigs but doesn't block anyone who earned
 * it through stamps alone. Graph intelligence is additive, not gate-keeping.
 */
export function assessOldGrowthReadiness(
  diversity: GraphDiversity,
  escalationBonus: number,
  bondCount: number,
  activeRigs?: number,
): OldGrowthAssessment {
  const connectionFloor = oldGrowthConnectionFloor(activeRigs);
  const diversityMet = diversity.score >= MIN_OLD_GROWTH_DIVERSITY;
  const connectionsMet = diversity.activeConnectionCount >= connectionFloor;

  return {
    diversityScore: diversity.score,
    escalationBonus,
    connectionCount: diversity.activeConnectionCount,
    bondCount,
    diversityMet,
    connectionsMet,
    ready: diversityMet && connectionsMet,
  };
}

// ============================================================================
// Human-Readable Summaries
// ============================================================================

/**
 * Describe an asymmetry classification in plain language.
 *
 * For Seedlings: simple description, no numbers.
 * For Old Growth: full detail with scores.
 */
export function describeAsymmetry(
  result: AsymmetryResult,
  trustLevel: number = 1,
): string {
  // Seedling/Sapling: plain language
  if (trustLevel < 3) {
    switch (result.category) {
      case 'mutual': return 'This connection runs both ways equally.';
      case 'one-sided': return 'One side of this connection is stronger than the other.';
      case 'character-mismatch': return 'You trust each other, but for different reasons.';
      case 'multi-context': return 'You share more than one kind of connection.';
      case 'bridge-potential': return 'This person connects different parts of the forest.';
    }
  }

  // Old Growth: full detail
  const deg = Math.round(result.angleDelta * (180 / Math.PI));
  return `${result.category} (harmony=${result.harmony.toFixed(2)}, mag-ratio=${result.magnitudeRatio.toFixed(2)}, angle-delta=${deg}°)`;
}

/**
 * Describe a bridge path in plain language.
 */
export function describeBridge(path: BridgePath): string {
  return `${path.from} → ${path.through} → ${path.to} (potential=${path.potential.toFixed(3)}, via ${path.fromBondType}/${path.toBondType})`;
}
