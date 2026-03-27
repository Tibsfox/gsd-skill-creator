/**
 * Full-text search engine for Aminet package discovery.
 *
 * Provides substring matching across package name, description, and author
 * fields with relevance-ranked results. Designed for instant client-side
 * search across the ~84,000-entry Aminet catalog without a search index.
 *
 * @module
 */

import type { AminetPackage, PackageReadme } from './types.js';

// ============================================================================
// Public types
// ============================================================================

/**
 * Options for searching the Aminet package catalog.
 */
export interface SearchOptions {
  /** Search query string (matched as case-insensitive substring) */
  query: string;
  /** Optional category filter (e.g., "mus", "game", "util") */
  category?: string;
  /** Optional subcategory filter (e.g., "edit", "shoot") -- requires category */
  subcategory?: string;
  /** Maximum number of results to return (default: 50) */
  limit?: number;
}

/**
 * A single search result with relevance scoring.
 *
 * matchField indicates which field produced the highest-scoring match:
 * - "name" (score 3): query found in package filename
 * - "description" (score 2): query found in package description
 * - "author" (score 1): query found in readme author field
 */
export interface SearchResult {
  /** The matched package */
  package: AminetPackage;
  /** Relevance score: 3 = name, 2 = description, 1 = author */
  score: number;
  /** Which field produced the match */
  matchField: 'name' | 'description' | 'author';
}

// ============================================================================
// Implementation
// ============================================================================

/** Default maximum number of results */
const DEFAULT_LIMIT = 50;

/**
 * Search Aminet packages by name, description, and author.
 *
 * Performs case-insensitive substring matching with relevance ranking.
 * Name matches score highest (3), followed by description (2), then
 * author (1). Only the highest-scoring match field is reported per package.
 *
 * Author search requires the package to have an entry in the readmeIndex.
 * Packages without readme data are still searchable by name and description.
 *
 * @param packages - Array of AminetPackage entries to search
 * @param readmeIndex - Map from fullPath to PackageReadme for author lookups
 * @param options - Search options (query, optional category/subcategory, limit)
 * @returns Relevance-ranked array of SearchResult, limited to options.limit
 */
export function searchPackages(
  packages: AminetPackage[],
  readmeIndex: Map<string, PackageReadme>,
  options: SearchOptions,
): SearchResult[] {
  const { query, category, subcategory, limit = DEFAULT_LIMIT } = options;

  // Empty query returns no results
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const pkg of packages) {
    // Category pre-filter
    if (category && pkg.category !== category) continue;
    if (subcategory && pkg.subcategory !== subcategory) continue;

    // Check fields in priority order: name (3) > description (2) > author (1)
    if (pkg.filename.toLowerCase().includes(q)) {
      results.push({ package: pkg, score: 3, matchField: 'name' });
    } else if (pkg.description.toLowerCase().includes(q)) {
      results.push({ package: pkg, score: 2, matchField: 'description' });
    } else {
      // Author search: only if readme exists for this package
      const readme = readmeIndex.get(pkg.fullPath);
      if (readme?.author && readme.author.toLowerCase().includes(q)) {
        results.push({ package: pkg, score: 1, matchField: 'author' });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply limit
  return results.slice(0, limit);
}
