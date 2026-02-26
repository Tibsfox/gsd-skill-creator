/**
 * Internet Archive resolver adapter.
 *
 * Resolves citations via the Internet Archive APIs. Supports Wayback
 * Machine URL lookup and advanced metadata search. Primary use case:
 * recovering dead links and finding archived versions of cited resources.
 *
 * APIs: Wayback Availability API, Advanced Search API
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// Internet Archive response types (minimal subset)
// ============================================================================

interface WaybackResponse {
  url?: string;
  archived_snapshots?: {
    closest?: {
      status?: string;
      available?: boolean;
      url?: string;
      timestamp?: string;
    };
  };
}

interface ArchiveSearchDoc {
  identifier?: string;
  title?: string;
  creator?: string | string[];
  date?: string;
  year?: string;
  publisher?: string;
  mediatype?: string;
  description?: string | string[];
  subject?: string | string[];
}

interface ArchiveSearchResponse {
  response?: {
    numFound?: number;
    docs?: ArchiveSearchDoc[];
  };
}

// ============================================================================
// Adapter
// ============================================================================

const ARCHIVE_BASE = 'https://archive.org';
const WAYBACK_BASE = 'https://web.archive.org';

export class ArchiveOrgAdapter extends BaseAdapter {
  readonly name: SourceApi = 'archive-org';
  readonly rateLimitPerSecond = 5;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const url = extractUrl(citation.text);
    if (url) {
      // Try Wayback Machine for URL-based citations
      const wayback = await this.fetchWayback(url);
      if (wayback) return wayback;
    }

    // Search archive metadata
    const docs = await this.searchArchive(citation.text);
    return this.bestMatch(citation, docs);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const parts = [query];
    if (options?.yearFrom) parts.push(`year:[${options.yearFrom} TO *]`);
    if (options?.yearTo) parts.push(`year:[* TO ${options.yearTo}]`);
    if (options?.author) parts.push(`creator:${options.author}`);

    const docs = await this.searchArchive(parts.join(' AND '), options?.maxResults);
    return docs.map((d) => this.docToCitedWork(d, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(
      `${WAYBACK_BASE}/wayback/available?url=example.com`,
      { signal: AbortSignal.timeout(5000) },
    );
    return res.ok;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async fetchWayback(url: string): Promise<CitedWork | null> {
    const res = await this.fetchFn(
      `${WAYBACK_BASE}/wayback/available?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as WaybackResponse;
    const snapshot = data.archived_snapshots?.closest;
    if (!snapshot?.available || !snapshot.url) return null;

    const year = snapshot.timestamp
      ? parseInt(snapshot.timestamp.slice(0, 4), 10)
      : new Date().getFullYear();
    const now = new Date().toISOString();

    return {
      id: `archive:${url}`,
      title: url,
      authors: [{ family: 'Internet Archive' }],
      year: isNaN(year) ? 2000 : year,
      url: snapshot.url,
      type: 'website',
      source_api: 'archive-org',
      confidence: 0.70,
      first_seen: now,
      cited_by: [],
      tags: ['wayback', 'archived'],
      notes: `Archived version of ${url}`,
      raw_citations: [],
      verified: false,
    };
  }

  private async searchArchive(query: string, maxResults = 5): Promise<ArchiveSearchDoc[]> {
    const params = [
      `q=${encodeURIComponent(query)}`,
      `output=json`,
      `rows=${maxResults}`,
      'fl[]=identifier,title,creator,date,year,publisher,mediatype,description,subject',
    ];
    const res = await this.fetchFn(
      `${ARCHIVE_BASE}/advancedsearch.php?${params.join('&')}`,
      { signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as ArchiveSearchResponse;
    return data.response?.docs ?? [];
  }

  private bestMatch(citation: RawCitation, docs: ArchiveSearchDoc[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const d of docs) {
      const cited = this.docToCitedWork(d, 0);
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private docToCitedWork(d: ArchiveSearchDoc, confidence: number): CitedWork {
    const yearStr = d.year ?? d.date?.slice(0, 4);
    const year = yearStr ? parseInt(yearStr, 10) : 2000;
    const now = new Date().toISOString();

    return {
      id: d.identifier ? `archive:${d.identifier}` : `archive:${(d.title ?? 'unknown').slice(0, 40)}`,
      title: d.title ?? 'Unknown Title',
      authors: parseCreators(d.creator),
      year: isNaN(year) ? 2000 : year,
      url: d.identifier ? `https://archive.org/details/${d.identifier}` : undefined,
      publisher: d.publisher,
      type: mapArchiveMediaType(d.mediatype),
      source_api: 'archive-org',
      confidence,
      first_seen: now,
      cited_by: [],
      tags: normalizeToArray(d.subject),
      raw_citations: [],
      verified: false,
    };
  }
}

// ============================================================================
// Utility functions
// ============================================================================

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

function parseCreators(creator?: string | string[]): Author[] {
  if (!creator) return [{ family: 'Unknown' }];
  const creators = Array.isArray(creator) ? creator : [creator];
  return creators.map((c) => {
    const parts = c.split(/,\s*/);
    return {
      family: parts[0] ?? 'Unknown',
      given: parts[1],
    };
  });
}

function normalizeToArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function mapArchiveMediaType(mediatype?: string): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    texts: 'book',
    audio: 'other',
    movies: 'other',
    software: 'repository',
    web: 'website',
    data: 'other',
    image: 'other',
  };
  return mapping[mediatype ?? ''] ?? 'other';
}
