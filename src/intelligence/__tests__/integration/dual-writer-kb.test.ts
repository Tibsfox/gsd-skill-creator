/**
 * Phase 826 / C13 — I12: Dual-writer KB concurrency
 *
 * Two KBStore instances sharing the same SQLite file.
 * 20+20 concurrent write operations (findings insertions) via two writers.
 * WAL mode enables concurrent reads; writes are serialized by SQLite.
 *
 * This test validates that WAL mode allows two open connections without
 * corruption (SQLITE_BUSY / lost updates / data mixing).
 *
 * Phase 826 / D-26-30.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';
import Database from 'better-sqlite3';
import type { Finding } from '../../types.js';

describe('I12: dual-writer KB WAL concurrency', () => {
  it('two DB connections in WAL mode can both write without corruption', async () => {
    const kbHandle = createTestKB();
    try {
      // Open a second connection to the same project DB
      const db2 = new Database(kbHandle.dbPath);
      db2.pragma('journal_mode = WAL');
      db2.pragma('foreign_keys = ON');

      const db1 = kbHandle.db;

      // Insert a snapshot for FK dependency
      const snapshotId = 'S-dual-001';
      db1.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      // Writer 1: insert 20 findings
      const insertFinding = (db: Database.Database, id: string) => {
        db.prepare(`
          INSERT OR IGNORE INTO findings
            (id, project_id, snapshot_id, kind, severity, confidence, title, rationale,
             source_path, source_range_start, source_range_end, produced_by, produced_at,
             status, addressed_by_decision, dismissed_rationale)
          VALUES (?,?,?,'hot_spot','high',0.8,?,?,NULL,NULL,NULL,'analyzer',?,?,NULL,NULL)
        `).run(id, 'test-proj', snapshotId, `Title ${id}`, `Rationale ${id}`, new Date().toISOString(), 'open');
      };

      // Write 20 findings from each connection, interleaved
      for (let i = 0; i < 20; i++) {
        insertFinding(db1, `F-w1-${i.toString().padStart(3, '0')}`);
        insertFinding(db2, `F-w2-${i.toString().padStart(3, '0')}`);
      }

      db2.close();

      // Count total findings
      const count = (db1.prepare("SELECT COUNT(*) AS n FROM findings WHERE snapshot_id = ?").get(snapshotId) as { n: number }).n;
      expect(count).toBe(40); // 20 from each writer
    } finally {
      kbHandle.cleanup();
    }
  });

  it('WAL mode is set on the project DB', () => {
    const kbHandle = createTestKB();
    try {
      const mode = (kbHandle.db.prepare('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode;
      expect(mode).toBe('wal');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('two KBStore instances can read from same project without conflict', async () => {
    const kbHandle = createTestKB();
    try {
      const kb1 = await kbHandle.createKBStore();
      const kb2 = await kbHandle.createKBStore();

      // Insert snapshot
      const snapshotId = 'S-readconc-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      await kb1.writeFindings(snapshotId, 'test-proj', [
        { id: 'F-rc-001' as `F-${string}`, project_id: 'test-proj', kind: 'hot_spot', severity: 'high', confidence: 0.9, title: 'R1', rationale: 'R', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' } satisfies Finding,
      ]);

      const [r1, r2] = await Promise.all([
        kb1.listOpenFindings('test-proj'),
        kb2.listOpenFindings('test-proj'),
      ]);

      expect(r1.length).toBeGreaterThan(0);
      expect(r2.length).toBe(r1.length);
      expect(r2[0]!.id).toBe(r1[0]!.id);
    } finally {
      kbHandle.cleanup();
    }
  });
});
