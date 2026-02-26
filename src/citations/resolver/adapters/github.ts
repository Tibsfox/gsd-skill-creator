/**
 * GitHub resolver adapter.
 *
 * Resolves citations for GitHub repositories using the GitHub REST API.
 * Supports URL-based repo lookup, CITATION.cff parsing, and repository
 * search. SAFE-01 compliant: fetches metadata only, never repository contents.
 *
 * API docs: https://docs.github.com/en/rest
 */

import type { CitedWork, RawCitation, Author } from '../../types/index.js';
import { BaseAdapter, type BaseAdapterConfig, type SearchOptions } from '../adapter.js';
import { scoreMatch } from '../confidence.js';
import type { SourceApi } from '../../types/index.js';

// ============================================================================
// GitHub response types (minimal subset)
// ============================================================================

interface GitHubRepo {
  full_name: string;
  name: string;
  description?: string;
  html_url: string;
  owner: { login: string };
  license?: { name?: string; spdx_id?: string };
  created_at?: string;
  updated_at?: string;
  stargazers_count?: number;
  topics?: string[];
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

interface CitationCff {
  title?: string;
  authors?: Array<{
    family?: string;
    given?: string;
    'family-names'?: string;
    'given-names'?: string;
    orcid?: string;
    affiliation?: string;
  }>;
  doi?: string;
  url?: string;
  version?: string;
  'date-released'?: string;
  type?: string;
}

// ============================================================================
// Adapter
// ============================================================================

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubAdapter extends BaseAdapter {
  readonly name: SourceApi = 'github';
  readonly rateLimitPerSecond = 1; // 60/hr unauthenticated

  constructor(config: BaseAdapterConfig = {}) {
    super(config);
  }

  // --------------------------------------------------------------------------
  // Resolve
  // --------------------------------------------------------------------------

  protected async doResolve(citation: RawCitation): Promise<CitedWork | null> {
    const ownerRepo = extractGitHubRepo(citation.text);
    if (ownerRepo) {
      const repo = await this.fetchRepo(ownerRepo.owner, ownerRepo.repo);
      if (!repo) return null;

      // Try to get CITATION.cff for richer metadata
      const cff = await this.fetchCitationCff(ownerRepo.owner, ownerRepo.repo);
      if (cff) {
        return this.cffToCitedWork(cff, repo, 0.95);
      }
      return this.repoToCitedWork(repo, 0.85);
    }

    // Search by text
    const repos = await this.searchRepos(citation.text);
    return this.bestMatch(citation, repos);
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  protected async doSearch(query: string, options?: SearchOptions): Promise<CitedWork[]> {
    const parts = [query];
    if (options?.author) parts.push(`user:${options.author}`);

    const repos = await this.searchRepos(parts.join(' '), options?.maxResults);
    return repos.map((r) => this.repoToCitedWork(r, 0.5));
  }

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------

  protected async checkAvailability(): Promise<boolean> {
    const res = await this.fetchFn(`${GITHUB_API_BASE}/rate_limit`, {
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
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'SkillCreatorCitations/1.0',
    };
  }

  private async fetchRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
    const res = await this.fetchFn(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as GitHubRepo;
  }

  private async fetchCitationCff(owner: string, repo: string): Promise<CitationCff | null> {
    // SAFE-01: Only fetch the CITATION.cff metadata file, not repo contents
    const res = await this.fetchFn(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/CITATION.cff`,
      { signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!res.ok) return null;
    try {
      const text = await res.text();
      return parseCitationCff(text);
    } catch {
      return null;
    }
  }

  private async searchRepos(query: string, maxResults = 5): Promise<GitHubRepo[]> {
    const res = await this.fetchFn(
      `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&per_page=${maxResults}`,
      {
        headers: this.headers(),
        signal: AbortSignal.timeout(this.timeoutMs),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as GitHubSearchResponse;
    return data.items ?? [];
  }

  private bestMatch(citation: RawCitation, repos: GitHubRepo[]): CitedWork | null {
    let best: CitedWork | null = null;
    let bestScore = 0;
    for (const r of repos) {
      const cited = this.repoToCitedWork(r, 0);
      const score = scoreMatch(citation, cited);
      if (score > bestScore) {
        bestScore = score;
        best = { ...cited, confidence: score };
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  private repoToCitedWork(r: GitHubRepo, confidence: number): CitedWork {
    const year = r.created_at ? new Date(r.created_at).getFullYear() : 2000;
    const now = new Date().toISOString();
    return {
      id: `github:${r.full_name}`,
      title: r.name,
      authors: [{ family: r.owner.login }],
      year,
      url: r.html_url,
      type: 'repository',
      source_api: 'github',
      confidence,
      first_seen: now,
      cited_by: [],
      tags: r.topics ?? [],
      notes: r.description ?? undefined,
      raw_citations: [],
      verified: false,
    };
  }

  private cffToCitedWork(cff: CitationCff, repo: GitHubRepo, confidence: number): CitedWork {
    const year = cff['date-released']
      ? parseInt(cff['date-released'].slice(0, 4), 10)
      : repo.created_at
        ? new Date(repo.created_at).getFullYear()
        : 2000;
    const now = new Date().toISOString();

    return {
      id: cff.doi ? `doi:${cff.doi}` : `github:${repo.full_name}`,
      title: cff.title ?? repo.name,
      authors: (cff.authors ?? []).map(mapCffAuthor),
      year: isNaN(year) ? 2000 : year,
      doi: cff.doi,
      url: cff.url ?? repo.html_url,
      type: 'repository',
      source_api: 'github',
      confidence,
      first_seen: now,
      cited_by: [],
      tags: repo.topics ?? [],
      raw_citations: [],
      verified: false,
    };
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/** Extract owner/repo from a GitHub URL. */
function extractGitHubRepo(text: string): { owner: string; repo: string } | null {
  const m = text.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

function mapCffAuthor(a: {
  family?: string;
  given?: string;
  'family-names'?: string;
  'given-names'?: string;
  orcid?: string;
  affiliation?: string;
}): Author {
  return {
    family: a['family-names'] ?? a.family ?? 'Unknown',
    given: a['given-names'] ?? a.given,
    orcid: a.orcid?.replace('https://orcid.org/', ''),
    affiliation: a.affiliation,
  };
}

/**
 * Minimal CITATION.cff parser. CFF is YAML, but we parse the most common
 * fields with simple regex to avoid a YAML dependency. Safe parsing only.
 */
function parseCitationCff(text: string): CitationCff | null {
  try {
    const result: CitationCff = {};

    // Title
    const titleMatch = text.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) result.title = titleMatch[1];

    // DOI
    const doiMatch = text.match(/^doi:\s*["']?(.+?)["']?\s*$/m);
    if (doiMatch) result.doi = doiMatch[1];

    // URL
    const urlMatch = text.match(/^url:\s*["']?(.+?)["']?\s*$/m);
    if (urlMatch) result.url = urlMatch[1];

    // Date released
    const dateMatch = text.match(/^date-released:\s*["']?(.+?)["']?\s*$/m);
    if (dateMatch) result['date-released'] = dateMatch[1];

    // Authors (simplified: extract family-names and given-names pairs)
    const authors: CitationCff['authors'] = [];
    const authorBlocks = text.split(/^  - /m).slice(1);
    for (const block of authorBlocks) {
      const familyMatch = block.match(/family-names:\s*["']?(.+?)["']?\s*$/m);
      const givenMatch = block.match(/given-names:\s*["']?(.+?)["']?\s*$/m);
      const orcidMatch = block.match(/orcid:\s*["']?(.+?)["']?\s*$/m);
      const affMatch = block.match(/affiliation:\s*["']?(.+?)["']?\s*$/m);
      if (familyMatch) {
        authors.push({
          'family-names': familyMatch[1],
          'given-names': givenMatch?.[1],
          orcid: orcidMatch?.[1],
          affiliation: affMatch?.[1],
        });
      }
    }
    if (authors.length > 0) result.authors = authors;

    return result;
  } catch {
    return null;
  }
}
