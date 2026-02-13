/**
 * Optimization analyzer for the staging queue.
 *
 * Detects batching, parallelism, and shared setup opportunities
 * across queued items by analyzing domains, tags, dependencies,
 * skills, and topology recommendations.
 *
 * Pure function — no I/O, no side effects.
 *
 * @module staging/queue/optimization-analyzer
 */

import type { QueueEntry } from './types.js';
import type { ResourceManifest } from '../resource/types.js';

// ============================================================================
// Types
// ============================================================================

/** Types of optimization that can be suggested. */
export type OptimizationType = 'batch' | 'parallel' | 'shared-setup';

/** All optimization types as a const array for runtime use. */
export const OPTIMIZATION_TYPES = [
  'batch',
  'parallel',
  'shared-setup',
] as const;

/**
 * A suggested optimization for a set of queue entries.
 */
export interface OptimizationSuggestion {
  /** Type of optimization. */
  type: OptimizationType;
  /** Human-readable description of the opportunity. */
  description: string;
  /** IDs of affected queue entries. */
  entryIds: string[];
  /** Confidence score (0-1). */
  confidence: number;
  /** Type-specific details. */
  details: Record<string, unknown>;
}

/**
 * A directed dependency edge between two queue entries.
 *
 * Indicates that `from` must complete before `to` can start.
 * Defined here since dependency-detector.ts is not yet implemented.
 */
export interface DependencyEdge {
  /** Entry ID that must complete first. */
  from: string;
  /** Entry ID that depends on `from`. */
  to: string;
  /** Reason for the dependency. */
  reason: string;
}

// ============================================================================
// Batching (QUEUE-04)
// ============================================================================

/**
 * Find batching opportunities for entries with overlapping domains or tags.
 *
 * Domain batching: entries sharing the exact same domain string.
 * Tag batching: entries with Jaccard similarity >= 0.4 on queueContext.tags.
 */
function findBatchOpportunities(
  entries: QueueEntry[],
  manifests: Map<string, ResourceManifest>,
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // --- Domain batching ---
  const domainGroups = new Map<string, QueueEntry[]>();
  for (const entry of entries) {
    const group = domainGroups.get(entry.domain) ?? [];
    group.push(entry);
    domainGroups.set(entry.domain, group);
  }

  const batchedEntryIds = new Set<string>();

  for (const [domain, group] of domainGroups) {
    if (group.length < 2) continue;

    const entryIds = group.map((e) => e.id);
    const confidence = Math.min(0.9, 0.6 + 0.05 * group.length);

    suggestions.push({
      type: 'batch',
      description: `Batch ${group.length} entries in "${domain}" domain`,
      entryIds,
      confidence,
      details: { domain },
    });

    for (const id of entryIds) {
      batchedEntryIds.add(id);
    }
  }

  // --- Tag batching ---
  // For pairs not already in a domain batch
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      // Skip if both already in the same domain batch
      if (batchedEntryIds.has(a.id) && batchedEntryIds.has(b.id) && a.domain === b.domain) {
        continue;
      }

      const manifestA = manifests.get(a.id);
      const manifestB = manifests.get(b.id);
      if (!manifestA || !manifestB) continue;

      const tagsA = new Set(manifestA.queueContext.tags);
      const tagsB = new Set(manifestB.queueContext.tags);

      if (tagsA.size === 0 && tagsB.size === 0) continue;

      const intersection = [...tagsA].filter((t) => tagsB.has(t));
      const union = new Set([...tagsA, ...tagsB]);
      const jaccard = union.size > 0 ? intersection.length / union.size : 0;

      if (jaccard >= 0.4 && intersection.length >= 2) {
        suggestions.push({
          type: 'batch',
          description: `Batch entries with shared tags: ${intersection.join(', ')}`,
          entryIds: [a.id, b.id],
          confidence: jaccard * 0.8,
          details: { sharedTags: intersection },
        });
      }
    }
  }

  return suggestions;
}

// ============================================================================
// Parallel lanes (QUEUE-05)
// ============================================================================

/**
 * Find parallel execution lanes for independent entries.
 *
 * Uses dependency edges to determine which entries can run concurrently.
 * Entries not connected by any edge (directly) are independent.
 */
function findParallelLanes(
  entries: QueueEntry[],
  dependencyEdges: DependencyEdge[],
): OptimizationSuggestion[] {
  if (entries.length < 2) return [];

  // Build adjacency set (bidirectional — if A->B, they cannot be parallel)
  const connected = new Set<string>();
  for (const edge of dependencyEdges) {
    connected.add(`${edge.from}:${edge.to}`);
    connected.add(`${edge.to}:${edge.from}`);
  }

  const entryIds = entries.map((e) => e.id);

  // Find maximal independent set via greedy approach
  // Check all pairs for independence
  const independentPairs: Array<[string, string]> = [];
  for (let i = 0; i < entryIds.length; i++) {
    for (let j = i + 1; j < entryIds.length; j++) {
      const key = `${entryIds[i]}:${entryIds[j]}`;
      if (!connected.has(key)) {
        independentPairs.push([entryIds[i], entryIds[j]]);
      }
    }
  }

  if (independentPairs.length === 0) return [];

  // Try to build maximal independent group
  // Start with all entries, remove those that are connected
  const independentGroup: string[] = [];
  for (const id of entryIds) {
    // Check if this entry is independent of all entries already in the group
    const isIndependent = independentGroup.every(
      (groupId) => !connected.has(`${id}:${groupId}`),
    );
    if (isIndependent) {
      independentGroup.push(id);
    }
  }

  const suggestions: OptimizationSuggestion[] = [];

  if (independentGroup.length >= 2) {
    suggestions.push({
      type: 'parallel',
      description: `${independentGroup.length} entries can execute in parallel`,
      entryIds: independentGroup,
      confidence: 0.7,
      details: { laneCount: independentGroup.length },
    });
  }

  return suggestions;
}

// ============================================================================
// Shared setup (QUEUE-06)
// ============================================================================

/**
 * Find shared setup opportunities across entries.
 *
 * Checks for: shared skills (ready/recommended), shared external
 * dependencies (case-insensitive), and same topology recommendation.
 * Merges multiple signals for the same pair into one suggestion.
 */
function findSharedSetup(
  entries: QueueEntry[],
  manifests: Map<string, ResourceManifest>,
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      const manifestA = manifests.get(a.id);
      const manifestB = manifests.get(b.id);
      if (!manifestA || !manifestB) continue;

      let bestConfidence = 0;
      const mergedDetails: Record<string, unknown> = {};
      const descParts: string[] = [];

      // (a) Shared skills
      const skillsA = manifestA.skillMatches
        .filter((s) => s.status === 'ready' || s.status === 'recommended')
        .map((s) => s.skillName);
      const skillsB = new Set(
        manifestB.skillMatches
          .filter((s) => s.status === 'ready' || s.status === 'recommended')
          .map((s) => s.skillName),
      );
      const sharedSkills = skillsA.filter((s) => skillsB.has(s));

      if (sharedSkills.length >= 1) {
        const confidence = Math.min(0.8, 0.5 + 0.1 * sharedSkills.length);
        if (confidence > bestConfidence) bestConfidence = confidence;
        mergedDetails.sharedSkills = sharedSkills;
        descParts.push(`shared skills: ${sharedSkills.join(', ')}`);
      }

      // (b) Shared external dependencies (case-insensitive)
      const depsA = manifestA.visionAnalysis.dependencies.map((d) =>
        d.name.toLowerCase(),
      );
      const depsB = new Set(
        manifestB.visionAnalysis.dependencies.map((d) => d.name.toLowerCase()),
      );
      const sharedDeps = [...new Set(depsA.filter((d) => depsB.has(d)))];

      if (sharedDeps.length >= 1) {
        const confidence = Math.min(0.8, 0.5 + 0.1 * sharedDeps.length);
        if (confidence > bestConfidence) bestConfidence = confidence;
        mergedDetails.sharedDependencies = sharedDeps;
        descParts.push(`shared dependencies: ${sharedDeps.join(', ')}`);
      }

      // (c) Same topology
      if (manifestA.topology.topology === manifestB.topology.topology) {
        const confidence = 0.4;
        if (confidence > bestConfidence) bestConfidence = confidence;
        mergedDetails.sharedTopology = manifestA.topology.topology;
        descParts.push(`shared topology: ${manifestA.topology.topology}`);
      }

      if (descParts.length > 0) {
        suggestions.push({
          type: 'shared-setup',
          description: `Shared setup opportunity: ${descParts.join('; ')}`,
          entryIds: [a.id, b.id],
          confidence: bestConfidence,
          details: mergedDetails,
        });
      }
    }
  }

  return suggestions;
}

// ============================================================================
// Main
// ============================================================================

/**
 * Analyze a set of queued entries for optimization opportunities.
 *
 * Detects three types of optimizations:
 * - **Batching (QUEUE-04):** Same domain or overlapping tags
 * - **Parallel lanes (QUEUE-05):** Independent entries with no dependencies
 * - **Shared setup (QUEUE-06):** Common skills, dependencies, or topology
 *
 * Results are sorted by confidence descending.
 *
 * @param entries - Queue entries to analyze.
 * @param manifests - Resource manifests keyed by entry ID.
 * @param dependencyEdges - Optional dependency edges between entries.
 * @returns Array of optimization suggestions, sorted by confidence descending.
 */
export function analyzeOptimizations(
  entries: QueueEntry[],
  manifests: Map<string, ResourceManifest>,
  dependencyEdges: DependencyEdge[] = [],
): OptimizationSuggestion[] {
  if (entries.length < 2) return [];

  const batching = findBatchOpportunities(entries, manifests);
  const parallel = findParallelLanes(entries, dependencyEdges);
  const sharedSetup = findSharedSetup(entries, manifests);

  const all = [...batching, ...parallel, ...sharedSetup];

  // Sort by confidence descending
  all.sort((a, b) => b.confidence - a.confidence);

  return all;
}
