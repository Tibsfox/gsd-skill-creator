/**
 * Cross-project skill index for multi-directory skill discovery.
 *
 * Searches across user, project, and plugin directories, merging results
 * with scope annotation and relevance scoring. Detects embedding model
 * version drift across directories when cache version info is provided.
 */

import { SkillStore } from '../storage/skill-store.js';
import { SkillIndex } from '../storage/skill-index.js';
import { getSkillsBasePath } from '../types/scope.js';
import type { SkillScope } from '../types/scope.js';
import type { ScopedSearchResult } from './types.js';

export interface CrossProjectSearchOptions {
  pluginDirs?: string[];
}

export interface CrossProjectSearchExtraOptions {
  /** Map of directory -> model version string for drift detection */
  cacheVersions?: Record<string, string>;
}

export interface CrossProjectSearchOutput {
  results: ScopedSearchResult[];
  versionDriftWarning?: string;
}

export class CrossProjectIndex {
  /**
   * Get all directories to search: user + project + configured plugins.
   * Deduplicates directories automatically.
   */
  getSearchDirectories(options?: CrossProjectSearchOptions): string[] {
    const dirs = new Set<string>();
    dirs.add(getSkillsBasePath('user'));
    dirs.add(getSkillsBasePath('project'));

    if (options?.pluginDirs) {
      for (const dir of options.pluginDirs) {
        dirs.add(dir);
      }
    }

    return Array.from(dirs);
  }

  /**
   * Search across all directories for skills matching query.
   *
   * Results are merged, annotated with source directory and scope,
   * scored by relevance, and sorted descending.
   *
   * @param query - Search query string
   * @param directories - Directories to search
   * @param extraOptions - Optional version drift detection config
   */
  async search(
    query: string,
    directories: string[],
    extraOptions?: CrossProjectSearchExtraOptions,
  ): Promise<CrossProjectSearchOutput> {
    const allResults: ScopedSearchResult[] = [];
    const modelVersions = new Set<string>();

    // Collect version info from cache versions if provided
    if (extraOptions?.cacheVersions) {
      for (const version of Object.values(extraOptions.cacheVersions)) {
        modelVersions.add(version);
      }
    }

    for (const dir of directories) {
      try {
        const store = new SkillStore(dir);
        const skillIndex = new SkillIndex(store, dir);
        const matches = await skillIndex.search(query);
        const scope = this.classifyScope(dir);

        for (const match of matches) {
          allResults.push({
            ...match,
            sourceDir: dir,
            scope,
            score: this.computeScore(match, query),
          });
        }
      } catch (error) {
        // Skip directories that don't exist or fail -- log warning, don't throw
        console.warn(
          `Skipping directory ${dir}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }

    // Sort by score descending
    allResults.sort((a, b) => b.score - a.score);

    // Check for version drift
    const versionDriftWarning =
      modelVersions.size > 1
        ? `Embedding model versions differ across search directories: ${Array.from(modelVersions).join(', ')}. Results may have inconsistent relevance scoring.`
        : undefined;

    return { results: allResults, versionDriftWarning };
  }

  /**
   * Classify a directory as user, project, or plugin scope.
   */
  private classifyScope(dir: string): SkillScope | 'plugin' {
    try {
      if (dir === getSkillsBasePath('user')) return 'user';
      if (dir === getSkillsBasePath('project')) return 'project';
    } catch {
      // getSkillsBasePath can throw if env is unusual
    }
    return 'plugin';
  }

  /**
   * Compute a simple relevance score for a match.
   * Uses name and description match quality.
   */
  private computeScore(
    match: { name: string; description: string },
    query: string,
  ): number {
    const lowerQuery = query.toLowerCase();
    const lowerName = match.name.toLowerCase();
    const lowerDesc = match.description.toLowerCase();

    let score = 0;
    // Exact name match is highest
    if (lowerName === lowerQuery) score += 1.0;
    // Name contains query
    else if (lowerName.includes(lowerQuery)) score += 0.7;
    // Description contains query
    if (lowerDesc.includes(lowerQuery)) score += 0.3;

    return score;
  }
}
