/**
 * Phase 826 / C13 — P6: KB migration speed
 *
 * Applying both SQL migrations to a fresh in-memory DB completes in <100ms.
 * Advisory.
 *
 * Phase 826 / D-26-44.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import Database from 'better-sqlite3';

const REPO_ROOT = resolve(__dirname, '../../../../');
const MIG_001 = join(REPO_ROOT, 'src/intelligence/db/migrations/001_initial.sql');
const MIG_002 = join(REPO_ROOT, 'src/intelligence/db/migrations/002_snapshot_diff_cache.sql');

describe('P6/migration: apply all SQL migrations to fresh DB under 100ms (PERF — WARN ONLY)', () => {
  it('001_initial + 002_snapshot_diff_cache apply to :memory: in <100ms', () => {
    const sql1 = readFileSync(MIG_001, 'utf8');
    const sql2 = readFileSync(MIG_002, 'utf8');

    const start = performance.now();
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(sql1);
    db.exec(sql2);
    db.close();
    const elapsed = performance.now() - start;

    if (elapsed > 100) {
      console.warn(`P6 PERF WARN: migrations took ${elapsed.toFixed(0)}ms (target: <100ms)`);
    }
    expect(elapsed).toBeLessThan(2000); // Hard limit
  });

  it('applyMigrations via KBStore helper applies in <500ms on real file', async () => {
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tmpDir = mkdtempSync(pathJoin(tmpdir(), 'gsd-p6-'));
    try {
      const { KBStore } = await import('../../kb/store.js');
      const kb = new KBStore({ registryPath: pathJoin(tmpDir, 'registry.db') });

      const start = performance.now();
      // ensureRegistry() triggers migration on first call
      await kb.ensureRegistry();
      const elapsed = performance.now() - start;

      if (elapsed > 500) {
        console.warn(`P6 PERF WARN: KBStore ensureRegistry took ${elapsed.toFixed(0)}ms (target: <500ms)`);
      }
      expect(elapsed).toBeLessThan(5000);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
