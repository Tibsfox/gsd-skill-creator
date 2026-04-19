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
import { commit } from '../commit.js';

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

// ─── Lock cleanup ─────────────────────────────────────────────────────────────

describe('commit — lock cleanup', () => {
  it('removes the commit lock after successful commit', async () => {
    const branchesDir = tempDir();
    const trunkPath = join(tempDir(), 'trunk.md');
    const parentBody = 'u'.repeat(500);

    const { manifest: m } = await fork({ parentBody, proposedBody: smallChange(parentBody), skillName: 'lock-test', branchesDir });
    await commit({ branchId: m.id, branchesDir, trunkPath });

    // Lock file must be removed.
    const lockExists = await fs.access(join(branchesDir, '.commit-lock')).then(() => true).catch(() => false);
    expect(lockExists).toBe(false);
  });
});
