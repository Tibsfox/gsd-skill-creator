/**
 * CF-M4-01: Cross-platform fork/explore/commit cycle (no filesystem-specific primitives).
 * SC-REFINE-BOUND: 20% bound enforced at fork time.
 *
 * Tests use Node's `os.tmpdir()` as the branches root so they work on
 * macOS, Linux, and Windows without any OS-specific filesystem features.
 * Path separators are via `path.join` throughout.
 *
 * @module branches/__tests__/fork.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir, platform } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fork, readManifest, DEFAULT_BRANCHES_DIR, MANIFEST_FILENAME, SKILL_FILENAME } from '../fork.js';
import { MAX_DELTA_FRACTION } from '../delta.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempBranchesDir(): string {
  return join(tmpdir(), `m4-fork-test-${randomUUID()}`);
}

const cleanupDirs: string[] = [];

function trackCleanup(dir: string): string {
  cleanupDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of cleanupDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

// ─── CF-M4-01: Cross-platform fork smoke test ─────────────────────────────────

describe('CF-M4-01: cross-platform fork smoke', () => {
  it(`runs on current platform: ${platform()}`, async () => {
    // This test is platform-aware: the path separator and tmpdir location
    // differ between platforms, but path.join handles them correctly.
    const branchesDir = trackCleanup(tempBranchesDir());
    const branchId = randomUUID();

    // 1000-byte parent; change last 50 bytes (5% of body — well within 20%)
    const parentBody = 'a'.repeat(1000);
    const proposedBody = 'a'.repeat(950) + 'b'.repeat(50);

    const result = await fork({
      parentBody,
      proposedBody,
      skillName: 'test-skill',
      branchesDir,
      branchId,
    });

    // Manifest exists and is valid.
    expect(result.manifest.id).toBe(branchId);
    expect(result.manifest.skillName).toBe('test-skill');
    expect(result.manifest.state).toBe('open');
    expect(result.manifest.deltaFraction).toBeLessThanOrEqual(MAX_DELTA_FRACTION);

    // Verify branch directory was created with correct path separator.
    const expectedDir = join(branchesDir, branchId);
    expect(result.branchDir).toBe(expectedDir);

    // Manifest file is readable on disk.
    const diskManifest = await readManifest(result.branchDir);
    expect(diskManifest.id).toBe(branchId);

    // Skill body file is present.
    const skillContent = await fs.readFile(join(result.branchDir, SKILL_FILENAME), 'utf8');
    expect(skillContent).toBe(proposedBody);

    // Manifest filename is correct.
    const manifestExists = await fs.access(join(result.branchDir, MANIFEST_FILENAME))
      .then(() => true)
      .catch(() => false);
    expect(manifestExists).toBe(true);
  });

  it('creates branch directory using path.join (not hardcoded separators)', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const branchId = 'test-branch-id';
    const parentBody = 'x'.repeat(500);
    const proposedBody = 'x'.repeat(490) + 'y'.repeat(10); // 2% change → within bound

    const result = await fork({
      parentBody,
      proposedBody,
      skillName: 'sep-test',
      branchesDir,
      branchId,
    });

    // The branchDir path must be formed with the correct platform separator.
    const expected = join(branchesDir, branchId);
    expect(result.branchDir).toBe(expected);

    // Verify via stat (not string comparison) that the directory exists.
    const stat = await fs.stat(result.branchDir);
    expect(stat.isDirectory()).toBe(true);
  });

  it('generates a UUID branch ID when none is provided', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const parentBody = 'a'.repeat(200);
    const proposedBody = 'a'.repeat(190) + 'b'.repeat(10); // 5% → within bound

    const result = await fork({
      parentBody,
      proposedBody,
      skillName: 'uuid-test',
      branchesDir,
    });

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(result.manifest.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

// ─── SC-REFINE-BOUND: 20% bound enforcement ──────────────────────────────────

describe('SC-REFINE-BOUND: 20% bound enforced at fork', () => {
  it('rejects a proposed body exceeding the 20% bound', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const parentBody = 'a'.repeat(1000);
    // Change 400 bytes → 40% of parent → exceeds 20%
    const proposedBody = 'a'.repeat(600) + 'b'.repeat(400);

    await expect(
      fork({ parentBody, proposedBody, skillName: 'x', branchesDir }),
    ).rejects.toThrow('SC-REFINE-BOUND');
  });

  it('accepts a proposed body at exactly the 20% bound edge', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    // 1000 bytes parent. Change just under 20% = 100 bytes changed per side.
    // changedBytes = parentChanged + proposedChanged = 100 + 100 = 200
    // denominator = 1000
    // fraction = 200/1000 = 0.20 — exactly at boundary.
    // Our check is fraction > 0.20 (strict), so 0.20 is accepted.
    const parentBody = 'a'.repeat(1000);
    const proposedBody = 'a'.repeat(900) + 'b'.repeat(100);
    // changedBytes: prefix=900 common, suffix=0, parentChanged=100, proposedChanged=100
    // fraction = 200/1000 = 0.20 exactly → not exceeding (strict >)
    const result = await fork({
      parentBody,
      proposedBody,
      skillName: 'edge-test',
      branchesDir,
    });
    expect(result.manifest.state).toBe('open');
    expect(result.manifest.deltaFraction).toBeLessThanOrEqual(0.20);
  });

  it('does NOT create a branch directory on rejection', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const branchId = randomUUID();
    const parentBody = 'a'.repeat(1000);
    const proposedBody = 'b'.repeat(1000); // 100% change → rejected

    await expect(
      fork({ parentBody, proposedBody, skillName: 'x', branchesDir, branchId }),
    ).rejects.toThrow();

    // No branch directory created.
    const exists = await fs.access(join(branchesDir, branchId))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('stores the delta fraction in the manifest', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const parentBody = 'a'.repeat(1000);
    const proposedBody = 'a'.repeat(950) + 'b'.repeat(50); // ~5% change
    const result = await fork({
      parentBody,
      proposedBody,
      skillName: 'fraction-test',
      branchesDir,
    });
    expect(result.manifest.deltaFraction).toBeGreaterThan(0);
    expect(result.manifest.deltaFraction).toBeLessThanOrEqual(0.20);
  });
});

// ─── Manifest content verification ───────────────────────────────────────────

describe('fork — manifest content', () => {
  it('writes correct parent hash', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    // Use a large enough body so the small change stays within the 20% bound.
    const parentBody = 'a'.repeat(500) + 'hello world';
    const proposedBody = 'a'.repeat(500) + 'hello earth'; // ~2% change

    const result = await fork({ parentBody, proposedBody, skillName: 'hash-test', branchesDir });

    // parentHash must be a valid 64-char hex string (SHA-256).
    expect(result.manifest.parentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records correct byte lengths', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const parentBody = 'x'.repeat(500);
    const proposedBody = 'x'.repeat(490) + 'y'.repeat(10);

    const result = await fork({ parentBody, proposedBody, skillName: 'len-test', branchesDir });
    expect(result.manifest.parentByteLength).toBe(500);
    expect(result.manifest.proposedByteLength).toBe(500);
  });

  it('initialises explore counters to zero', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const parentBody = 'a'.repeat(300);
    const proposedBody = 'a'.repeat(280) + 'b'.repeat(20);

    const result = await fork({ parentBody, proposedBody, skillName: 'counters', branchesDir });
    expect(result.manifest.exploreSessionCount).toBe(0);
    expect(result.manifest.tracePaths).toEqual([]);
  });

  it('uses the provided timestamp', async () => {
    const branchesDir = trackCleanup(tempBranchesDir());
    const ts = 1_700_000_000_000;
    const parentBody = 'a'.repeat(300);
    const proposedBody = 'a'.repeat(280) + 'b'.repeat(20);

    const result = await fork({
      parentBody,
      proposedBody,
      skillName: 'ts-test',
      branchesDir,
      ts,
    });
    expect(result.manifest.createdAt).toBe(ts);
  });
});

// ─── DEFAULT_BRANCHES_DIR ─────────────────────────────────────────────────────

describe('DEFAULT_BRANCHES_DIR', () => {
  it('is a non-empty string', () => {
    expect(typeof DEFAULT_BRANCHES_DIR).toBe('string');
    expect(DEFAULT_BRANCHES_DIR.length).toBeGreaterThan(0);
  });
});
