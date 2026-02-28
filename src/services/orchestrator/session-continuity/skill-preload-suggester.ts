/**
 * SkillPreloadSuggester: recommends skills to preload based on snapshot patterns.
 *
 * Analyzes a SessionSnapshot's files_modified (by extension and path patterns)
 * and active_skills to produce a deduplicated list of skill suggestions.
 * This enables Claude Code to start each session with relevant skills loaded.
 */

import type { SessionSnapshot } from './types.js';

export class SkillPreloadSuggester {
  /**
   * Map file extensions to skill suggestions.
   * Longer extensions checked first via iteration order.
   */
  private extensionMap: Record<string, string[]> = {
    '.test.ts': ['testing', 'typescript'],
    '.spec.ts': ['testing', 'typescript'],
    '.test.js': ['testing', 'javascript'],
    '.spec.js': ['testing', 'javascript'],
    '.ts': ['typescript'],
    '.js': ['javascript'],
    '.md': ['documentation'],
    '.json': ['configuration'],
    '.yaml': ['configuration'],
    '.yml': ['configuration'],
    '.css': ['styling'],
    '.html': ['web'],
  };

  /**
   * Map directory path patterns to skill suggestions.
   */
  private pathPatterns: Array<{ pattern: RegExp; skills: string[] }> = [
    { pattern: /\.claude\//, skills: ['claude-code-skills'] },
    { pattern: /\.planning\//, skills: ['gsd-planning'] },
    { pattern: /test|spec|__tests__/, skills: ['testing'] },
    { pattern: /src\/cli\//, skills: ['cli'] },
    { pattern: /src\/observation\//, skills: ['observability'] },
  ];

  /**
   * Suggest skills to preload based on snapshot file patterns and active skills.
   *
   * Returns a deduplicated array of skill names derived from:
   * 1. active_skills from the snapshot (baseline)
   * 2. File extension matches against files_modified
   * 3. Path pattern matches against files_modified
   */
  suggest(snapshot: SessionSnapshot): string[] {
    const suggestions = new Set<string>(snapshot.active_skills);

    for (const file of snapshot.files_modified) {
      // Check extensions (longest match first via ordering in map)
      for (const [ext, skills] of Object.entries(this.extensionMap)) {
        if (file.endsWith(ext)) {
          skills.forEach(s => suggestions.add(s));
        }
      }
      // Check path patterns
      for (const { pattern, skills } of this.pathPatterns) {
        if (pattern.test(file)) {
          skills.forEach(s => suggestions.add(s));
        }
      }
    }

    return Array.from(suggestions);
  }
}
