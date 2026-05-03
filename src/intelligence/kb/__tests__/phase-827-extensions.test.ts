/**
 * Phase 827 / C01 — KBStore extensions: editDecision, withdrawDecision, previewBundle.
 *
 * TDD RED phase: 7 tests that all fail before implementation.
 * After implementation (GREEN phase) all 7 must pass.
 *
 * T1 — editDecision happy path
 * T2 — editDecision not-found throws
 * T3 — editDecision concurrent-write idempotency (no lost write)
 * T4 — withdrawDecision happy path
 * T5 — withdrawDecision idempotent (bus.publish called exactly ONCE)
 * T6 — previewBundle happy path (3 pending + 1 withdrawn → 3 returned)
 * T7 — previewBundle empty meeting
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';
import type { MeetingId, SnapshotId, DecisionId } from '../../types.js';
import type { EventBus } from '../../events/types.js';
import type { IntelligenceEvent } from '../../events/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_ID = 'phase-827-extensions-test';

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
    name: 'Phase 827 Extensions Test',
    path: join(tmpDir, 'test-project'),
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

async function addPendingDecision(modifications: string[] = []): Promise<DecisionId> {
  const d = await store.addDecision(meetingId, {
    kind: 'vision_mission',
    state: 'pending',
    ai_draft: null,
    developer_modifications: modifications,
    source_findings: [],
    approved_at: null,
    emitted_at: null,
    emission_path: null,
  });
  return d.id;
}

/** Creates a stub event bus that records publish calls. */
function makeStubBus(): { bus: EventBus<IntelligenceEvent>; events: IntelligenceEvent[] } {
  const events: IntelligenceEvent[] = [];
  const bus: EventBus<IntelligenceEvent> = {
    subscribe: (_cb) => () => {},
    publish: (event) => { events.push(event); },
  };
  return { bus, events };
}

describe('intelligence/kb — Phase 827 extensions (C01)', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-827-extensions-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setup();
  }, 30_000);

  afterEach(() => {
    try { store.close(); } catch { /* ignore */ }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── T1: editDecision happy path ────────────────────────────────────────

  it('T1: editDecision appends modifications; row reflects merged array', async () => {
    const decisionId = await addPendingDecision(['initial mod']);
    const updated = await store.editDecision(decisionId, ['second mod', 'third mod']);

    expect(updated.id).toBe(decisionId);
    expect(updated.developer_modifications).toEqual(['initial mod', 'second mod', 'third mod']);
  });

  // ─── T2: editDecision not-found throws ──────────────────────────────────

  it('T2: editDecision on non-existent decision throws descriptive error', async () => {
    await expect(
      store.editDecision('nonexistent-decision-id', ['a mod']),
    ).rejects.toThrow(/nonexistent-decision-id/);
  });

  // ─── T3: editDecision concurrent-write idempotency ──────────────────────

  it('T3: concurrent editDecision calls both land; no lost write; ordering preserved', async () => {
    const decisionId = await addPendingDecision();

    // Fire two concurrent calls
    const [r1, r2] = await Promise.all([
      store.editDecision(decisionId, ['concurrent-A']),
      store.editDecision(decisionId, ['concurrent-B']),
    ]);

    // Both calls must succeed
    expect(r1.id).toBe(decisionId);
    expect(r2.id).toBe(decisionId);

    // The final state must contain both modifications (one write can't shadow the other)
    // Re-read via editDecision with empty array to get current state
    const final = await store.editDecision(decisionId, []);
    const mods = final.developer_modifications;
    expect(mods).toContain('concurrent-A');
    expect(mods).toContain('concurrent-B');
    // Ordering: whichever won the transaction, all entries must be present
    expect(mods.length).toBeGreaterThanOrEqual(2);
  });

  // ─── T4: withdrawDecision happy path ────────────────────────────────────

  it('T4: withdrawDecision transitions state to withdrawn', async () => {
    const decisionId = await addPendingDecision();
    const updated = await store.withdrawDecision(decisionId);

    expect(updated.id).toBe(decisionId);
    expect(updated.state).toBe('withdrawn');
  });

  // ─── T5: withdrawDecision idempotent (single emit) ──────────────────────

  it('T5: withdrawDecision called twice returns same row; bus.publish called exactly ONCE', async () => {
    const { bus, events } = makeStubBus();
    store.setEventBus(bus);

    const decisionId = await addPendingDecision();

    const first = await store.withdrawDecision(decisionId);
    const second = await store.withdrawDecision(decisionId);

    expect(first.state).toBe('withdrawn');
    expect(second.state).toBe('withdrawn');
    expect(second.id).toBe(first.id);

    // Bus must be called exactly once (on the real transition, not on the no-op retry)
    const relevantEvents = events.filter(
      (e) => e.type === 'intelligence:findings_updated' || e.type === 'intelligence:meeting_record_updated',
    );
    expect(relevantEvents.length).toBe(1);
  });

  // ─── T6: previewBundle happy path ───────────────────────────────────────

  it('T6: previewBundle returns only pending decisions (3 pending + 1 withdrawn → 3 returned)', async () => {
    const [id1, id2, id3, id4] = await Promise.all([
      addPendingDecision(),
      addPendingDecision(),
      addPendingDecision(),
      addPendingDecision(),
    ]);

    // Withdraw one
    await store.withdrawDecision(id4);

    const preview = await store.previewBundle(meetingId);

    expect(preview.meeting_id).toBe(meetingId);
    expect(preview.decision_count).toBe(3);
    expect(preview.decisions.length).toBe(3);

    const returnedIds = preview.decisions.map((d) => d.id);
    expect(returnedIds).toContain(id1);
    expect(returnedIds).toContain(id2);
    expect(returnedIds).toContain(id3);
    expect(returnedIds).not.toContain(id4);
  });

  // ─── T7: previewBundle empty meeting ────────────────────────────────────

  it('T7: previewBundle on meeting with 0 decisions returns decision_count: 0 and empty array', async () => {
    const preview = await store.previewBundle(meetingId);

    expect(preview.meeting_id).toBe(meetingId);
    expect(preview.decision_count).toBe(0);
    expect(preview.decisions).toEqual([]);
  });
});
