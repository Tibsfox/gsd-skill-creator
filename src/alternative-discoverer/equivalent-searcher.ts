/**
 * Registry keyword/description search for functional equivalents.
 *
 * For npm: uses the public registry search API (no auth required).
 * For all other ecosystems: returns [] (no public unauthenticated search API).
 *
 * DISC-03 implementation.
 */

import type { DependencyRecord } from '../dependency-auditor/types.js';
import type { AlternativeReport } from './types.js';

// ─── npm search API types ─────────────────────────────────────────────────────

interface NpmSearchObject {
  package: {
    name: string;
    description?: string;
    keywords?: string[];
  };
  score: {
    final: number;
  };
}

interface NpmSearchResponse {
  objects: NpmSearchObject[];
}

// ─── Core function ────────────────────────────────────────────────────────────

const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search';
const NPM_SEARCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'gsd-alternative-discoverer/1.0',
};

/**
 * Searches the npm registry for functional equivalents of the given dependency.
 *
 * Returns [] for non-npm ecosystems and gracefully on any API failure.
 * Minimum confidence threshold: 0.3 (= 0.3 + 0 * 0.4 when textScore = 0).
 */
export async function searchEquivalents(
  dep: DependencyRecord,
  registryMeta: Record<string, unknown>,
): Promise<AlternativeReport[]> {
  // Only npm has a public unauthenticated search API
  if (dep.ecosystem !== 'npm') return [];

  // Extract keywords from _meta or fall back to the package name itself
  const meta = registryMeta._meta as Record<string, unknown> | undefined;
  const keywords: string[] = Array.isArray(meta?.keywords)
    ? (meta.keywords as string[])
    : [dep.name];

  const searchText = keywords.join(' ');

  let response: NpmSearchResponse;
  try {
    const res = await fetch(
      `${NPM_SEARCH_URL}?text=${encodeURIComponent(searchText)}&size=5`,
      { headers: NPM_SEARCH_HEADERS },
    );
    if (!res.ok) return [];
    response = (await res.json()) as NpmSearchResponse;
  } catch {
    return [];
  }

  if (!response.objects?.length) return [];

  const reports: AlternativeReport[] = [];

  for (const obj of response.objects) {
    // Filter out the original package
    if (obj.package.name === dep.name) continue;

    const textScore = typeof obj.score?.final === 'number' ? obj.score.final : 0;
    const confidenceScore = 0.3 + textScore * 0.4;

    // Minimum confidence threshold
    if (confidenceScore < 0.3) continue;

    reports.push({
      originalPackage: dep.name,
      originalEcosystem: dep.ecosystem,
      relationship: 'equivalent',
      alternativeName: obj.package.name,
      evidenceSummary: `Registry keyword match: ${searchText}`,
      apiCompatibility: 'unknown',
      migrationEffort: 'medium',
      confidenceScore,
      sourceUrl: null,
    });
  }

  return reports;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for searchEquivalents, providing a stateful API surface. */
export class EquivalentSearcher {
  search(dep: DependencyRecord, meta: Record<string, unknown>): Promise<AlternativeReport[]> {
    return searchEquivalents(dep, meta);
  }
}
