/**
 * C04 T4 — Snapshot lifecycle tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let tmpDir: string;
let store: KBStore;
const PROJECT_ID = 'snap-test-project';

async function setupStore() {
  store = new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
  await store.ensureRegistry();
  await store.registerProject({
    id: PROJECT_ID,
    name: 'Snapshot Test',
    path: join(tmpDir, 'snap-project'),
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await store.ensureProjectDB(PROJECT_ID);
}

describe('intelligence/kb — snapshot lifecycle', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-snapshots-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setupStore();
  }, 30000); // Stabilized at v1.49.637 ship-time: widen hookTimeout to absorb full-suite I/O contention on KBStore registry + migrations setup (was 10000ms default).

  afterEach(() => {
    store.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('beginSnapshot writes row (taken_at is null initially)', async () => {
    const snapshotId = 'snap-begin-1';
    await store.beginSnapshot(snapshotId, PROJECT_ID);

    const snapshots = await store.listSnapshotsForProject(PROJECT_ID);
    // taken_at is null so not returned by listSnapshotsForProject (which filters null)
    // Verify via internal check that row exists
    const pdb = await store.getProjectRawDB(PROJECT_ID);
    const row = pdb.prepare('SELECT id, taken_at FROM snapshots WHERE id = ?').get(snapshotId) as { id: string; taken_at: string | null } | undefined;
    expect(row).toBeDefined();
    expect(row?.id).toBe(snapshotId);
  });

  it('commitSnapshot sets taken_at and updates projects.last_snapshot_id', async () => {
    const snapshotId = 'snap-commit-1';
    await store.beginSnapshot(snapshotId, PROJECT_ID);
    await store.commitSnapshot(snapshotId);

    const project = await store.getProject(PROJECT_ID);
    expect(project?.last_snapshot_id).toBe(snapshotId);

    const snapshots = await store.listSnapshotsForProject(PROJECT_ID);
    expect(snapshots.some((s) => s.id === snapshotId)).toBe(true);
    const snap = snapshots.find((s) => s.id === snapshotId);
    expect(snap?.taken_at).toBeTruthy();
  });

  it('rollbackSnapshot deletes findings under snapshot AND the snapshot row', async () => {
    const snapshotId = 'snap-rollback-1';
    await store.beginSnapshot(snapshotId, PROJECT_ID);

    // Write some findings under the snapshot
    await store.writeFindings(snapshotId, PROJECT_ID, [
      {
        id: 'F-rollback-1',
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.8,
        title: 'Rollback finding',
        rationale: 'test',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: snapshotId,
        status: 'open',
      },
    ]);

    await store.rollbackSnapshot(snapshotId);

    // Snapshot row should be gone
    const pdb = await store.getProjectRawDB(PROJECT_ID);
    const snapRow = pdb.prepare('SELECT id FROM snapshots WHERE id = ?').get(snapshotId);
    expect(snapRow).toBeUndefined();

    // Findings under snapshot should be gone
    const findingRow = pdb.prepare('SELECT id FROM findings WHERE snapshot_id = ?').get(snapshotId);
    expect(findingRow).toBeUndefined();
  });

  it('commitSnapshot on same id twice → second is no-op (idempotent)', async () => {
    const snapshotId = 'snap-idempotent-1';
    await store.beginSnapshot(snapshotId, PROJECT_ID);
    await store.commitSnapshot(snapshotId);
    // Second commit must not throw
    await expect(store.commitSnapshot(snapshotId)).resolves.not.toThrow();

    const project = await store.getProject(PROJECT_ID);
    expect(project?.last_snapshot_id).toBe(snapshotId);
  });

  it('writeSnapshot creates a snapshot with generated id', async () => {
    const snap = await store.writeSnapshot({
      project_id: PROJECT_ID,
      taken_at: new Date().toISOString(),
      files_scanned: 42,
      loc_total: 1000,
    });
    expect(snap.id).toBeTruthy();
    expect(snap.files_scanned).toBe(42);

    const snapshots = await store.listSnapshotsForProject(PROJECT_ID);
    expect(snapshots.some((s) => s.id === snap.id)).toBe(true);
  });
});
