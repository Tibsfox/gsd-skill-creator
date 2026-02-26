/**
 * Attribution report generator.
 *
 * Classifies claims within documents into five categories:
 * - cited_prior_work: Claims with [CITE:id] markers or matching citations
 * - common_knowledge: Generic statements, definitions, well-known facts
 * - novel_synthesis: Combines multiple cited works in new way
 * - novel_claims: Original GSD contributions with no citation match
 * - unattributed: Specific claims that appear citable but lack citation
 *
 * Works with CitationStore for citation lookups and ProvenanceTracker
 * for artifact-level provenance data.
 */

import type { CitedWork } from '../types/index.js';
import { CitationStore } from '../store/index.js';
import { ProvenanceTracker } from '../store/provenance-chain.js';

// ============================================================================
// Types
// ============================================================================

/** Full attribution report data for a document, pack, or ecosystem. */
export interface AttributionReportData {
  total_claims: number;
  cited_prior_work: { count: number; works: CitedWork[] };
  common_knowledge: { count: number; examples: string[] };
  novel_synthesis: { count: number; descriptions: string[] };
  novel_claims: { count: number; descriptions: string[] };
  unattributed: { count: number; flagged: string[] };
  summary_text: string;
}

// ============================================================================
// Heuristic patterns
// ============================================================================

/** Patterns indicating common knowledge (definitions, well-known facts). */
const COMMON_KNOWLEDGE_PATTERNS = [
  /^[\w\s]+ is (defined as|a|an|the) /i,
  /^(it is|this is) (well[- ]known|widely accepted|generally understood)/i,
  /^(by definition|traditionally|conventionally|historically)/i,
  /^(the|a|an) [\w\s]+ (refers to|means|denotes|describes) /i,
];

/** Pattern for [CITE:id] markers in text. */
const CITE_MARKER = /\[CITE:([^\]]+)\]/g;

/** Pattern for multi-citation references suggesting synthesis. */
const MULTI_CITE = /\[CITE:[^\]]+\].*\[CITE:[^\]]+\]/;

/** Patterns suggesting a claim needs attribution. */
const ATTRIBUTION_NEEDED_PATTERNS = [
  /^(studies show|research (indicates|suggests|has shown))/i,
  /^(according to|as (noted|described|shown) by)/i,
  /^(evidence (suggests|indicates)|data (shows|indicates))/i,
  /^(it has been (shown|demonstrated|proven|found))/i,
  /^(\d+%|a majority|most|many|several|numerous) (of|studies|researchers)/i,
];

// ============================================================================
// Claim extraction and classification
// ============================================================================

/**
 * Extract individual claims (sentences) from document content.
 * Splits on sentence boundaries and filters noise.
 */
function extractClaims(content: string): string[] {
  // Remove headings, code blocks, and empty lines
  const cleaned = content
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/^\s*[-*]\s*/gm, '')
    .trim();

  // Split into sentences
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Skip very short fragments
}

/**
 * Check if a claim matches common knowledge patterns.
 */
function isCommonKnowledge(claim: string): boolean {
  return COMMON_KNOWLEDGE_PATTERNS.some(p => p.test(claim));
}

/**
 * Check if a claim appears to need attribution but lacks it.
 */
function needsAttribution(claim: string): boolean {
  return ATTRIBUTION_NEEDED_PATTERNS.some(p => p.test(claim));
}

/**
 * Extract all CITE marker IDs from a claim.
 */
function extractCiteIds(claim: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(CITE_MARKER.source, CITE_MARKER.flags);
  while ((match = regex.exec(claim)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

// ============================================================================
// AttributionReport
// ============================================================================

export class AttributionReport {
  private readonly store: CitationStore;
  private readonly provenance: ProvenanceTracker;

  constructor(store: CitationStore, provenance: ProvenanceTracker) {
    this.store = store;
    this.provenance = provenance;
  }

  /**
   * Generate an attribution report for a single document.
   */
  async generateForDocument(docPath: string, content?: string): Promise<AttributionReportData> {
    const docContent = content ?? '';
    const claims = extractClaims(docContent);

    // Get citation IDs linked to this document via provenance
    const linkedCitationIds = await this.provenance.getByArtifact(docPath);
    const linkedWorks = await this.resolveWorks(linkedCitationIds);

    return this.classifyClaims(claims, linkedWorks);
  }

  /**
   * Generate an attribution report for a pack (directory of documents).
   */
  async generateForPack(packName: string): Promise<AttributionReportData> {
    // Get all works tagged with this pack name
    const works = await this.store.findByTag(packName);

    // For pack-level, we classify based on the works themselves
    return {
      total_claims: works.length,
      cited_prior_work: { count: works.length, works },
      common_knowledge: { count: 0, examples: [] },
      novel_synthesis: { count: 0, descriptions: [] },
      novel_claims: { count: 0, descriptions: [] },
      unattributed: { count: 0, flagged: [] },
      summary_text: this.generateSummary({
        total_claims: works.length,
        cited_prior_work: { count: works.length, works },
        common_knowledge: { count: 0, examples: [] },
        novel_synthesis: { count: 0, descriptions: [] },
        novel_claims: { count: 0, descriptions: [] },
        unattributed: { count: 0, flagged: [] },
        summary_text: '',
      }),
    };
  }

  /**
   * Generate an ecosystem-wide attribution summary.
   */
  async generateEcosystemSummary(): Promise<AttributionReportData> {
    const allWorks = await this.store.all();

    return {
      total_claims: allWorks.length,
      cited_prior_work: { count: allWorks.length, works: allWorks },
      common_knowledge: { count: 0, examples: [] },
      novel_synthesis: { count: 0, descriptions: [] },
      novel_claims: { count: 0, descriptions: [] },
      unattributed: { count: 0, flagged: [] },
      summary_text: this.generateSummary({
        total_claims: allWorks.length,
        cited_prior_work: { count: allWorks.length, works: allWorks },
        common_knowledge: { count: 0, examples: [] },
        novel_synthesis: { count: 0, descriptions: [] },
        novel_claims: { count: 0, descriptions: [] },
        unattributed: { count: 0, flagged: [] },
        summary_text: '',
      }),
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private async resolveWorks(citationIds: string[]): Promise<CitedWork[]> {
    const works: CitedWork[] = [];
    for (const id of citationIds) {
      const work = await this.store.get(id);
      if (work) works.push(work);
    }
    return works;
  }

  private classifyClaims(claims: string[], linkedWorks: CitedWork[]): AttributionReportData {
    const citedWorks: CitedWork[] = [];
    const commonKnowledge: string[] = [];
    const novelSynthesis: string[] = [];
    const novelClaims: string[] = [];
    const unattributed: string[] = [];

    const linkedWorkIds = new Set(linkedWorks.map(w => w.id));

    for (const claim of claims) {
      const citeIds = extractCiteIds(claim);

      if (citeIds.length > 0) {
        // Has explicit citation markers
        if (MULTI_CITE.test(claim)) {
          // Multiple citations = synthesis
          novelSynthesis.push(claim);
        } else {
          // Single citation = cited prior work
          for (const id of citeIds) {
            const work = linkedWorks.find(w => w.id === id);
            if (work && !citedWorks.some(w => w.id === work.id)) {
              citedWorks.push(work);
            }
          }
        }
      } else if (isCommonKnowledge(claim)) {
        commonKnowledge.push(claim);
      } else if (needsAttribution(claim)) {
        unattributed.push(claim);
      } else {
        // No citation, not common knowledge, not needing attribution = novel
        novelClaims.push(claim);
      }
    }

    // Add any linked works not already captured from CITE markers
    for (const work of linkedWorks) {
      if (!citedWorks.some(w => w.id === work.id)) {
        citedWorks.push(work);
      }
    }

    const data: AttributionReportData = {
      total_claims: claims.length,
      cited_prior_work: { count: citedWorks.length, works: citedWorks },
      common_knowledge: { count: commonKnowledge.length, examples: commonKnowledge },
      novel_synthesis: { count: novelSynthesis.length, descriptions: novelSynthesis },
      novel_claims: { count: novelClaims.length, descriptions: novelClaims },
      unattributed: { count: unattributed.length, flagged: unattributed },
      summary_text: '',
    };

    data.summary_text = this.generateSummary(data);
    return data;
  }

  private generateSummary(data: AttributionReportData): string {
    const lines: string[] = [
      '# Attribution Report',
      '',
      `**Total claims analyzed:** ${data.total_claims}`,
      '',
      '| Category | Count | Percentage |',
      '|----------|-------|------------|',
    ];

    const categories = [
      ['Cited prior work', data.cited_prior_work.count],
      ['Common knowledge', data.common_knowledge.count],
      ['Novel synthesis', data.novel_synthesis.count],
      ['Novel claims', data.novel_claims.count],
      ['Unattributed', data.unattributed.count],
    ] as const;

    for (const [name, count] of categories) {
      const pct = data.total_claims > 0
        ? ((count / data.total_claims) * 100).toFixed(1)
        : '0.0';
      lines.push(`| ${name} | ${count} | ${pct}% |`);
    }

    if (data.unattributed.count > 0) {
      lines.push('');
      lines.push('## Unattributed Claims');
      lines.push('');
      for (const claim of data.unattributed.flagged) {
        lines.push(`- ${claim}`);
      }
    }

    return lines.join('\n');
  }
}
