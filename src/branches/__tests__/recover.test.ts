/**
 * M4 branches — recover() tests (v1.49.960).
 *
 * recover() closes the v1.49.952 write-ahead residual: a crash in the
 * commit() flip->rename window leaves a `committing: true` marker with the trunk
 * UN-advanced (a round gc() keeps but never reopens). The v1.49.960 intent
 * journal (trunkTmp + bodyHash on the committing:true marker) lets recover()
 * forward-complete that wedged round idempotently.
 *
 * The crash is simulated DETERMINISTICALLY by hand-constructing the exact
 * on-disk state a SIGKILL would leave — no real signal needed. The load-bearing
 * mutation targets are (a) the bodyHash guard (a corrupt staged body must never
 * be renamed in) and (b) the never-roll-back-a-committing:true-marker rule (a
 * late same-round sibling must STILL be blocked after recovery — the v1.49.948
 * double-win invariant).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, promises as fs } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

import { recover } from '../recover.js';
import { commit, commitRoundKey, COMMIT_LOCK_PREFIX } from '../commit.js';
import { fork, readManifest, writeManifest } from '../fork.js';
import type { BranchManifest } from '../manifest.js';

const NOW = 9_000_000_000_000;
const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

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

describe('recover()', () => {
  let dir: string; // branches dir
  let trunkPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'recover-test-'));
    trunkPath = join(dir, 'trunk.md');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function makeBranch(id: string, overrides: Partial<BranchManifest> = {}): Promise<void> {
    const bdir = join(dir, id);
    await fs.mkdir(bdir, { recursive: true });
    await fs.writeFile(join(bdir, 'skill.md'), 'branch-body', 'utf8');
    await writeManifest(bdir, makeManifest({ id, ...overrides }));
  }

  /** Write a per-round marker with arbitrary fields. roundKey is the filename suffix. */
  async function writeMarker(
    roundKey: string,
    entry: Record<string, unknown>,
  ): Promise<string> {
    const marker = COMMIT_LOCK_PREFIX + roundKey;
    await fs.writeFile(join(dir, marker), JSON.stringify(entry), 'utf8');
    return marker;
  }

  /** Stage a trunk-tmp file (what commit() writes before the rename). */
  async function stageTmp(body: string): Promise<string> {
    const tmp = trunkPath + '.tmp.' + randomUUID();
    await fs.writeFile(tmp, body, 'utf8');
    return tmp;
  }

  it('returns an empty report when the branches dir does not exist', async () => {
    const rep = await recover({ branchesDir: join(dir, 'nope') });
    expect(rep.completed).toEqual([]);
    expect(rep.reconciled).toEqual([]);
    expect(rep.skipped).toEqual([]);
  });

  it('forward-completes the flip->rename crash window (redo rename + reconcile manifest)', async () => {
    // The core residual: committing:true, staged tmp present, trunk un-advanced.
    const bid = 'winner';
    await makeBranch(bid); // manifest 'open'
    const body = 'branch-body';
    const tmp = await stageTmp(body);
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    expect(existsSync(trunkPath)).toBe(false); // un-advanced before recovery

    const rep = await recover({ branchesDir: dir, now: NOW });

    expect(rep.completed).toEqual([marker]);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(body); // trunk advanced
    expect(existsSync(tmp)).toBe(false); // staged tmp consumed by the rename
    const m = await readManifest(join(dir, bid));
    expect(m.state).toBe('committed');
    expect(m.committedAt).toBe(NOW);
  });

  it('reconciles only the manifest when the rename completed pre-crash (line 321->324 window)', async () => {
    const bid = 'winner';
    await makeBranch(bid);
    const body = 'branch-body';
    await fs.writeFile(trunkPath, body, 'utf8'); // trunk already advanced
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: trunkPath + '.tmp.gone', // tmp already gone
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });

    expect(rep.reconciled).toEqual([marker]);
    expect(rep.completed).toEqual([]);
    expect((await readManifest(join(dir, bid))).state).toBe('committed');
  });

  it('is a no-op on an already-complete round (trunk advanced + manifest committed)', async () => {
    const bid = 'winner';
    await makeBranch(bid, { state: 'committed', committedAt: NOW });
    const body = 'branch-body';
    await fs.writeFile(trunkPath, body, 'utf8');
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: trunkPath + '.tmp.gone',
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.alreadyComplete).toEqual([marker]);
    expect(rep.completed).toEqual([]);
    expect(rep.reconciled).toEqual([]);
  });

  it('SKIPS a committing:false marker (that is gc()s job, not recover()s)', async () => {
    const bid = 'winner';
    await makeBranch(bid);
    const tmp = await stageTmp('branch-body');
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: false, // un-won round
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256('branch-body'),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.skipped).toEqual([marker]);
    expect(existsSync(trunkPath)).toBe(false); // never advanced a committing:false round
  });

  it('SKIPS a legacy committing:true marker with no journal fields (cannot replay)', async () => {
    const bid = 'winner';
    await makeBranch(bid);
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true, // pre-v1.49.960: no trunkTmp / bodyHash
      trunkPath,
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.skipped).toEqual([marker]);
    expect(existsSync(trunkPath)).toBe(false);
  });

  it('SKIPS (never renames in) a staged body whose hash does not match bodyHash', async () => {
    // Load-bearing safety guard: a truncated/corrupt staged body must NOT reach
    // the trunk. Removing the sha256 check renames the corrupt body in.
    const bid = 'winner';
    await makeBranch(bid);
    const tmp = await stageTmp('CORRUPTED-PARTIAL-WRITE');
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256('the-intended-body'), // mismatch
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.skipped).toEqual([marker]);
    expect(existsSync(trunkPath)).toBe(false); // trunk NOT advanced with corrupt body
    expect((await readManifest(join(dir, bid))).state).toBe('open'); // manifest untouched
  });

  it('NEVER resurrects an ABORTED winner — skips the whole recovery (gates the rename too)', async () => {
    // Load-bearing safety guard (v960 review MAJOR): a committing:true marker
    // pointing at an 'aborted' branch is an inconsistent externally-induced state.
    // recover() must NOT rewrite the manifest to 'committed' AND must NOT advance
    // the trunk with the rejected variant's body — it skips the whole round.
    const bid = 'aborted-winner';
    await makeBranch(bid, { state: 'aborted', abortedAt: NOW });
    const body = 'rejected-variant-body';
    const tmp = await stageTmp(body);
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.skipped).toEqual([marker]);
    expect(existsSync(trunkPath)).toBe(false); // trunk NOT advanced (rejected variant kept out)
    expect((await readManifest(join(dir, bid))).state).toBe('aborted'); // NOT resurrected
  });

  it('redoes the rename when the trunk is still at the recorded PARENT generation', async () => {
    // The legit redo case with an existing trunk: trunk holds parentBody, the
    // marker records parentHash, the staged body differs -> recover() advances it.
    const bid = 'winner';
    const parentBody = 'parent-body-content';
    const body = 'advanced-body-content';
    await makeBranch(bid, { parentHash: sha256(parentBody) });
    await fs.writeFile(trunkPath, parentBody, 'utf8'); // trunk at the parent generation
    const tmp = await stageTmp(body);
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      parentHash: sha256(parentBody),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.completed).toEqual([marker]);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(body); // advanced from parent
  });

  it('does NOT clobber a trunk advanced PAST the parent generation (stale-clobber guard)', async () => {
    // Defense-in-depth: if the trunk holds neither the parent nor this round's
    // body (a newer round advanced it), recover() must NOT rename the stale body
    // in. Skips, leaving the newer trunk intact.
    const bid = 'winner';
    const parentBody = 'parent-body-content';
    const staleBody = 'this-rounds-staged-body';
    const newerBody = 'a-newer-rounds-trunk-body';
    await makeBranch(bid, { parentHash: sha256(parentBody) });
    await fs.writeFile(trunkPath, newerBody, 'utf8'); // trunk already moved past parent
    const tmp = await stageTmp(staleBody);
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(staleBody),
      parentHash: sha256(parentBody),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.skipped).toEqual([marker]);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(newerBody); // newer trunk NOT clobbered
  });

  it('cleans a leftover staged tmp on the reconcile (rename-already-done) path', async () => {
    const bid = 'winner';
    await makeBranch(bid);
    const body = 'branch-body';
    await fs.writeFile(trunkPath, body, 'utf8'); // trunk already advanced
    const tmp = await stageTmp(body); // a real leftover staged tmp
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.reconciled).toEqual([marker]);
    expect(existsSync(tmp)).toBe(false); // leftover staged tmp opportunistically removed
  });

  it('is IDEMPOTENT — a second recover() is a no-op (no double rename, no throw)', async () => {
    const bid = 'winner';
    await makeBranch(bid);
    const body = 'branch-body';
    const tmp = await stageTmp(body);
    await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const first = await recover({ branchesDir: dir, now: NOW });
    expect(first.completed).toHaveLength(1);

    const second = await recover({ branchesDir: dir, now: NOW });
    expect(second.completed).toEqual([]); // already done on the first pass
    expect(second.alreadyComplete).toHaveLength(1); // trunk advanced + manifest committed
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(body); // unchanged
  });

  it('dry-run reports the completion but does NOT rename or write the manifest', async () => {
    const bid = 'winner';
    await makeBranch(bid);
    const body = 'branch-body';
    const tmp = await stageTmp(body);
    const marker = await writeMarker('k1', {
      branchId: bid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW, dryRun: true });
    expect(rep.completed).toEqual([marker]);
    expect(rep.dryRun).toBe(true);
    expect(existsSync(trunkPath)).toBe(false); // NOT renamed
    expect(existsSync(tmp)).toBe(true); // staged tmp untouched
    expect((await readManifest(join(dir, bid))).state).toBe('open'); // NOT written
  });

  it('SKIPS a corrupt (unparseable) marker without throwing', async () => {
    await fs.writeFile(join(dir, COMMIT_LOCK_PREFIX + 'k1'), '{not json', 'utf8');
    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.skipped).toEqual([COMMIT_LOCK_PREFIX + 'k1']);
  });

  it('advances the trunk even when the winner branch dir was reaped (manifest tolerated missing)', async () => {
    // No makeBranch — the branch dir is gone (gc reaped it). The trunk is the
    // source of truth, so an old wedged round still heals.
    const body = 'branch-body';
    const tmp = await stageTmp(body);
    const marker = await writeMarker('k1', {
      branchId: 'reaped-branch',
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(body),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.completed).toEqual([marker]);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(body); // trunk advanced anyway
  });

  it('does not disturb a HEALTHY committed round produced by real commit() (no-op)', async () => {
    // Bodies must respect M4's 20% fork delta bound — a large parent + tiny change.
    const parentBody = 'shared trunk content line\n'.repeat(15);
    const proposedBody = parentBody + 'tiny refinement\n';
    const { manifest } = await fork({
      parentBody,
      proposedBody,
      skillName: 's',
      branchesDir: dir,
      ts: NOW,
    });
    await fs.writeFile(trunkPath, parentBody, 'utf8');
    const res = await commit({ branchId: manifest.id, branchesDir: dir, trunkPath, ts: NOW });
    expect(res.outcome).toBe('committed');

    const rep = await recover({ branchesDir: dir, now: NOW });
    // The healthy round's marker is committing:true + trunk advanced + committed.
    expect(rep.completed).toEqual([]);
    expect(rep.alreadyComplete).toHaveLength(1);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(proposedBody); // unchanged by recover
  });

  it('preserves the double-win invariant: a late same-round sibling is STILL blocked after recovery', async () => {
    // Construct a wedged winner round, recover it, then race a sibling forked
    // from the SAME parent generation. The marker stays (never rolled back), so
    // the sibling loses the ax race — exactly the v1.49.948 guard.
    // Bodies must respect M4's 20% fork delta bound — a large parent + tiny change.
    const parentBody = 'shared trunk content line\n'.repeat(15);
    const winnerBody = parentBody + 'winner refinement\n';
    const parentHash = sha256(parentBody);
    const roundKey = commitRoundKey(trunkPath, parentHash);

    // Wedged winner: committing:true, staged tmp, trunk un-advanced, manifest open.
    const winnerBid = 'winner';
    await fs.mkdir(join(dir, winnerBid), { recursive: true });
    await fs.writeFile(join(dir, winnerBid, 'skill.md'), winnerBody, 'utf8');
    await writeManifest(join(dir, winnerBid), makeManifest({ id: winnerBid, parentHash }));
    const tmp = await stageTmp(winnerBody);
    await writeMarker(roundKey, {
      branchId: winnerBid,
      committing: true,
      trunkPath,
      trunkTmp: tmp,
      bodyHash: sha256(winnerBody),
      acquiredAt: NOW,
    });

    const rep = await recover({ branchesDir: dir, now: NOW });
    expect(rep.completed).toHaveLength(1);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(winnerBody);

    // recover() must NEVER mutate the winner marker — neither unlink it nor
    // soft-rollback committing to false. Either would let gc() (false) or a
    // sibling 'ax' open (unlink) reopen the round = the v1.49.948 double-win.
    const markerRaw = await fs.readFile(join(dir, COMMIT_LOCK_PREFIX + roundKey), 'utf8');
    expect(JSON.parse(markerRaw).committing).toBe(true);

    // A sibling forked from the SAME parent body collides on roundKey.
    const sibling = await fork({
      parentBody,
      proposedBody: parentBody + 'sibling refinement\n',
      skillName: 's',
      branchesDir: dir,
      ts: NOW,
    });
    const r2 = await commit({ branchId: sibling.manifest.id, branchesDir: dir, trunkPath, ts: NOW });
    expect(r2.outcome).toBe('blocked'); // marker still present -> no second winner
    expect(r2.winnerBranchId).toBe(winnerBid);
    expect(await fs.readFile(trunkPath, 'utf8')).toBe(winnerBody); // trunk unchanged by the loser
  });
});
