/**
 * M4 branches — gc() tests (v1.49.952).
 *
 * gc() had ZERO tests before this ship. These cover both passes:
 *   - branch reaping (terminal >7d, open >30d, recency keep, unreadable skip,
 *     dry-run, missing dir), and
 *   - commit-lock-marker reaping (the v1.49.952 crash-recovery closure).
 *
 * The reaper reaps a marker iff (old) AND it explicitly records
 * `committing: false` (the v1.49.952 commit() write-ahead — proof the crash
 * preceded the trunk write, so the round was never won). The load-bearing
 * mutation target is the `committing: true` SAFETY case: a marker whose trunk
 * write was reached MUST be kept — mutating away the `committing !== false`
 * guard reaps it and reopens the v1.49.948 double-win.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, promises as fs } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  gc,
  DEFAULT_COMMIT_LOCK_MAX_AGE_MS,
  DEFAULT_TERMINAL_MAX_AGE_MS,
  DEFAULT_OPEN_MAX_AGE_MS,
} from '../gc.js';
import { COMMIT_LOCK_PREFIX } from '../commit.js';
import { writeManifest } from '../fork.js';
import type { BranchManifest } from '../manifest.js';

// A fixed clock far above any real timestamp so all ages are deterministic.
const NOW = 10_000_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeManifest(overrides: Partial<BranchManifest> = {}): BranchManifest {
  return {
    id: overrides.id ?? randomUUID(),
    skillName: 'demo-skill',
    parentHash: 'a'.repeat(64),
    parentByteLength: 100,
    createdAt: NOW,
    state: 'open',
    exploreSessionCount: 0,
    tracePaths: [],
    proposedByteLength: 100,
    deltaFraction: 0,
    ...overrides,
  };
}

describe('gc()', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'gc-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function makeBranch(id: string, overrides: Partial<BranchManifest> = {}): Promise<void> {
    const bdir = join(dir, id);
    await fs.mkdir(bdir, { recursive: true });
    await writeManifest(bdir, makeManifest({ id, ...overrides }));
  }

  /**
   * Write a commit-lock marker. `committing` controls the write-ahead flag:
   * `false` (crash before trunk write), `true` (trunk write reached), or
   * `'absent'` (legacy pre-v1.49.952 marker with no field).
   */
  async function makeLock(
    roundKey: string,
    entry: { branchId?: string; acquiredAt?: number | 'absent'; committing?: boolean | 'absent'; trunkTmp?: string },
  ): Promise<string> {
    const marker = COMMIT_LOCK_PREFIX + roundKey;
    const body: Record<string, unknown> = {
      branchId: entry.branchId ?? 'winner',
      createdAt: 0,
      parentHash: 'p',
      trunkPath: join(dir, 'trunk.md'),
    };
    if (entry.acquiredAt !== 'absent') body.acquiredAt = entry.acquiredAt;
    if (entry.committing !== 'absent') body.committing = entry.committing;
    if (entry.trunkTmp !== undefined) body.trunkTmp = entry.trunkTmp;
    await fs.writeFile(join(dir, marker), JSON.stringify(body), 'utf8');
    return marker;
  }

  /** Stage a fake trunk tmp on disk and return its path (the v1.49.964 orphan). */
  async function stageTmp(name = 'trunk.md.tmp.' + randomUUID()): Promise<string> {
    const tmpPath = join(dir, name);
    await fs.writeFile(tmpPath, 'staged-body', 'utf8');
    return tmpPath;
  }

  // ── Branch reaping (previously untested core) ─────────────────────────────

  it('deletes terminal branches older than terminalMaxAgeMs', async () => {
    await makeBranch('old-committed', { state: 'committed', createdAt: NOW - 8 * DAY, committedAt: NOW - 8 * DAY });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.deleted).toEqual(['old-committed']);
    expect(existsSync(join(dir, 'old-committed'))).toBe(false);
  });

  it('keeps terminal branches younger than terminalMaxAgeMs', async () => {
    await makeBranch('fresh-committed', { state: 'committed', createdAt: NOW - 1 * DAY, committedAt: NOW - 1 * DAY });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.kept).toEqual(['fresh-committed']);
    expect(existsSync(join(dir, 'fresh-committed'))).toBe(true);
  });

  it('deletes open branches older than openMaxAgeMs', async () => {
    await makeBranch('stuck-open', { state: 'open', createdAt: NOW - 31 * DAY });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.deleted).toEqual(['stuck-open']);
  });

  it('keeps open branches younger than openMaxAgeMs (even past terminal age)', async () => {
    // 10 days old: past the 7-day terminal age but NOT the 30-day open age.
    await makeBranch('young-open', { state: 'open', createdAt: NOW - 10 * DAY });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.kept).toEqual(['young-open']);
  });

  it('skips a directory with an unreadable manifest', async () => {
    const bdir = join(dir, 'broken');
    await fs.mkdir(bdir, { recursive: true });
    await fs.writeFile(join(bdir, 'manifest.json'), '{not json', 'utf8');
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.skipped).toEqual(['broken']);
    expect(existsSync(bdir)).toBe(true);
  });

  it('returns an empty report when the branches dir does not exist', async () => {
    const report = await gc({ branchesDir: join(dir, 'nope'), now: NOW });
    expect(report).toMatchObject({ deleted: [], kept: [], skipped: [], reapedLocks: [], keptLocks: [], skippedLocks: [] });
  });

  it('dry-run reports a deletion but does not delete', async () => {
    await makeBranch('old-committed', { state: 'committed', createdAt: NOW - 8 * DAY, committedAt: NOW - 8 * DAY });
    const report = await gc({ branchesDir: dir, now: NOW, dryRun: true });
    expect(report.deleted).toEqual(['old-committed']);
    expect(report.dryRun).toBe(true);
    expect(existsSync(join(dir, 'old-committed'))).toBe(true);
  });

  // ── Commit-lock reaping (v1.49.952) ───────────────────────────────────────

  it('reaps an orphan: old AND committing:false (crash before the trunk write)', async () => {
    const marker = await makeLock('round-crash', { acquiredAt: NOW - 2 * HOUR, committing: false });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.reapedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(false);
  });

  it('SAFETY: keeps an old marker recording committing:true (trunk write reached — round may be won)', async () => {
    // The load-bearing guard. A committing:true marker may be a permanent winner
    // record (or a crash at/after the trunk rename). Mutating away the
    // `committing !== false` check reaps this and reopens the v1.49.948 double-win.
    const marker = await makeLock('round-won', { acquiredAt: NOW - 2 * HOUR, committing: true });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.reapedLocks).toEqual([]);
    expect(report.keptLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  it('keeps a legacy marker with no committing field (pre-v1.49.952, cannot classify)', async () => {
    const marker = await makeLock('round-legacy', { acquiredAt: NOW - 2 * HOUR, committing: 'absent' });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.reapedLocks).toEqual([]);
    expect(report.keptLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  it('keeps a young committing:false marker (possibly in-flight commit)', async () => {
    const marker = await makeLock('round-inflight', { acquiredAt: NOW - 60_000, committing: false });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.keptLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  it('skips a corrupt (unparseable) marker', async () => {
    const marker = COMMIT_LOCK_PREFIX + 'round-corrupt';
    await fs.writeFile(join(dir, marker), '{not json', 'utf8');
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.skippedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  it('skips a marker missing a usable acquiredAt', async () => {
    const marker = await makeLock('round-noage', { acquiredAt: 'absent', committing: false });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.skippedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  it('dry-run reports a reapable orphan marker but does not delete it', async () => {
    const marker = await makeLock('round-crash', { acquiredAt: NOW - 2 * HOUR, committing: false });
    const report = await gc({ branchesDir: dir, now: NOW, dryRun: true });
    expect(report.reapedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  it('commitLockMaxAgeMs=Infinity disables reaping (marker always kept)', async () => {
    const marker = await makeLock('round-ancient', { acquiredAt: NOW - 100 * DAY, committing: false });
    const report = await gc({ branchesDir: dir, now: NOW, commitLockMaxAgeMs: Infinity });
    expect(report.keptLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
  });

  // ── Orphan trunk-tmp cleanup (v1.49.964) ──────────────────────────────────
  // commit() records trunkTmp in the ACQUISITION marker (committing:false), so
  // gc() can unlink the orphan staged tmp left by a crash before the flip.

  it('reaps an orphan AND unlinks its recorded trunk-tmp (committing:false, old)', async () => {
    const tmp = await stageTmp();
    const marker = await makeLock('round-orphan', { acquiredAt: NOW - 2 * HOUR, committing: false, trunkTmp: tmp });
    expect(existsSync(tmp)).toBe(true);
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.reapedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(false);
    expect(existsSync(tmp)).toBe(false); // the orphan tmp is unlinked
  });

  it('SAFETY: does NOT unlink the trunk-tmp of a committing:true (won) marker', async () => {
    // A won round's staged tmp may be mid-rename or recover()'s to replay —
    // never touch it. The unlink rides the same committing:false reap gate.
    const tmp = await stageTmp();
    const marker = await makeLock('round-won', { acquiredAt: NOW - 2 * HOUR, committing: true, trunkTmp: tmp });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.keptLocks).toEqual([marker]);
    expect(existsSync(tmp)).toBe(true); // won round's tmp preserved
  });

  it('does NOT unlink the trunk-tmp of a YOUNG committing:false marker (possibly in-flight)', async () => {
    const tmp = await stageTmp();
    const marker = await makeLock('round-young', { acquiredAt: NOW - 60_000, committing: false, trunkTmp: tmp });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.keptLocks).toEqual([marker]);
    expect(existsSync(tmp)).toBe(true); // in-flight round's tmp preserved
  });

  it('tolerates an already-gone trunk-tmp on reap (rename consumed it, or crash before staging)', async () => {
    const ghostTmp = join(dir, 'trunk.md.tmp.' + randomUUID()); // never created on disk
    const marker = await makeLock('round-ghost', { acquiredAt: NOW - 2 * HOUR, committing: false, trunkTmp: ghostTmp });
    const report = await gc({ branchesDir: dir, now: NOW }); // must not throw
    expect(report.reapedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(false);
  });

  it('dry-run reports the reapable marker but unlinks NOTHING (marker + tmp both survive)', async () => {
    const tmp = await stageTmp();
    const marker = await makeLock('round-dry', { acquiredAt: NOW - 2 * HOUR, committing: false, trunkTmp: tmp });
    const report = await gc({ branchesDir: dir, now: NOW, dryRun: true });
    expect(report.reapedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(true);
    expect(existsSync(tmp)).toBe(true);
  });

  it('reaps a legacy committing:false marker with NO trunkTmp field cleanly (no throw)', async () => {
    const marker = await makeLock('round-notmp', { acquiredAt: NOW - 2 * HOUR, committing: false });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.reapedLocks).toEqual([marker]);
    expect(existsSync(join(dir, marker))).toBe(false);
  });

  it('order-independence: reaps a committing:false marker AND deletes a >30d open branch in one run', async () => {
    // The marker (pass 1) and an unrelated stale-open branch (pass 2) are
    // independent: the reaper reads only the marker, so reaping is independent of
    // whether/when the branch pass deletes any branch.
    await makeBranch('old-open-branch', { state: 'open', createdAt: NOW - 31 * DAY });
    const marker = await makeLock('round-oldopen', { acquiredAt: NOW - 31 * DAY, committing: false });
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report.reapedLocks).toEqual([marker]);
    expect(report.deleted).toEqual(['old-open-branch']);
    expect(existsSync(join(dir, marker))).toBe(false);
    expect(existsSync(join(dir, 'old-open-branch'))).toBe(false);
  });

  it('ignores a non-lock dotfile (e.g. .gitkeep) entirely', async () => {
    await fs.writeFile(join(dir, '.gitkeep'), '', 'utf8');
    const report = await gc({ branchesDir: dir, now: NOW });
    expect(report).toMatchObject({
      deleted: [], kept: [], skipped: [], reapedLocks: [], keptLocks: [], skippedLocks: [],
    });
    expect(existsSync(join(dir, '.gitkeep'))).toBe(true);
  });

  it('exposes sane default age constants', () => {
    expect(DEFAULT_COMMIT_LOCK_MAX_AGE_MS).toBe(60 * 60 * 1000);
    expect(DEFAULT_TERMINAL_MAX_AGE_MS).toBe(7 * DAY);
    expect(DEFAULT_OPEN_MAX_AGE_MS).toBe(30 * DAY);
  });
});
