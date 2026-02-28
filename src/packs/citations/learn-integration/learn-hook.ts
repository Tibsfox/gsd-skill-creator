/**
 * Citation learn pipeline hooks.
 *
 * Pre-hook (beforeLearn): extracts citations from source material before
 * skill generation, resolves DOIs via local store, annotates material
 * with [CITE:id] markers. Post-hook (afterLearn): links generated skills
 * to citation provenance asynchronously.
 *
 * SAFE-06: Citation failure NEVER blocks skill generation. All operations
 * wrapped in try/catch with graceful fallback to original material.
 */

import type { RawCitation, CitedWork, ProvenanceEntry, ExtractionResult } from '../types/index.js';
import type { CitationStorePort } from '../resolver/resolver-engine.js';
import type { ResolverEngine } from '../resolver/resolver-engine.js';
import type { CitationStore } from '../store/citation-db.js';
import type { ProvenanceTracker } from '../store/provenance-chain.js';
import { AnnotationInjector } from './annotation-injector.js';

// ============================================================================
// Types
// ============================================================================

/** Metadata about the source material being learned. */
export interface LearnMetadata {
  sourcePath: string;
  sourceType: 'teaching-reference' | 'vision-document' | 'research-reference' | 'documentation' | 'other';
  domain?: string;
  tags?: string[];
}

/** Result of the pre-learn citation extraction hook. */
export interface PreLearnResult {
  annotatedMaterial: string;
  extractedCitations: RawCitation[];
  resolvedWorks: CitedWork[];
  unresolvedCount: number;
  processingTimeMs: number;
}

/** Result of the post-learn skill linking hook. */
export interface PostLearnResult {
  linkedSkills: number;
  newCitedWorks: number;
  resolutionsPending: number;
  provenanceEntries: number;
}

/** Minimal skill metadata for post-hook linking. */
export interface SkillMetadata {
  name: string;
  path: string;
  content: string;
  sections?: string[];
}

/** Extraction function signature matching extractCitations. */
export type ExtractFn = (
  text: string,
  sourceDocument: string,
  options?: { includeLowConfidence?: boolean },
) => Promise<ExtractionResult>;

// ============================================================================
// CitationLearnHook
// ============================================================================

export class CitationLearnHook {
  private readonly extractor: ExtractFn;
  private readonly resolver: ResolverEngine;
  private readonly store: CitationStore;
  private readonly provenance: ProvenanceTracker;
  private readonly injector: AnnotationInjector;

  constructor(
    extractor: ExtractFn,
    resolver: ResolverEngine,
    store: CitationStore,
    provenance: ProvenanceTracker,
  ) {
    this.extractor = extractor;
    this.resolver = resolver;
    this.store = store;
    this.provenance = provenance;
    this.injector = new AnnotationInjector();
  }

  // --------------------------------------------------------------------------
  // Pre-hook: extract and annotate citations before skill generation
  // --------------------------------------------------------------------------

  /**
   * Extract citations from source material before skill generation.
   *
   * Pipeline: extract -> resolve DOIs (local only) -> store resolved ->
   * queue unresolved -> annotate with [CITE:id] markers.
   *
   * SAFE-06: On any error, returns original material unchanged with
   * empty extraction stats.
   */
  async beforeLearn(material: string, metadata: LearnMetadata): Promise<PreLearnResult> {
    const start = Date.now();

    try {
      // Step 1: Extract citations from material
      const extraction = await this.extractor(material, metadata.sourcePath);
      const rawCitations = extraction.citations;

      if (rawCitations.length === 0) {
        return {
          annotatedMaterial: material,
          extractedCitations: [],
          resolvedWorks: [],
          unresolvedCount: 0,
          processingTimeMs: Date.now() - start,
        };
      }

      // Step 2: Resolve citations with DOIs via local store first
      const resolvedWorks: CitedWork[] = [];
      const unresolvedCitations: RawCitation[] = [];

      for (const citation of rawCitations) {
        const doi = extractDoiFromText(citation.text);
        let resolved: CitedWork | null = null;

        // Fast path: check store by DOI
        if (doi) {
          resolved = await this.store.findByDoi(doi);
        }

        // Try resolver for remaining (DOI + local DB only, budget: <2s)
        if (!resolved) {
          try {
            resolved = await this.resolver.resolve(citation);
          } catch {
            // Resolver failure is non-fatal
          }
        }

        if (resolved) {
          resolvedWorks.push(resolved);
          // Step 3: Store resolved works
          try {
            await this.store.add(resolved);
          } catch {
            // Store failure is non-fatal
          }
        } else {
          unresolvedCitations.push(citation);
          // Step 4: Queue unresolved
          try {
            await this.store.addUnresolved(citation);
          } catch {
            // Queue failure is non-fatal
          }
        }
      }

      // Step 5: Annotate material with [CITE:id] markers
      const annotationEntries = rawCitations.map((citation, idx) => ({
        citation,
        work: resolvedWorks.find((_w, wIdx) => wIdx === idx) ?? findWorkForCitation(citation, resolvedWorks),
      }));

      const annotatedMaterial = await this.injector.annotate(material, annotationEntries);

      // Step 6: Return result with timing
      return {
        annotatedMaterial,
        extractedCitations: rawCitations,
        resolvedWorks,
        unresolvedCount: unresolvedCitations.length,
        processingTimeMs: Date.now() - start,
      };
    } catch {
      // SAFE-06: Citation failure NEVER blocks learn pipeline
      return {
        annotatedMaterial: material,
        extractedCitations: [],
        resolvedWorks: [],
        unresolvedCount: 0,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Post-hook: link generated skills to citation provenance (async)
  // --------------------------------------------------------------------------

  /**
   * Link generated skills to citation provenance after skill generation.
   *
   * For each skill, determines which citations apply based on [CITE:id]
   * marker proximity, creates provenance entries, and updates skill
   * metadata. This runs asynchronously -- does not block skill generation.
   *
   * SAFE-06: On any error, returns zero stats without propagating.
   */
  async afterLearn(
    generatedSkills: SkillMetadata[],
    preResult: PreLearnResult,
  ): Promise<PostLearnResult> {
    try {
      let linkedSkills = 0;
      let provenanceEntries = 0;
      const newCitedWorkIds = new Set<string>();

      for (const skill of generatedSkills) {
        // Find [CITE:id] markers in skill content
        const citeIds = extractCiteMarkers(skill.content);

        if (citeIds.length === 0) {
          // If no markers in skill, check if any resolved works match skill sections
          const matchingWorks = findWorksMatchingSections(
            skill,
            preResult.resolvedWorks,
            preResult.annotatedMaterial,
          );
          if (matchingWorks.length > 0) {
            for (const work of matchingWorks) {
              citeIds.push(work.id);
            }
          }
        }

        if (citeIds.length === 0) continue;

        linkedSkills++;

        // Create provenance entries for each citation in this skill
        for (const citationId of citeIds) {
          const entry: ProvenanceEntry = {
            artifact_type: 'skill',
            artifact_path: skill.path,
            artifact_name: skill.name,
            section: skill.sections?.[0],
            timestamp: new Date().toISOString(),
          };

          try {
            await this.provenance.link(citationId, entry);
            provenanceEntries++;
            newCitedWorkIds.add(citationId);
          } catch {
            // Provenance failure is non-fatal
          }
        }

        // Update skill frontmatter with citation IDs
        try {
          await this.injector.annotateSkill(skill.content, citeIds);
        } catch {
          // Annotation failure is non-fatal
        }
      }

      return {
        linkedSkills,
        newCitedWorks: newCitedWorkIds.size,
        resolutionsPending: preResult.unresolvedCount,
        provenanceEntries,
      };
    } catch {
      // SAFE-06: Post-hook failure is completely non-fatal
      return {
        linkedSkills: 0,
        newCitedWorks: 0,
        resolutionsPending: preResult.unresolvedCount,
        provenanceEntries: 0,
      };
    }
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Extract DOI from citation text. */
function extractDoiFromText(text: string): string | null {
  const m = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

/** Extract [CITE:id] markers from text. */
export function extractCiteMarkers(text: string): string[] {
  const markers: string[] = [];
  const pattern = /\[CITE:([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    markers.push(match[1]);
  }
  return markers;
}

/** Find a resolved work that matches a raw citation by DOI or text overlap. */
function findWorkForCitation(citation: RawCitation, works: CitedWork[]): CitedWork | undefined {
  const doi = extractDoiFromText(citation.text);
  if (doi) {
    const byDoi = works.find(w => w.doi === doi);
    if (byDoi) return byDoi;
  }

  // Match by text overlap: check if citation text contains work title
  for (const work of works) {
    if (citation.text.toLowerCase().includes(work.title.toLowerCase().slice(0, 30))) {
      return work;
    }
  }

  return undefined;
}

/**
 * Find resolved works whose content appears near skill sections
 * in the annotated material. Uses text proximity matching.
 */
function findWorksMatchingSections(
  skill: SkillMetadata,
  works: CitedWork[],
  annotatedMaterial: string,
): CitedWork[] {
  if (!skill.sections || skill.sections.length === 0) return [];

  const matching: CitedWork[] = [];
  const materialLower = annotatedMaterial.toLowerCase();

  for (const work of works) {
    const titleLower = work.title.toLowerCase();
    // Check if work title appears near any skill section content
    const titlePos = materialLower.indexOf(titleLower.slice(0, 30));
    if (titlePos === -1) continue;

    for (const section of skill.sections) {
      const sectionPos = materialLower.indexOf(section.toLowerCase().slice(0, 30));
      if (sectionPos === -1) continue;

      // If within 500 chars of each other, consider them related
      if (Math.abs(titlePos - sectionPos) < 500) {
        matching.push(work);
        break;
      }
    }
  }

  return matching;
}
