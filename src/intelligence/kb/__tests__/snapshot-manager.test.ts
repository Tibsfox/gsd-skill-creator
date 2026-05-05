/**
 * C05 — SnapshotManager tests covering T1-T6.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';
import { SnapshotManager } from '../snapshots.js';
import type { ProjectId, SnapshotId, FindingId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_ID: ProjectId = 'sm-test-project';
let tmpDir: string;
let store: KBStore;
let sm: SnapshotManager;

async function setup() {
  store = new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
  await store.ensureRegistry();
  await store.registerProject({
    id: PROJECT_ID,
    name: 'Snapshot Manager Test',
    path: join(tmpDir, 'sm-project'),
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await store.ensureProjectDB(PROJECT_ID);
  sm = new SnapshotManager({ kb: store });
}

async function makeCommittedSnapshot(daysAgo: number): Promise<SnapshotId> {
  const taken_at = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  const snap = await store.writeSnapshot({
    project_id: PROJECT_ID,
    taken_at,
    files_scanned: 10,
    loc_total: 1000,
  });
  return snap.id;
}

describe('intelligence/kb — SnapshotManager (C05)', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-sm-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setup();
  }, 30000);

  afterEach(() => {
    try { store.close(); } catch { /* ignore */ }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── T1: Migration v2 ────────────────────────────────────────────────

  it('T1: migration v2 creates snapshot_diffs table', async () => {
    const pdb = await store.getProjectRawDB(PROJECT_ID);
    const tables = (
      pdb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    ).map((r) => r.name);
    expect(tables).toContain('snapshot_diffs');
    expect(tables).toContain('file_metrics');
  });

  it('T1: schema_version shows version ≥ 2 after migration', async () => {
    // v1.49.607 added migration 003 (atlas symbols) on top of v2. The
    // snapshot-manager still depends only on v2-and-earlier tables; assert
    // migrations have advanced past the v2 boundary.
    const pdb = await store.getProjectRawDB(PROJECT_ID);
    const rows = pdb
      .prepare('SELECT MAX(version) AS v FROM schema_version')
      .all() as Array<{ v: number }>;
    expect(rows[0].v).toBeGreaterThanOrEqual(2);
  });

  // ─── T2: Snapshot lifecycle ───────────────────────────────────────────

  it('T2: newestSnapshot returns most recent', async () => {
    const s1 = await makeCommittedSnapshot(5);
    const s2 = await makeCommittedSnapshot(1);
    const s3 = await makeCommittedSnapshot(10);

    const newest = await sm.newestSnapshot(PROJECT_ID);
    expect(newest).toBe(s2);
  });

  it('T2: newestSnapshot returns null for project with no snapshots', async () => {
    const result = await sm.newestSnapshot(PROJECT_ID);
    expect(result).toBeNull();
  });

  it('T2: previousSnapshot returns snapshot before given', async () => {
    const s1 = await makeCommittedSnapshot(15);
    const s2 = await makeCommittedSnapshot(10);
    const s3 = await makeCommittedSnapshot(5);
    const s4 = await makeCommittedSnapshot(1);

    // Previous before s3 should be s2
    const prev = await sm.previousSnapshot(PROJECT_ID, s3);
    expect(prev).toBe(s2);
  });

  it('T2: listSnapshots returns all in DESC order', async () => {
    const s1 = await makeCommittedSnapshot(10);
    const s2 = await makeCommittedSnapshot(5);
    const s3 = await makeCommittedSnapshot(1);

    const list = await sm.listSnapshots(PROJECT_ID);
    expect(list.length).toBe(3);
    expect(list[0].id).toBe(s3);
    expect(list[2].id).toBe(s1);
  });

  it('T2: listSnapshots respects limit', async () => {
    for (let i = 10; i >= 1; i--) await makeCommittedSnapshot(i);
    const list = await sm.listSnapshots(PROJECT_ID, 3);
    expect(list.length).toBe(3);
  });

  it('T2: pruneOlderThan(7) keeps 7 newest regardless of date', async () => {
    // Create 10 snapshots: most recent 7 should survive
    for (let i = 30; i >= 1; i--) await makeCommittedSnapshot(i);
    const pruned = await sm.pruneOlderThan(PROJECT_ID, 7);

    const remaining = await sm.listSnapshots(PROJECT_ID);
    expect(remaining.length).toBe(7);
    // The newest 7 should have survived (days 1-7)
    const latestDays = remaining.map((s) => {
      const age = (Date.now() - new Date(s.taken_at).getTime()) / 86_400_000;
      return Math.round(age);
    }).sort((a, b) => a - b);
    expect(latestDays[0]).toBeLessThanOrEqual(7);
  });

  it('T2: pruneOlderThan keeps latest snapshot always', async () => {
    const only = await makeCommittedSnapshot(0);
    const pruned = await sm.pruneOlderThan(PROJECT_ID, 7);
    expect(pruned).toBe(0);
    const remaining = await sm.listSnapshots(PROJECT_ID);
    expect(remaining.length).toBe(1);
  });

  it('T2: 1 snapshot total → pruning is no-op', async () => {
    await makeCommittedSnapshot(30);
    const pruned = await sm.pruneOlderThan(PROJECT_ID, 7);
    expect(pruned).toBe(0);
  });

  it('T2: 5 snapshots; previousSnapshot(snap3) returns snap4 (older)', async () => {
    // snaps array created oldest-first:
    // snaps[0] = 5 days ago (oldest)
    // snaps[1] = 4 days ago
    // snaps[2] = 3 days ago
    // snaps[3] = 2 days ago
    // snaps[4] = 1 day ago (newest)
    const snaps: SnapshotId[] = [];
    for (let i = 5; i >= 1; i--) snaps.push(await makeCommittedSnapshot(i));
    // previousSnapshot(snaps[2]) → should return snaps[1] (4 days ago, one step older than snaps[2])
    // listSnapshots returns DESC: [snaps[4], snaps[3], snaps[2], snaps[1], snaps[0]]
    // previousSnapshot(snaps[2]) finds snaps[2] at index 2, returns index 3 = snaps[1]
    const prev = await sm.previousSnapshot(PROJECT_ID, snaps[2]);
    expect(prev).toBe(snaps[1]);
  });

  // ─── T3: Diff algorithm ───────────────────────────────────────────────

  it('T3: identical snapshots → empty diff', async () => {
    const s1 = await makeCommittedSnapshot(5);
    const diff = await sm.diff(s1, s1);
    expect(diff.filesAdded).toHaveLength(0);
    expect(diff.filesDeleted).toHaveLength(0);
    expect(diff.filesModified).toHaveLength(0);
    expect(diff.findingsAdded).toHaveLength(0);
    expect(diff.findingsResolved).toHaveLength(0);
    expect(diff.findingsChanged).toHaveLength(0);
  });

  it('T3: snapshot B = A + new finding in new file → filesAdded + findingsAdded', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFindings(s1, PROJECT_ID, [
      {
        id: 'F-s1-1' as FindingId,
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.8,
        title: 'Old finding',
        rationale: 'test',
        source_path: 'src/old.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s1,
        status: 'open',
      },
    ]);

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFindings(s2, PROJECT_ID, [
      {
        id: 'F-s1-1' as FindingId, // same finding still exists
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.8,
        title: 'Old finding',
        rationale: 'test',
        source_path: 'src/old.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s2,
        status: 'open',
      },
      {
        id: 'F-s2-new' as FindingId,
        project_id: PROJECT_ID,
        kind: 'hot_spot',
        severity: 'high',
        confidence: 0.9,
        title: 'New finding',
        rationale: 'test',
        source_path: 'src/new-file.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s2,
        status: 'open',
      },
    ]);

    const diff = await sm.diff(s1, s2);
    expect(diff.filesAdded).toContain('src/new-file.ts');
    expect(diff.findingsAdded.some((f) => f.id === 'F-s2-new')).toBe(true);
  });

  it('T3: snapshot B = A − deleted finding → findingsResolved + filesDeleted', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFindings(s1, PROJECT_ID, [
      {
        id: 'F-old-1' as FindingId,
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.7,
        title: 'Old',
        rationale: 'test',
        source_path: 'src/deleted.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s1,
        status: 'open',
      },
    ]);

    const s2 = await makeCommittedSnapshot(1);
    // s2 has no findings — the old file was deleted

    const diff = await sm.diff(s1, s2);
    expect(diff.findingsResolved.some((f) => f.id === 'F-old-1')).toBe(true);
    expect(diff.filesDeleted).toContain('src/deleted.ts');
  });

  it('T3: confidence delta < 0.1 → not in findingsChanged', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFindings(s1, PROJECT_ID, [
      {
        id: 'F-conf-s1-1' as FindingId, // unique ID per snapshot
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.700,
        title: 'Conf finding',
        rationale: 'test',
        source_path: 'src/conf.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s1,
        status: 'open',
      },
    ]);

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFindings(s2, PROJECT_ID, [
      {
        id: 'F-conf-s2-1' as FindingId, // different id, same findingKey (path|kind|start)
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.709, // delta < 0.1 — should NOT appear in changed
        title: 'Conf finding',
        rationale: 'test',
        source_path: 'src/conf.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s2,
        status: 'open',
      },
    ]);

    const diff = await sm.diff(s1, s2);
    expect(diff.findingsChanged).toHaveLength(0);
  });

  it('T3: confidence delta > 0.1 → in findingsChanged', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFindings(s1, PROJECT_ID, [
      {
        id: 'F-conf2-s1-1' as FindingId,
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.5,
        title: 'Conf finding 2',
        rationale: 'test',
        source_path: 'src/conf2.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s1,
        status: 'open',
      },
    ]);

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFindings(s2, PROJECT_ID, [
      {
        id: 'F-conf2-s2-1' as FindingId, // different id, same findingKey
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.8, // delta > 0.1
        title: 'Conf finding 2',
        rationale: 'test',
        source_path: 'src/conf2.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s2,
        status: 'open',
      },
    ]);

    const diff = await sm.diff(s1, s2);
    // findingsChanged contains entry where fromFinding has the s1 id
    expect(diff.findingsChanged.some((fc) => fc.fromFinding.id === 'F-conf2-s1-1')).toBe(true);
  });

  it('T3: severity changed → in findingsChanged', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFindings(s1, PROJECT_ID, [
      {
        id: 'F-sev-s1-1' as FindingId,
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.8,
        title: 'Severity finding',
        rationale: 'test',
        source_path: 'src/sev.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s1,
        status: 'open',
      },
    ]);

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFindings(s2, PROJECT_ID, [
      {
        id: 'F-sev-s2-1' as FindingId, // different id, same findingKey
        project_id: PROJECT_ID,
        kind: 'dead_code',
        severity: 'high', // changed severity
        confidence: 0.8,
        title: 'Severity finding',
        rationale: 'test',
        source_path: 'src/sev.ts',
        produced_by: 'analyzer',
        produced_at: new Date().toISOString(),
        snapshot_id: s2,
        status: 'open',
      },
    ]);

    const diff = await sm.diff(s1, s2);
    expect(diff.findingsChanged.some((fc) => fc.fromFinding.id === 'F-sev-s1-1')).toBe(true);
  });

  // ─── T4: Diff cache ───────────────────────────────────────────────────

  it('T4: first diff call computes; second call returns cached (faster)', async () => {
    const s1 = await makeCommittedSnapshot(5);
    const s2 = await makeCommittedSnapshot(1);

    const t0 = performance.now();
    const diff1 = await sm.diff(s1, s2);
    const firstCallMs = performance.now() - t0;

    const t1 = performance.now();
    const diff2 = await sm.diff(s1, s2);
    const secondCallMs = performance.now() - t1;

    // Results must be identical
    expect(diff2.fromSnapshot).toBe(diff1.fromSnapshot);
    expect(diff2.toSnapshot).toBe(diff1.toSnapshot);

    // Second call must be faster (cache hit)
    expect(secondCallMs).toBeLessThan(10);
  });

  it('T4: diffSinceLast returns diff between previous and newest', async () => {
    const s1 = await makeCommittedSnapshot(5);
    const s2 = await makeCommittedSnapshot(1);

    const diff = await sm.diffSinceLast(PROJECT_ID);
    expect(diff).not.toBeNull();
    expect(diff?.fromSnapshot).toBe(s1);
    expect(diff?.toSnapshot).toBe(s2);
  });

  it('T4: diffSinceLast returns null if fewer than 2 snapshots', async () => {
    const result = await sm.diffSinceLast(PROJECT_ID);
    expect(result).toBeNull();
  });

  // ─── T5: Structural change detection ─────────────────────────────────

  it('T5: file with new export between snapshots → exportsAdded', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFileMetrics(s1, PROJECT_ID, 'src/module.ts',
      ['exportA'],
      ['importX'],
      ['funcFoo(a: string)'],
    );

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFileMetrics(s2, PROJECT_ID, 'src/module.ts',
      ['exportA', 'exportB'], // new export
      ['importX'],
      ['funcFoo(a: string)'],
    );

    const change = await sm.structuralChange('src/module.ts', s1, s2);
    expect(change.exportsAdded).toContain('exportB');
    expect(change.exportsRemoved).toHaveLength(0);
  });

  it('T5: function with new arg → signaturesChanged', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFileMetrics(s1, PROJECT_ID, 'src/func.ts',
      ['myFunc'],
      [],
      ['myFunc(a: string)'],
    );

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFileMetrics(s2, PROJECT_ID, 'src/func.ts',
      ['myFunc'],
      [],
      ['myFunc(a: string, b: number)'], // signature changed
    );

    const change = await sm.structuralChange('src/func.ts', s1, s2);
    expect(change.signaturesChanged).toContain('myFunc');
  });

  it('T5: no structural change → all arrays empty', async () => {
    const s1 = await makeCommittedSnapshot(5);
    await store.writeFileMetrics(s1, PROJECT_ID, 'src/same.ts',
      ['exportA'],
      ['importX'],
      ['funcBar(x: number)'],
    );

    const s2 = await makeCommittedSnapshot(1);
    await store.writeFileMetrics(s2, PROJECT_ID, 'src/same.ts',
      ['exportA'],
      ['importX'],
      ['funcBar(x: number)'],
    );

    const change = await sm.structuralChange('src/same.ts', s1, s2);
    expect(change.exportsAdded).toHaveLength(0);
    expect(change.exportsRemoved).toHaveLength(0);
    expect(change.signaturesChanged).toHaveLength(0);
  });

  // ─── T6: Performance ──────────────────────────────────────────────────

  it('T6: diff on 100K-LOC fixture completes in <2s', async () => {
    const s1 = await makeCommittedSnapshot(5);
    const s2 = await makeCommittedSnapshot(1);

    // Seed 5000 findings per snapshot to simulate 100K-LOC project
    const batchSize = 250;
    for (let b = 0; b < 20; b++) {
      const fs1 = Array.from({ length: batchSize }, (_, i) => ({
        id: `F-s1-${b}-${i}` as FindingId,
        project_id: PROJECT_ID,
        kind: 'dead_code' as const,
        severity: 'low' as const,
        confidence: 0.6,
        title: `Finding ${b}-${i}`,
        rationale: 'test',
        source_path: `src/module${b}/file${i % 10}.ts`,
        produced_by: 'analyzer' as const,
        produced_at: new Date().toISOString(),
        snapshot_id: s1,
        status: 'open' as const,
      }));
      await store.writeFindings(s1, PROJECT_ID, fs1);
    }

    for (let b = 0; b < 20; b++) {
      const fs2 = Array.from({ length: batchSize }, (_, i) => ({
        id: `F-s2-${b}-${i}` as FindingId,
        project_id: PROJECT_ID,
        kind: 'dead_code' as const,
        severity: 'low' as const,
        confidence: 0.6,
        title: `Finding ${b}-${i}`,
        rationale: 'test',
        source_path: `src/module${b}/file${i % 10}.ts`,
        produced_by: 'analyzer' as const,
        produced_at: new Date().toISOString(),
        snapshot_id: s2,
        status: 'open' as const,
      }));
      await store.writeFindings(s2, PROJECT_ID, fs2);
    }

    const start = performance.now();
    const diff = await sm.diff(s1, s2);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  }, 30000);
});
