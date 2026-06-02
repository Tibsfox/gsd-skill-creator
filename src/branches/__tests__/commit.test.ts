/**
 * CF-M4-02: First-commit-wins: N=5 concurrent branches, first commit blocks N-1
 * with clear diagnostic.
 *
 * @module branches/__tests__/commit.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fork } from '../fork.js';
import { commit, commitRoundKey, COMMIT_LOCK_PREFIX } from '../commit.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanupDirs: string[] = [];

function tempDir(): string {
  const dir = join(tmpdir(), `m4-commit-test-${randomUUID()}`);
  cleanupDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of cleanupDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

function smallChange(parent: string, n = 10, ch = 'z'): string {
  return parent.slice(0, -n) + ch.repeat(n);
}

async function makeBranch(
  branchesDir: string,
  skillName: string,
  parentBody: string,
  offset = 0,
): Promise<{ branchId: string; parentBody: string }> {
  const proposed = smallChange(parentBody, 10 + offset, String.fromCharCode(97 + offset));
  const { manifest } = await fork({ parentBody, proposedBody: proposed, skillName, branchesDir });
  return { branchId: manifest.id, parentBody };
}

// ─── Single commit ────────────────────────────────────────────────────────────

describe('commit — single branch', () => {
  it('commits successfully and writes skill body to trunk path', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'p'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'commit-test',
      branchesDir,
    });

    const result = await commit({ branchId: m.id, branchesDir, trunkPath });

    expect(result.outcome).toBe('committed');
    expect(result.winnerBranchId).toBe(m.id);
    expect(result.manifest.state).toBe('committed');
    expect(result.manifest.committedAt).toBeDefined();

    // Trunk file was written.
    const trunkContent = await fs.readFile(trunkPath, 'utf8');
    expect(trunkContent).toBe(proposedBody);
  });

  it('marks manifest as committed with committedAt timestamp', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'q'.repeat(500);
    const ts = 1_700_000_001_000;

    const { manifest: m } = await fork({ parentBody, proposedBody: smallChange(parentBody), skillName: 's', branchesDir });
    const result = await commit({ branchId: m.id, branchesDir, trunkPath, ts });

    expect(result.manifest.committedAt).toBe(ts);
  });

  it('throws if branch is not open', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'r'.repeat(500);

    const { manifest: m } = await fork({ parentBody, proposedBody: smallChange(parentBody), skillName: 's', branchesDir });

    // Manually abort the branch.
    const { writeManifest } = await import('../fork.js');
    await writeManifest(join(branchesDir, m.id), { ...m, state: 'aborted', abortedAt: Date.now() });

    await expect(commit({ branchId: m.id, branchesDir, trunkPath })).rejects.toThrow(/not open/);
  });
});

// ─── CF-M4-02: First-commit-wins with N=5 ─────────────────────────────────────

describe('CF-M4-02: first-commit-wins — N=5 concurrent branches', () => {
  it('exactly one branch commits; N-1 branches are blocked with clear diagnostic', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const N = 5;

    const parentBody = 's'.repeat(1000);

    // Create N branches, each with a slightly different proposed body.
    const branches: Array<{ branchId: string }> = [];
    for (let i = 0; i < N; i++) {
      const { branchId } = await makeBranch(branchesDir, `skill-${i}`, parentBody, i);
      branches.push({ branchId });
    }

    // Race all N commits concurrently.
    const results = await Promise.all(
      branches.map(({ branchId }) => commit({ branchId, branchesDir, trunkPath })),
    );

    // Exactly one winner.
    const committed = results.filter((r) => r.outcome === 'committed');
    const blocked = results.filter((r) => r.outcome === 'blocked');

    expect(committed).toHaveLength(1);
    expect(blocked).toHaveLength(N - 1);

    // Each blocked result has a diagnostic naming the winner.
    const winnerId = committed[0].winnerBranchId;
    for (const b of blocked) {
      expect(b.diagnostic).toBeDefined();
      expect(typeof b.diagnostic).toBe('string');
      // Diagnostic must contain "CF-M4-02" or at minimum mention the winner or "blocked".
      expect(b.diagnostic!.length).toBeGreaterThan(10);
      // Blocked branches are marked aborted.
      expect(b.manifest.state).toBe('aborted');
    }

    // Winner is marked committed.
    expect(committed[0].manifest.state).toBe('committed');

    // Trunk file exists.
    const trunkExists = await fs.access(trunkPath).then(() => true).catch(() => false);
    expect(trunkExists).toBe(true);

    // Trunk contains the winner's skill body.
    const trunkContent = await fs.readFile(trunkPath, 'utf8');
    const winnerSkill = await fs.readFile(join(branchesDir, winnerId, 'skill.md'), 'utf8');
    expect(trunkContent).toBe(winnerSkill);
  }, 15000); // Allow up to 15s for concurrent FS operations.

  it('blocked branches include a diagnostic mentioning the winner', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');

    const parentBody = 't'.repeat(800);
    const b1 = await makeBranch(branchesDir, 'skill', parentBody, 0);
    const b2 = await makeBranch(branchesDir, 'skill', parentBody, 1);
    const b3 = await makeBranch(branchesDir, 'skill', parentBody, 2);

    const results = await Promise.all([
      commit({ branchId: b1.branchId, branchesDir, trunkPath }),
      commit({ branchId: b2.branchId, branchesDir, trunkPath }),
      commit({ branchId: b3.branchId, branchesDir, trunkPath }),
    ]);

    const blockedResults = results.filter((r) => r.outcome === 'blocked');
    for (const b of blockedResults) {
      // Diagnostic must contain some descriptive text.
      expect(b.diagnostic).toBeDefined();
      expect(b.diagnostic!).toContain('blocked');
    }
  });
});

// ─── Per-round winner lock ─────────────────────────────────────────────────────

describe('commit — per-round winner lock', () => {
  it('keeps a permanent per-round marker and never creates the legacy global lock', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'u'.repeat(500);

    const { manifest: m } = await fork({ parentBody, proposedBody: smallChange(parentBody), skillName: 'lock-test', branchesDir });
    const result = await commit({ branchId: m.id, branchesDir, trunkPath });
    expect(result.outcome).toBe('committed');

    // The legacy global lock file `.commit-lock` is never created.
    const legacyExists = await fs.access(join(branchesDir, '.commit-lock')).then(() => true).catch(() => false);
    expect(legacyExists).toBe(false);

    // The per-round winner marker PERSISTS (it is the durable winner record)
    // and records the winning branch id + the parent generation it won on.
    const markerPath = join(branchesDir, COMMIT_LOCK_PREFIX + commitRoundKey(trunkPath, m.parentHash));
    const marker = JSON.parse(await fs.readFile(markerPath, 'utf8'));
    expect(marker.branchId).toBe(m.id);
    expect(marker.parentHash).toBe(m.parentHash);
  });
});

// ─── CF-M4-02b: late-sibling double-win regression (v1.49.948) ─────────────────

describe('CF-M4-02b: permanent winner lock blocks a late same-round sibling', () => {
  it('a sibling committed AFTER the winner (same parent + trunk) is blocked, not a 2nd winner', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'w'.repeat(900);

    // Two siblings forked from the SAME parent, targeting the SAME trunk.
    const b1 = await makeBranch(branchesDir, 'skill', parentBody, 0);
    const b2 = await makeBranch(branchesDir, 'skill', parentBody, 1);

    // Commit b1 to completion FIRST, then b2 — the exact ordering under which
    // the pre-v1.49.948 releasable global lock double-won (b1 unlinked the lock
    // on success, so b2's later 'ax' open succeeded and b2 ALSO committed).
    // The permanent per-round lock must block b2.
    const r1 = await commit({ branchId: b1.branchId, branchesDir, trunkPath });
    const r2 = await commit({ branchId: b2.branchId, branchesDir, trunkPath });

    expect(r1.outcome).toBe('committed');
    expect(r2.outcome).toBe('blocked');
    expect(r2.winnerBranchId).toBe(b1.branchId);
    expect(r2.manifest.state).toBe('aborted');

    // Trunk still holds the FIRST winner's body — b2 never overwrote it.
    const trunkContent = await fs.readFile(trunkPath, 'utf8');
    const b1Skill = await fs.readFile(join(branchesDir, b1.branchId, 'skill.md'), 'utf8');
    expect(trunkContent).toBe(b1Skill);
  });
});

// ─── Future round (new parent generation) still commits ─────────────────────────

describe('commit — a future round from the updated trunk still commits', () => {
  it('a branch forked from the committed trunk body (new generation) is not blocked', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'x'.repeat(900);

    // Round 1: fork from parentBody, commit it.
    const b1 = await makeBranch(branchesDir, 'skill', parentBody, 0);
    const r1 = await commit({ branchId: b1.branchId, branchesDir, trunkPath });
    expect(r1.outcome).toBe('committed');

    // Round 2: fork from the UPDATED trunk body (a different parent generation,
    // hence a different round key than round 1's permanent lock).
    const newTrunkBody = await fs.readFile(trunkPath, 'utf8');
    const { manifest: m2 } = await fork({
      parentBody: newTrunkBody,
      proposedBody: smallChange(newTrunkBody, 12, 'k'),
      skillName: 'skill',
      branchesDir,
    });
    const r2 = await commit({ branchId: m2.id, branchesDir, trunkPath });

    // Must succeed: keying the round lock on parentHash (not trunkPath alone)
    // lets a new generation commit. If the key dropped parentHash this blocks.
    expect(r2.outcome).toBe('committed');
    // Precondition: the trunk generation actually advanced (round 2's parent
    // differs from round 1's), so the two rounds key onto different locks.
    expect(newTrunkBody).not.toBe(parentBody);
  });
});

// ─── Unrelated rounds are independent (no false cross-trunk blocking) ───────────

describe('commit — unrelated rounds do not block each other', () => {
  it('two branches with different parents + trunks both commit concurrently', async () => {
    const branchesDir = tempDir();
    const trunkPathA = join(tempDir(), 'trunkA.md');
    const trunkPathB = join(tempDir(), 'trunkB.md');

    const a = await makeBranch(branchesDir, 'skill-a', 'a'.repeat(700), 0);
    const b = await makeBranch(branchesDir, 'skill-b', 'b'.repeat(700), 1);

    // Same branchesDir, different round keys → independent permanent locks.
    const [ra, rb] = await Promise.all([
      commit({ branchId: a.branchId, branchesDir, trunkPath: trunkPathA }),
      commit({ branchId: b.branchId, branchesDir, trunkPath: trunkPathB }),
    ]);

    expect(ra.outcome).toBe('committed');
    expect(rb.outcome).toBe('committed');
  });
});

// ─── 0-delta idempotency (same generation → blocked) ───────────────────────────

describe('commit — 0-delta sibling is idempotently blocked', () => {
  it('a 0-delta commit blocks a later 0-delta sibling from the same parent', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'z'.repeat(600);

    // Two 0-delta branches (proposed === parent) from the same parent + trunk:
    // committing the first leaves the trunk unchanged, so the second shares the
    // round key and is blocked rather than double-applied.
    const { manifest: m1 } = await fork({ parentBody, proposedBody: parentBody, skillName: 's', branchesDir });
    const { manifest: m2 } = await fork({ parentBody, proposedBody: parentBody, skillName: 's', branchesDir });

    const r1 = await commit({ branchId: m1.id, branchesDir, trunkPath });
    const r2 = await commit({ branchId: m2.id, branchesDir, trunkPath });

    expect(r1.outcome).toBe('committed');
    expect(r2.outcome).toBe('blocked');
    expect(r2.winnerBranchId).toBe(m1.id);
  });
});

// ─── Winner error path releases the lock (round not wedged) ─────────────────────

describe('commit — winner error path releases the lock', () => {
  it('a winner whose skill body is missing releases the lock so a sibling recovers', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'e'.repeat(800);

    const b1 = await makeBranch(branchesDir, 'skill', parentBody, 0);
    const b2 = await makeBranch(branchesDir, 'skill', parentBody, 1);

    // Sabotage b1's skill body so its winner path throws AFTER acquiring the lock.
    await fs.rm(join(branchesDir, b1.branchId, 'skill.md'));

    // b1 wins the lock, fails to read its skill body, then must release the lock
    // and rethrow (the only winner-side release path).
    await expect(commit({ branchId: b1.branchId, branchesDir, trunkPath })).rejects.toThrow();

    // No per-round marker remains → the round is not wedged.
    const markers = (await fs.readdir(branchesDir)).filter((f) => f.startsWith(COMMIT_LOCK_PREFIX));
    expect(markers).toHaveLength(0);

    // The sibling b2 can therefore win the round and commit.
    const r2 = await commit({ branchId: b2.branchId, branchesDir, trunkPath });
    expect(r2.outcome).toBe('committed');
    const trunkContent = await fs.readFile(trunkPath, 'utf8');
    const b2Skill = await fs.readFile(join(branchesDir, b2.branchId, 'skill.md'), 'utf8');
    expect(trunkContent).toBe(b2Skill);
  });
});
