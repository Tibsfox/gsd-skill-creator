/**
 * Resolution cascade orchestrator.
 *
 * Coordinates multiple resolver adapters in priority order, implementing
 * the confidence-based cascade: stop at first >= 0.70 match, continue
 * if 0.50-0.69, unresolved if all < 0.50.
 *
 * Resolution priority:
 *   1. Local store (if provided)
 *   2. CrossRef (DOI priority)
 *   3. OpenAlex
 *   4. NASA NTRS (report number pattern)
 *   5. GitHub (GitHub URL)
 *   6. Internet Archive (URL-based)
 *   7. Generic web (fallback text parsing)
 */

import type { CitedWork, RawCitation } from '../types/index.js';
import type { ResolutionResult } from '../types/pipeline.js';
import type { ResolverAdapter } from './adapter.js';
import { deduplicateCitations } from './dedup.js';

// ============================================================================
// Store interface (minimal, to avoid circular dependency)
// ============================================================================

/** Minimal interface for the citation store, used for local lookups. */
export interface CitationStorePort {
  findByDoi(doi: string): Promise<CitedWork | null>;
  findByIsbn(isbn: string): Promise<CitedWork | null>;
  findByTitle(title: string, threshold?: number): Promise<CitedWork[]>;
}

// ============================================================================
// Engine options
// ============================================================================

export interface ResolverEngineOptions {
  /** Local citation store for cache-first lookups. */
  store?: CitationStorePort;
  /** Minimum confidence to accept a result (default: 0.70). */
  acceptThreshold?: number;
  /** Minimum confidence to continue trying more adapters (default: 0.50). */
  continueThreshold?: number;
}

// ============================================================================
// ResolverEngine
// ============================================================================

export class ResolverEngine {
  private readonly adapters: ResolverAdapter[];
  private readonly store: CitationStorePort | null;
  private readonly acceptThreshold: number;
  private readonly continueThreshold: number;

  constructor(adapters: ResolverAdapter[], options: ResolverEngineOptions = {}) {
    this.adapters = adapters;
    this.store = options.store ?? null;
    this.acceptThreshold = options.acceptThreshold ?? 0.70;
    this.continueThreshold = options.continueThreshold ?? 0.50;
  }

  // --------------------------------------------------------------------------
  // Single citation resolution
  // --------------------------------------------------------------------------

  /**
   * Resolve a single citation through the adapter cascade.
   *
   * 1. Check local store (DOI, ISBN, title)
   * 2. Try each adapter in order
   * 3. Stop at first >= acceptThreshold
   * 4. Continue if best is in [continueThreshold, acceptThreshold)
   * 5. Return null if all < continueThreshold
   */
  async resolve(citation: RawCitation): Promise<CitedWork | null> {
    // Step 1: Check local store
    const storeResult = await this.checkStore(citation);
    if (storeResult && storeResult.confidence >= this.acceptThreshold) {
      return storeResult;
    }

    let best: CitedWork | null = storeResult;

    // Step 2: Try each adapter
    for (const adapter of this.adapters) {
      // Skip adapters that aren't relevant
      if (!this.shouldTryAdapter(adapter, citation)) continue;

      const result = await adapter.resolve(citation);
      if (!result) continue;

      // Update best if this result is better
      if (!best || result.confidence > best.confidence) {
        best = result;
      }

      // Stop at first high-confidence match
      if (best.confidence >= this.acceptThreshold) {
        return best;
      }
    }

    // Step 3: Return best if above continue threshold, else null
    if (best && best.confidence >= this.continueThreshold) {
      return best;
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // Batch resolution
  // --------------------------------------------------------------------------

  /**
   * Resolve a batch of citations with deduplication.
   *
   * Deduplicates input first, then resolves each unique citation
   * through the cascade. Returns aggregated results.
   */
  async resolveBatch(citations: RawCitation[]): Promise<ResolutionResult> {
    const deduped = deduplicateCitations(citations);

    const resolved: CitedWork[] = [];
    const unresolved: RawCitation[] = [];
    let fromCache = 0;
    let apiCalls = 0;

    for (const citation of deduped) {
      // Track API metrics before resolution
      const metricsBefore = this.adapters.reduce(
        (sum, a) => sum + ((a as { metrics?: { totalCalls: number } }).metrics?.totalCalls ?? 0),
        0,
      );
      const cachesBefore = this.adapters.reduce(
        (sum, a) => sum + ((a as { metrics?: { cacheHits: number } }).metrics?.cacheHits ?? 0),
        0,
      );

      const result = await this.resolve(citation);

      const metricsAfter = this.adapters.reduce(
        (sum, a) => sum + ((a as { metrics?: { totalCalls: number } }).metrics?.totalCalls ?? 0),
        0,
      );
      const cachesAfter = this.adapters.reduce(
        (sum, a) => sum + ((a as { metrics?: { cacheHits: number } }).metrics?.cacheHits ?? 0),
        0,
      );

      apiCalls += metricsAfter - metricsBefore;
      fromCache += cachesAfter - cachesBefore;

      if (result) {
        resolved.push(result);
      } else {
        unresolved.push(citation);
      }
    }

    const avgConfidence = resolved.length > 0
      ? resolved.reduce((sum, r) => sum + r.confidence, 0) / resolved.length
      : 0;

    return {
      resolved,
      unresolved,
      stats: {
        total_attempted: deduped.length,
        resolved_count: resolved.length,
        from_cache: fromCache,
        api_calls: apiCalls,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Enrich unresolved
  // --------------------------------------------------------------------------

  /**
   * Re-attempt resolution for citations in the unresolved queue.
   * Uses a full CitationStorePort to read and write results.
   */
  async enrichUnresolved(store: CitationStorePort & { getUnresolved?: () => Promise<RawCitation[]> }): Promise<ResolutionResult> {
    const unresolved = store.getUnresolved
      ? await store.getUnresolved()
      : [];
    return this.resolveBatch(unresolved);
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  private async checkStore(citation: RawCitation): Promise<CitedWork | null> {
    if (!this.store) return null;

    // Check DOI
    const doi = extractDoi(citation.text);
    if (doi) {
      const found = await this.store.findByDoi(doi);
      if (found) return found;
    }

    // Check ISBN
    const isbn = extractIsbn(citation.text);
    if (isbn) {
      const found = await this.store.findByIsbn(isbn);
      if (found) return found;
    }

    // Check title
    const title = extractTitle(citation.text);
    if (title) {
      const matches = await this.store.findByTitle(title);
      if (matches.length > 0) return matches[0];
    }

    return null;
  }

  /**
   * Determine if an adapter is relevant for a given citation.
   * Optimizes cascade by skipping irrelevant adapters.
   */
  private shouldTryAdapter(adapter: ResolverAdapter, citation: RawCitation): boolean {
    const text = citation.text;

    switch (adapter.name) {
      case 'nasa-ntrs':
        // Only try NASA for NASA report patterns
        return /NASA[-\s]?(SP|TM|NPR|CR|CP|TP|TN|TR|RP)/i.test(text)
          || /ntrs\.nasa\.gov/i.test(text);

      case 'github':
        // Only try GitHub for GitHub URLs or references
        return /github\.com/i.test(text) || /github/i.test(text);

      case 'archive-org':
        // Try for any URL or Archive.org references
        return /https?:\/\//i.test(text) || /archive\.org/i.test(text);

      case 'extracted':
        // Always try generic as last resort (adapter order handles priority)
        return true;

      default:
        // CrossRef, OpenAlex: always try
        return true;
    }
  }
}

// ============================================================================
// Text extraction helpers (duplicated here to avoid circular dependency)
// ============================================================================

function extractDoi(text: string): string | null {
  const m = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

function extractIsbn(text: string): string | null {
  const m = text.match(/(?:ISBN[-:\s]*)?((?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dXx])/i);
  return m ? m[1].replace(/[-\s]/g, '') : null;
}

function extractTitle(text: string): string | null {
  const quoted = text.match(/"([^"]+)"/);
  if (quoted) return quoted[1];
  const afterYear = text.match(/\(\d{4}\)\.\s*(.+?)\./);
  if (afterYear) return afterYear[1];
  return null;
}
