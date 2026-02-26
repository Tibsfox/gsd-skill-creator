/**
 * Schema version tracking and migration support for the citation store.
 *
 * Maintains a version.json file that tracks the current schema version.
 * Migrations can be registered for version upgrades. Currently at v1
 * with an empty migration registry.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

/** Schema version record persisted in version.json. */
export interface SchemaVersion {
  version: number;
  migrated_at: string;
}

/** Migration function signature. */
export type MigrationFn = (basePath: string) => Promise<void>;

// ============================================================================
// Constants
// ============================================================================

/** Current schema version. */
export const CURRENT_VERSION = 1;

/**
 * Migration registry: version number -> migration function.
 * Empty for v1 (initial schema).
 */
const migrations: Map<number, MigrationFn> = new Map();

// ============================================================================
// Functions
// ============================================================================

/**
 * Read the current schema version from version.json.
 * Returns 1 (default) if the file does not exist.
 */
export async function getCurrentVersion(basePath: string): Promise<number> {
  const versionPath = path.join(basePath, 'version.json');

  if (!fs.existsSync(versionPath)) {
    return 1;
  }

  try {
    const raw = fs.readFileSync(versionPath, 'utf-8');
    const schema = JSON.parse(raw) as SchemaVersion;
    return schema.version;
  } catch {
    return 1;
  }
}

/**
 * Run all pending migrations in order from current version to latest.
 * Updates version.json after each successful migration.
 */
export async function migrate(basePath: string): Promise<void> {
  const current = await getCurrentVersion(basePath);

  for (let v = current + 1; v <= CURRENT_VERSION; v++) {
    const fn = migrations.get(v);
    if (fn) {
      await fn(basePath);
    }

    const versionPath = path.join(basePath, 'version.json');
    const record: SchemaVersion = {
      version: v,
      migrated_at: new Date().toISOString(),
    };
    fs.writeFileSync(versionPath, JSON.stringify(record, null, 2));
  }
}
