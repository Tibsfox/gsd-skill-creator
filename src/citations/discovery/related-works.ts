/**
 * Related works finder.
 *
 * Discovers related citations by analyzing co-citation patterns in
 * provenance data and by searching by author family name.
 *
 * @module citations/discovery/related-works
 */

import type { CitedWork } from '../types/index.js';
import type { CitationStore } from '../store/citation-db.js';
import type { ProvenanceTracker } from '../store/provenance-chain.js';

// ============================================================================
// RelatedWorksFinder
// ============================================================================

export class RelatedWorksFinder {
  private readonly store: CitationStore;
  private readonly provenance: ProvenanceTracker;

  constructor(store: CitationStore, provenance: ProvenanceTracker) {
    this.store = store;
    this.provenance = provenance;
  }

  /**
   * Find works related to a given citation by co-citation.
   *
   * Looks at the provenance chain to find which artifacts cite this work,
   * then collects all other citations referenced by those same artifacts.
   *
   * @param citationId - The citation to find related works for.
   * @returns Array of related CitedWork (excluding the input itself).
   */
  async findRelated(citationId: string): Promise<CitedWork[]> {
    const related = new Map<string, CitedWork>();

    // Get provenance entries for this citation
    const entries = await this.provenance.getBySource(citationId);

    for (const entry of entries) {
      // Find all other citations in the same artifact
      const coIds = await this.provenance.getByArtifact(entry.artifact_path);
      for (const coId of coIds) {
        if (coId === citationId) continue;
        if (related.has(coId)) continue;

        const work = await this.store.get(coId);
        if (work) {
          related.set(coId, work);
        }
      }
    }

    return Array.from(related.values());
  }

  /**
   * Find all works by an author family name.
   *
   * @param authorFamily - Author family name to search for.
   * @returns Array of CitedWork by that author.
   */
  async findByAuthor(authorFamily: string): Promise<CitedWork[]> {
    return this.store.findByAuthor(authorFamily);
  }
}
