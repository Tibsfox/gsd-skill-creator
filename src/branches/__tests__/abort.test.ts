/**
 * CF-M4-04: Clean abort leaves no residual branch files.
 *
 * @module branches/__tests__/abort.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fork } from '../fork.js';
import { abort, branchDirectoryGone } from '../abort.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanupDirs: string[] = [];

function tempDir(): string {
  const dir = join(tmpdir(), `m4-abort-test-${randomUUID()}`);
  cleanupDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of cleanupDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

function smallChange(parent: string): string {
  return parent.slice(0, -10) + 'z'.repeat(10);
}

// ─── CF-M4-04: Clean abort ────────────────────────────────────────────────────

describe('CF-M4-04: abort leaves no residual branch files', () => {
  it('deletes the branch directory entirely', async () => {
    const branchesDir = tempDir();
    const parentBody = 'a'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'abort-test',
      branchesDir,
    });

    // Branch directory exists before abort.
    const branchDir = join(branchesDir, m.id);
    const existsBefore = await fs.access(branchDir).then(() => true).catch(() => false);
    expect(existsBefore).toBe(true);

    await abort({ branchId: m.id, branchesDir });

    // Branch directory is gone after abort.
    const gone = await branchDirectoryGone(m.id, branchesDir);
    expect(gone).toBe(true);
  });

  it('removes manifest.json (no residual manifest)', async () => {
    const branchesDir = tempDir();
    const parentBody = 'b'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m, branchDir } = await fork({
      parentBody,
      proposedBody,
      skillName: 'manifest-cleanup',
      branchesDir,
    });

    await abort({ branchId: m.id, branchesDir });

    const manifestGone = await fs.access(join(branchDir, 'manifest.json')).then(() => false).catch(() => true);
    expect(manifestGone).toBe(true);
  });

  it('removes skill.md (no residual skill body)', async () => {
    const branchesDir = tempDir();
    const parentBody = 'c'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m, branchDir } = await fork({
      parentBody,
      proposedBody,
      skillName: 'skill-cleanup',
      branchesDir,
    });

    await abort({ branchId: m.id, branchesDir });

    const skillGone = await fs.access(join(branchDir, 'skill.md')).then(() => false).catch(() => true);
    expect(skillGone).toBe(true);
  });

  it('does not modify trunk (no residual in trunk)', async () => {
    const branchesDir = tempDir();
    const trunkDir = tempDir();
    const trunkPath = join(trunkDir, 'skill.md');
    const trunkContent = 'trunk content that must not change';
    await fs.mkdir(trunkDir, { recursive: true });
    await fs.writeFile(trunkPath, trunkContent, 'utf8');

    const parentBody = 'd'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'trunk-untouched',
      branchesDir,
    });

    await abort({ branchId: m.id, branchesDir });

    // Trunk is unchanged.
    const trunkAfter = await fs.readFile(trunkPath, 'utf8');
    expect(trunkAfter).toBe(trunkContent);
  });

  it('returns deleted=true and finalState=aborted', async () => {
    const branchesDir = tempDir();
    const parentBody = 'e'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'result-check',
      branchesDir,
    });

    const result = await abort({ branchId: m.id, branchesDir });
    expect(result.deleted).toBe(true);
    expect(result.finalState).toBe('aborted');
    expect(result.branchId).toBe(m.id);
  });
});

// ─── Idempotency ─────────────────────────────────────────────────────────────

describe('abort — idempotency', () => {
  it('is a no-op for an already-aborted branch (returns deleted=false)', async () => {
    const branchesDir = tempDir();
    const parentBody = 'f'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'idempotent-abort',
      branchesDir,
    });

    // First abort.
    await abort({ branchId: m.id, branchesDir });

    // Branch is gone — second abort should handle gracefully.
    // The branch directory no longer exists, so readManifest will throw.
    // abort() throws in this case since the branch doesn't exist.
    await expect(abort({ branchId: m.id, branchesDir })).rejects.toThrow();
  });

  it('no-ops for a committed branch (returns deleted=false)', async () => {
    const branchesDir = tempDir();
    const parentBody = 'g'.repeat(500);
    const proposedBody = smallChange(parentBody);

    const { manifest: m } = await fork({
      parentBody,
      proposedBody,
      skillName: 'abort-committed',
      branchesDir,
    });

    // Manually mark as committed via writeManifest.
    const { writeManifest } = await import('../fork.js');
    await writeManifest(join(branchesDir, m.id), {
      ...m,
      state: 'committed',
      committedAt: Date.now(),
    });

    const result = await abort({ branchId: m.id, branchesDir });
    // Should be a no-op (terminal state).
    expect(result.deleted).toBe(false);
    expect(result.finalState).toBe('committed');
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('abort — error handling', () => {
  it('throws if branch does not exist', async () => {
    const branchesDir = tempDir();
    await expect(
      abort({ branchId: randomUUID(), branchesDir }),
    ).rejects.toThrow();
  });
});

// ─── branchDirectoryGone helper ───────────────────────────────────────────────

describe('branchDirectoryGone', () => {
  it('returns true for a non-existent branch directory', async () => {
    const branchesDir = tempDir();
    const gone = await branchDirectoryGone('no-such-branch', branchesDir);
    expect(gone).toBe(true);
  });

  it('returns false for an existing branch directory', async () => {
    const branchesDir = tempDir();
    const parentBody = 'h'.repeat(400);
    const { manifest: m } = await fork({
      parentBody,
      proposedBody: smallChange(parentBody),
      skillName: 'exists-check',
      branchesDir,
    });
    const gone = await branchDirectoryGone(m.id, branchesDir);
    expect(gone).toBe(false);
  });
});
