/**
 * Phase 826 / C13 — I8: Two-scan snapshot diff loop
 *
 * Write snapshot 1 findings, write snapshot 2 findings, compare —
 * new findings in S2 not in S1 are classified as 'new'; findings
 * present in both are 'persisted'; findings only in S1 are 'resolved'.
 *
 * Also tests the getSnapshotDiffCache / setSnapshotDiffCache round-trip.
 *
 * Phase 826 / D-26-26.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';
import type { Finding } from '../../types.js';

describe('I8: snapshot diff loop', () => {
  it('listFindingsAt returns findings for a specific snapshot', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      // Snapshot 1 findings
      const s1 = 'S-diff-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(s1, 'test-proj', new Date().toISOString());
      await kb.beginSnapshot(s1, 'test-proj');
      await kb.writeFindings(s1, 'test-proj', [
        makeF('F-s1-hot', s1, 'hot_spot', 'high'),
        makeF('F-s1-dead', s1, 'dead_code', 'low'),
      ]);
      await kb.commitSnapshot(s1);

      // Snapshot 2 findings — 'F-s1-hot' persists; 'F-s1-dead' resolved; 'F-s2-new' new
      const s2 = 'S-diff-002';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,12,600)"
      ).run(s2, 'test-proj', new Date().toISOString());
      await kb.beginSnapshot(s2, 'test-proj');
      await kb.writeFindings(s2, 'test-proj', [
        makeF('F-s2-hot', s2, 'hot_spot', 'high'),
        makeF('F-s2-new', s2, 'coupling_spike', 'med'),
      ]);
      await kb.commitSnapshot(s2);

      const s1findings = await kb.listFindingsAt(s1);
      const s2findings = await kb.listFindingsAt(s2);

      expect(s1findings.map((f) => f.id)).toContain('F-s1-hot');
      expect(s1findings.map((f) => f.id)).toContain('F-s1-dead');
      expect(s2findings.map((f) => f.id)).toContain('F-s2-hot');
      expect(s2findings.map((f) => f.id)).toContain('F-s2-new');

      // S1-dead not in S2 (resolved); S2-new not in S1 (new)
      expect(s2findings.map((f) => f.id)).not.toContain('F-s1-dead');
      expect(s1findings.map((f) => f.id)).not.toContain('F-s2-new');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('setSnapshotDiffCache / getSnapshotDiffCache round-trip', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const s1 = 'S-cache-001';
      const s2 = 'S-cache-002';

      for (const sid of [s1, s2]) {
        kbHandle.db.prepare(
          "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
        ).run(sid, 'test-proj', new Date().toISOString());
        await kb.beginSnapshot(sid, 'test-proj');
        await kb.commitSnapshot(sid);
      }

      const diffJson = JSON.stringify({ new: ['F-001'], resolved: ['F-old'], persisted: [] });
      // setSnapshotDiffCache(from, to, projectId, json)
      await kb.setSnapshotDiffCache(s1, s2, 'test-proj', diffJson);

      // getSnapshotDiffCache(from, to) → { payload_json } | null
      const cached = await kb.getSnapshotDiffCache(s1, s2);
      expect(cached).not.toBeNull();
      expect(cached?.payload_json).toBe(diffJson);
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getSnapshotDiffCache returns null for uncached pair', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.getSnapshotDiffCache('S-x', 'S-y');
      expect(result).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });
});

function makeF(id: string, snapshotId: string, kind: 'hot_spot' | 'dead_code' | 'coupling_spike', severity: 'high' | 'med' | 'low'): Finding {
  return {
    id: id as `F-${string}`,
    project_id: 'test-proj',
    kind,
    severity,
    confidence: 0.8,
    title: `Finding ${id}`,
    rationale: 'Test rationale',
    produced_by: 'analyzer',
    produced_at: new Date().toISOString(),
    snapshot_id: snapshotId,
    status: 'open',
  };
}
