/**
 * Bibliography formatter orchestrator.
 *
 * Coordinates bibliography generation across multiple output formats
 * with scope filtering (all/document/domain), sorting, and a pluggable
 * format registry. Delegates actual rendering to format-specific modules.
 */

import type { CitedWork } from '../types/index.js';
import type { BibliographyFormat, FormatOptions } from '../types/index.js';
import { CitationStore } from '../store/index.js';
import { formatBibliography as formatBibtex } from './formats/bibtex.js';
import { formatBibliography as formatApa7 } from './formats/apa7.js';

// ============================================================================
// Types
// ============================================================================

/** A format renderer takes works and options, returns formatted string. */
export type FormatRenderer = (works: CitedWork[], options: FormatOptions) => string;

// ============================================================================
// BibliographyFormatter
// ============================================================================

export class BibliographyFormatter {
  private readonly store: CitationStore;
  private readonly formats: Map<BibliographyFormat, FormatRenderer> = new Map();

  constructor(store: CitationStore) {
    this.store = store;

    // Register built-in formats
    this.formats.set('bibtex', formatBibtex);
    this.formats.set('apa7', formatApa7);
  }

  /**
   * Register a format renderer. Can override built-in formats.
   */
  registerFormat(name: BibliographyFormat, renderer: FormatRenderer): void {
    this.formats.set(name, renderer);
  }

  /**
   * Generate a bibliography for all works matching the options.
   */
  async generate(options: FormatOptions): Promise<string> {
    let works = await this.store.all();
    works = this.applyFilters(works, options);
    works = this.sortWorks(works, options);
    return this.render(works, options);
  }

  /**
   * Generate a bibliography scoped to works cited by a specific artifact.
   */
  async generateForArtifact(artifactPath: string, options: FormatOptions): Promise<string> {
    const allWorks = await this.store.all();
    let works = allWorks.filter(w =>
      w.cited_by.some(p => p.artifact_path === artifactPath),
    );
    works = this.applyFilters(works, options);
    works = this.sortWorks(works, options);
    return this.render(works, options);
  }

  /**
   * Generate a bibliography scoped to works with a specific tag.
   */
  async generateForDomain(tag: string, options: FormatOptions): Promise<string> {
    let works = await this.store.findByTag(tag);
    works = this.applyFilters(works, options);
    works = this.sortWorks(works, options);
    return this.render(works, options);
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private applyFilters(works: CitedWork[], options: FormatOptions): CitedWork[] {
    let filtered = works;

    // Filter unverified if not included
    if (!options.includeUnverified) {
      filtered = filtered.filter(w => w.verified);
    }

    // Apply scopeFilter if present (tag-based filtering)
    if (options.scopeFilter) {
      const filterTag = options.scopeFilter.toLowerCase();
      filtered = filtered.filter(w =>
        w.tags.some(t => t.toLowerCase() === filterTag),
      );
    }

    return filtered;
  }

  private sortWorks(works: CitedWork[], options: FormatOptions): CitedWork[] {
    const sorted = [...works];

    switch (options.sortBy) {
      case 'author':
        sorted.sort((a, b) => {
          const aName = a.authors[0]?.family.toLowerCase() ?? '';
          const bName = b.authors[0]?.family.toLowerCase() ?? '';
          if (aName !== bName) return aName.localeCompare(bName);
          return a.year - b.year;
        });
        break;
      case 'year':
        sorted.sort((a, b) => a.year - b.year);
        break;
      case 'title':
        sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
        break;
    }

    return sorted;
  }

  private render(works: CitedWork[], options: FormatOptions): string {
    const renderer = this.formats.get(options.format);
    if (!renderer) {
      throw new Error(`Unsupported bibliography format: ${options.format}`);
    }
    return renderer(works, options);
  }
}
