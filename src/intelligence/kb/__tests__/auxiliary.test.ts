/**
 * C04 T8 — Briefings, meeting log, mission links tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';
import type { MeetingId, SnapshotId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_ID = 'aux-test-project';
let tmpDir: string;
let store: KBStore;
let snapshotId: SnapshotId;
let meetingId: MeetingId;

async function setup() {
  store = new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
  await store.ensureRegistry();
  await store.registerProject({
    id: PROJECT_ID,
    name: 'Aux Test',
    path: join(tmpDir, 'aux-project'),
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await store.ensureProjectDB(PROJECT_ID);
  const snap = await store.writeSnapshot({
    project_id: PROJECT_ID,
    taken_at: new Date().toISOString(),
    files_scanned: 1,
    loc_total: 100,
  });
  snapshotId = snap.id;
  const meeting = await store.startMeeting(PROJECT_ID, snapshotId);
  meetingId = meeting.id;
}

describe('intelligence/kb — briefings, meeting log, mission links', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-aux-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setup();
  }, 30000);

  afterEach(() => {
    try { store.close(); } catch { /* ignore */ }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('write briefing + read back → all fields preserved (including JSON arrays)', async () => {
    const briefing = await store.writeBriefing({
      project_id: PROJECT_ID,
      snapshot_id: snapshotId,
      generated_at: new Date().toISOString(),
      body: 'The codebase shows evidence of coupling spikes in the service layer.',
      confidence: 'high',
      source_findings: ['F-001', 'F-002', 'F-003'],
      suggested_moves: [
        {
          rank: 1,
          title: 'Refactor service layer',
          kind: 'analyze',
          rationale: 'High coupling detected',
          expected_unblocks: 'Improves testability',
          source_findings: ['F-001'],
        },
      ],
    });

    expect(briefing.id).toMatch(/^B-/);

    const retrieved = await store.getCurrentBriefing(PROJECT_ID);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.body).toContain('coupling spikes');
    expect(retrieved?.confidence).toBe('high');
    expect(retrieved?.source_findings).toEqual(['F-001', 'F-002', 'F-003']);
    expect(retrieved?.suggested_moves).toHaveLength(1);
    expect(retrieved?.suggested_moves[0].title).toBe('Refactor service layer');
    expect(retrieved?.suggested_moves[0].source_findings).toEqual(['F-001']);
  });

  it('getCurrentBriefing returns most recent briefing for project', async () => {
    const older = new Date(Date.now() - 10000).toISOString();
    const newer = new Date().toISOString();

    await store.writeBriefing({
      project_id: PROJECT_ID,
      snapshot_id: snapshotId,
      generated_at: older,
      body: 'Older briefing',
      confidence: 'low',
      source_findings: [],
      suggested_moves: [],
    });

    await store.writeBriefing({
      project_id: PROJECT_ID,
      snapshot_id: snapshotId,
      generated_at: newer,
      body: 'Newer briefing',
      confidence: 'high',
      source_findings: [],
      suggested_moves: [],
    });

    const current = await store.getCurrentBriefing(PROJECT_ID);
    expect(current?.body).toBe('Newer briefing');
  });

  it('getCurrentBriefing → null for project with no briefings', async () => {
    const result = await store.getCurrentBriefing(PROJECT_ID);
    expect(result).toBeNull();
  });

  it('writeMeetingLog 100 entries → 100 rows in correct order', async () => {
    for (let i = 0; i < 100; i++) {
      await store.writeMeetingLog(meetingId, 'event', `Event ${i}`);
    }

    const log = await store.getMeetingLog(meetingId);
    expect(log.length).toBe(100);
    expect(log[0].body).toBe('Event 0');
    expect(log[99].body).toBe('Event 99');
    // Verify chronological order
    for (let i = 1; i < log.length; i++) {
      expect(log[i].recorded_at >= log[i - 1].recorded_at).toBe(true);
    }
  });

  it('addMissionLink → row in mission_links with correct decision_id', async () => {
    const decision = await store.addDecision(meetingId, {
      kind: 'vision_mission',
      state: 'pending',
      ai_draft: null,
      developer_modifications: [],
      source_findings: [],
      approved_at: null,
      emitted_at: null,
      emission_path: null,
    });

    await store.addMissionLink(decision.id, 'vision_doc', 'missions/M-001/vision.md');

    const pdb = await store.getProjectRawDB(PROJECT_ID);
    const rows = pdb
      .prepare('SELECT * FROM mission_links WHERE decision_id = ?')
      .all(decision.id) as Array<{ artifact_kind: string; artifact_ref: string }>;

    expect(rows.length).toBe(1);
    expect(rows[0].artifact_kind).toBe('vision_doc');
    expect(rows[0].artifact_ref).toBe('missions/M-001/vision.md');
  });

  it('meeting ID follows pattern M-YYYYMMDD-XXXX', () => {
    expect(meetingId).toMatch(/^M-\d{8}-[a-zA-Z0-9_-]{4}$/);
  });

  it('startMeeting creates meeting with in_session status', async () => {
    const meetings = await store.listMeetings(PROJECT_ID);
    expect(meetings.length).toBe(1);
    expect(meetings[0].status).toBe('in_session');
    expect(meetings[0].kb_snapshot).toBe(snapshotId);
  });

  it('parkMeeting transitions in_session → parked', async () => {
    const parked = await store.parkMeeting(meetingId);
    expect(parked.status).toBe('parked');

    const meetings = await store.listMeetings(PROJECT_ID);
    const m = meetings.find((m) => m.id === meetingId);
    expect(m?.status).toBe('parked');
  });

  it('listInFlightWork returns bundles and non-terminal decisions', async () => {
    const d = await store.addDecision(meetingId, {
      kind: 'analysis_run',
      state: 'pending',
      ai_draft: null,
      developer_modifications: [],
      source_findings: [],
      approved_at: null,
      emitted_at: null,
      emission_path: null,
    });

    const inFlight = await store.listInFlightWork(PROJECT_ID);
    expect(inFlight.decisions.some((dec) => dec.id === d.id)).toBe(true);

    // After commit, decision moves to bundled (excluded from in-flight)
    await store.commitBundle(meetingId);
    const inFlight2 = await store.listInFlightWork(PROJECT_ID);
    expect(inFlight2.bundles.length).toBe(1);
  });
});
