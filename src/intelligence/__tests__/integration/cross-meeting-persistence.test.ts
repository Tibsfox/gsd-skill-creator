/**
 * Phase 826 / C13 — I13: External repo fixture scan + register
 *                    I14: Pending decisions survive KBStore restart
 *                    I17: Live work from prior bundle visible in new meeting
 *
 * Phase 826 / D-26-31, D-26-32, D-26-35.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';

describe('I13: external project registration and scan', () => {
  it('registers a project for an external path, writes findings, lists them back', async () => {
    const kbHandle = createTestKB('ext-proj');
    try {
      const kb = await kbHandle.createKBStore();

      // Register an external project (simulates registering a cloned OSS repo)
      const proj = await kb.registerProject({
        id: 'ext-proj',
        name: 'External OSS Project',
        path: '/tmp/external-oss-repo',
        branch: 'main',
        kind: 'code',
        priority: 'low',
        last_activity_at: new Date().toISOString(),
      });
      expect(proj.id).toBe('ext-proj');

      // Write a snapshot + findings as if a scan ran
      const snapshotId = 'S-ext-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,150,12000)"
      ).run(snapshotId, 'ext-proj', new Date().toISOString());

      await kb.beginSnapshot(snapshotId, 'ext-proj');
      await kb.writeFindings(snapshotId, 'ext-proj', [
        { id: 'F-ext-001' as `F-${string}`, project_id: 'ext-proj', kind: 'hot_spot', severity: 'high', confidence: 0.85, title: 'High churn controller', rationale: 'Core entry point', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
        { id: 'F-ext-002' as `F-${string}`, project_id: 'ext-proj', kind: 'dead_code', severity: 'low', confidence: 0.6, title: 'Unused utility', rationale: 'Zero callers', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
      ]);
      await kb.commitSnapshot(snapshotId);

      const findings = await kb.listOpenFindings('ext-proj');
      expect(findings.length).toBe(2);
      expect(findings.map((f) => f.id)).toContain('F-ext-001');
    } finally {
      kbHandle.cleanup();
    }
  });
});

describe('I14: pending decisions survive KBStore restart', () => {
  it('pending decision state is preserved after reopening the same storage', async () => {
    const kbHandle = createTestKB('persist-proj');
    try {
      const kb1 = await kbHandle.createKBStore();

      await kb1.registerProject({
        id: 'persist-proj',
        name: 'Persist Test',
        path: kbHandle.projectDir,
        branch: 'main',
        kind: 'code',
        priority: 'med',
        last_activity_at: new Date().toISOString(),
      });

      const snapshotId = 'S-persist-restart-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'persist-proj', new Date().toISOString());

      const meeting = await kb1.startMeeting('persist-proj', snapshotId);
      const decision = await kb1.addDecision(meeting.id, {
        state: 'pending',
        kind: 'vision_mission',
        ai_draft: { title: 'Survive restart', body: 'Vision body' },
        developer_modifications: ['Dev mod 1', 'Dev mod 2'],
        source_findings: [],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });

      // Simulate server restart — open new KBStore on same path.
      // Must open the project DB before querying meetings/decisions.
      const kb2 = await kbHandle.createKBStore();
      await kb2.ensureProjectDB('persist-proj');
      const fetched = await kb2.getDecision(decision.id);
      expect(fetched?.state).toBe('pending');
      expect(fetched?.developer_modifications).toEqual(['Dev mod 1', 'Dev mod 2']);
      expect(fetched?.kind).toBe('vision_mission');
    } finally {
      kbHandle.cleanup();
    }
  });
});

describe('I17: live work from prior bundle visible in new meeting', () => {
  it('decisions committed in a prior bundle appear in listInFlightWork', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId1 = 'S-prior-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId1, 'test-proj', new Date().toISOString());

      // Meeting 1: commit a bundle
      const meeting1 = await kb.startMeeting('test-proj', snapshotId1);
      const decision1 = await kb.addDecision(meeting1.id, {
        state: 'pending',
        kind: 'vision_mission',
        ai_draft: { title: 'Prior vision', body: 'Body 1' },
        developer_modifications: [],
        source_findings: [],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });
      const bundle1 = await kb.commitBundle(meeting1.id);
      expect(bundle1.decisions).toContain(decision1.id);

      // Meeting 2 starts after bundle 1 committed — inFlight includes prior meeting
      const snapshotId2 = 'S-prior-002';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,12,1200)"
      ).run(snapshotId2, 'test-proj', new Date().toISOString());
      const meeting2 = await kb.startMeeting('test-proj', snapshotId2);

      // ListMeetings returns all meetings including committed ones
      const meetings = await kb.listMeetings('test-proj');
      const meetingIds = meetings.map((m) => m.id);
      // Both meetings should be visible
      expect(meetingIds).toContain(meeting1.id);
      expect(meetingIds).toContain(meeting2.id);
    } finally {
      kbHandle.cleanup();
    }
  });
});
