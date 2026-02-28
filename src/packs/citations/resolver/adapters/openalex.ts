/**
 * OpenAlex resolver adapter.
 *
 * Resolves citations via the OpenAlex API. Supports DOI filter lookup
 * and free-text search. Free tier, no API key required.
 *
 * API docs: https://docs.openalex.org
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// OpenAlex response types (minimal subset)
// ============================================================================

interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  authorships?: Array<{
    author: { display_name?: string; orcid?: string };
    institutions?: Array<{ display_name?: string }>;
  }>;
  publication_year?: number;
  primary_location?: {
    source?: { display_name?: string; publisher?: string };
  };
  biblio?: { volume?: string; issue?: string; first_page?: string; last_page?: string };
  type?: string;
  open_access?: { oa_url?: string };
  ids?: { doi?: string; openalex?: string };
}

interface OpenAlexResponse {
  results: OpenAlexWork[];
  meta: { count: number };
}

// ============================================================================
// Adapter
// ============================================================================

const OPENALEX_BASE = 'https://api.openalex.org';
const MAILTO = 'citations@skill-creator.dev';

export class OpenAlexAdapter extends BaseAdapter {
  readonly name: SourceApi = 'openalex';
  readonly rateLimitPerSecond = 10;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const doi = extractDoi(citation.text);
    if (doi) {
      const works = await this.fetchWorks(`/works?filter=doi:${encodeURIComponent(doi)}`);
      if (works.length > 0) return this.toCitedWork(works[0], 0.99);
    }

    // Free-text search
    const works = await this.fetchWorks(
      `/works?search=${encodeURIComponent(citation.text)}&per_page=5`,
    );
    return this.bestMatch(citation, works);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const params = [
      `search=${encodeURIComponent(query)}`,
      `per_page=${options?.maxResults ?? 10}`,
    ];
    if (options?.yearFrom) params.push(`filter=publication_year:>${options.yearFrom - 1}`);
    if (options?.yearTo) params.push(`filter=publication_year:<${options.yearTo + 1}`);
    if (options?.author) params.push(`filter=author.search:${encodeURIComponent(options.author)}`);

    const works = await this.fetchWorks(`/works?${params.join('&')}`);
    return works.map((w) => this.toCitedWork(w, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(`${OPENALEX_BASE}/works?search=test&per_page=0`, {
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

  private async fetchWorks(path: string): Promise<OpenAlexWork[]> {
    const res = await this.fetchFn(`${OPENALEX_BASE}${path}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as OpenAlexResponse;
    return data.results ?? [];
  }

  private bestMatch(citation: RawCitation, works: OpenAlexWork[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const w of works) {
      const cited = this.toCitedWork(w, 0);
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private toCitedWork(w: OpenAlexWork, confidence: number): CitedWork {
    const doi = w.doi?.replace('https://doi.org/', '') ?? w.ids?.doi?.replace('https://doi.org/', '');
    const now = new Date().toISOString();
    return {
      id: doi ? `doi:${doi}` : `openalex:${w.id}`,
      title: w.title ?? 'Unknown Title',
      authors: (w.authorships ?? []).map(mapOpenAlexAuthor),
      year: w.publication_year ?? 2000,
      doi,
      url: w.open_access?.oa_url ?? undefined,
      publisher: w.primary_location?.source?.publisher,
      journal: w.primary_location?.source?.display_name,
      volume: w.biblio?.volume,
      issue: w.biblio?.issue,
      pages: formatPages(w.biblio?.first_page, w.biblio?.last_page),
      type: mapOpenAlexType(w.type),
      source_api: 'openalex',
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

function extractDoi(text: string): string | null {
  const m = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

function mapOpenAlexAuthor(authorship: {
  author: { display_name?: string; orcid?: string };
  institutions?: Array<{ display_name?: string }>;
}): Author {
  const displayName = authorship.author.display_name ?? 'Unknown';
  const parts = displayName.split(' ');
  const family = parts.length > 1 ? parts[parts.length - 1] : displayName;
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : undefined;
  const orcid = authorship.author.orcid
    ?.replace('https://orcid.org/', '')
    ?.replace('http://orcid.org/', '');

  return {
    family,
    given,
    orcid,
    affiliation: authorship.institutions?.[0]?.display_name,
  };
}

function mapOpenAlexType(type?: string): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    'journal-article': 'article',
    'book': 'book',
    'book-chapter': 'chapter',
    'proceedings-article': 'conference',
    'report': 'report',
    'dissertation': 'thesis',
    'posted-content': 'article',
    'standard': 'standard',
    'dataset': 'other',
    'article': 'article',
  };
  return mapping[type ?? ''] ?? 'other';
}

function formatPages(first?: string, last?: string): string | undefined {
  if (!first) return undefined;
  return last && first !== last ? `${first}-${last}` : first;
}
