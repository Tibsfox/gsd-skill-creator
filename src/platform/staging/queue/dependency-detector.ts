/**
 * Cross-queue dependency detector for staging milestones.
 *
 * Detects when one milestone depends on another using two methods:
 * 1. Explicit keywords in milestone names, domains, and vision summaries
 *    (e.g., "requires", "depends on", "blocks", "enables")
 * 2. Implicit shared resources and overlapping domain requirements
 *    between ResourceManifests
 *
 * Pure functions, no I/O. All data passed as arguments.
 *
 * @module staging/queue/dependency-detector
 */

import type { QueueEntry } from './types.js';
import type { ResourceManifest } from '../resource/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A directed dependency edge between two queue entries.
 *
 * Direction: `from` depends on `to` (from needs to before it can proceed).
 */
export interface DependencyEdge {
  /** ID of the entry that depends on another. */
  from: string;
  /** ID of the entry that is depended upon. */
  to: string;
  /** How the dependency was detected. */
  type: 'explicit' | 'implicit';
  /** Human-readable explanation of the dependency. */
  reason: string;
  /** Confidence score (0-1). Explicit >= 0.8, implicit 0.3-0.6. */
  confidence: number;
}

/**
 * A graph of dependency edges between queue entries.
 */
export interface DependencyGraph {
  /** All detected dependency edges. */
  edges: DependencyEdge[];
  /** All entry IDs included in analysis. */
  entryIds: string[];
}

// ============================================================================
// Keyword patterns
// ============================================================================

/** Keywords indicating "this entry depends on the target". */
const FORWARD_KEYWORDS = [
  'depends on',
  'requires',
  'needs',
  'after',
  'prerequisite',
] as const;

/** Keywords indicating "this entry is depended upon by the target". */
const REVERSE_KEYWORDS = [
  'blocks',
  'enables',
  'provides for',
] as const;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Normalize a string for case-insensitive matching.
 */
function norm(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Check if `text` contains a forward keyword followed by a reference
 * to `targetName` or `targetDomain`.
 */
function findForwardKeyword(
  text: string,
  targetName: string,
  targetDomain: string,
): { keyword: string } | null {
  const lowerText = norm(text);
  const lowerName = norm(targetName);
  const lowerDomain = norm(targetDomain);

  for (const kw of FORWARD_KEYWORDS) {
    const kwIdx = lowerText.indexOf(kw);
    if (kwIdx === -1) continue;

    // Check if target name or domain appears in the text
    // (anywhere -- the keyword's presence establishes directionality)
    if (lowerName.length > 0 && lowerText.includes(lowerName)) {
      return { keyword: kw };
    }
    if (lowerDomain.length > 0 && lowerText.includes(lowerDomain)) {
      return { keyword: kw };
    }
  }
  return null;
}

/**
 * Check if `text` contains a reverse keyword followed by a reference
 * to `targetName` or `targetDomain`.
 */
function findReverseKeyword(
  text: string,
  targetName: string,
  targetDomain: string,
): { keyword: string } | null {
  const lowerText = norm(text);
  const lowerName = norm(targetName);
  const lowerDomain = norm(targetDomain);

  for (const kw of REVERSE_KEYWORDS) {
    const kwIdx = lowerText.indexOf(kw);
    if (kwIdx === -1) continue;

    if (lowerName.length > 0 && lowerText.includes(lowerName)) {
      return { keyword: kw };
    }
    if (lowerDomain.length > 0 && lowerText.includes(lowerDomain)) {
      return { keyword: kw };
    }
  }
  return null;
}

/**
 * Count shared external dependencies between two manifests.
 * Case-insensitive name comparison.
 */
function countSharedDeps(
  a: ResourceManifest,
  b: ResourceManifest,
): number {
  const aDeps = new Set(
    a.visionAnalysis.dependencies.map((d) => norm(d.name)),
  );
  let count = 0;
  for (const dep of b.visionAnalysis.dependencies) {
    if (aDeps.has(norm(dep.name))) {
      count++;
    }
  }
  return count;
}

/**
 * Compute word-level Jaccard overlap between requirement categories
 * of two manifests.
 */
function categoryOverlap(
  a: ResourceManifest,
  b: ResourceManifest,
): number {
  const aCats = new Set(
    a.visionAnalysis.requirements.map((r) => norm(r.category)),
  );
  const bCats = new Set(
    b.visionAnalysis.requirements.map((r) => norm(r.category)),
  );

  if (aCats.size === 0 || bCats.size === 0) return 0;

  let intersection = 0;
  for (const cat of aCats) {
    if (bCats.has(cat)) intersection++;
  }

  const union = new Set([...aCats, ...bCats]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Build a unique key for an edge pair (order-independent for dedup).
 */
function pairKey(fromId: string, toId: string): string {
  return `${fromId}::${toId}`;
}

// ============================================================================
// Main
// ============================================================================

/**
 * Detect cross-queue dependencies between milestones.
 *
 * For each pair of entries, checks for:
 * 1. Explicit keyword dependencies in milestone names, domains, summaries
 * 2. Implicit dependencies via shared external dependencies
 * 3. Implicit dependencies via overlapping requirement categories
 *
 * Deduplicates: if both explicit and implicit exist for the same
 * directed pair, keeps the explicit edge (higher confidence).
 * Filters out self-referencing edges.
 *
 * @param entries - Queue entries to analyze.
 * @param manifests - Resource manifests keyed by QueueEntry.id.
 * @returns Dependency graph with edges and entry IDs.
 */
export function detectDependencies(
  entries: QueueEntry[],
  manifests: Map<string, ResourceManifest>,
): DependencyGraph {
  if (entries.length === 0) {
    return { edges: [], entryIds: [] };
  }

  const entryIds = entries.map((e) => e.id);

  // Collect all candidate edges
  const explicitEdges = new Map<string, DependencyEdge>();
  const implicitEdges = new Map<string, DependencyEdge>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;

      const a = entries[i];
      const b = entries[j];

      // --- Explicit: check if A's text mentions dependency on B ---
      const textsA = [a.milestoneName, a.domain];
      const manifestA = manifests.get(a.id);
      if (manifestA) {
        textsA.push(manifestA.visionAnalysis.summary);
      }

      for (const text of textsA) {
        // Forward: A "requires" B -> A depends on B
        const fwd = findForwardKeyword(text, b.milestoneName, b.domain);
        if (fwd) {
          const key = pairKey(a.id, b.id);
          if (!explicitEdges.has(key)) {
            explicitEdges.set(key, {
              from: a.id,
              to: b.id,
              type: 'explicit',
              reason: `"${fwd.keyword}" keyword referencing "${b.milestoneName}"`,
              confidence: 0.85,
            });
          }
        }

        // Reverse: A "blocks" B -> B depends on A
        const rev = findReverseKeyword(text, b.milestoneName, b.domain);
        if (rev) {
          const key = pairKey(b.id, a.id);
          if (!explicitEdges.has(key)) {
            explicitEdges.set(key, {
              from: b.id,
              to: a.id,
              type: 'explicit',
              reason: `"${rev.keyword}" keyword in "${a.milestoneName}"`,
              confidence: 0.8,
            });
          }
        }
      }

      // --- Implicit checks require both manifests ---
      if (i >= j) continue; // Only check each unordered pair once for implicit
      const mA = manifests.get(a.id);
      const mB = manifests.get(b.id);
      if (!mA || !mB) continue;

      // Implicit: shared external dependencies
      const sharedCount = countSharedDeps(mA, mB);
      if (sharedCount > 0) {
        const confidence = Math.min(0.3 + 0.1 * sharedCount, 0.6);
        const key = pairKey(a.id, b.id);
        if (!implicitEdges.has(key)) {
          implicitEdges.set(key, {
            from: a.id,
            to: b.id,
            type: 'implicit',
            reason: `${sharedCount} shared external dependencies`,
            confidence,
          });
        }
      }

      // Implicit: overlapping requirement categories
      const overlap = categoryOverlap(mA, mB);
      if (overlap > 0.3) {
        const confidence = Math.min(overlap * 0.6, 0.6);
        const key = pairKey(a.id, b.id);
        if (!implicitEdges.has(key)) {
          implicitEdges.set(key, {
            from: a.id,
            to: b.id,
            type: 'implicit',
            reason: `Overlapping requirement categories (${(overlap * 100).toFixed(0)}% overlap)`,
            confidence,
          });
        }
      }
    }
  }

  // --- Deduplicate: explicit wins over implicit for same directed pair ---
  const finalEdges: DependencyEdge[] = [];
  const addedKeys = new Set<string>();

  // Add all explicit edges first
  for (const [key, edge] of explicitEdges) {
    finalEdges.push(edge);
    addedKeys.add(key);
  }

  // Add implicit edges only if no explicit edge for same pair
  for (const [key, edge] of implicitEdges) {
    if (!addedKeys.has(key)) {
      finalEdges.push(edge);
      addedKeys.add(key);
    }
  }

  return { edges: finalEdges, entryIds };
}
