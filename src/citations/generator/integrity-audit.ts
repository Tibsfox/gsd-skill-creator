/**
 * Citation integrity auditor.
 *
 * Cross-references citations found in documents against the CitationStore
 * and ProvenanceTracker to:
 * - Detect broken references (cited IDs not in store)
 * - Find orphaned works (in store but not cited by anything)
 * - Calculate completeness score = resolved / total
 * - Generate actionable recommendations
 */

import type { CitedWork } from '../types/index.js';
import { CitationStore } from '../store/index.js';
import { ProvenanceTracker } from '../store/provenance-chain.js';

// ============================================================================
// Types
// ============================================================================

/** Result of an integrity audit. */
export interface AuditResult {
  total_citations_found: number;
  resolved: number;
  unresolved: number;
  broken_links: string[];
  orphaned_works: string[];
  completeness_score: number;
  recommendations: string[];
}

// ============================================================================
// Citation extraction from content
// ============================================================================

/** Pattern for [CITE:id] markers in document content. */
const CITE_MARKER = /\[CITE:([^\]]+)\]/g;

/** Pattern for DOI references. */
const DOI_PATTERN = /(?:doi:\s*|https?:\/\/doi\.org\/)(10\.\d{4,}\/[^\s,)]+)/gi;

/**
 * Extract all citation references from document content.
 * Returns unique citation IDs and DOIs found.
 */
function extractReferences(content: string): { citeIds: string[]; dois: string[] } {
  const citeIds = new Set<string>();
  const dois = new Set<string>();

  // Extract [CITE:id] markers
  let match: RegExpExecArray | null;
  const citeRegex = new RegExp(CITE_MARKER.source, CITE_MARKER.flags);
  while ((match = citeRegex.exec(content)) !== null) {
    citeIds.add(match[1]);
  }

  // Extract DOIs
  const doiRegex = new RegExp(DOI_PATTERN.source, DOI_PATTERN.flags);
  while ((match = doiRegex.exec(content)) !== null) {
    dois.add(match[1].toLowerCase());
  }

  return {
    citeIds: Array.from(citeIds),
    dois: Array.from(dois),
  };
}

// ============================================================================
// IntegrityAuditor
// ============================================================================

export class IntegrityAuditor {
  private readonly store: CitationStore;
  private readonly provenance: ProvenanceTracker;

  constructor(store: CitationStore, provenance: ProvenanceTracker) {
    this.store = store;
    this.provenance = provenance;
  }

  /**
   * Audit a single document for citation integrity.
   */
  async auditDocument(docPath: string, docContent: string): Promise<AuditResult> {
    const { citeIds, dois } = extractReferences(docContent);
    const totalFound = citeIds.length + dois.length;
    const broken: string[] = [];
    const resolved: string[] = [];

    // Check CITE markers against store
    for (const id of citeIds) {
      const work = await this.store.get(id);
      if (work) {
        resolved.push(id);
      } else {
        broken.push(`[CITE:${id}]`);
      }
    }

    // Check DOIs against store
    for (const doi of dois) {
      const work = await this.store.findByDoi(doi);
      if (work) {
        resolved.push(doi);
      } else {
        broken.push(`DOI:${doi}`);
      }
    }

    // Find orphaned works: in store but not cited by this document
    const allWorks = await this.store.all();
    const provenanceIds = await this.provenance.getByArtifact(docPath);
    const citedInDoc = new Set([...citeIds, ...provenanceIds]);
    const orphaned = allWorks
      .filter(w => !citedInDoc.has(w.id))
      .map(w => w.id);

    const completeness = totalFound > 0 ? resolved.length / totalFound : 1.0;
    const recommendations = this.generateRecommendations(broken, orphaned, completeness);

    return {
      total_citations_found: totalFound,
      resolved: resolved.length,
      unresolved: broken.length,
      broken_links: broken,
      orphaned_works: orphaned,
      completeness_score: completeness,
      recommendations,
    };
  }

  /**
   * Audit all documents in a pack directory.
   */
  async auditPack(packDir: string): Promise<AuditResult> {
    // For pack-level audit, aggregate across all works tagged with the pack
    const allWorks = await this.store.all();
    const packWorks = allWorks.filter(w =>
      w.tags.some(t => t.toLowerCase() === packDir.toLowerCase()),
    );

    // Check that all pack works have provenance entries
    const broken: string[] = [];
    const resolved: string[] = [];

    for (const work of packWorks) {
      const entries = await this.provenance.getBySource(work.id);
      if (entries.length > 0) {
        resolved.push(work.id);
      } else {
        broken.push(work.id);
      }
    }

    const total = packWorks.length;
    const completeness = total > 0 ? resolved.length / total : 1.0;
    const recommendations = this.generateRecommendations(broken, [], completeness);

    return {
      total_citations_found: total,
      resolved: resolved.length,
      unresolved: broken.length,
      broken_links: broken,
      orphaned_works: [],
      completeness_score: completeness,
      recommendations,
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private generateRecommendations(
    broken: string[],
    orphaned: string[],
    completeness: number,
  ): string[] {
    const recs: string[] = [];

    if (broken.length > 0) {
      recs.push(`Resolve ${broken.length} broken reference(s): ${broken.slice(0, 3).join(', ')}${broken.length > 3 ? '...' : ''}`);
    }

    if (orphaned.length > 0) {
      recs.push(`Review ${orphaned.length} orphaned work(s) not cited by any document`);
    }

    if (completeness < 0.5) {
      recs.push('Citation completeness is below 50% -- consider adding source resolution');
    } else if (completeness < 0.8) {
      recs.push('Citation completeness could be improved -- resolve remaining references');
    }

    if (broken.length === 0 && orphaned.length === 0 && completeness >= 0.8) {
      recs.push('Citation integrity is good -- no immediate action needed');
    }

    return recs;
  }
}
