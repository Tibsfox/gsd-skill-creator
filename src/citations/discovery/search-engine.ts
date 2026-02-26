/**
 * Discovery search engine for citation lookups across multiple APIs.
 *
 * Orchestrates parallel queries to all registered resolver adapters,
 * deduplicates results by DOI and title similarity, and marks works
 * already present in the citation store.
 *
 * @module citations/discovery/search-engine
 */

import type { CitedWork, SourceApi } from '../types/index.js';
import type { ResolverAdapter, SearchOptions } from '../resolver/adapter.js';
import type { CitationStorePort } from '../resolver/resolver-engine.js';
import { titleSimilarity } from '../store/citation-db.js';

// ============================================================================
// Types
// ============================================================================

/** Options controlling discovery search behavior. */
export interface DiscoveryOptions {
  /** Restrict search to a specific API adapter. */
  api?: SourceApi;
  /** Maximum results per adapter (default: 10). */
  maxResults?: number;
  /** Filter results from this year onward. */
  yearFrom?: number;
  /** Filter results up to this year. */
  yearTo?: number;
  /** Filter results by author family name. */
  author?: string;
}

/** A single discovery search result with metadata. */
export interface SearchResult {
  /** The resolved or partial work. */
  work: Partial<CitedWork>;
  /** Which API adapter returned this result. */
  source: SourceApi;
  /** Confidence score from the adapter (0-1). */
  confidence: number;
  /** Whether this work is already in the local store. */
  alreadyInStore: boolean;
}

// ============================================================================
// Dedup threshold
// ============================================================================

const DEDUP_TITLE_THRESHOLD = 0.92;

// ============================================================================
// DiscoverySearchEngine
// ============================================================================

export class DiscoverySearchEngine {
  private readonly adapters: ResolverAdapter[];
  private readonly store: CitationStorePort;

  constructor(adapters: ResolverAdapter[], store: CitationStorePort) {
    this.adapters = adapters;
    this.store = store;
  }

  /**
   * Search for works matching a query across all registered adapters.
   *
   * If a specific API is requested via options.api, only that adapter
   * is queried. Otherwise all adapters are queried in parallel using
   * Promise.allSettled. Results are deduplicated by DOI and title
   * similarity, marked for store presence, and sorted by confidence
   * descending.
   */
  async search(query: string, options: DiscoveryOptions = {}): Promise<SearchResult[]> {
    const searchOpts: SearchOptions = {
      maxResults: options.maxResults ?? 10,
      yearFrom: options.yearFrom,
      yearTo: options.yearTo,
      author: options.author,
    };

    // Determine which adapters to query
    const targetAdapters = options.api
      ? this.adapters.filter(a => a.name === options.api)
      : this.adapters;

    if (targetAdapters.length === 0) {
      return [];
    }

    // Query all target adapters in parallel
    const settled = await Promise.allSettled(
      targetAdapters.map(async (adapter) => {
        const works = await adapter.search(query, searchOpts);
        return works.map((work): SearchResult => ({
          work,
          source: adapter.name,
          confidence: work.confidence,
          alreadyInStore: false,
        }));
      }),
    );

    // Collect all successful results
    const allResults: SearchResult[] = [];
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        allResults.push(...outcome.value);
      }
    }

    // Deduplicate by DOI and title similarity
    const deduped = this.deduplicate(allResults);

    // Check store presence for each result
    await this.markStorePresence(deduped);

    // Sort by confidence descending
    deduped.sort((a, b) => b.confidence - a.confidence);

    return deduped;
  }

  /**
   * Deduplicate results. If two results share the same DOI or have
   * very similar titles, keep the one with higher confidence.
   */
  private deduplicate(results: SearchResult[]): SearchResult[] {
    const kept: SearchResult[] = [];

    for (const result of results) {
      const doi = result.work.doi?.toLowerCase();
      const title = result.work.title ?? '';

      let isDuplicate = false;
      for (let i = 0; i < kept.length; i++) {
        const existing = kept[i];
        const existingDoi = existing.work.doi?.toLowerCase();
        const existingTitle = existing.work.title ?? '';

        // Match by DOI
        if (doi && existingDoi && doi === existingDoi) {
          // Keep the higher-confidence one
          if (result.confidence > existing.confidence) {
            kept[i] = result;
          }
          isDuplicate = true;
          break;
        }

        // Match by title similarity
        if (title && existingTitle && titleSimilarity(title, existingTitle) >= DEDUP_TITLE_THRESHOLD) {
          if (result.confidence > existing.confidence) {
            kept[i] = result;
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        kept.push(result);
      }
    }

    return kept;
  }

  /**
   * Mark each result's alreadyInStore flag by checking the store.
   */
  private async markStorePresence(results: SearchResult[]): Promise<void> {
    for (const result of results) {
      // Check by DOI first
      if (result.work.doi) {
        const found = await this.store.findByDoi(result.work.doi);
        if (found) {
          result.alreadyInStore = true;
          continue;
        }
      }

      // Check by title
      if (result.work.title) {
        const matches = await this.store.findByTitle(result.work.title);
        if (matches.length > 0) {
          result.alreadyInStore = true;
        }
      }
    }
  }
}
