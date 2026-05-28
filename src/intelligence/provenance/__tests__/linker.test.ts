/**
 * Linker — integration tests over fixture git repos (v1.49.607 W1 Track B).
 *
 * Each test spins up a fresh repo in os.tmpdir() via spawnSync('git', …),
 * commits a small file history, links commits to fake mission_links rows,
 * runs the ProvenanceLinker, and asserts on the resulting DB rows.
 *
 * Compromise: these tests REQUIRE git to be on PATH; the test author
 * verified `git` is a baseline tool on every supported platform (the
 * pre-tag-gate already shells out to git). If git is missing the tests
 * skip via the early exit in the helper.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { applyMigrations } from '../../kb/migrations.js';
import {
  ProvenanceLinker,
  parseGitLogNameStatusNumstat,
} from '../linker.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

function gitInit(repoDir: string): void {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'T',
    GIT_AUTHOR_EMAIL: 't@example.com',
    GIT_COMMITTER_NAME: 'T',
    GIT_COMMITTER_EMAIL: 't@example.com',
  };
  function g(args: string[]) {
    const r = spawnSync('git', args, { cwd: repoDir, env, encoding: 'utf-8' });
    if (r.status !== 0) {
      throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
    }
    return r;
  }
  g(['init', '-q', '-b', 'main']);
  g(['config', 'user.email', 't@example.com']);
  g(['config', 'user.name', 'T']);
  g(['config', 'commit.gpgsign', 'false']);
}

function gitCommit(repoDir: string, message: string, files: Record<string, string>): string {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'T',
    GIT_AUTHOR_EMAIL: 't@example.com',
    GIT_COMMITTER_NAME: 'T',
    GIT_COMMITTER_EMAIL: 't@example.com',
  };
  for (const [path, content] of Object.entries(files)) {
    const abs = join(repoDir, path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
  }
  const add = spawnSync('git', ['add', '.'], { cwd: repoDir, env, encoding: 'utf-8' });
  if (add.status !== 0) throw new Error(`git add failed: ${add.stderr}`);
  const commit = spawnSync(
    'git',
    ['commit', '-q', '--no-gpg-sign', '-m', message],
    { cwd: repoDir, env, encoding: 'utf-8' },
  );
  if (commit.status !== 0) throw new Error(`git commit failed: ${commit.stderr}`);
  const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, env, encoding: 'utf-8' });
  return (sha.stdout ?? '').trim();
}

function gitAvailable(): boolean {
  const r = spawnSync('git', ['--version'], { encoding: 'utf-8' });
  return r.status === 0;
}

function setupKBSchema(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applyMigrations(db, MIGRATIONS_DIR);
  return db;
}

/** Insert a minimal decision row + mission_link so resolveMissionCommits works. */
function insertMissionLink(
  db: Database.Database,
  decisionId: string,
  meetingId: string,
  artifactKind: string,
  artifactRef: string,
): void {
  // Need a parent meeting (FK from decisions → meetings) and a project for
  // the meeting to satisfy the v1 schema. Simplest path: insert minimal
  // placeholder rows directly, mirroring KBStore's bootstrap.
  db.prepare(
    `INSERT OR IGNORE INTO projects (id, name, path, kind, priority, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run('proj-1', 'P', '/tmp/p', 'code', 'med', new Date().toISOString());
  db.prepare(
    `INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, files_scanned, loc_total)
     VALUES (?, ?, ?, ?, ?)`,
  ).run('snap-bootstrap', 'proj-1', new Date().toISOString(), 0, 0);
  db.prepare(
    `INSERT OR IGNORE INTO meetings
       (id, project_id, started_at, committed_at, status, kb_snapshot, briefing_at_start)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(meetingId, 'proj-1', new Date().toISOString(), null, 'in_session', 'snap-bootstrap', null);
  db.prepare(
    `INSERT OR IGNORE INTO decisions
       (id, meeting_id, kind, state, ai_draft_title, ai_draft_body,
        developer_modifications, source_findings, source_move_rank,
        approved_at, emitted_at, emission_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(decisionId, meetingId, 'analysis_run', 'pending', null, null, '[]', '[]', null, null, null, null);
  db.prepare(
    `INSERT INTO mission_links (decision_id, artifact_kind, artifact_ref, recorded_at)
     VALUES (?, ?, ?, ?)`,
  ).run(decisionId, artifactKind, artifactRef, new Date().toISOString());
}

let tmpDir: string;
let repoDir: string;
let db: Database.Database;

const HAVE_GIT = gitAvailable();

describe('ProvenanceLinker — integration', () => {
  // Hook timeout bumped to 60s (= root-project testTimeout). setupKBSchema calls
  // applyMigrations which is fsync-bound and flakes under full-suite contention.
  // Canonical pattern: c6d49d8ab (connection-caching).
  // Discipline doc: .planning/test-discipline/fragile-test-pattern.md (Template 2).
  beforeEach(() => {
    tmpDir = join(
      tmpdir(),
      `gsd-linker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    repoDir = join(tmpDir, 'repo');
    mkdirSync(repoDir, { recursive: true });
    db = setupKBSchema(join(tmpDir, 'atlas.db'));
  }, 60_000);

  afterEach(() => {
    db.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it.skipIf(!HAVE_GIT)('writes files_changed + mission_provenance for a 2-commit history', () => {
    gitInit(repoDir);
    const sha1 = gitCommit(repoDir, 'feat: add a.ts', { 'src/a.ts': 'line-1\nline-2\nline-3\n' });
    const sha2 = gitCommit(repoDir, 'feat: extend a.ts', {
      'src/a.ts': 'line-1\nline-2\nline-3\nline-4\n',
    });

    insertMissionLink(db, 'D-mission-1', 'M-1', 'commit_sha', sha1);
    insertMissionLink(db, 'D-mission-2', 'M-2', 'commit_sha', sha2);

    const linker = new ProvenanceLinker(db);
    const result = linker.run({
      project_dir: repoDir,
      snapshot_id: 'snap-test-1',
      file_paths: ['src/a.ts'],
    });

    expect(result.missions_seen).toBe(2);
    expect(result.files_blamed).toBe(1);
    expect(result.provenance_inserted).toBe(4); // 4 lines, sole-attribution

    const provRows = db
      .prepare('SELECT * FROM mission_provenance WHERE snapshot_id = ? ORDER BY line_no')
      .all('snap-test-1') as Array<{ line_no: number; mission_id: string; weight: number; commit_sha: string }>;
    expect(provRows.length).toBe(4);
    // Lines 1-3 attributed to mission-1 (sha1), line 4 to mission-2 (sha2).
    expect(provRows[0].mission_id).toBe('D-mission-1');
    expect(provRows[3].mission_id).toBe('D-mission-2');
    expect(provRows.every((r) => r.weight === 1.0)).toBe(true);

    const fcRows = db
      .prepare('SELECT * FROM files_changed ORDER BY commit_sha')
      .all() as Array<{ mission_id: string; file_path: string; change_kind: string }>;
    expect(fcRows.length).toBeGreaterThanOrEqual(2);
    expect(fcRows.every((r) => r.file_path === 'src/a.ts')).toBe(true);
  });

  it.skipIf(!HAVE_GIT)('split-attributes a line touched by two missions claiming the same sha', () => {
    gitInit(repoDir);
    const sha1 = gitCommit(repoDir, 'feat: add', { 'src/a.ts': 'x\n' });
    insertMissionLink(db, 'D-A', 'M-A', 'commit_sha', sha1);
    insertMissionLink(db, 'D-B', 'M-B', 'commit_sha', sha1);

    const linker = new ProvenanceLinker(db);
    const result = linker.run({ project_dir: repoDir, snapshot_id: 'snap-split', file_paths: ['src/a.ts'] });
    expect(result.provenance_inserted).toBe(2);

    const rows = db
      .prepare('SELECT mission_id, weight FROM mission_provenance ORDER BY mission_id')
      .all() as Array<{ mission_id: string; weight: number }>;
    expect(rows.map((r) => r.mission_id)).toEqual(['D-A', 'D-B']);
    for (const r of rows) {
      expect(r.weight).toBeCloseTo(0.5, 10);
    }
  });

  it.skipIf(!HAVE_GIT)('emits zero provenance rows when no commits are attributed', () => {
    gitInit(repoDir);
    gitCommit(repoDir, 'feat: add', { 'src/a.ts': 'unattributed\n' });
    // No mission_links rows → no missions resolved.

    const linker = new ProvenanceLinker(db);
    const result = linker.run({ project_dir: repoDir, snapshot_id: 'snap-empty', file_paths: ['src/a.ts'] });
    expect(result.missions_seen).toBe(0);
    expect(result.provenance_inserted).toBe(0);
    expect(result.files_changed_inserted).toBe(0);
  });

  it.skipIf(!HAVE_GIT)('clearSnapshotProvenance removes all provenance rows for the snapshot', () => {
    gitInit(repoDir);
    const sha1 = gitCommit(repoDir, 'feat: add a.ts', { 'src/a.ts': 'line1\n' });
    insertMissionLink(db, 'D-clear-1', 'M-clear-1', 'commit_sha', sha1);

    const linker = new ProvenanceLinker(db);
    linker.run({ project_dir: repoDir, snapshot_id: 'snap-clear', file_paths: ['src/a.ts'] });

    const before = db.prepare('SELECT COUNT(*) as n FROM mission_provenance WHERE snapshot_id = ?').get('snap-clear') as { n: number };
    expect(before.n).toBeGreaterThan(0);

    linker.clearSnapshotProvenance('snap-clear');
    const after = db.prepare('SELECT COUNT(*) as n FROM mission_provenance WHERE snapshot_id = ?').get('snap-clear') as { n: number };
    expect(after.n).toBe(0);
  });

  it.skipIf(!HAVE_GIT)('clearSnapshotProvenance is idempotent — calling twice does not error', () => {
    gitInit(repoDir);
    const sha1 = gitCommit(repoDir, 'feat: add a.ts', { 'src/a.ts': 'line1\n' });
    insertMissionLink(db, 'D-idem-1', 'M-idem-1', 'commit_sha', sha1);

    const linker = new ProvenanceLinker(db);
    linker.run({ project_dir: repoDir, snapshot_id: 'snap-idem', file_paths: ['src/a.ts'] });

    expect(() => linker.clearSnapshotProvenance('snap-idem')).not.toThrow();
    expect(() => linker.clearSnapshotProvenance('snap-idem')).not.toThrow();
    const after = db.prepare('SELECT COUNT(*) as n FROM mission_provenance WHERE snapshot_id = ?').get('snap-idem') as { n: number };
    expect(after.n).toBe(0);
  });

  it.skipIf(!HAVE_GIT)("replace mode produces the same final state regardless of how many times invoked", () => {
    gitInit(repoDir);
    const sha1 = gitCommit(repoDir, 'feat: add a.ts', { 'src/a.ts': 'line1\nline2\n' });
    insertMissionLink(db, 'D-rep-1', 'M-rep-1', 'commit_sha', sha1);

    const linker = new ProvenanceLinker(db);
    const cfg = { project_dir: repoDir, snapshot_id: 'snap-rep', file_paths: ['src/a.ts'] };

    const r1 = linker.run(cfg, { mode: 'replace' });
    const r2 = linker.run(cfg, { mode: 'replace' });
    const r3 = linker.run(cfg, { mode: 'replace' });

    // All three runs produced the same count — 'replace' cleared before each write.
    expect(r1.provenance_inserted).toBe(r2.provenance_inserted);
    expect(r2.provenance_inserted).toBe(r3.provenance_inserted);

    const finalCount = db.prepare('SELECT COUNT(*) as n FROM mission_provenance WHERE snapshot_id = ?').get('snap-rep') as { n: number };
    expect(finalCount.n).toBe(r1.provenance_inserted);
  });

  it('parseGitLogNameStatusNumstat parses interleaved numstat + name-status output', () => {
    const sha = '1'.repeat(40);
    const stdout = [
      sha,
      '5\t2\tsrc/a.ts',
      '0\t3\tsrc/b.ts',
      'M\tsrc/a.ts',
      'D\tsrc/b.ts',
      '',
    ].join('\n');
    const result = parseGitLogNameStatusNumstat(stdout);
    expect(result.length).toBe(2);
    const a = result.find((r) => r.file_path === 'src/a.ts')!;
    const b = result.find((r) => r.file_path === 'src/b.ts')!;
    expect(a.change_kind).toBe('M');
    expect(a.added_lines).toBe(5);
    expect(a.removed_lines).toBe(2);
    expect(b.change_kind).toBe('D');
    expect(b.removed_lines).toBe(3);
  });

  it('parseGitLogNameStatusNumstat captures rename rows with rename_from', () => {
    const sha = '2'.repeat(40);
    const stdout = [
      sha,
      '4\t4\tsrc/new.ts',
      'R100\tsrc/old.ts\tsrc/new.ts',
      '',
    ].join('\n');
    const result = parseGitLogNameStatusNumstat(stdout);
    expect(result.length).toBe(1);
    expect(result[0].change_kind).toBe('R');
    expect(result[0].rename_from).toBe('src/old.ts');
    expect(result[0].file_path).toBe('src/new.ts');
    expect(result[0].added_lines).toBe(4);
  });
});

describe('ProvenanceLinker — ProcessContext wire (v1.49.860)', () => {
  it('throws ProcessContextDenied when ctx denies git spawn via resolveMissionCommits', async () => {
    const { resolveMissionCommits } = await import('../linker.js');
    const {
      ProcessContextDenied,
      CapturingProcessAuditSink,
    } = await import('../../../security/process-context.js');
    const db = new Database(':memory:');
    applyMigrations(db, MIGRATIONS_DIR);
    // Disable FKs so we can seed a mission_links row without the full
    // meetings + decisions chain (the wire test only exercises git invocation).
    db.pragma('foreign_keys = OFF');
    db.prepare(
      "INSERT INTO mission_links (decision_id, artifact_kind, artifact_ref, recorded_at) VALUES ('m1', 'commit_range', 'HEAD~1..HEAD', '2026-05-28T00:00:00Z')",
    ).run();
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx = { allowList: [], audit: sink };
    expect(() => resolveMissionCommits(db, '/tmp', restrictiveCtx)).toThrow(
      ProcessContextDenied,
    );
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe('git');
    expect(sink.records[0]?.allowed).toBe(false);
    db.close();
  });

  it('returns empty array when ctx is undefined and no mission_links exist (backward-compat)', async () => {
    const { resolveMissionCommits } = await import('../linker.js');
    const db = new Database(':memory:');
    applyMigrations(db, MIGRATIONS_DIR);
    const result = resolveMissionCommits(db, '/tmp');
    expect(result).toEqual([]);
    db.close();
  });

  it('propagates ProcessContextDenied through ProvenanceLinker.run', async () => {
    const {
      ProcessContextDenied,
      CapturingProcessAuditSink,
    } = await import('../../../security/process-context.js');
    const db = new Database(':memory:');
    applyMigrations(db, MIGRATIONS_DIR);
    db.pragma('foreign_keys = OFF');
    db.prepare(
      "INSERT INTO mission_links (decision_id, artifact_kind, artifact_ref, recorded_at) VALUES ('m1', 'commit_range', 'HEAD~1..HEAD', '2026-05-28T00:00:00Z')",
    ).run();
    const linker = new ProvenanceLinker(db);
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx = { allowList: [], audit: sink };
    expect(() =>
      linker.run(
        { snapshot_id: 's1', project_dir: '/tmp', file_paths: [] },
        undefined,
        restrictiveCtx,
      ),
    ).toThrow(ProcessContextDenied);
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.allowed).toBe(false);
    db.close();
  });
});
