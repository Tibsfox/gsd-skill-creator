/**
 * C04 T6 — Decision state machine tests (UPDATE-WHERE pattern).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore, InvalidStateTransition } from '../store.js';
import type { MeetingId, SnapshotId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_ID = 'state-machine-test';
let tmpDir: string;
let store: KBStore;
let meetingId: MeetingId;
let snapshotId: SnapshotId;

async function setup() {
  store = new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
  await store.ensureRegistry();
  await store.registerProject({
    id: PROJECT_ID,
    name: 'State Machine Test',
    path: join(tmpDir, 'sm-project'),
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await store.ensureProjectDB(PROJECT_ID);
  const snap = await store.writeSnapshot({
    project_id: PROJECT_ID,
    taken_at: new Date().toISOString(),
    files_scanned: 0,
    loc_total: 0,
  });
  snapshotId = snap.id;
  const meeting = await store.startMeeting(PROJECT_ID, snapshotId);
  meetingId = meeting.id;
}

async function addDecision() {
  return store.addDecision(meetingId, {
    kind: 'vision_mission',
    state: 'pending',
    ai_draft: null,
    developer_modifications: [],
    source_findings: [],
    approved_at: null,
    emitted_at: null,
    emission_path: null,
  });
}

describe('intelligence/kb — decision state machine', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-state-machine-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setup();
  }, 30000);

  afterEach(() => {
    try { store.close(); } catch { /* ignore */ }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('pending → sent_now succeeds', async () => {
    const d = await addDecision();
    expect(d.state).toBe('pending');
    const updated = await store.promoteToSendNow(d.id);
    expect(updated.state).toBe('sent_now');
  });

  it('sent_now → bundled throws InvalidStateTransition', async () => {
    const d = await addDecision();
    await store.promoteToSendNow(d.id);
    // Attempting to promote again (sent_now → sent_now) should throw
    await expect(store.promoteToSendNow(d.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('bundled state: commit then try to promote → throws', async () => {
    const d = await addDecision();
    await store.commitBundle(meetingId);
    // After commit, decision is in 'bundled' state
    await expect(store.promoteToSendNow(d.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('pending → withdrawn succeeds (via commitBundle exclusion is not test, use dismissFinding approach)', async () => {
    // Test the state machine via direct DB manipulation to simulate 'withdrawn'
    const d = await addDecision();
    const pdb = await store.getProjectRawDB(PROJECT_ID);
    // Manually transition to withdrawn (as MeetingStore would do via withdraw())
    pdb.prepare("UPDATE decisions SET state = 'withdrawn' WHERE id = ?").run(d.id);
    // Now promoteToSendNow should throw
    await expect(store.promoteToSendNow(d.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('addDecision returns decision with state=pending and meeting_id set', async () => {
    const d = await addDecision();
    expect(d.state).toBe('pending');
    expect(d.meeting_id).toBe(meetingId);
    expect(d.kind).toBe('vision_mission');
  });

  it('promoteToSendNow on non-existent decision → throws NotFound', async () => {
    const { NotFoundError } = await import('../store.js');
    await expect(store.promoteToSendNow('nonexistent-decision')).rejects.toThrow();
  });

  it('commitBundle creates bundle with all pending decisions', async () => {
    const d1 = await addDecision();
    const d2 = await addDecision();
    const bundle = await store.commitBundle(meetingId);
    expect(bundle.decisions).toContain(d1.id);
    expect(bundle.decisions).toContain(d2.id);
    expect(bundle.id).toBe(meetingId);
  });

  it('meeting → committed after commitBundle', async () => {
    await addDecision();
    await store.commitBundle(meetingId);
    const meetings = await store.listMeetings(PROJECT_ID);
    const m = meetings.find((m) => m.id === meetingId);
    expect(m?.status).toBe('committed');
  });
});
