/**
 * PubMed resolver adapter.
 *
 * Resolves biomedical citations via the NCBI E-utilities. Uses a two-step
 * esearch -> esummary flow: esearch maps a term (or DOI) to PubMed IDs,
 * esummary returns document summaries. Free, no API key required.
 *
 * API docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// PubMed response types (minimal subset)
// ============================================================================

interface ESearchResponse {
  esearchresult?: { idlist?: string[]; count?: string };
}

interface PubMedArticleId {
  idtype?: string;
  value?: string;
}

interface PubMedDocSummary {
  uid?: string;
  title?: string;
  authors?: Array<{ name?: string; authtype?: string }>;
  pubdate?: string;
  articleids?: PubMedArticleId[];
  fulljournalname?: string;
  source?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  pubtype?: string[];
}

interface ESummaryResponse {
  result?: { uids?: string[] } & Record<string, PubMedDocSummary | string[] | undefined>;
}

// ============================================================================
// Adapter
// ============================================================================

const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const MAILTO = 'citations@skill-creator.dev';

export class PubMedAdapter extends BaseAdapter {
  readonly name: SourceApi = 'pubmed';
  readonly rateLimitPerSecond = 3;

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const doi = extractDoi(citation.text);
    if (doi) {
      const summaries = await this.fetchSummaries(`${doi}[doi]`, 1);
      if (summaries.length > 0) {
        const cited = this.toCitedWork(summaries[0], 0);
        const score = scoreMatch(citation, cited);
        return { ...cited, confidence: Math.max(score, 0.9) };
      }
    }

    const summaries = await this.fetchSummaries(citation.text, 5);
    return this.bestMatch(citation, summaries);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    let term = query;
    if (options?.author) term += ` AND ${options.author}[author]`;
    if (options?.yearFrom || options?.yearTo) {
      const from = options?.yearFrom ?? 1400;
      const to = options?.yearTo ?? 2100;
      term += ` AND ${from}:${to}[dp]`;
    }
    const summaries = await this.fetchSummaries(term, options?.maxResults ?? 10);
    return summaries.map((s) => this.toCitedWork(s, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(
      `${EUTILS_BASE}/esearch.fcgi?db=pubmed&term=test&retmode=json&retmax=1`,
      { headers: this.headers(), signal: AbortSignal.timeout(5000) },
    );
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

  private async fetchSummaries(term: string, retmax: number): Promise<PubMedDocSummary[]> {
    const ids = await this.esearch(term, retmax);
    if (ids.length === 0) return [];
    return this.esummary(ids);
  }

  private async esearch(term: string, retmax: number): Promise<string[]> {
    const res = await this.fetchFn(
      `${EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${retmax}`,
      { headers: this.headers(), signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as ESearchResponse;
    return data.esearchresult?.idlist ?? [];
  }

  private async esummary(ids: string[]): Promise<PubMedDocSummary[]> {
    const res = await this.fetchFn(
      `${EUTILS_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
      { headers: this.headers(), signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as ESummaryResponse;
    const result = data.result;
    if (!result) return [];
    const uids = result.uids ?? ids;
    const summaries: PubMedDocSummary[] = [];
    for (const uid of uids) {
      const entry = result[uid];
      if (entry && !Array.isArray(entry)) summaries.push(entry);
    }
    return summaries;
  }

  private bestMatch(citation: RawCitation, summaries: PubMedDocSummary[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const s of summaries) {
      const cited = this.toCitedWork(s, 0);
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private toCitedWork(s: PubMedDocSummary, confidence: number): CitedWork {
    const doi = s.articleids?.find((a) => a.idtype === 'doi')?.value;
    const now = new Date().toISOString();
    return {
      id: doi ? `doi:${doi}` : `pubmed:${s.uid ?? (s.title ?? 'unknown').slice(0, 40)}`,
      title: (s.title ?? 'Unknown Title').replace(/\.$/, ''),
      authors: mapPubMedAuthors(s.authors),
      year: extractYear(s.pubdate) ?? 2000,
      doi,
      journal: s.fulljournalname ?? s.source,
      volume: s.volume,
      issue: s.issue,
      pages: s.pages,
      type: mapPubMedType(s.pubtype),
      source_api: 'pubmed',
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

function extractYear(pubdate?: string): number | null {
  if (!pubdate) return null;
  const m = pubdate.match(/\b(1[4-9]\d{2}|20\d{2}|2100)\b/);
  return m ? parseInt(m[1], 10) : null;
}

function mapPubMedAuthors(authors?: Array<{ name?: string; authtype?: string }>): Author[] {
  const people = (authors ?? []).filter((a) => (a.authtype ?? 'Author') === 'Author' && a.name);
  const mapped = people.map((a) => splitPubMedName(a.name as string));
  return mapped.length > 0 ? mapped : [{ family: 'Unknown' }];
}

function splitPubMedName(name: string): Author {
  // PubMed format: "Family GG" (initials trail the family name).
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return { family: parts[0], given: parts.slice(1).join(' ') };
  }
  return { family: name };
}

function mapPubMedType(pubtypes?: string[]): CitedWork['type'] {
  const mapping: Record<string, CitedWork['type']> = {
    'Journal Article': 'article',
    'Review': 'article',
    'Systematic Review': 'article',
    'Book': 'book',
    'Book Chapter': 'chapter',
    'Clinical Trial': 'article',
    'Comparative Study': 'article',
  };
  for (const t of pubtypes ?? []) {
    const mapped = mapping[t];
    if (mapped) return mapped;
  }
  return 'article';
}
