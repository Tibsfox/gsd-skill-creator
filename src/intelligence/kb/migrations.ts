/**
 * Intelligence KB — migration runner.
 *
 * Reads all `*.sql` files from migrationsDir, sorts lexically, and applies
 * those whose embedded version number exceeds the current schema_version.
 * Idempotent: re-running with no new files is a no-op.
 *
 * Phase 823 / C04 / T1 (D-23-07).
 */

import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Extract the version number from a migration filename.
 * Convention: filename starts with NNN_ where NNN is the integer version.
 * Example: "001_initial.sql" → 1, "002_snapshot_diff_cache.sql" → 2.
 */
function versionFromFilename(filename: string): number {
  const match = /^(\d+)_/.exec(filename);
  if (!match) return -1;
  return parseInt(match[1], 10);
}

/**
 * Apply all pending migrations from `migrationsDir` to `db`.
 *
 * The `schema_version` table tracks applied migrations. If the table does not
 * exist yet, it will be created by the migration files themselves — in that
 * case we treat the current version as 0.
 */
export function applyMigrations(db: Database.Database, migrationsDir: string): void {
  // Collect .sql files, sort lexically so 001 comes before 002
  let files: string[];
  try {
    files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    // Directory doesn't exist or unreadable — treat as no migrations
    return;
  }

  if (files.length === 0) return;

  // Determine current schema version
  let currentVersion = 0;
  try {
    const row = db
      .prepare('SELECT MAX(version) AS v FROM schema_version')
      .get() as { v: number | null };
    currentVersion = row?.v ?? 0;
  } catch {
    // Table doesn't exist yet; version 0
    currentVersion = 0;
  }

  for (const filename of files) {
    const fileVersion = versionFromFilename(filename);
    if (fileVersion < 0) continue; // Skip files without version prefix
    if (fileVersion <= currentVersion) continue; // Already applied

    const filePath = join(migrationsDir, filename);
    let sql: string;
    try {
      sql = readFileSync(filePath, 'utf-8');
    } catch (err) {
      throw new Error(
        `applyMigrations: failed to read migration file "${filename}": ${(err as Error).message}`,
      );
    }

    try {
      db.exec(sql);
    } catch (err) {
      throw new Error(
        `applyMigrations: failed to apply migration "${filename}": ${(err as Error).message}`,
      );
    }

    currentVersion = fileVersion;
  }
}
