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

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { SessionsIndexSchema } from './types.js';
import type { SessionInfo } from './types.js';

/**
 * Fallback: enumerate sessions from raw .jsonl files when sessions-index.json
 * is missing. Extracts sessionId from filename, reads file stats for mtime,
 * and counts lines for messageCount. Skips non-JSONL files and subdirectories.
 */
async function enumerateFromJsonlFiles(
  projectsDir: string,
  slug: string,
): Promise<SessionInfo[]> {
  const projectDir = join(projectsDir, slug);
  const results: SessionInfo[] = [];

  let entries;
  try {
    entries = await readdir(projectDir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;

    const sessionId = entry.name.replace(/\.jsonl$/, '');
    const fullPath = join(projectDir, entry.name);

    try {
      const fileStat = await stat(fullPath);
      const mtime = fileStat.mtimeMs;

      // Quick line count via reading the file (sessions are typically < 50KB)
      const content = await readFile(fullPath, { encoding: 'utf-8' });
      const lineCount = content.split('\n').filter(l => l.trim()).length;

      results.push({
        sessionId,
        fullPath,
        fileMtime: mtime,
        messageCount: lineCount,
        created: new Date(fileStat.birthtimeMs || fileStat.mtimeMs).toISOString(),
        modified: new Date(mtime).toISOString(),
        projectSlug: slug,
      });
    } catch {
      // Skip files we can't read
      continue;
    }
  }

  return results;
}

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
        // Invalid schema -- fall through to JSONL fallback
        const fallback = await enumerateFromJsonlFiles(projectsDir, slug);
        results.push(...fallback);
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
      // No sessions-index.json -- fallback to direct .jsonl enumeration
      const fallback = await enumerateFromJsonlFiles(projectsDir, slug);
      results.push(...fallback);
    }
  }

  return results;
}
