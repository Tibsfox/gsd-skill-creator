// === Plane Navigator ===
//
// Takes a classified plane position and identifies relevant domains,
// nearby primitives, and candidate decomposition strategies.
//
// Algorithm: rank all domains by distance -> load primitives from activated
// domains -> score primitives by relevance -> generate strategies from
// compatibility matrix -> return NavigationResult.
//
// Domain data loaded lazily from data/domains/*.json and cached.

import { createRequire } from 'node:module';
import type {
  PlanePosition,
  DomainId,
  DomainDefinition,
  MathematicalPrimitive,
  PrimitiveType,
} from '../types/mfe-types.js';
import type { PlaneClassification, DomainActivation } from './plane-classifier.js';

// === Public types ===

export interface NearbyPrimitive {
  id: string;
  name: string;
  domain: DomainId;
  distance: number;
  relevanceScore: number;
  type: PrimitiveType;
}

export interface DecompositionStrategy {
  name: string;
  description: string;
  primaryDomain: DomainId;
  supportingDomains: DomainId[];
  suggestedPrimitives: string[];
  confidence: number;
}

export interface NavigationResult {
  classifiedPosition: PlanePosition;
  nearbyDomains: Array<{
    domainId: DomainId;
    distance: number;
    withinRegion: boolean;
  }>;
  nearbyPrimitives: NearbyPrimitive[];
  decompositionStrategies: DecompositionStrategy[];
  totalPrimitivesScanned: number;
}

// === Domain index loading ===

const require = createRequire(import.meta.url);
const domainIndex: { domains: DomainDefinition[] } = require('../../data/domain-index.json');

// === Domain file number mapping ===

const DOMAIN_FILE_MAP: Record<string, string> = {
  perception: '01',
  waves: '02',
  change: '03',
  structure: '04',
  reality: '05',
  foundations: '06',
  mapping: '07',
  unification: '08',
  emergence: '09',
  synthesis: '10',
};

// === Primitive cache ===

const primitiveCache = new Map<DomainId, MathematicalPrimitive[]>();

/**
 * Load primitives for a domain from data/domains/NN-domainId.json.
 * Caches loaded domains.
 */
function loadDomainPrimitives(domainId: DomainId): MathematicalPrimitive[] {
  if (primitiveCache.has(domainId)) {
    return primitiveCache.get(domainId)!;
  }

  const fileNum = DOMAIN_FILE_MAP[domainId];
  if (!fileNum) return [];

  try {
    const data = require(`../../data/domains/${fileNum}-${domainId}.json`);
    const primitives: MathematicalPrimitive[] = data.primitives || [];
    primitiveCache.set(domainId, primitives);
    return primitives;
  } catch {
    // Domain file not found or unreadable
    primitiveCache.set(domainId, []);
    return [];
  }
}

// === Distance calculation ===

/**
 * Standard 2D Euclidean distance between two plane positions.
 */
function euclideanDistance(a: PlanePosition, b: PlanePosition): number {
  const dx = a.real - b.real;
  const dy = a.imaginary - b.imaginary;
  return Math.sqrt(dx * dx + dy * dy);
}

// === Domain ranking ===

/**
 * Rank all domains by distance from position. Mark whether position is within region.
 */
function rankDomains(position: PlanePosition): NavigationResult['nearbyDomains'] {
  return domainIndex.domains
    .map(domain => {
      const dist = euclideanDistance(position, domain.planeRegion.center);
      return {
        domainId: domain.id as DomainId,
        distance: dist,
        withinRegion: dist < domain.planeRegion.radius,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

// === Primitive scoring ===

/**
 * Find nearby primitives from activated domains, ranked by relevance.
 *
 * relevanceScore = domainActivationScore * (1 / (1 + distance))
 */
function findNearbyPrimitives(
  position: PlanePosition,
  activations: DomainActivation[],
  limit = 20,
): { primitives: NearbyPrimitive[]; scanned: number } {
  // Score all primitives per domain
  const perDomain = new Map<DomainId, NearbyPrimitive[]>();
  let scanned = 0;

  for (const activation of activations) {
    const domainPrimitives = loadDomainPrimitives(activation.domainId);
    scanned += domainPrimitives.length;

    const scored: NearbyPrimitive[] = [];
    for (const prim of domainPrimitives) {
      const dist = euclideanDistance(position, prim.planePosition);
      const relevanceScore = activation.score * (1 / (1 + dist));

      scored.push({
        id: prim.id,
        name: prim.name,
        domain: prim.domain as DomainId,
        distance: dist,
        relevanceScore,
        type: prim.type,
      });
    }

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    perDomain.set(activation.domainId, scored);
  }

  // Guarantee representation from each activated domain:
  // Reserve at least minPerDomain slots per domain, fill rest by global rank
  const domainCount = activations.length;
  if (domainCount === 0) return { primitives: [], scanned };

  const minPerDomain = Math.max(1, Math.floor(limit / domainCount));
  const result: NearbyPrimitive[] = [];
  const usedIds = new Set<string>();

  // Phase 1: guaranteed slots per domain (up to minPerDomain)
  for (const activation of activations) {
    const domPrims = perDomain.get(activation.domainId) || [];
    let added = 0;
    for (const p of domPrims) {
      if (added >= minPerDomain) break;
      if (!usedIds.has(p.id)) {
        result.push(p);
        usedIds.add(p.id);
        added++;
      }
    }
  }

  // Phase 2: fill remaining slots by global relevance
  if (result.length < limit) {
    const allRemaining: NearbyPrimitive[] = [];
    for (const prims of perDomain.values()) {
      for (const p of prims) {
        if (!usedIds.has(p.id)) {
          allRemaining.push(p);
        }
      }
    }
    allRemaining.sort((a, b) => b.relevanceScore - a.relevanceScore);
    for (const p of allRemaining) {
      if (result.length >= limit) break;
      result.push(p);
      usedIds.add(p.id);
    }
  }

  // Final sort by relevance descending
  result.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    primitives: result,
    scanned,
  };
}

// === Strategy generation ===

/**
 * Generate decomposition strategies based on activated domains and compatibility.
 */
function generateStrategies(
  activations: DomainActivation[],
  primitives: NearbyPrimitive[],
): DecompositionStrategy[] {
  const strategies: DecompositionStrategy[] = [];

  if (activations.length === 0) return strategies;

  // Build domain lookup for compatibility checks
  const domainDefs = new Map<string, DomainDefinition>();
  for (const d of domainIndex.domains) {
    domainDefs.set(d.id, d);
  }

  const topActivation = activations[0];

  // === Single-domain strategy ===
  // If top domain has score > 0.6, suggest direct decomposition
  if (topActivation.score > 0.6) {
    const domDef = domainDefs.get(topActivation.domainId);
    const domPrimitives = primitives
      .filter(p => p.domain === topActivation.domainId)
      .slice(0, 5)
      .map(p => p.id);

    strategies.push({
      name: `${domDef?.name ?? topActivation.domainId} Direct Decomposition`,
      description: `Decompose the problem within the ${domDef?.name ?? topActivation.domainId} domain using its core primitives.`,
      primaryDomain: topActivation.domainId,
      supportingDomains: [],
      suggestedPrimitives: domPrimitives,
      confidence: Math.min(1.0, topActivation.score),
    });
  }

  // === Cross-domain strategies ===
  // For pairs of activated domains that are in each other's compatibleWith
  for (let i = 0; i < activations.length; i++) {
    for (let j = i + 1; j < activations.length; j++) {
      const domA = activations[i];
      const domB = activations[j];
      const defA = domainDefs.get(domA.domainId);
      const defB = domainDefs.get(domB.domainId);

      if (!defA || !defB) continue;

      // Both must list each other as compatible
      const aCompatible = defA.compatibleWith.includes(domB.domainId as DomainId);
      const bCompatible = defB.compatibleWith.includes(domA.domainId as DomainId);

      if (aCompatible && bCompatible) {
        const primA = primitives
          .filter(p => p.domain === domA.domainId)
          .slice(0, 3)
          .map(p => p.id);
        const primB = primitives
          .filter(p => p.domain === domB.domainId)
          .slice(0, 3)
          .map(p => p.id);

        strategies.push({
          name: `${defA.name}-${defB.name} Bridge`,
          description: `Cross-domain decomposition bridging ${defA.name} and ${defB.name} techniques.`,
          primaryDomain: domA.domainId,
          supportingDomains: [domB.domainId],
          suggestedPrimitives: [...primA, ...primB],
          confidence: Math.min(1.0, (domA.score + domB.score) / 2),
        });
      }
    }
  }

  // === Synthesis strategy ===
  // If 3+ domains activated or synthesis domain is active
  const synthActive = activations.some(a => a.domainId === 'synthesis');
  if (activations.length >= 3 || synthActive) {
    const allDomainIds = activations.map(a => a.domainId);
    const topPrimitives = primitives.slice(0, 5).map(p => p.id);
    const avgScore = activations.reduce((s, a) => s + a.score, 0) / activations.length;

    strategies.push({
      name: `Multi-Domain Synthesis`,
      description: `Synthesis-level decomposition drawing from ${allDomainIds.join(', ')} domains.`,
      primaryDomain: activations[0].domainId,
      supportingDomains: allDomainIds.slice(1),
      suggestedPrimitives: topPrimitives,
      confidence: Math.min(1.0, avgScore),
    });
  }

  // Sort by confidence descending
  strategies.sort((a, b) => b.confidence - a.confidence);

  return strategies;
}

// === Main navigator ===

/**
 * Navigate the Complex Plane from a classified position. Identifies relevant
 * domains, nearby primitives, and candidate decomposition strategies.
 *
 * @param classification - Output from classifyProblem()
 * @returns NavigationResult with domains, primitives, and strategies
 */
export function navigatePlane(classification: PlaneClassification): NavigationResult {
  const { position, activatedDomains } = classification;

  // Rank all 10 domains by distance from position
  const nearbyDomains = rankDomains(position);

  // Load and score primitives from activated domains
  const { primitives: nearbyPrimitives, scanned } = findNearbyPrimitives(
    position,
    activatedDomains,
  );

  // Generate decomposition strategies
  const decompositionStrategies = generateStrategies(activatedDomains, nearbyPrimitives);

  return {
    classifiedPosition: position,
    nearbyDomains,
    nearbyPrimitives,
    decompositionStrategies,
    totalPrimitivesScanned: scanned,
  };
}
