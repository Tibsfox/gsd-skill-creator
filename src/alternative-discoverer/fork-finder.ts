/**
 * GitHub fork activity analyzer — finds maintained forks of
 * abandoned/deprecated packages.
 *
 * DISC-02 implementation. Uses only public GitHub API endpoints — no
 * authentication required for public repositories.
 */

import type { DependencyRecord } from '../dependency-auditor/types.js';
import type { AlternativeReport } from './types.js';

// ─── GitHub URL extraction ────────────────────────────────────────────────────

interface GitHubRepo {
  owner: string;
  repo: string;
}

/**
 * Extracts owner/repo from a GitHub URL in repository or homepage fields.
 * Handles: https://github.com/owner/repo, git+https://github.com/owner/repo.git
 */
function extractGitHubRepo(meta: Record<string, unknown>): GitHubRepo | null {
  const candidates = [meta.repository, meta.homepage]
    .filter(Boolean)
    .map(String);

  for (const url of candidates) {
    const m = url.match(/github\.com[/:]([^/]+)\/([^/\s#]+)/);
    if (m) {
      return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
    }
  }
  return null;
}

// ─── GitHub API types ─────────────────────────────────────────────────────────

interface GitHubFork {
  name: string;
  owner: { login: string };
  html_url: string;
  stargazers_count: number;
  has_issues: boolean;
  pushed_at: string;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
}

// ─── Core function ────────────────────────────────────────────────────────────

const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'gsd-alternative-discoverer/1.0',
};

const DAYS_365_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Finds maintained GitHub forks of the given dependency.
 *
 * A fork is "maintained" if it has at least one release of its own.
 * Recent push date (within 365 days) is a supporting signal but NOT required —
 * releases are the authoritative sign of an active fork.
 *
 * Returns [] gracefully on any API error (403, 404, network failure).
 */
export async function findForks(
  dep: DependencyRecord,
  registryMeta: Record<string, unknown>,
): Promise<AlternativeReport[]> {
  const ghRepo = extractGitHubRepo(registryMeta);
  if (!ghRepo) return [];

  const { owner, repo } = ghRepo;

  // Fetch forks list
  let forks: GitHubFork[];
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/forks?sort=stargazers&per_page=10`,
      { headers: GITHUB_API_HEADERS },
    );
    if (!res.ok) return [];
    forks = (await res.json()) as GitHubFork[];
  } catch {
    return [];
  }

  if (!forks.length) return [];

  // Check each fork for releases (in parallel)
  const results: AlternativeReport[] = [];

  await Promise.all(
    forks.map(async (fork) => {
      let releases: GitHubRelease[];
      try {
        const res = await fetch(
          `https://api.github.com/repos/${fork.owner.login}/${fork.name}/releases?per_page=1`,
          { headers: GITHUB_API_HEADERS },
        );
        if (!res.ok) return;
        releases = (await res.json()) as GitHubRelease[];
      } catch {
        return;
      }

      // Must have own releases to be considered "maintained"
      if (!releases.length) return;

      const stars = fork.stargazers_count ?? 0;
      const confidenceScore = 0.6 + Math.min(stars / 1000, 0.3);

      const pushedAt = fork.pushed_at ? new Date(fork.pushed_at) : null;
      const daysSincePush = pushedAt
        ? Math.floor((Date.now() - pushedAt.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      const evidenceSummary = daysSincePush !== null
        ? `Active fork with ${releases.length} release(s), last pushed ${daysSincePush} days ago`
        : `Active fork with ${releases.length} release(s)`;

      results.push({
        originalPackage: dep.name,
        originalEcosystem: dep.ecosystem,
        relationship: 'fork',
        alternativeName: `${fork.owner.login}/${fork.name}`,
        evidenceSummary,
        apiCompatibility: 'compatible',
        migrationEffort: 'low',
        confidenceScore,
        sourceUrl: fork.html_url,
      });
    }),
  );

  return results;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for findForks, providing a stateful API surface. */
export class ForkFinder {
  find(dep: DependencyRecord, meta: Record<string, unknown>): Promise<AlternativeReport[]> {
    return findForks(dep, meta);
  }
}
