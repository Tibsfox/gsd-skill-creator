/**
 * NASA NTRS (Technical Reports Server) resolver adapter.
 *
 * Resolves citations via the NASA NTRS API. Supports report number
 * lookup and title search. Maps NASA document types to CitedWork types.
 *
 * API docs: https://ntrs.nasa.gov/api
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// NASA NTRS response types (minimal subset)
// ============================================================================

interface NtrsDocument {
  id?: number;
  title?: string;
  authorAffiliations?: Array<{
    meta?: { author?: { name?: string; orcidId?: string } };
  }>;
  publications?: Array<{
    publicationDate?: string;
    publisher?: string;
    reportNumber?: string;
  }>;
  downloadsCount?: number;
  subjectCategories?: string[];
  center?: { name?: string };
  documentType?: string;
  stiType?: string;
  url?: string;
}

interface NtrsSearchResponse {
  results?: NtrsDocument[];
  totalCount?: number;
}

// ============================================================================
// Adapter
// ============================================================================

const NTRS_BASE = 'https://ntrs.nasa.gov/api';

export class NasaNtrsAdapter extends BaseAdapter {
  readonly name: SourceApi = 'nasa-ntrs';
  readonly rateLimitPerSecond = 5;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const reportNumber = extractReportNumber(citation.text);
    if (reportNumber) {
      const docs = await this.fetchDocuments(
        `/citations/search?reportNumber=${encodeURIComponent(reportNumber)}`,
      );
      if (docs.length > 0) return this.bestMatch(citation, docs);
    }

    // Title-based search
    const docs = await this.fetchDocuments(
      `/citations/search?q=${encodeURIComponent(citation.text)}`,
    );
    return this.bestMatch(citation, docs);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const params = [`q=${encodeURIComponent(query)}`];
    if (options?.maxResults) params.push(`size=${options.maxResults}`);
    if (options?.yearFrom) params.push(`yearFrom=${options.yearFrom}`);
    if (options?.yearTo) params.push(`yearTo=${options.yearTo}`);

    const docs = await this.fetchDocuments(`/citations/search?${params.join('&')}`);
    return docs.map((d) => this.toCitedWork(d, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(`${NTRS_BASE}/citations/search?q=test&size=0`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async fetchDocuments(path: string): Promise<NtrsDocument[]> {
    const res = await this.fetchFn(`${NTRS_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NtrsSearchResponse;
    return data.results ?? [];
  }

  private bestMatch(citation: RawCitation, docs: NtrsDocument[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const d of docs) {
      const cited = this.toCitedWork(d, 0);
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private toCitedWork(d: NtrsDocument, confidence: number): CitedWork {
    const pub = d.publications?.[0];
    const year = pub?.publicationDate
      ? parseInt(pub.publicationDate.slice(0, 4), 10)
      : 2000;
    const now = new Date().toISOString();

    return {
      id: d.id ? `ntrs:${d.id}` : `ntrs:${(d.title ?? 'unknown').slice(0, 40)}`,
      title: d.title ?? 'Unknown Title',
      authors: (d.authorAffiliations ?? []).map(mapNtrsAuthor),
      year: isNaN(year) ? 2000 : year,
      url: d.url ?? (d.id ? `https://ntrs.nasa.gov/citations/${d.id}` : undefined),
      publisher: pub?.publisher ?? d.center?.name,
      type: mapNtrsType(d.stiType ?? d.documentType),
      source_api: 'nasa-ntrs',
      confidence,
      first_seen: now,
      cited_by: [],
      tags: d.subjectCategories ?? [],
      raw_citations: [],
      verified: false,
    };
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/** Extract NASA report number patterns: NASA-SP-XXX, NASA-TM-XXX, NASA-NPR-XXX, etc. */
function extractReportNumber(text: string): string | null {
  const m = text.match(/NASA[-\s]?(SP|TM|NPR|CR|CP|TP|TN|TR|RP)[-\s]?\d+/i);
  return m ? m[0] : null;
}

function mapNtrsAuthor(aa: {
  meta?: { author?: { name?: string; orcidId?: string } };
}): Author {
  const name = aa.meta?.author?.name ?? 'Unknown';
  const parts = name.split(/,\s*/);
  return {
    family: parts[0] ?? 'Unknown',
    given: parts[1],
    orcid: aa.meta?.author?.orcidId ?? undefined,
  };
}

function mapNtrsType(type?: string): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    'SP': 'report',
    'TM': 'report',
    'CR': 'report',
    'CP': 'conference',
    'TP': 'report',
    'NPR': 'standard',
    'Technical Report': 'report',
    'Conference Paper': 'conference',
    'Journal Article': 'article',
    'Book': 'book',
    'Thesis': 'thesis',
    'Patent': 'patent',
  };
  return mapping[type ?? ''] ?? 'report';
}
