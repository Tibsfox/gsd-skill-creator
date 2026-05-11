/**
 * Atlas KB — connection-caching tests (v1.49.607 F3).
 *
 * Verifies that KBStore.getAtlasSymbolsKB / getAtlasProvenanceKB cache their
 * instances across calls and that clearAtlasKBCache performs targeted and
 * full invalidation correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { KBStore } from '../store.js';
import { SymbolsKB } from '../symbols.js';
import { ProvenanceKB } from '../provenance.js';
import { applyMigrations } from '../migrations.js';
import type { ProjectId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let tmpDir: string;
let store: KBStore;

const PROJECT_ID = 'test-caching-proj' as ProjectId;

function buildProjectDB(projectDir: string): Database.Database {
  const dbDir = join(projectDir, '.gsd', 'intelligence');
  mkdirSync(dbDir, { recursive: true });
  const dbPath = join(dbDir, 'intelligence.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applyMigrations(db, MIGRATIONS_DIR);
  db.prepare(
    `INSERT OR IGNORE INTO projects
       (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(PROJECT_ID, 'Caching Test Project', projectDir, 'dev', 'code', 'med', new Date().toISOString(), null);
  return db;
}

function registerProjectInRegistry(registryPath: string, projectDir: string): void {
  const reg = new Database(registryPath);
  reg.pragma('journal_mode = WAL');
  reg.pragma('foreign_keys = ON');
  applyMigrations(reg, MIGRATIONS_DIR);
  reg.prepare(
    `INSERT OR IGNORE INTO projects
       (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(PROJECT_ID, 'Caching Test Project', projectDir, 'dev', 'code', 'med', new Date().toISOString(), null);
  reg.close();
}

// Hook timeout bumped from default 10s to 60s to match the root-project
// testTimeout under full-suite contention (vitest.config.ts root project
// runs at testTimeout: 60000 because subprocess-spawning + sqlite migrations
// can exceed 10s when 1880+ test files run concurrently). The migration
// + dual-DB-init in this hook is sqlite-fsync-bound and flakes only
// under contention; isolated runtime is ~50ms.
beforeEach(() => {
  tmpDir = join(
    tmpdir(),
    `gsd-conn-cache-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(tmpDir, { recursive: true });

  const registryPath = join(tmpDir, 'registry.db');
  const projectDir = join(tmpDir, 'proj');
  mkdirSync(projectDir, { recursive: true });

  buildProjectDB(projectDir);
  registerProjectInRegistry(registryPath, projectDir);

  store = new KBStore({ registryPath, migrationsDir: MIGRATIONS_DIR });
}, 60_000);

afterEach(() => {
  store.close();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('intelligence/kb — connection caching (F3)', () => {
  it('cache hit: second call returns the same SymbolsKB instance', async () => {
    await store.ensureRegistry();
    const kb1 = await store.getAtlasSymbolsKB(PROJECT_ID);
    const kb2 = await store.getAtlasSymbolsKB(PROJECT_ID);
    expect(kb1).toBe(kb2);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);
  });

  it('cache hit: second call returns the same ProvenanceKB instance', async () => {
    await store.ensureRegistry();
    const kb1 = await store.getAtlasProvenanceKB(PROJECT_ID);
    const kb2 = await store.getAtlasProvenanceKB(PROJECT_ID);
    expect(kb1).toBe(kb2);
    expect(store.cachedAtlasProvenanceKBCount()).toBe(1);
  });

  it('cache invalidation: clearAtlasKBCache(projectId) forces new instance on next call', async () => {
    await store.ensureRegistry();
    const kb1 = await store.getAtlasSymbolsKB(PROJECT_ID);
    store.clearAtlasKBCache(PROJECT_ID);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(0);

    const kb2 = await store.getAtlasSymbolsKB(PROJECT_ID);
    expect(kb2).not.toBe(kb1);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);
  });

  it('cache invalidation: clearAtlasKBCache() with no arg clears all cached instances', async () => {
    await store.ensureRegistry();
    await store.getAtlasSymbolsKB(PROJECT_ID);
    await store.getAtlasProvenanceKB(PROJECT_ID);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);
    expect(store.cachedAtlasProvenanceKBCount()).toBe(1);

    store.clearAtlasKBCache();
    expect(store.cachedAtlasSymbolsKBCount()).toBe(0);
    expect(store.cachedAtlasProvenanceKBCount()).toBe(0);
  });

  it('cross-instance independence: two KBStore instances cache independently', async () => {
    const registryPath = join(tmpDir, 'registry.db');
    const store2 = new KBStore({ registryPath, migrationsDir: MIGRATIONS_DIR });
    await store.ensureRegistry();
    await store2.ensureRegistry();

    const kb1 = await store.getAtlasSymbolsKB(PROJECT_ID);
    const kb2 = await store2.getAtlasSymbolsKB(PROJECT_ID);

    expect(kb1).not.toBe(kb2);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);
    expect(store2.cachedAtlasSymbolsKBCount()).toBe(1);

    store2.close();
  });

  it('error path: corrupt or missing project DB → getAtlasSymbolsKB rejects gracefully', async () => {
    await store.ensureRegistry();

    const MISSING_ID = 'does-not-exist-proj' as ProjectId;
    await expect(store.getAtlasSymbolsKB(MISSING_ID)).rejects.toThrow();
  });

  it('prepared-statement cache inside the SymbolsKB instance persists across calls via cache', async () => {
    await store.ensureRegistry();
    const kb = await store.getAtlasSymbolsKB(PROJECT_ID);

    // Pre-condition: no statements cached yet.
    expect(kb.preparedStatementCount()).toBe(0);

    // Fire two reads — each warms a prepared statement inside the KB.
    kb.listSymbolsForFile('snap-x' as any, 'src/a.ts');
    kb.listSymbolsInSnapshot('snap-x' as any);
    expect(kb.preparedStatementCount()).toBe(2);

    // Getting the KB again from the cache returns the SAME instance with
    // those statements still warm.
    const kb2 = await store.getAtlasSymbolsKB(PROJECT_ID);
    expect(kb2).toBe(kb);
    expect(kb2.preparedStatementCount()).toBe(2);
  });

  it('close() evicts the atlas KB caches alongside project DBs', async () => {
    await store.ensureRegistry();
    await store.getAtlasSymbolsKB(PROJECT_ID);
    await store.getAtlasProvenanceKB(PROJECT_ID);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);

    store.close();
    expect(store.cachedAtlasSymbolsKBCount()).toBe(0);
    expect(store.cachedAtlasProvenanceKBCount()).toBe(0);
  });
});
