/**
 * Phase 826 / C13 — P5: Snapshot diff cache read/write speed
 *
 * setSnapshotDiffCache + getSnapshotDiffCache round-trip in <100ms for 100 pairs.
 * Advisory — warn on CI flakiness.
 *
 * Phase 826 / D-26-43.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';

describe('P5/diff: snapshot diff cache 100 pairs under 500ms (PERF — WARN ONLY)', () => {
  it('setSnapshotDiffCache × 100 + getSnapshotDiffCache × 100 completes in <500ms', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      // Pre-create 100 snapshot pairs
      const snapshotPairs: Array<[string, string]> = [];
      const insertSnapshot = kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      );
      const insertMany = kbHandle.db.transaction(() => {
        for (let i = 0; i < 200; i++) {
          const id = `S-pdiff-${i.toString().padStart(3, '0')}`;
          insertSnapshot.run(id, 'test-proj', new Date().toISOString());
        }
        for (let i = 0; i < 100; i++) {
          snapshotPairs.push([`S-pdiff-${i.toString().padStart(3, '0')}`, `S-pdiff-${(i + 100).toString().padStart(3, '0')}`]);
        }
      });
      insertMany();

      const diffJson = JSON.stringify({ new: ['F-001', 'F-002'], resolved: ['F-old'], persisted: ['F-p01'] });

      const start = performance.now();
      for (const [s1, s2] of snapshotPairs) {
        // setSnapshotDiffCache(from, to, projectId, json)
        await kb.setSnapshotDiffCache(s1, s2, 'test-proj', diffJson);
      }
      for (const [s1, s2] of snapshotPairs) {
        // getSnapshotDiffCache(from, to) → { payload_json } | null
        const cached = await kb.getSnapshotDiffCache(s1, s2);
        expect(cached?.payload_json).toBe(diffJson);
      }
      const elapsed = performance.now() - start;

      if (elapsed > 500) {
        console.warn(`P5 PERF WARN: diff cache × 100 pairs took ${elapsed.toFixed(0)}ms (target: <500ms)`);
      }
      expect(elapsed).toBeLessThan(5000);
    } finally {
      kbHandle.cleanup();
    }
  });
});
