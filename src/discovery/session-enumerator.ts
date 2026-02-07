/**
 * Session enumerator -- discovers all sessions across Claude Code projects.
 *
 * Reads sessions-index.json from each project directory under ~/.claude/projects/,
 * validates with Zod schemas, and returns SessionInfo objects enriched with
 * projectSlug derived from the directory name.
 *
 * Handles missing/corrupt index files gracefully by skipping affected projects.
 * Supports configurable base path for testing without touching real ~/.claude.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { SessionsIndexSchema } from './types.js';
import type { SessionInfo } from './types.js';

/**
 * Enumerate all sessions across Claude Code project directories.
 *
 * Scans `{claudeBaseDir}/projects/` for subdirectories containing
 * sessions-index.json files. Each valid index is parsed and its entries
 * are returned as SessionInfo objects with the projectSlug attached.
 *
 * @param claudeBaseDir - Base directory for Claude data (defaults to ~/.claude).
 *                        Pass a custom path for testing.
 * @returns Array of SessionInfo objects from all valid project indexes.
 */
export async function enumerateSessions(
  claudeBaseDir?: string,
): Promise<SessionInfo[]> {
  const baseDir = claudeBaseDir ?? join(homedir(), '.claude');
  const projectsDir = join(baseDir, 'projects');

  // Read project directories; return empty if projects dir doesn't exist
  let projectDirNames: string[];
  try {
    const entries = await readdir(projectsDir, { withFileTypes: true });
    projectDirNames = entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }

  const results: SessionInfo[] = [];

  for (const slug of projectDirNames) {
    const indexPath = join(projectsDir, slug, 'sessions-index.json');

    try {
      const raw = await readFile(indexPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const validated = SessionsIndexSchema.safeParse(parsed);

      if (!validated.success) {
        // Invalid schema -- skip this project
        continue;
      }

      const index = validated.data;

      // Warn on unknown version but continue parsing
      if (index.version !== 1) {
        process.stderr.write(
          `Warning: sessions-index.json in ${slug} has unknown version ${index.version}, attempting to parse anyway\n`,
        );
      }

      // Map entries to SessionInfo with projectSlug
      for (const entry of index.entries) {
        results.push({
          ...entry,
          projectSlug: slug,
        });
      }
    } catch {
      // File read error (ENOENT, permission) or JSON.parse error -- skip silently
      continue;
    }
  }

  return results;
}
