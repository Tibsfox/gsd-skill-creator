/**
 * C04 T2 — KBStore lifecycle tests (TDD RED phase).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';

const here = dirname(fileURLToPath(import.meta.url));
// Real migrations dir relative to this test file: ../../../db/migrations
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let tmpDir: string;

function makeStore(extra?: { registryPath?: string }) {
  const registryPath = extra?.registryPath ?? join(tmpDir, 'registry.db');
  return new KBStore({
    registryPath,
    migrationsDir: MIGRATIONS_DIR,
  });
}

describe('intelligence/kb — KBStore lifecycle', () => {
  beforeEach(() => {
    tmpDir = join(
      tmpdir(),
      `gsd-store-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('constructor with custom registryPath — path stored', () => {
    const registryPath = join(tmpDir, 'custom-registry.db');
    const store = new KBStore({ registryPath });
    expect(store.registryPath).toBe(registryPath);
    store.close();
  });

  it('ensureRegistry() then PRAGMA journal_mode → wal', async () => {
    const store = makeStore();
    await store.ensureRegistry();
    const mode = store.registryJournalMode();
    expect(mode).toBe('wal');
    store.close();
  });

  it('ensureRegistry() then PRAGMA foreign_keys → 1', async () => {
    const store = makeStore();
    await store.ensureRegistry();
    const fk = store.registryForeignKeys();
    expect(fk).toBe(1);
    store.close();
  });

  it('ensureProjectDB(p) twice → same connection cached', async () => {
    const store = makeStore();
    await store.ensureRegistry();
    const projectId = 'proj-lifecycle-test';
    const projectPath = join(tmpDir, 'project-data');
    // Register the project first so ensureProjectDB can resolve path
    await store.registerProject({
      id: projectId,
      name: 'Lifecycle Test',
      path: projectPath,
      kind: 'code',
      priority: 'med',
      last_activity_at: new Date().toISOString(),
    });
    await store.ensureProjectDB(projectId);
    await store.ensureProjectDB(projectId);
    // Cached connection count must be 1 for this project
    expect(store.cachedProjectDBCount()).toBe(1);
    store.close();
  });

  it('close() closes registry and all project connections without error', async () => {
    const store = makeStore();
    await store.ensureRegistry();
    const projectId = 'proj-close-test';
    const projectPath = join(tmpDir, 'project-close-data');
    await store.registerProject({
      id: projectId,
      name: 'Close Test',
      path: projectPath,
      kind: 'code',
      priority: 'med',
      last_activity_at: new Date().toISOString(),
    });
    await store.ensureProjectDB(projectId);
    expect(() => store.close()).not.toThrow();
  });
});
