/**
 * C06 — MeetingStore tests covering T1-T9.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore, InvalidStateTransition } from '../store.js';
import { MeetingStore } from '../meetings.js';
import type { ProjectId, SnapshotId, MeetingId, FindingId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_ID: ProjectId = 'meeting-store-test';
let tmpDir: string;
let store: KBStore;
let ms: MeetingStore;
let snapshotId: SnapshotId;

async function setup() {
  store = new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
  await store.ensureRegistry();
  await store.registerProject({
    id: PROJECT_ID,
    name: 'Meeting Store Test',
    path: join(tmpDir, 'ms-project'),
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
  ms = new MeetingStore({ kb: store });
}

describe('intelligence/kb — MeetingStore (C06)', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-ms-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setup();
  }, 30000);

  afterEach(() => {
    try { store.close(); } catch { /* ignore */ }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── T1: MeetingStore shell + start/resume ─────────────────────────────

  it('T1: new project → startOrResume creates meeting in state in_session', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m.status).toBe('in_session');
    expect(m.project_id).toBe(PROJECT_ID);
    expect(m.kb_snapshot).toBe(snapshotId);
  });

  it('T1: existing parked meeting → startOrResume resumes (transitions to in_session)', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.park(m1.id);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m2.id).toBe(m1.id);
    expect(m2.status).toBe('in_session');
  });

  it('T1: in_session meeting already exists → startOrResume returns existing', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m2.id).toBe(m1.id);
    expect(m2.status).toBe('in_session');
  });

  it('T1: meeting ID format M-YYYYMMDD-NNNN', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m.id).toMatch(/^M-\d{8}-[a-zA-Z0-9_-]{4}$/);
  });

  it('T1: getCurrent returns active meeting', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const current = await ms.getCurrent(PROJECT_ID);
    expect(current?.id).toBe(m.id);
  });

  it('T1: listHistory returns meetings ordered by started_at desc', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m1.id);
    await ms.wrap(m1.id);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m2.id);
    await ms.wrap(m2.id);

    const history = await ms.listHistory(PROJECT_ID);
    expect(history.length).toBe(2);
    // Most recent first
    expect(history[0].id).toBe(m2.id);
  });

  // ─── T2: park / resume / commit / wrap ────────────────────────────────

  it('T2: park from in_session succeeds; pending decisions intact', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const parked = await ms.park(m.id);
    expect(parked.status).toBe('parked');

    const pending = await ms.listPending(m.id);
    expect(pending.length).toBe(1);
  });

  it('T2: resume from parked succeeds', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.park(m.id);
    const resumed = await ms.resume(m.id);
    expect(resumed.status).toBe('in_session');
  });

  it('T2: park from parked throws (already parked)', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.park(m.id);
    await expect(ms.park(m.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('T2: wrap from in_session throws (must commit first)', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await expect(ms.wrap(m.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('T2: commit from parked throws (must resume first)', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.park(m.id);
    await expect(ms.commit(m.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('T2: full lifecycle: in_session → committed → wrapped', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const bundle = await ms.commit(m.id);
    expect(bundle).toBeDefined();
    const wrapped = await ms.wrap(m.id);
    expect(wrapped.status).toBe('wrapped');
  });

  // ─── T3: addDecision / editDecision / withdraw ─────────────────────────

  it('T3: addDecision returns full Decision with state pending', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, {
      kind: 'vision_mission',
      ai_draft: { title: 'Vision', body: 'A new vision' },
      source_findings: ['F-001' as FindingId],
    });
    expect(d.state).toBe('pending');
    expect(d.kind).toBe('vision_mission');
    expect(d.ai_draft?.title).toBe('Vision');
  });

  it('T3: editDecision appends to developer_modifications; original preserved', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const d1 = await ms.editDecision(d.id, ['first edit']);
    expect(d1.developer_modifications).toContain('first edit');
    expect(d1.state).toBe('pending'); // state unchanged

    const d2 = await ms.editDecision(d.id, ['second edit']);
    expect(d2.developer_modifications).toContain('first edit');
    expect(d2.developer_modifications).toContain('second edit');
  });

  it('T3: withdraw from pending succeeds', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const withdrawn = await ms.withdraw(d.id);
    expect(withdrawn.state).toBe('withdrawn');
  });

  it('T3: withdraw from sent_now throws', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    await ms.sendNow(d.id);
    await expect(ms.withdraw(d.id)).rejects.toThrow(InvalidStateTransition);
  });

  // ─── T4: sendNow ──────────────────────────────────────────────────────

  it('T4: pending → sendNow succeeds; state becomes sent_now', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    const result = await ms.sendNow(d.id);
    expect(result.decision.state).toBe('sent_now');
  });

  it('T4: emissionPath returned but filesystem unchanged', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    const result = await ms.sendNow(d.id);
    expect(result.emissionPath).toBeTruthy();
    expect(result.emissionPath).toContain('.planning/staging/inbox/');

    // Verify no file was created
    const { access } = await import('node:fs/promises');
    await expect(access(result.emissionPath)).rejects.toThrow();
  });

  it('T4: sendNow on already-sent decision throws', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    await ms.sendNow(d.id);
    await expect(ms.sendNow(d.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('T4: sendNow on bundled decision throws', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    await ms.commit(m.id);
    // Decision is now 'bundled'
    await expect(ms.sendNow(d.id)).rejects.toThrow(InvalidStateTransition);
  });

  // ─── T5: previewBundle ────────────────────────────────────────────────

  it('T5: 3 pending + 1 sent_now → preview shows 3 pending, 1 alreadySent', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d1 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: [] });
    const d3 = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    const d4 = await ms.addDecision(m.id, { kind: 'finding_dismissal', ai_draft: null, source_findings: [] });
    await ms.sendNow(d4.id);

    const preview = await ms.previewBundle(m.id);
    expect(preview.pendingDecisions.length).toBe(3);
    expect(preview.alreadySentDecisions.length).toBe(1);
    expect(preview.decisionCount).toBe(3);
  });

  // ─── T6: computeBatchHints ────────────────────────────────────────────

  it('T6: 3 unrelated decisions → 3 singleton groups (parallelizable)', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);

    // Write snapshot and findings with different source paths
    await store.writeFindings(snapshotId, PROJECT_ID, [
      { id: 'F-a1' as FindingId, project_id: PROJECT_ID, kind: 'dead_code', severity: 'low', confidence: 0.8, title: 'A1', rationale: '', source_path: 'src/a.ts', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
      { id: 'F-b1' as FindingId, project_id: PROJECT_ID, kind: 'dead_code', severity: 'low', confidence: 0.8, title: 'B1', rationale: '', source_path: 'src/b.ts', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
      { id: 'F-c1' as FindingId, project_id: PROJECT_ID, kind: 'dead_code', severity: 'low', confidence: 0.8, title: 'C1', rationale: '', source_path: 'src/c.ts', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
    ]);

    const d1 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: ['F-a1' as FindingId] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: ['F-b1' as FindingId] });
    const d3 = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: ['F-c1' as FindingId] });

    const hints = await ms.computeBatchHints([
      (await store.getDecision(d1.id))!,
      (await store.getDecision(d2.id))!,
      (await store.getDecision(d3.id))!,
    ]);

    // 3 unrelated decisions → 3 singleton groups
    const totalGroups = hints.parallelizable.length;
    expect(totalGroups).toBe(3);
    expect(hints.shared_context).toHaveLength(0);
  });

  it('T6: 2 decisions sharing files → 1 serial group', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);

    await store.writeFindings(snapshotId, PROJECT_ID, [
      { id: 'F-shared-1' as FindingId, project_id: PROJECT_ID, kind: 'dead_code', severity: 'low', confidence: 0.8, title: 'Shared 1', rationale: '', source_path: 'src/shared.ts', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
      { id: 'F-shared-2' as FindingId, project_id: PROJECT_ID, kind: 'dead_code', severity: 'low', confidence: 0.8, title: 'Shared 2', rationale: '', source_path: 'src/shared.ts', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' },
    ]);

    const d1 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: ['F-shared-1' as FindingId] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: ['F-shared-2' as FindingId] });

    const hints = await ms.computeBatchHints([
      (await store.getDecision(d1.id))!,
      (await store.getDecision(d2.id))!,
    ]);

    expect(hints.shared_context).toContain('src/shared.ts');
    // Both decisions share a file → they should be in the same group (non-singleton)
    const serialGroup = hints.parallelizable.find((g) => g.length > 1);
    expect(serialGroup).toBeDefined();
  });

  it('T6: suggested_order: analysis < research < vision', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d1 = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: [] });
    const d3 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });

    const hints = await ms.computeBatchHints([
      (await store.getDecision(d1.id))!,
      (await store.getDecision(d2.id))!,
      (await store.getDecision(d3.id))!,
    ]);

    const order = hints.suggested_order;
    const idxAnalysis = order.indexOf(d3.id);
    const idxResearch = order.indexOf(d2.id);
    const idxVision = order.indexOf(d1.id);
    expect(idxAnalysis).toBeLessThan(idxResearch);
    expect(idxResearch).toBeLessThan(idxVision);
  });

  // ─── T7: commit() atomic transaction ──────────────────────────────────

  it('T7: 3 pending + 1 sent_now → commit creates bundle with 3 decisions; sent_now stays', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d1 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: [] });
    const d3 = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    const d4 = await ms.addDecision(m.id, { kind: 'finding_dismissal', ai_draft: null, source_findings: [] });
    await ms.sendNow(d4.id);

    const bundle = await ms.commit(m.id);
    expect(bundle.decisions).toHaveLength(3);
    expect(bundle.decisions).toContain(d1.id);
    expect(bundle.decisions).toContain(d2.id);
    expect(bundle.decisions).toContain(d3.id);
    expect(bundle.decisions).not.toContain(d4.id);

    // d4 is still sent_now
    const d4After = await store.getDecision(d4.id);
    expect(d4After?.state).toBe('sent_now');
  });

  it('T7: commit on already-committed meeting throws', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m.id);
    await expect(ms.commit(m.id)).rejects.toThrow(InvalidStateTransition);
  });

  it('T7: after commit, getCurrent returns null; new meeting can be started', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m1.id);
    await ms.wrap(m1.id);

    const current = await ms.getCurrent(PROJECT_ID);
    expect(current).toBeNull();

    // Can start a new meeting
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m2.id).not.toBe(m1.id);
  });

  // ─── T8: Meeting log ──────────────────────────────────────────────────

  it('T8: log 100 entries → getLog returns 100 in chronological order', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    for (let i = 0; i < 100; i++) {
      await ms.log(m.id, 'event', `Event ${i}`);
    }
    const log = await ms.getLog(m.id);
    expect(log.length).toBe(100);
    expect(log[0].body).toBe('Event 0');
    expect(log[99].body).toBe('Event 99');
  });

  it('T8: getLog on meeting with no entries → empty array', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const log = await ms.getLog(m.id);
    expect(log).toHaveLength(0);
  });

  // ─── T9: One-active-meeting-per-project invariant ─────────────────────

  it('T9: in_session meeting M1 → startOrResume returns M1 (not new)', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m2.id).toBe(m1.id);
  });

  it('T9: park M1 → startOrResume resumes M1 (not new)', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.park(m1.id);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m2.id).toBe(m1.id);
    expect(m2.status).toBe('in_session');
  });

  it('T9: wrap M1 → startOrResume creates M2', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m1.id);
    await ms.wrap(m1.id);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(m2.id).not.toBe(m1.id);
  });

  it('T9: two committed meetings can coexist', async () => {
    const m1 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m1.id);
    await ms.wrap(m1.id);
    const m2 = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.commit(m2.id);
    await ms.wrap(m2.id);

    const history = await ms.listHistory(PROJECT_ID);
    expect(history.filter((m) => m.status === 'wrapped').length).toBe(2);
  });

  // ─── Additional: listPending + listAll ────────────────────────────────

  it('listPending returns only pending decisions', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d1 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: [] });
    await ms.sendNow(d2.id);

    const pending = await ms.listPending(m.id);
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe(d1.id);
  });

  it('listAll returns all decisions including sent_now, bundled, withdrawn', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d1 = await ms.addDecision(m.id, { kind: 'analysis_run', ai_draft: null, source_findings: [] });
    const d2 = await ms.addDecision(m.id, { kind: 'research_mission', ai_draft: null, source_findings: [] });
    const d3 = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });
    await ms.sendNow(d3.id);
    await ms.withdraw(d2.id);

    const all = await ms.listAll(m.id);
    expect(all.length).toBe(3);
  });

  // ─── S8: Rollback-via-snapshot ────────────────────────────────────────

  it('S8: beginSnapshot + rollback restores prior state (no orphan findings)', async () => {
    // Prior state: snapshot s1 with 5 findings committed
    const s1 = await store.writeSnapshot({
      project_id: PROJECT_ID,
      taken_at: new Date().toISOString(),
      files_scanned: 5,
      loc_total: 500,
    });
    await store.writeFindings(s1.id, PROJECT_ID, Array.from({ length: 5 }, (_, i) => ({
      id: `F-s8-${i}` as FindingId,
      project_id: PROJECT_ID,
      kind: 'dead_code' as const,
      severity: 'low' as const,
      confidence: 0.7,
      title: `S8 Finding ${i}`,
      rationale: 'test',
      produced_by: 'analyzer' as const,
      produced_at: new Date().toISOString(),
      snapshot_id: s1.id,
      status: 'open' as const,
    })));

    // Begin a new snapshot (in-progress)
    const s2id = 'snap-s8-in-progress';
    await store.beginSnapshot(s2id, PROJECT_ID);
    await store.writeFindings(s2id, PROJECT_ID, Array.from({ length: 3 }, (_, i) => ({
      id: `F-s8-new-${i}` as FindingId,
      project_id: PROJECT_ID,
      kind: 'hot_spot' as const,
      severity: 'high' as const,
      confidence: 0.9,
      title: `New finding ${i}`,
      rationale: 'test',
      produced_by: 'analyzer' as const,
      produced_at: new Date().toISOString(),
      snapshot_id: s2id,
      status: 'open' as const,
    })));

    // Rollback: should remove s2's findings + s2 snapshot
    await store.rollbackSnapshot(s2id);

    // Open findings should only be from s1
    const open = await store.listOpenFindings(PROJECT_ID);
    expect(open.length).toBe(5);
    expect(open.every((f) => f.snapshot_id === s1.id)).toBe(true);
  });

  // ─── I14: Persistence ─────────────────────────────────────────────────

  it('I14: meeting state survives store close + reopen', async () => {
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    const d = await ms.addDecision(m.id, { kind: 'vision_mission', ai_draft: null, source_findings: [] });

    // Close store
    store.close();

    // Reopen
    store = new KBStore({
      registryPath: join(tmpDir, 'registry.db'),
      migrationsDir: MIGRATIONS_DIR,
    });
    await store.ensureRegistry();
    await store.ensureProjectDB(PROJECT_ID);
    ms = new MeetingStore({ kb: store });

    const current = await ms.getCurrent(PROJECT_ID);
    expect(current?.id).toBe(m.id);
    expect(current?.status).toBe('in_session');

    const pending = await ms.listPending(m.id);
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe(d.id);
  });

  // ─── E7: Long-parked meeting ──────────────────────────────────────────

  it('E7: long-parked meeting (30 days simulated) reopens cleanly', async () => {
    // Create meeting with past started_at to simulate 30 days parked
    const m = await ms.startOrResume(PROJECT_ID, snapshotId);
    await ms.park(m.id);

    // Simulate 30 days: update started_at in DB
    const pdb = await store.getProjectRawDB(PROJECT_ID);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
    pdb.prepare('UPDATE meetings SET started_at = ? WHERE id = ?').run(thirtyDaysAgo, m.id);

    // Should reopen cleanly
    const resumed = await ms.startOrResume(PROJECT_ID, snapshotId);
    expect(resumed.id).toBe(m.id);
    expect(resumed.status).toBe('in_session');
  });
});
