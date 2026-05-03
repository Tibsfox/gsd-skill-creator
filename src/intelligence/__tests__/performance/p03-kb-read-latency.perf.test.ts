/**
 * Phase 826 / C13 — P3: KB read latency
 *
 * With 500 open findings, listOpenFindings completes in <200ms.
 * Advisory — warn on CI flakiness.
 *
 * Phase 826 / D-26-41.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';
import type { Finding } from '../../types.js';

describe('P3/KB: read 500 findings under 200ms (PERF — WARN ONLY)', () => {
  it('listOpenFindings with 500 rows completes in <200ms', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-perf-read-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,500,50000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      // Bulk-insert via raw DB (faster setup)
      const insertStmt = kbHandle.db.prepare(`
        INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale,
          source_path, source_range_start, source_range_end, produced_by, produced_at, status,
          addressed_by_decision, dismissed_rationale)
        VALUES (?,?,'${snapshotId}','hot_spot','med',0.7,?,?,NULL,NULL,NULL,'analyzer',?,'open',NULL,NULL)
      `);

      const insertMany = kbHandle.db.transaction(() => {
        for (let i = 0; i < 500; i++) {
          const id = `F-pr-${i.toString().padStart(4, '0')}`;
          insertStmt.run(id, 'test-proj', `Title ${i}`, `Rationale ${i}`, new Date().toISOString());
        }
      });
      insertMany();

      const start = performance.now();
      const findings = await kb.listOpenFindings('test-proj');
      const elapsed = performance.now() - start;

      if (elapsed > 200) {
        console.warn(`P3 PERF WARN: listOpenFindings × 500 took ${elapsed.toFixed(0)}ms (target: <200ms)`);
      }
      expect(elapsed).toBeLessThan(2000); // Hard limit
      expect(findings.length).toBe(500);
    } finally {
      kbHandle.cleanup();
    }
  });
});
