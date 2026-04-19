/**
 * IT-05: branched activation alongside trunk; trunk and branch desensitisation
 * independent; outcome trace captured via M3.
 *
 * @module branches/__tests__/explore.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fork } from '../fork.js';
import { explore } from '../explore.js';
import { readManifest } from '../fork.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanupDirs: string[] = [];

function tempDir(): string {
  const dir = join(tmpdir(), `m4-explore-test-${randomUUID()}`);
  cleanupDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of cleanupDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

function smallChange(parent: string, n = 10): string {
  return parent.slice(0, -n) + 'z'.repeat(n);
}

// ─── Basic explore ────────────────────────────────────────────────────────────

describe('explore — basic', () => {
  it('runs a single session and captures outcome', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'a'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'explore-test',
      branchesDir,
    });

    let runCount = 0;
    const result = await explore({
      branchId: m.id,
      branchesDir,
      trunkBody: parentBody,
      sessionCount: 1,
      traceDir,
      runSkill: async (body, idx) => {
        runCount++;
        return `output-${idx}`;
      },
    });

    // runSkill was called twice (trunk + branch).
    expect(runCount).toBe(2);

    // One session result.
    expect(result.sessions).toHaveLength(1);

    // Both outcomes captured.
    expect(result.sessions[0].outcomes.trunk.passed).toBe(true);
    expect(result.sessions[0].outcomes.branch.passed).toBe(true);
  });

  it('runs multiple sessions and increments explore count', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'x'.repeat(400);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'multi-session',
      branchesDir,
    });

    await explore({
      branchId: m.id,
      branchesDir,
      trunkBody: parentBody,
      sessionCount: 3,
      traceDir,
      runSkill: async () => 'ok',
    });

    const updated = await readManifest(join(branchesDir, m.id));
    expect(updated.exploreSessionCount).toBe(3);
  });

  it('accumulates session count across multiple explore() calls', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'y'.repeat(400);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'accumulate',
      branchesDir,
    });

    await explore({ branchId: m.id, branchesDir, trunkBody: parentBody, sessionCount: 2, traceDir, runSkill: async () => 'a' });
    await explore({ branchId: m.id, branchesDir, trunkBody: parentBody, sessionCount: 3, traceDir, runSkill: async () => 'b' });

    const updated = await readManifest(join(branchesDir, m.id));
    expect(updated.exploreSessionCount).toBe(5);
  });
});

// ─── IT-05: trunk and branch desensitisation independent ─────────────────────

describe('IT-05: trunk and branch desensitisation are independent', () => {
  it('trunk failure does not abort the branch outcome', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'a'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'trunk-fail',
      branchesDir,
    });

    let callCount = 0;
    const result = await explore({
      branchId: m.id,
      branchesDir,
      trunkBody: parentBody,
      sessionCount: 1,
      traceDir,
      runSkill: async (body, idx) => {
        callCount++;
        // Trunk (called first) fails; branch (called second) succeeds.
        if (callCount === 1) throw new Error('trunk exploded');
        return 'branch ok';
      },
    });

    // Both sides ran.
    expect(callCount).toBe(2);

    const { trunk, branch } = result.sessions[0].outcomes;
    expect(trunk.passed).toBe(false);
    expect(trunk.error).toContain('trunk exploded');
    expect(branch.passed).toBe(true);
    expect(branch.output).toBe('branch ok');
  });

  it('branch failure does not abort the trunk outcome', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'b'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'branch-fail',
      branchesDir,
    });

    let callCount = 0;
    const result = await explore({
      branchId: m.id,
      branchesDir,
      trunkBody: parentBody,
      sessionCount: 1,
      traceDir,
      runSkill: async (body, idx) => {
        callCount++;
        // Trunk passes; branch (second call) fails.
        if (callCount === 2) throw new Error('branch exploded');
        return 'trunk ok';
      },
    });

    const { trunk, branch } = result.sessions[0].outcomes;
    expect(trunk.passed).toBe(true);
    expect(trunk.output).toBe('trunk ok');
    expect(branch.passed).toBe(false);
    expect(branch.error).toContain('branch exploded');
  });

  it('both sides can fail independently without crashing explore()', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'c'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'both-fail',
      branchesDir,
    });

    const result = await explore({
      branchId: m.id,
      branchesDir,
      trunkBody: parentBody,
      sessionCount: 1,
      traceDir,
      runSkill: async () => { throw new Error('everything is on fire'); },
    });

    const { trunk, branch } = result.sessions[0].outcomes;
    expect(trunk.passed).toBe(false);
    expect(branch.passed).toBe(false);

    // Manifest is still updated.
    const updated = await readManifest(join(branchesDir, m.id));
    expect(updated.exploreSessionCount).toBe(1);
  });
});

// ─── Outcome trace captured ───────────────────────────────────────────────────

describe('explore — M3 outcome trace captured', () => {
  it('writes a trace file to traceDir', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'd'.repeat(400);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'trace-capture',
      branchesDir,
    });

    const result = await explore({
      branchId: m.id,
      branchesDir,
      trunkBody: parentBody,
      sessionCount: 1,
      traceDir,
      runSkill: async () => 'ok',
    });

    // tracePath is set.
    expect(result.sessions[0].tracePath).toBeTruthy();

    // Trace file is referenced in updated manifest.
    const updated = await readManifest(join(branchesDir, m.id));
    expect(updated.tracePaths.length).toBeGreaterThan(0);
  });
});

// ─── Rejects non-open branches ───────────────────────────────────────────────

describe('explore — rejects non-open branches', () => {
  it('throws if branch is not open', async () => {
    const branchesDir = tempDir();
    const traceDir = tempDir();
    const parentBody = 'e'.repeat(400);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'not-open',
      branchesDir,
    });

    // Manually transition to aborted state.
    const { writeManifest } = await import('../fork.js');
    await writeManifest(join(branchesDir, m.id), { ...m, state: 'aborted', abortedAt: Date.now() });

    await expect(
      explore({
        branchId: m.id,
        branchesDir,
        trunkBody: parentBody,
        sessionCount: 1,
        traceDir,
        runSkill: async () => 'ok',
      }),
    ).rejects.toThrow(/not open/);
  });
});
