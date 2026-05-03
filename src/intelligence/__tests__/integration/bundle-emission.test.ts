/**
 * Phase 826 / C13 — I3: Bundle emission round-trip (commit + send-now flows)
 *                    I4: Send-now promotes decision state correctly
 *
 * Meeting start → add decisions → commitBundle → assert DB state.
 * promoteToSendNow changes decision state to 'sent_now'.
 * NOTE: commitBundle records a manifest_path in the DB but does NOT create
 * the file on disk (file creation is done by the emitter layer, tested separately).
 *
 * Phase 826 / D-26-21, D-26-22.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';

describe('I3: bundle commit emission flow', () => {
  it('startMeeting → addDecision × 2 → commitBundle records correct bundle in DB', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-bundle-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      expect(meeting.status).toBe('in_session');
      expect(meeting.kb_snapshot).toBe(snapshotId);

      const d1 = await kb.addDecision(meeting.id, {
        kind: 'vision_mission',
        state: 'pending',
        ai_draft: { title: 'Refactor auth layer', body: 'Detailed vision' },
        developer_modifications: [],
        source_findings: ['F-001' as `F-${string}`],
        source_move_rank: 1,
        approved_at: new Date().toISOString(),
        emitted_at: null,
        emission_path: null,
      });
      expect(d1.state).toBe('pending');

      const d2 = await kb.addDecision(meeting.id, {
        kind: 'research_mission',
        state: 'pending',
        ai_draft: { title: 'Research caching patterns', body: 'Background research' },
        developer_modifications: [],
        source_findings: ['F-002' as `F-${string}`],
        source_move_rank: 2,
        approved_at: new Date().toISOString(),
        emitted_at: null,
        emission_path: null,
      });
      expect(d2.state).toBe('pending');

      const bundle = await kb.commitBundle(meeting.id);
      expect(bundle.id).toBe(meeting.id);
      expect(bundle.decisions).toContain(d1.id);
      expect(bundle.decisions).toContain(d2.id);
      // manifest_path is a logical path (file not created until emitter runs)
      expect(bundle.manifest_path).toContain(meeting.id);
      expect(bundle.batch_hints).toBeDefined();
    } finally {
      kbHandle.cleanup();
    }
  });

  it('commitBundle transitions decisions from pending → bundled', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-bundle-state-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const d = await kb.addDecision(meeting.id, {
        kind: 'vision_mission',
        state: 'pending',
        ai_draft: { title: 'Test', body: 'Body' },
        developer_modifications: [],
        source_findings: [],
        approved_at: new Date().toISOString(),
        emitted_at: null,
        emission_path: null,
      });
      expect(d.state).toBe('pending');

      await kb.commitBundle(meeting.id);

      // After commit, decision state should be 'bundled'
      const updated = await kb.getDecision(d.id);
      expect(updated?.state).toBe('bundled');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('commitBundle sets meeting status to committed', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-bundle-meet-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      await kb.addDecision(meeting.id, {
        kind: 'analysis_run',
        state: 'pending',
        ai_draft: { title: 'Analyze', body: 'Body' },
        developer_modifications: [],
        source_findings: [],
        approved_at: new Date().toISOString(),
        emitted_at: null,
        emission_path: null,
      });

      await kb.commitBundle(meeting.id);
      const updatedMeeting = await kb.getMeeting(meeting.id);
      expect(updatedMeeting?.status).toBe('committed');
    } finally {
      kbHandle.cleanup();
    }
  });
});

describe('I4: send-now decision state transition', () => {
  it('promoteToSendNow changes decision state from pending to sent_now', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-sendnow-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const decision = await kb.addDecision(meeting.id, {
        kind: 'vision_mission',
        state: 'pending',
        ai_draft: { title: 'Send-now test', body: 'Body' },
        developer_modifications: [],
        source_findings: [],
        approved_at: new Date().toISOString(),
        emitted_at: null,
        emission_path: null,
      });

      expect(decision.state).toBe('pending');

      const promoted = await kb.promoteToSendNow(decision.id);
      expect(promoted.state).toBe('sent_now');
      expect(promoted.id).toBe(decision.id);
    } finally {
      kbHandle.cleanup();
    }
  });
});
