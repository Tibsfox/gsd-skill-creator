/**
 * Phase 826 / C13 — I6: Meeting record start/park/list lifecycle
 *                    I7: getMeeting + getDecision lookups
 *                    I15: meeting persists across KBStore restarts
 *
 * Phase 826 / D-26-24, D-26-25, D-26-33.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';

describe('I6: meeting record lifecycle', () => {
  it('startMeeting → listMeetings includes the new meeting', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-meeting-life-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const meetings = await kb.listMeetings('test-proj');
      expect(meetings.some((m) => m.id === meeting.id)).toBe(true);
    } finally {
      kbHandle.cleanup();
    }
  });

  it('parkMeeting transitions status to parked', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-park-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      expect(meeting.status).toBe('in_session');

      const parked = await kb.parkMeeting(meeting.id);
      expect(parked.status).toBe('parked');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('addDecision adds decisions visible via listInFlightWork', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-decisions-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      await kb.addDecision(meeting.id, {
        state: 'pending',
        kind: 'vision_mission',
        ai_draft: { title: 'In-flight test', body: 'Body' },
        developer_modifications: [],
        source_findings: [],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });

      const inFlight = await kb.listInFlightWork('test-proj');
      // listInFlightWork returns { bundles, decisions } — decisions includes pending ones
      expect(inFlight.decisions.length).toBeGreaterThan(0);
    } finally {
      kbHandle.cleanup();
    }
  });
});

describe('I7: getMeeting + getDecision lookups', () => {
  it('getMeeting returns the correct meeting by id', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-getmeet-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const fetched = await kb.getMeeting(meeting.id);
      expect(fetched?.id).toBe(meeting.id);
      expect(fetched?.project_id).toBe('test-proj');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getDecision returns the correct decision by id', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-getdec-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const decision = await kb.addDecision(meeting.id, {
        state: 'pending',
        kind: 'research_mission',
        ai_draft: { title: 'Research X', body: 'Body' },
        developer_modifications: ['Added constraint'],
        source_findings: [],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });

      const fetched = await kb.getDecision(decision.id);
      expect(fetched?.id).toBe(decision.id);
      expect(fetched?.kind).toBe('research_mission');
      expect(fetched?.developer_modifications).toContain('Added constraint');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getMeeting returns null for unknown id', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.getMeeting('M-nonexistent' as `M-${string}`);
      expect(result).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });
});

describe('I15: meeting persists across KBStore restarts', () => {
  it('meeting and decision survive creating a new KBStore instance on the same path', async () => {
    const kbHandle = createTestKB();
    try {
      const kb1 = await kbHandle.createKBStore();

      const snapshotId = 'S-persist-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb1.startMeeting('test-proj', snapshotId);
      const decision = await kb1.addDecision(meeting.id, {
        state: 'pending',
        kind: 'vision_mission',
        ai_draft: { title: 'Persisted decision', body: 'Body' },
        developer_modifications: [],
        source_findings: [],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });

      // Open a new KBStore on the same path — simulates a server restart.
      // Must call ensureProjectDB first since getMeeting only scans cached DBs.
      const kb2 = await kbHandle.createKBStore();
      await kb2.ensureProjectDB('test-proj');
      const fetched = await kb2.getMeeting(meeting.id);
      expect(fetched?.id).toBe(meeting.id);

      const fetchedDecision = await kb2.getDecision(decision.id);
      expect(fetchedDecision?.id).toBe(decision.id);
      expect(fetchedDecision?.kind).toBe('vision_mission');
    } finally {
      kbHandle.cleanup();
    }
  });
});
