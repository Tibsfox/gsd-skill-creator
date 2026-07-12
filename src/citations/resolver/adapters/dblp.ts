/**
 * DBLP resolver adapter.
 *
 * Resolves computer-science citations via the DBLP search API. Uses the
 * publication search endpoint with JSON output. Free, no API key required.
 *
 * API docs: https://dblp.org/faq/How+to+use+the+dblp+search+API.html
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// DBLP response types (minimal subset)
// ============================================================================

interface DblpAuthorEntry {
  '@pid'?: string;
  text?: string;
}

interface DblpInfo {
  authors?: { author?: DblpAuthorEntry | DblpAuthorEntry[] };
  title?: string;
  venue?: string;
  volume?: string;
  number?: string;
  pages?: string;
  year?: string;
  type?: string;
  key?: string;
  doi?: string;
  ee?: string;
  url?: string;
}

interface DblpHit {
  info?: DblpInfo;
}

interface DblpResponse {
  result?: {
    hits?: {
      hit?: DblpHit | DblpHit[];
    };
  };
}

// ============================================================================
// Adapter
// ============================================================================

const DBLP_BASE = 'https://dblp.org/search/publ/api';
const MAILTO = 'citations@skill-creator.dev';

export class DblpAdapter extends BaseAdapter {
  readonly name: SourceApi = 'dblp';
  readonly rateLimitPerSecond = 2;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const hits = await this.fetchHits(citation.text, 5);
    return this.bestMatch(citation, hits);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const hits = await this.fetchHits(query, options?.maxResults ?? 10);
    return hits
      .map((h) => this.toCitedWork(h, 0.5))
      .filter((w): w is CitedWork => w !== null);
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(`${DBLP_BASE}?q=test&format=json&h=1`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private headers(): Record<string, string> {
    return {
      'User-Agent': `SkillCreatorCitations/1.0 (mailto:${MAILTO})`,
      Accept: 'application/json',
    };
  }

  private async fetchHits(query: string, limit: number): Promise<DblpHit[]> {
    const res = await this.fetchFn(
      `${DBLP_BASE}?q=${encodeURIComponent(query)}&format=json&h=${limit}`,
      {
        headers: this.headers(),
        signal: AbortSignal.timeout(this.timeoutMs),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as DblpResponse;
    const hit = data.result?.hits?.hit;
    if (!hit) return [];
    return Array.isArray(hit) ? hit : [hit];
  }

  private bestMatch(citation: RawCitation, hits: DblpHit[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const h of hits) {
      const cited = this.toCitedWork(h, 0);
      if (!cited) continue;
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private toCitedWork(h: DblpHit, confidence: number): CitedWork | null {
    const info = h.info;
    if (!info) return null;
    const doi = info.doi;
    const now = new Date().toISOString();
    return {
      id: doi ? `doi:${doi}` : `dblp:${info.key ?? (info.title ?? 'unknown').slice(0, 40)}`,
      title: (info.title ?? 'Unknown Title').replace(/\.$/, ''),
      authors: mapDblpAuthors(info.authors?.author),
      year: info.year ? parseInt(info.year, 10) : 2000,
      doi,
      url: info.ee ?? info.url,
      journal: info.venue,
      volume: info.volume,
      issue: info.number,
      pages: info.pages,
      type: mapDblpType(info.type),
      source_api: 'dblp',
      confidence,
      first_seen: now,
      cited_by: [],
      tags: [],
      raw_citations: [],
      verified: false,
    };
  }
}

// ============================================================================
// Utility functions
// ============================================================================

function mapDblpAuthors(author?: DblpAuthorEntry | DblpAuthorEntry[]): Author[] {
  if (!author) return [{ family: 'Unknown' }];
  const entries = Array.isArray(author) ? author : [author];
  const mapped = entries
    .map((a) => a.text)
    .filter((t): t is string => Boolean(t))
    .map(splitName);
  return mapped.length > 0 ? mapped : [{ family: 'Unknown' }];
}

function splitName(displayName: string): Author {
  // DBLP disambiguates homonyms with a trailing number, e.g. "Wei Wang 0001".
  const cleaned = displayName.replace(/\s+\d{4}$/, '').trim();
  const parts = cleaned.split(/\s+/);
  const family = parts.length > 1 ? parts[parts.length - 1] : cleaned;
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : undefined;
  return { family: family || 'Unknown', given };
}

function mapDblpType(type?: string): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    'Journal Articles': 'article',
    'Conference and Workshop Papers': 'conference',
    'Books and Theses': 'book',
    'Parts in Books or Collections': 'chapter',
    'Informal and Other Publications': 'other',
    'Editorship': 'other',
  };
  return mapping[type ?? ''] ?? 'other';
}
