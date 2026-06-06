/**
 * Test harness: KB factory.
 *
 * Creates per-test KBStore instances in isolated tmp directories.
 * Each call to createTestKB() returns a fresh KB with applied migrations,
 * plus a cleanup function that removes the tmp directory.
 *
 * Phase 826 / C13 / D-26-40.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { applyMigrations } from '../../kb/migrations.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(here, '..', '..', 'db', 'migrations');

export interface TestKB {
  /** SQLite connection to the in-test project DB (WAL mode). */
  db: Database.Database;
  /** Absolute path to the project tmp dir. */
  projectDir: string;
  /** Absolute path to the project intelligence.db. */
  dbPath: string;
  /** Absolute path to the registry.db. */
  registryPath: string;
  /**
   * Create a KBStore bound to this test's registry.
   * Calls ensureRegistry() automatically so callers can use KB methods immediately.
   */
  createKBStore(): Promise<import('../../kb/store.js').KBStore>;
  /** Remove all tmp files created by this KB instance. */
  cleanup(): void;
}

/**
 * Create a fresh isolated test KB.
 *
 * The registry DB records a single project with id `test-proj` pointing at
 * `projectDir`. Both registry and project DB have migrations applied.
 * WAL mode is enabled on both connections.
 *
 * @param projectId - optional project ID (default: 'test-proj')
 */
export function createTestKB(projectId = 'test-proj'): TestKB {
  const tmpBase = mkdtempSync(join(tmpdir(), 'gsd-intelligence-test-'));
  const projectDir = join(tmpBase, 'project');
  const gsdDir = join(projectDir, '.gsd', 'intelligence');
  const registryPath = join(tmpBase, 'registry.db');
  const dbPath = join(gsdDir, 'intelligence.db');

  // Create directories
  const { mkdirSync } = require('node:fs');
  mkdirSync(gsdDir, { recursive: true });

  // Initialize registry DB
  const registry = new Database(registryPath);
  registry.pragma('journal_mode = WAL');
  registry.pragma('foreign_keys = ON');
  applyMigrations(registry, MIGRATIONS_DIR);
  registry.prepare(`
    INSERT OR IGNORE INTO projects
      (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(
    projectId,
    'Test Project',
    projectDir,
    'dev',
    'code',
    'high',
    new Date().toISOString(),
  );
  registry.close();

  // Initialize project DB
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applyMigrations(db, MIGRATIONS_DIR);
  // Mirror project row into project DB
  db.prepare(`
    INSERT OR IGNORE INTO projects
      (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(
    projectId,
    'Test Project',
    projectDir,
    'dev',
    'code',
    'high',
    new Date().toISOString(),
  );

  // Track every KBStore opened via createKBStore() so cleanup() can close them
  // BEFORE removing the tmp dir. On Windows an open SQLite handle locks the file,
  // so rmSync throws EBUSY (POSIX allows unlink-while-open; Windows does not).
  const stores: Array<import('../../kb/store.js').KBStore> = [];

  return {
    db,
    projectDir,
    dbPath,
    registryPath,
    async createKBStore() {
      const { KBStore } = await import('../../kb/store.js');
      const kb = new KBStore({ registryPath });
      await kb.ensureRegistry();
      stores.push(kb);
      return kb;
    },
    cleanup() {
      // Close KBStore connections (registry + cached project DBs) first, then the
      // factory's own project DB, before unlinking — see the `stores` note above.
      for (const kb of stores) {
        try {
          kb.close();
        } catch {
          // Already closed
        }
      }
      try {
        db.close();
      } catch {
        // Already closed
      }
      rmSync(tmpBase, { recursive: true, force: true });
    },
  };
}
