/**
 * ProvenanceKB — round-trip + aggregation tests (v1.49.607 W1 Track B).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { applyMigrations } from '../migrations.js';
import { ProvenanceKB } from '../provenance.js';
import type { SnapshotId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let tmpDir: string;
let db: Database.Database;
let kb: ProvenanceKB;

const SNAP: SnapshotId = 'snap-prov-1';

function insertFilesChanged(opts: {
  id: string;
  mission: string;
  sha: string;
  path: string;
  kind?: 'A' | 'M' | 'D' | 'R';
  rename_from?: string | null;
  added?: number;
  removed?: number;
}): void {
  db.prepare(
    `INSERT INTO files_changed
       (id, mission_id, commit_sha, file_path, change_kind,
        rename_from, added_lines, removed_lines)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opts.id,
    opts.mission,
    opts.sha,
    opts.path,
    opts.kind ?? 'M',
    opts.rename_from ?? null,
    opts.added ?? 0,
    opts.removed ?? 0,
  );
}

function insertProvenance(opts: {
  id: string;
  file: string;
  line: number;
  mission: string;
  sha: string;
  weight?: number;
  snapshot?: string;
}): void {
  db.prepare(
    `INSERT INTO mission_provenance
       (id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opts.id,
    opts.snapshot ?? SNAP,
    opts.file,
    opts.line,
    opts.mission,
    opts.sha,
    opts.weight ?? 1.0,
  );
}

describe('intelligence/kb — ProvenanceKB', () => {
  // Hook timeout bumped to 60s (= root-project testTimeout). sqlite WAL pragma +
  // migration is fsync-bound and flakes under full-suite contention; isolated
  // runtime is ~50ms. Canonical pattern: c6d49d8ab (connection-caching).
  // Discipline doc: .planning/test-discipline/fragile-test-pattern.md (Template 2).
  beforeEach(() => {
    tmpDir = join(
      tmpdir(),
      `gsd-prov-kb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    db = new Database(join(tmpDir, 'atlas.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    applyMigrations(db, MIGRATIONS_DIR);
    kb = new ProvenanceKB(db);
  }, 60_000);

  afterEach(() => {
    db.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('listFilesChangedByMission returns rows for the requested mission only', () => {
    insertFilesChanged({ id: 'fc1', mission: 'M-A', sha: 'sha1', path: 'src/a.ts', added: 5 });
    insertFilesChanged({ id: 'fc2', mission: 'M-A', sha: 'sha2', path: 'src/b.ts', added: 3 });
    insertFilesChanged({ id: 'fc3', mission: 'M-B', sha: 'sha3', path: 'src/c.ts', added: 1 });

    const result = kb.listFilesChangedByMission('M-A');
    expect(result.length).toBe(2);
    expect(result.every((r) => r.mission_id === 'M-A')).toBe(true);
    expect(result.map((r) => r.file_path).sort()).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('listFilesChangedByMission preserves rename_from for change_kind=R', () => {
    insertFilesChanged({
      id: 'fc-rename',
      mission: 'M-X',
      sha: 'sha-rename',
      path: 'src/new.ts',
      kind: 'R',
      rename_from: 'src/old.ts',
    });
    const result = kb.listFilesChangedByMission('M-X');
    expect(result.length).toBe(1);
    expect(result[0].change_kind).toBe('R');
    expect(result[0].rename_from).toBe('src/old.ts');
  });

  it('listMissionsForFile aggregates weight + line_count grouped by mission', () => {
    // Mission A touches 3 lines (sole attribution)
    insertProvenance({ id: 'p1', file: 'src/a.ts', line: 1, mission: 'M-A', sha: 'sha1', weight: 1.0 });
    insertProvenance({ id: 'p2', file: 'src/a.ts', line: 2, mission: 'M-A', sha: 'sha1', weight: 1.0 });
    insertProvenance({ id: 'p3', file: 'src/a.ts', line: 3, mission: 'M-A', sha: 'sha1', weight: 1.0 });
    // Mission B shares line 4 50/50 with mission C
    insertProvenance({ id: 'p4', file: 'src/a.ts', line: 4, mission: 'M-B', sha: 'sha2', weight: 0.5 });
    insertProvenance({ id: 'p5', file: 'src/a.ts', line: 4, mission: 'M-C', sha: 'sha3', weight: 0.5 });
    // Mission D in a different file — should not appear
    insertProvenance({ id: 'p6', file: 'src/b.ts', line: 1, mission: 'M-D', sha: 'sha4', weight: 1.0 });

    const result = kb.listMissionsForFile(SNAP, 'src/a.ts');
    expect(result.length).toBe(3);
    const byId = Object.fromEntries(result.map((r) => [r.mission_id, r]));
    expect(byId['M-A'].weight).toBe(3);
    expect(byId['M-A'].line_count).toBe(3);
    expect(byId['M-B'].weight).toBe(0.5);
    expect(byId['M-B'].line_count).toBe(1);
    expect(byId['M-C'].weight).toBe(0.5);
    // Highest-weight mission first
    expect(result[0].mission_id).toBe('M-A');
  });

  it('listMissionsForFile returns empty array for an unknown file', () => {
    insertProvenance({ id: 'p1', file: 'src/a.ts', line: 1, mission: 'M-A', sha: 'sha1' });
    const result = kb.listMissionsForFile(SNAP, 'src/nope.ts');
    expect(result).toEqual([]);
  });

  it('listProvenanceForLine returns every mission attributing the same line', () => {
    insertProvenance({ id: 'p1', file: 'src/a.ts', line: 7, mission: 'M-A', sha: 'sha1', weight: 0.5 });
    insertProvenance({ id: 'p2', file: 'src/a.ts', line: 7, mission: 'M-B', sha: 'sha2', weight: 0.3 });
    insertProvenance({ id: 'p3', file: 'src/a.ts', line: 7, mission: 'M-C', sha: 'sha3', weight: 0.2 });
    insertProvenance({ id: 'p4', file: 'src/a.ts', line: 8, mission: 'M-A', sha: 'sha1', weight: 1.0 });

    const result = kb.listProvenanceForLine(SNAP, 'src/a.ts', 7);
    expect(result.length).toBe(3);
    expect(result[0].mission_id).toBe('M-A'); // ordered DESC by weight
    expect(result[0].weight).toBe(0.5);
    expect(result.map((r) => r.line_no)).toEqual([7, 7, 7]);
  });

  it('prepared statements are reused across repeated calls', () => {
    insertProvenance({ id: 'p1', file: 'src/a.ts', line: 1, mission: 'M-A', sha: 'sha1' });
    expect(kb.preparedStatementCount()).toBe(0);
    kb.listFilesChangedByMission('M-A');
    expect(kb.preparedStatementCount()).toBe(1);
    kb.listMissionsForFile(SNAP, 'src/a.ts');
    expect(kb.preparedStatementCount()).toBe(2);
    kb.listProvenanceForLine(SNAP, 'src/a.ts', 1);
    expect(kb.preparedStatementCount()).toBe(3);

    // Repeated calls must not increase the cache
    kb.listFilesChangedByMission('M-A');
    kb.listMissionsForFile(SNAP, 'src/a.ts');
    kb.listProvenanceForLine(SNAP, 'src/a.ts', 1);
    expect(kb.preparedStatementCount()).toBe(3);
  });

  it('mission_provenance rows are scoped by snapshot_id', () => {
    insertProvenance({ id: 'p1', file: 'src/a.ts', line: 1, mission: 'M-A', sha: 'sha1', snapshot: 'snap-old' });
    insertProvenance({ id: 'p2', file: 'src/a.ts', line: 1, mission: 'M-B', sha: 'sha2', snapshot: SNAP });

    const current = kb.listProvenanceForLine(SNAP, 'src/a.ts', 1);
    expect(current.length).toBe(1);
    expect(current[0].mission_id).toBe('M-B');

    const old = kb.listProvenanceForLine('snap-old' as SnapshotId, 'src/a.ts', 1);
    expect(old.length).toBe(1);
    expect(old[0].mission_id).toBe('M-A');
  });
});
