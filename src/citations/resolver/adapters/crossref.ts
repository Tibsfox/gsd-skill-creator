/**
 * CrossRef resolver adapter.
 *
 * Resolves citations via the CrossRef REST API. Supports DOI lookup,
 * title+author search, and full-text query. Uses polite pool with
 * mailto header for higher rate limits.
 *
 * API docs: https://api.crossref.org/swagger-ui/index.html
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// CrossRef response types (minimal subset)
// ============================================================================

interface CrossRefWork {
  DOI?: string;
  title?: string[];
  author?: Array<{ family?: string; given?: string; ORCID?: string; affiliation?: Array<{ name: string }> }>;
  'published-print'?: { 'date-parts'?: number[][] };
  'published-online'?: { 'date-parts'?: number[][] };
  publisher?: string;
  'container-title'?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  type?: string;
  ISBN?: string[];
  URL?: string;
}

interface CrossRefResponse {
  status: string;
  message: CrossRefWork | { items: CrossRefWork[]; 'total-results': number };
}

// ============================================================================
// Adapter
// ============================================================================

const CROSSREF_BASE = 'https://api.crossref.org';
const MAILTO = 'citations@skill-creator.dev';

export class CrossRefAdapter extends BaseAdapter {
  readonly name: SourceApi = 'crossref';
  readonly rateLimitPerSecond = 50;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const doi = extractDoi(citation.text);
    if (doi) {
      const work = await this.fetchWork(`/works/${encodeURIComponent(doi)}`);
      if (work) return this.toCitedWork(work, 0.99);
    }

    // Try structured search if parseable
    const { title, author } = parseStructuredFields(citation.text);
    if (title) {
      const query = author
        ? `/works?query.bibliographic=${enc(title)}&query.author=${enc(author)}&rows=3`
        : `/works?query=${enc(citation.text)}&rows=5`;
      const works = await this.fetchWorks(query);
      return this.bestMatch(citation, works);
    }

    // Fallback: full-text query
    const works = await this.fetchWorks(`/works?query=${enc(citation.text)}&rows=5`);
    return this.bestMatch(citation, works);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const params = [`query=${enc(query)}`, `rows=${options?.maxResults ?? 10}`];
    if (options?.yearFrom) params.push(`filter=from-pub-date:${options.yearFrom}`);
    if (options?.yearTo) params.push(`filter=until-pub-date:${options.yearTo}`);
    if (options?.author) params.push(`query.author=${enc(options.author)}`);

    const works = await this.fetchWorks(`/works?${params.join('&')}`);
    return works.map((w) => this.toCitedWork(w, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(`${CROSSREF_BASE}/works?query=test&rows=0`, {
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

  private async fetchWork(path: string): Promise<CrossRefWork | null> {
    const res = await this.fetchFn(`${CROSSREF_BASE}${path}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CrossRefResponse;
    return data.message as CrossRefWork;
  }

  private async fetchWorks(path: string): Promise<CrossRefWork[]> {
    const res = await this.fetchFn(`${CROSSREF_BASE}${path}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as CrossRefResponse;
    const msg = data.message as { items: CrossRefWork[] };
    return msg.items ?? [];
  }

  private bestMatch(citation: RawCitation, works: CrossRefWork[]): CitedWork | null {
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

  private toCitedWork(w: CrossRefWork, confidence: number): CitedWork {
    const year = extractCrossRefYear(w);
    const now = new Date().toISOString();
    return {
      id: w.DOI ? `doi:${w.DOI}` : `crossref:${(w.title?.[0] ?? 'unknown').slice(0, 40)}`,
      title: w.title?.[0] ?? 'Unknown Title',
      authors: (w.author ?? []).map(mapCrossRefAuthor),
      year: year ?? 2000,
      doi: w.DOI,
      isbn: w.ISBN?.[0],
      url: w.URL,
      publisher: w.publisher,
      journal: w['container-title']?.[0],
      volume: w.volume,
      issue: w.issue,
      pages: w.page,
      type: mapCrossRefType(w.type),
      source_api: 'crossref',
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

function enc(s: string): string {
  return encodeURIComponent(s);
}

function extractDoi(text: string): string | null {
  const m = text.match(/10\.\d{4,}\/[^\s,;)}\]]+/);
  return m ? m[0] : null;
}

function parseStructuredFields(text: string): { title: string | null; author: string | null } {
  const titleMatch = text.match(/"([^"]+)"/) ?? text.match(/\(\d{4}\)\.\s*(.+?)\./);
  const authorMatch = text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[,(]/);
  return {
    title: titleMatch ? (titleMatch[1] ?? titleMatch[2]) : null,
    author: authorMatch ? authorMatch[1] : null,
  };
}

function extractCrossRefYear(w: CrossRefWork): number | null {
  const dateParts =
    w['published-print']?.['date-parts']?.[0] ??
    w['published-online']?.['date-parts']?.[0];
  return dateParts?.[0] ?? null;
}

function mapCrossRefAuthor(a: { family?: string; given?: string; ORCID?: string; affiliation?: Array<{ name: string }> }): Author {
  return {
    family: a.family ?? 'Unknown',
    given: a.given,
    orcid: a.ORCID?.replace('http://orcid.org/', '').replace('https://orcid.org/', ''),
    affiliation: a.affiliation?.[0]?.name,
  };
}

function mapCrossRefType(type?: string): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    'journal-article': 'article',
    'book': 'book',
    'book-chapter': 'chapter',
    'proceedings-article': 'conference',
    'report': 'report',
    'posted-content': 'article',
    'dissertation': 'thesis',
    'monograph': 'book',
    'standard': 'standard',
  };
  return mapping[type ?? ''] ?? 'other';
}
