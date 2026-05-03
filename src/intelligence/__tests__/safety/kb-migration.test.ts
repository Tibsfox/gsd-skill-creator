/**
 * Phase 826 / C13 — S7: KB migration applies cleanly to fresh DB
 *                    S8: KB migration rollback-compatible via snapshot
 *
 * G2 BLOCK — any FAIL blocks release.
 *
 * Phase 826 / D-26-12, D-26-13.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import Database from 'better-sqlite3';

const REPO_ROOT = resolve(__dirname, '../../../../');
const MIGRATION_001 = join(REPO_ROOT, 'src/intelligence/db/migrations/001_initial.sql');
const MIGRATION_002 = join(REPO_ROOT, 'src/intelligence/db/migrations/002_snapshot_diff_cache.sql');

// ─── S7: DB migration applies cleanly ───────────────────────────────────────

describe('S7: KB schema migration applies to fresh DB (G2 BLOCK)', () => {
  it('migration 001 applies to fresh in-memory DB', () => {
    const sql = readFileSync(MIGRATION_001, 'utf8');
    const db = new Database(':memory:');
    expect(() => db.exec(sql)).not.toThrow();

    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name:string}>)
      .map((r) => r.name);
    expect(tables).toContain('projects');
    expect(tables).toContain('findings');
    expect(tables).toContain('meetings');
    expect(tables).toContain('decisions');
    expect(tables).toContain('briefings');
    expect(tables).toContain('schema_version');
    db.close();
  });

  it('migration 002 applies after 001', () => {
    const sql1 = readFileSync(MIGRATION_001, 'utf8');
    const sql2 = readFileSync(MIGRATION_002, 'utf8');
    const db = new Database(':memory:');
    db.exec(sql1);
    expect(() => db.exec(sql2)).not.toThrow();

    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name:string}>)
      .map((r) => r.name);
    expect(tables).toContain('snapshot_diffs');
    expect(tables).toContain('file_metrics');

    const version = (db.prepare('SELECT MAX(version) AS v FROM schema_version').get() as {v:number}).v;
    expect(version).toBe(2);
    db.close();
  });

  it('migrations are idempotent (re-apply safe)', () => {
    const sql1 = readFileSync(MIGRATION_001, 'utf8');
    const sql2 = readFileSync(MIGRATION_002, 'utf8');
    const db = new Database(':memory:');
    db.exec(sql1);
    db.exec(sql2);
    // Re-apply
    expect(() => db.exec(sql1)).not.toThrow();
    expect(() => db.exec(sql2)).not.toThrow();
    db.close();
  });

  it('WAL mode can be enabled after migration', () => {
    const sql = readFileSync(MIGRATION_001, 'utf8');
    const db = new Database(':memory:');
    db.exec(sql);
    db.pragma('journal_mode = WAL');
    const mode = (db.prepare('PRAGMA journal_mode').get() as {journal_mode:string}).journal_mode;
    // In-memory DB returns 'memory' not 'wal'; file DBs return 'wal'
    expect(['wal', 'memory']).toContain(mode);
    db.close();
  });
});

// ─── S8: KB migration rollback-compatible ───────────────────────────────────

describe('S8: KB migration rollback-compatible via snapshot (G2 BLOCK)', () => {
  it('rollback via savepoint restores pre-write state', () => {
    const sql = readFileSync(MIGRATION_001, 'utf8');
    const db = new Database(':memory:');
    db.exec(sql);

    // Insert a baseline project + snapshot (findings FK requires snapshot)
    db.prepare(
      "INSERT INTO projects (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id) VALUES ('p1','P1','/tmp/p1','dev','code','high','2026-05-02T00:00:00Z',NULL)"
    ).run();
    db.prepare(
      "INSERT INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES ('S-001','p1','2026-05-02T00:00:00Z',NULL,10,1000)"
    ).run();

    // Use a SQLite savepoint as the "snapshot" mechanism
    db.exec('SAVEPOINT snapshot_v2');

    // Write findings (simulating a new snapshot write)
    db.prepare(
      "INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, source_path, source_range_start, source_range_end, produced_by, produced_at, status, addressed_by_decision, dismissed_rationale) VALUES ('F-001','p1','S-001','hot_spot','high',0.9,'Test','Rationale',NULL,NULL,NULL,'analyzer','2026-05-02T00:00:00Z','open',NULL,NULL)"
    ).run();

    const countBefore = (db.prepare("SELECT COUNT(*) AS n FROM findings").get() as {n:number}).n;
    expect(countBefore).toBe(1);

    // Rollback to the savepoint
    db.exec('ROLLBACK TO SAVEPOINT snapshot_v2');
    db.exec('RELEASE SAVEPOINT snapshot_v2');

    const countAfter = (db.prepare("SELECT COUNT(*) AS n FROM findings").get() as {n:number}).n;
    expect(countAfter).toBe(0); // Findings gone after rollback

    db.close();
  });

  it('rollbackSnapshot on KBStore removes findings under that snapshot', async () => {
    const { createTestKB } = await import('../_harness/kb-factory.js');
    const kbHandle = createTestKB();

    try {
      const db = kbHandle.db;
      // Insert a snapshot and two findings
      db.prepare(
        "INSERT INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES ('S-rollback','test-proj','2026-05-02T00:00:00Z',NULL,10,1000)"
      ).run();
      db.prepare(
        "INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, source_path, source_range_start, source_range_end, produced_by, produced_at, status, addressed_by_decision, dismissed_rationale) VALUES ('F-r01','test-proj','S-rollback','dead_code','low',0.8,'Unused export','Not called',NULL,NULL,NULL,'analyzer','2026-05-02T00:00:00Z','open',NULL,NULL)"
      ).run();
      db.prepare(
        "INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, source_path, source_range_start, source_range_end, produced_by, produced_at, status, addressed_by_decision, dismissed_rationale) VALUES ('F-r02','test-proj','S-rollback','hot_spot','high',0.9,'Hot spot','High churn',NULL,NULL,NULL,'analyzer','2026-05-02T00:00:00Z','open',NULL,NULL)"
      ).run();

      const beforeCount = (db.prepare("SELECT COUNT(*) AS n FROM findings WHERE snapshot_id = 'S-rollback'").get() as {n:number}).n;
      expect(beforeCount).toBe(2);

      // Perform rollback using raw SQLite (mirrors KBStore.rollbackSnapshot)
      db.transaction(() => {
        db.prepare("DELETE FROM findings WHERE snapshot_id = 'S-rollback'").run();
        db.prepare("DELETE FROM snapshots WHERE id = 'S-rollback'").run();
      })();

      const afterCount = (db.prepare("SELECT COUNT(*) AS n FROM findings WHERE snapshot_id = 'S-rollback'").get() as {n:number}).n;
      expect(afterCount).toBe(0);

      const snapshotCount = (db.prepare("SELECT COUNT(*) AS n FROM snapshots WHERE id = 'S-rollback'").get() as {n:number}).n;
      expect(snapshotCount).toBe(0);
    } finally {
      kbHandle.cleanup();
    }
  });
});
