/**
 * Provenance chain builder for derived knowledge checking.
 *
 * Traces the lineage of a derived artifact back to its source
 * observations and computes an inherited familiarity tier from
 * the most distant source in the chain.
 *
 * @module staging/derived/provenance
 */

import type { LineageEntry } from '../../types/observation.js';
import type { FamiliarityTier, ProvenanceNode, ProvenanceChain } from './types.js';
import { FAMILIARITY_TIERS } from './types.js';

/**
 * Build a provenance chain by tracing upstream from the target artifact.
 *
 * Traces through LineageEntry.inputs[] recursively until reaching root
 * entries (those with no inputs). Uses a visited set to prevent cycles.
 * Nodes are ordered root-first, leaf-last.
 *
 * @param artifactId - The artifact to trace provenance for
 * @param entries - All available lineage entries
 * @returns A ProvenanceChain with nodes and computed inheritedTier
 */
export function buildProvenanceChain(
  artifactId: string,
  entries: LineageEntry[],
): ProvenanceChain {
  // Build index for O(1) lookups
  const index = new Map<string, LineageEntry>();
  for (const entry of entries) {
    index.set(entry.artifactId, entry);
  }

  const targetEntry = index.get(artifactId);

  // Unknown artifact: return empty chain
  if (!targetEntry) {
    const chain: ProvenanceChain = {
      artifactId,
      nodes: [],
      inheritedTier: 'stranger',
    };
    return chain;
  }

  // Collect all reachable entries via upstream tracing
  const collected: LineageEntry[] = [];
  const visited = new Set<string>();

  traceUpstream(artifactId, index, collected, visited);

  // Build nodes from collected entries (already in trace order: leaf first)
  // Reverse to get root-first, leaf-last
  collected.reverse();

  // Build a set of collected artifact IDs for parent resolution
  const collectedIds = new Set(collected.map(e => e.artifactId));

  const nodes: ProvenanceNode[] = collected.map((entry) => {
    // Parent = the first input of this entry that exists in the chain.
    // Entries with no inputs (or no resolvable inputs) are roots with null parent.
    const parent = entry.inputs.find(id => collectedIds.has(id)) ?? null;
    return {
      artifactId: entry.artifactId,
      artifactType: entry.artifactType,
      tier: extractTier(entry),
      parent,
      metadata: entry.metadata,
    };
  });

  const chain: ProvenanceChain = {
    artifactId,
    nodes,
    inheritedTier: 'stranger', // placeholder, computed below
  };

  chain.inheritedTier = getInheritedTier(chain);

  return chain;
}

/**
 * Get the inherited (least familiar) tier from a provenance chain.
 *
 * The inherited tier is the tier with the highest index in
 * FAMILIARITY_TIERS among all nodes. Returns 'stranger' for
 * empty chains (conservative default).
 *
 * @param chain - The provenance chain to evaluate
 * @returns The least familiar tier found in the chain
 */
export function getInheritedTier(chain: ProvenanceChain): FamiliarityTier {
  if (chain.nodes.length === 0) {
    return 'stranger';
  }

  let maxIndex = 0;
  for (const node of chain.nodes) {
    const tierIndex = FAMILIARITY_TIERS.indexOf(node.tier);
    if (tierIndex > maxIndex) {
      maxIndex = tierIndex;
    }
  }

  return FAMILIARITY_TIERS[maxIndex];
}

/**
 * Recursively trace upstream through lineage entries.
 *
 * Visits the target entry, then recurses into each of its inputs.
 * A visited set prevents infinite loops from circular references.
 * Entries are collected in leaf-first order (target first, roots last).
 */
function traceUpstream(
  artifactId: string,
  index: Map<string, LineageEntry>,
  collected: LineageEntry[],
  visited: Set<string>,
): void {
  if (visited.has(artifactId)) return;
  visited.add(artifactId);

  const entry = index.get(artifactId);
  if (!entry) return;

  // Collect this entry (leaf-first order)
  collected.push(entry);

  // Recurse into inputs (upstream)
  for (const inputId of entry.inputs) {
    traceUpstream(inputId, index, collected, visited);
  }
}

/**
 * Extract familiarity tier from a lineage entry's metadata.
 * Defaults to 'stranger' when not present.
 */
function extractTier(entry: LineageEntry): FamiliarityTier {
  const tier = entry.metadata.familiarityTier;
  if (
    typeof tier === 'string' &&
    FAMILIARITY_TIERS.includes(tier as FamiliarityTier)
  ) {
    return tier as FamiliarityTier;
  }
  return 'stranger';
}
