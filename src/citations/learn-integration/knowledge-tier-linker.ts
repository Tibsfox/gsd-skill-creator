/**
 * Knowledge tier linker for citations.
 *
 * Connects resolved citations to knowledge tiers (summary, active,
 * reference) by scanning tier content for mentions of citation
 * authors or titles. Priority assignment follows tier hierarchy:
 *   summary = 3 (always loaded)
 *   active = 2 (session-relevant)
 *   reference = 1 (deep dives)
 */

import type { CitedWork } from '../types/index.js';

// ============================================================================
// Types
// ============================================================================

/** A knowledge tier with name, content, and priority. */
export interface KnowledgeTier {
  name: 'summary' | 'active' | 'reference';
  content: string;
  priority: number;
}

/** Result of linking citations to tiers. */
export interface TierLinkResult {
  linked: Array<{ citationId: string; tier: string; priority: number }>;
  unlinked: string[];
}

/** Default tier priorities. */
const TIER_PRIORITIES: Record<string, number> = {
  summary: 3,
  active: 2,
  reference: 1,
};

// ============================================================================
// KnowledgeTierLinker
// ============================================================================

export class KnowledgeTierLinker {

  /**
   * Link citations to knowledge tiers by scanning content for mentions.
   *
   * For each citation, check each tier's content for:
   * - Author family name mentions
   * - Title (or first 40 chars) mentions
   *
   * Citations found in higher-priority tiers get higher priority values.
   * A citation matching multiple tiers gets the highest priority.
   * Results are sorted by priority descending.
   */
  async linkToTiers(
    citations: CitedWork[],
    tiers: KnowledgeTier[],
  ): Promise<TierLinkResult> {
    const linked: Array<{ citationId: string; tier: string; priority: number }> = [];
    const linkedIds = new Set<string>();

    for (const citation of citations) {
      let bestTier: string | null = null;
      let bestPriority = 0;

      for (const tier of tiers) {
        if (this.citationMentionedInTier(citation, tier)) {
          const priority = TIER_PRIORITIES[tier.name] ?? tier.priority;
          if (priority > bestPriority) {
            bestTier = tier.name;
            bestPriority = priority;
          }
        }
      }

      if (bestTier !== null) {
        linked.push({
          citationId: citation.id,
          tier: bestTier,
          priority: bestPriority,
        });
        linkedIds.add(citation.id);
      }
    }

    // Sort by priority descending
    linked.sort((a, b) => b.priority - a.priority);

    // Collect unlinked citation IDs
    const unlinked = citations
      .filter(c => !linkedIds.has(c.id))
      .map(c => c.id);

    return { linked, unlinked };
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /**
   * Check if a citation is mentioned in a tier's content.
   * Matches author family names and title fragments (case-insensitive).
   */
  private citationMentionedInTier(citation: CitedWork, tier: KnowledgeTier): boolean {
    const contentLower = tier.content.toLowerCase();

    // Check author family names
    for (const author of citation.authors) {
      if (contentLower.includes(author.family.toLowerCase())) {
        return true;
      }
    }

    // Check title (first 40 chars to handle truncation)
    const titleFragment = citation.title.toLowerCase().slice(0, 40);
    if (titleFragment.length >= 10 && contentLower.includes(titleFragment)) {
      return true;
    }

    return false;
  }
}
