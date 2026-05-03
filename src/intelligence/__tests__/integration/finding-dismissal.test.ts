/**
 * Phase 826 / C13 — I5 (partial): Finding dismissal state machine
 *                    I11: intervention path — dismissed finding → decision
 *
 * dismissFinding transitions status from 'open' to 'dismissed'.
 * Dismissed findings no longer appear in listOpenFindings.
 * A dismissed finding can be the source_finding for a subsequent decision.
 *
 * Phase 826 / D-26-23, D-26-29.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';
import type { Finding } from '../../types.js';

describe('I5/I11: finding dismissal and intervention path', () => {
  it('dismissFinding marks finding as dismissed, removes from listOpenFindings', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-dismiss-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      await kb.writeFindings(snapshotId, 'test-proj', [
        {
          id: 'F-dismiss-001' as `F-${string}`,
          project_id: 'test-proj',
          kind: 'dead_code',
          severity: 'low',
          confidence: 0.6,
          title: 'Potentially unused',
          rationale: 'No callsites found',
          produced_by: 'analyzer',
          produced_at: new Date().toISOString(),
          snapshot_id: snapshotId,
          status: 'open',
        } satisfies Finding,
      ]);

      const before = await kb.listOpenFindings('test-proj');
      expect(before.some((f) => f.id === 'F-dismiss-001')).toBe(true);

      const dismissed = await kb.dismissFinding('F-dismiss-001' as `F-${string}`, 'False positive — used in tests');
      expect(dismissed.status).toBe('dismissed');
      expect(dismissed.dismissed_rationale).toBe('False positive — used in tests');

      const after = await kb.listOpenFindings('test-proj');
      expect(after.some((f) => f.id === 'F-dismiss-001')).toBe(false);
    } finally {
      kbHandle.cleanup();
    }
  });

  it('dismissed finding can still be source_finding for a decision (intervention path)', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-interv-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      await kb.writeFindings(snapshotId, 'test-proj', [
        {
          id: 'F-interv-001' as `F-${string}`,
          project_id: 'test-proj',
          kind: 'hot_spot',
          severity: 'high',
          confidence: 0.9,
          title: 'High churn module',
          rationale: 'Changed 30 times in 60 days',
          produced_by: 'analyzer',
          produced_at: new Date().toISOString(),
          snapshot_id: snapshotId,
          status: 'open',
        } satisfies Finding,
      ]);

      // Dismiss the finding (developer investigated, decided to take action)
      await kb.dismissFinding('F-interv-001' as `F-${string}`, 'Will address via refactor decision');

      // Start a meeting and add a decision sourced from the dismissed finding
      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const decision = await kb.addDecision(meeting.id, {
        state: 'pending',
        kind: 'vision_mission',
        ai_draft: { title: 'Refactor high-churn module', body: 'Vision for restructuring' },
        developer_modifications: [],
        source_findings: ['F-interv-001' as `F-${string}`],
        source_move_rank: 1,
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });

      expect(decision.source_findings).toContain('F-interv-001');
      expect(decision.state).toBe('pending');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getFinding returns dismissed finding with correct status', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-getf-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      await kb.writeFindings(snapshotId, 'test-proj', [
        {
          id: 'F-getf-001' as `F-${string}`,
          project_id: 'test-proj',
          kind: 'complexity_outlier',
          severity: 'med',
          confidence: 0.75,
          title: 'Complex function',
          rationale: 'Cyclomatic complexity > 20',
          produced_by: 'analyzer',
          produced_at: new Date().toISOString(),
          snapshot_id: snapshotId,
          status: 'open',
        } satisfies Finding,
      ]);

      await kb.dismissFinding('F-getf-001' as `F-${string}`, 'Accepted complexity');
      const f = await kb.getFinding('F-getf-001' as `F-${string}`);
      expect(f?.status).toBe('dismissed');
      expect(f?.dismissed_rationale).toBe('Accepted complexity');
    } finally {
      kbHandle.cleanup();
    }
  });
});
