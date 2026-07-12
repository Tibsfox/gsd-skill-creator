/**
 * Semantic Scholar resolver adapter.
 *
 * Resolves citations via the Semantic Scholar Graph API. Supports DOI
 * lookup and free-text search. Free tier, no API key required.
 *
 * API docs: https://api.semanticscholar.org/api-docs/graph
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// Semantic Scholar response types (minimal subset)
// ============================================================================

interface S2Paper {
  paperId?: string;
  externalIds?: { DOI?: string };
  title?: string;
  year?: number;
  authors?: Array<{ authorId?: string; name?: string }>;
  venue?: string;
  journal?: { name?: string; volume?: string; pages?: string };
  publicationTypes?: string[];
  openAccessPdf?: { url?: string };
}

interface S2SearchResponse {
  total?: number;
  offset?: number;
  data?: S2Paper[];
}

// ============================================================================
// Adapter
// ============================================================================

const S2_BASE = 'https://api.semanticscholar.org/graph/v1';
const FIELDS = 'title,year,authors,externalIds,venue,journal,publicationTypes,openAccessPdf';
const MAILTO = 'citations@skill-creator.dev';

export class SemanticScholarAdapter extends BaseAdapter {
  readonly name: SourceApi = 'semantic-scholar';
  readonly rateLimitPerSecond = 1;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const doi = extractDoi(citation.text);
    if (doi) {
      const paper = await this.fetchPaper(`/paper/DOI:${encodeURIComponent(doi)}?fields=${FIELDS}`);
      if (paper) return this.toCitedWork(paper, 0.99);
    }

    const papers = await this.fetchSearch(
      `/paper/search?query=${encodeURIComponent(citation.text)}&limit=5&fields=${FIELDS}`,
    );
    return this.bestMatch(citation, papers);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const params = [
      `query=${encodeURIComponent(query)}`,
      `limit=${options?.maxResults ?? 10}`,
      `fields=${FIELDS}`,
    ];
    if (options?.yearFrom || options?.yearTo) {
      const from = options?.yearFrom ?? '';
      const to = options?.yearTo ?? '';
      params.push(`year=${from}-${to}`);
    }

    const papers = await this.fetchSearch(`/paper/search?${params.join('&')}`);
    return papers.map((p) => this.toCitedWork(p, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(`${S2_BASE}/paper/search?query=test&limit=1`, {
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

  private async fetchPaper(path: string): Promise<S2Paper | null> {
    const res = await this.fetchFn(`${S2_BASE}${path}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as S2Paper;
  }

  private async fetchSearch(path: string): Promise<S2Paper[]> {
    const res = await this.fetchFn(`${S2_BASE}${path}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as S2SearchResponse;
    return data.data ?? [];
  }

  private bestMatch(citation: RawCitation, papers: S2Paper[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const p of papers) {
      const cited = this.toCitedWork(p, 0);
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private toCitedWork(p: S2Paper, confidence: number): CitedWork {
    const doi = p.externalIds?.DOI;
    const now = new Date().toISOString();
    return {
      id: doi ? `doi:${doi}` : `semantic-scholar:${p.paperId ?? (p.title ?? 'unknown').slice(0, 40)}`,
      title: p.title ?? 'Unknown Title',
      authors: (p.authors ?? []).map(mapS2Author),
      year: p.year ?? 2000,
      doi,
      url: p.openAccessPdf?.url ?? undefined,
      journal: p.journal?.name ?? p.venue,
      volume: p.journal?.volume,
      pages: p.journal?.pages,
      type: mapS2Type(p.publicationTypes),
      source_api: 'semantic-scholar',
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

function mapS2Author(a: { authorId?: string; name?: string }): Author {
  const displayName = a.name ?? 'Unknown';
  const parts = displayName.trim().split(/\s+/);
  const family = parts.length > 1 ? parts[parts.length - 1] : displayName;
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : undefined;
  return { family, given };
}

function mapS2Type(types?: string[]): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    JournalArticle: 'article',
    Review: 'article',
    Conference: 'conference',
    Book: 'book',
    BookSection: 'chapter',
    Dataset: 'other',
    Thesis: 'thesis',
    Editorial: 'article',
  };
  for (const t of types ?? []) {
    const mapped = mapping[t];
    if (mapped) return mapped;
  }
  return 'other';
}
