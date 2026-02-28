// === Dependency Wirer ===
//
// Stage 4.5 of the sc:learn pipeline. Takes extracted candidate primitives
// with empty dependency arrays and fills in dependencies, enables, and
// prerequisites by analyzing textual relationships between candidates.
//
// Does NOT import from dependency-graph.ts (that's the full registry graph
// engine; this builds LOCAL edges only).

import type { DependencyEdge, DependencyType } from '../../core/types/mfe-types.js';
import type { CandidatePrimitive } from './extractor.js';

// === Public types ===

export interface WiringResult {
  wiredPrimitives: CandidatePrimitive[];  // Same primitives with populated deps
  edgesAdded: number;
  enablesAdded: number;
  prerequisitesAdded: number;
}

// === Relationship keyword patterns ===

interface RelationshipPattern {
  keywords: string[];
  type: DependencyType;
  strength: number;
}

const RELATIONSHIP_PATTERNS: RelationshipPattern[] = [
  { keywords: ['requires', 'depends on', 'needs', 'assumes', 'builds on'], type: 'requires', strength: 0.8 },
  { keywords: ['generalizes', 'extends', 'broadens', 'is a generalization'], type: 'generalizes', strength: 0.7 },
  { keywords: ['special case', 'specialization', 'restriction', 'narrows'], type: 'specializes', strength: 0.7 },
  { keywords: ['applies', 'uses', 'employs', 'leverages'], type: 'applies', strength: 0.6 },
];

// === Cycle detection ===

/**
 * Check if adding an edge from source -> target would create a cycle.
 * Uses BFS from target to see if it can reach source via existing edges.
 */
function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  adjacency: Map<string, string[]>,
): boolean {
  // If target can reach source, adding source->target creates a cycle
  const visited = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        queue.push(n);
      }
    }
  }

  return false;
}

/**
 * Add an edge to the adjacency map (for cycle detection tracking).
 */
function addToAdjacency(
  adjacency: Map<string, string[]>,
  sourceId: string,
  targetId: string,
): void {
  if (!adjacency.has(sourceId)) {
    adjacency.set(sourceId, []);
  }
  adjacency.get(sourceId)!.push(targetId);
}

// === Main wirer ===

/**
 * Wire dependencies between candidate primitives by analyzing section ordering,
 * cross-references, prerequisite language, and type-based inference.
 */
export function wireDependencies(candidates: CandidatePrimitive[]): WiringResult {
  if (candidates.length === 0) {
    return { wiredPrimitives: [], edgesAdded: 0, enablesAdded: 0, prerequisitesAdded: 0 };
  }

  // Deep copy candidates to avoid mutating inputs
  const prims = candidates.map(c => ({
    ...c,
    dependencies: [...c.dependencies],
    enables: [...c.enables],
    prerequisites: [...c.prerequisites],
  }));

  // Build name index: lowercased name -> primitive id
  const nameIndex = new Map<string, string>();
  for (const p of prims) {
    nameIndex.set(p.name.toLowerCase(), p.id);
  }

  // Adjacency map for cycle detection (source depends on target)
  const adjacency = new Map<string, string[]>();

  let edgesAdded = 0;
  let prerequisitesAdded = 0;

  /**
   * Safely add a dependency edge with cycle prevention.
   */
  function addEdge(
    source: CandidatePrimitive,
    targetId: string,
    type: DependencyType,
    strength: number,
    description: string,
  ): boolean {
    // Don't add self-references
    if (source.id === targetId) return false;

    // Don't add duplicate edges
    if (source.dependencies.some(d => d.target === targetId && d.type === type)) return false;

    // Cycle prevention
    if (wouldCreateCycle(source.id, targetId, adjacency)) return false;

    const edge: DependencyEdge = { target: targetId, type, strength, description };
    source.dependencies.push(edge);
    addToAdjacency(adjacency, source.id, targetId);
    edgesAdded++;
    return true;
  }

  // === Pass 1: Section ordering ===
  // Sort by sourceOffset (document order)
  const sorted = [...prims].sort((a, b) => a.sourceOffset - b.sourceOffset);

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];

    // Skip ordering edges for axioms (they are foundational)
    if (current.type === 'axiom') continue;

    // Add motivates edge: current depends on previous by document order
    addEdge(current, previous.id, 'motivates', 0.3, 'Required by section ordering');

    // Add prerequisite
    if (!current.prerequisites.includes(previous.name)) {
      current.prerequisites.push(previous.name);
      prerequisitesAdded++;
    }
  }

  // === Pass 2: Cross-reference detection ===
  for (const prim of prims) {
    const textToScan = `${prim.formalStatement} ${prim.sourceSection}`.toLowerCase();

    for (const [name, targetId] of nameIndex) {
      if (targetId === prim.id) continue;
      if (!textToScan.includes(name)) continue;

      // Found a name reference -- determine relationship type
      let foundRelationship = false;

      for (const pattern of RELATIONSHIP_PATTERNS) {
        for (const keyword of pattern.keywords) {
          if (textToScan.includes(keyword)) {
            addEdge(prim, targetId, pattern.type, pattern.strength, `Keyword "${keyword}" with name reference in formal statement`);
            foundRelationship = true;
            break;
          }
        }
        if (foundRelationship) break;
      }

      // Default: name reference without relationship keyword -> requires
      if (!foundRelationship) {
        addEdge(prim, targetId, 'requires', 0.5, 'Name reference in formal statement');
      }

      // Also add to prerequisites
      const targetPrim = prims.find(p => p.id === targetId);
      if (targetPrim && !prim.prerequisites.includes(targetPrim.name)) {
        prim.prerequisites.push(targetPrim.name);
        prerequisitesAdded++;
      }
    }
  }

  // === Pass 3: Type-based inference ===
  for (const prim of prims) {
    if (prim.type !== 'algorithm' && prim.type !== 'technique') continue;

    const textLower = prim.formalStatement.toLowerCase();

    for (const other of prims) {
      if (other.id === prim.id) continue;
      if (other.type !== 'definition' && other.type !== 'theorem') continue;

      // Check if this algorithm/technique references the definition/theorem
      if (textLower.includes(other.name.toLowerCase())) {
        addEdge(prim, other.id, 'applies', 0.6, `${prim.type} applies ${other.type} "${other.name}"`);
      }
    }
  }

  // === Pass 4: Enables reverse-index ===
  let enablesAdded = 0;

  for (const prim of prims) {
    for (const dep of prim.dependencies) {
      const target = prims.find(p => p.id === dep.target);
      if (target && !target.enables.includes(prim.id)) {
        target.enables.push(prim.id);
        enablesAdded++;
      }
    }
  }

  return {
    wiredPrimitives: prims,
    edgesAdded,
    enablesAdded,
    prerequisitesAdded,
  };
}
