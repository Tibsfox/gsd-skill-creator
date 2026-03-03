import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rollback, RollbackEngine } from './rollback-engine.js';
import type { BackupRecord } from './types.js';

// ─── Test setup ───────────────────────────────────────────────────────────────

let testDir: string;
let manifestPath: string;
let lockfilePath: string;
let backupDir: string;

beforeEach(async () => {
  testDir = await fs.mkdtemp(join(tmpdir(), 'rollback-test-'));
  manifestPath = join(testDir, 'package.json');
  lockfilePath = join(testDir, 'package-lock.json');
  backupDir = join(testDir, '.dependency-resolver-backups', '20260303-120000-abcd');
  await fs.mkdir(backupDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

function makeRecord(opts: Partial<BackupRecord> = {}): BackupRecord {
  return {
    backupDir,
    manifestPath,
    lockfilePath,
    backedUpAt: '2026-03-03T12:00:00Z',
    manifestExists: true,
    lockfileExists: true,
    ...opts,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('rollback', () => {
  it('restores manifest from backup', async () => {
    const originalContent = '{"name":"original"}';
    await fs.writeFile(join(backupDir, 'package.json'), originalContent);
    await fs.writeFile(join(backupDir, 'package-lock.json'), '{}');
    // Current manifest is "modified"
    await fs.writeFile(manifestPath, '{"name":"modified"}');
    const result = await rollback(makeRecord());
    const restored = await fs.readFile(manifestPath, 'utf-8');
    expect(restored).toBe(originalContent);
    expect(result.success).toBe(true);
  });

  it('restores lockfile when lockfileExists=true', async () => {
    const origLock = '{"lockfileVersion":2}';
    await fs.writeFile(join(backupDir, 'package.json'), '{}');
    await fs.writeFile(join(backupDir, 'package-lock.json'), origLock);
    await fs.writeFile(manifestPath, '{}');
    await fs.writeFile(lockfilePath, '{"lockfileVersion":1}'); // modified
    const result = await rollback(makeRecord());
    const restored = await fs.readFile(lockfilePath, 'utf-8');
    expect(restored).toBe(origLock);
    expect(result.restoredFiles).toContain(lockfilePath);
  });

  it('skips lockfile restore when lockfileExists=false', async () => {
    await fs.writeFile(join(backupDir, 'package.json'), '{}');
    await fs.writeFile(manifestPath, '{}');
    const record = makeRecord({ lockfileExists: false });
    const result = await rollback(record);
    expect(result.success).toBe(true);
    // lockfilePath should NOT be in restoredFiles
    expect(result.restoredFiles).not.toContain(lockfilePath);
  });

  it('returns success=false when backupDir does not exist — no throw', async () => {
    const record = makeRecord({ backupDir: join(testDir, 'nonexistent-backup') });
    const result = await rollback(record);
    expect(result.success).toBe(false);
    expect(result.failureReason).toContain('not found');
    expect(result.restoredFiles).toHaveLength(0);
  });

  it('returns restoredFiles with correct paths', async () => {
    await fs.writeFile(join(backupDir, 'package.json'), '{}');
    await fs.writeFile(join(backupDir, 'package-lock.json'), '{}');
    await fs.writeFile(manifestPath, '{}');
    const result = await rollback(makeRecord());
    expect(result.restoredFiles).toContain(manifestPath);
    expect(result.restoredFiles).toContain(lockfilePath);
  });

  it('returns success=false on file copy error — no throw', async () => {
    // Don't create backup files — copy will fail
    await fs.writeFile(manifestPath, '{}');
    const result = await rollback(makeRecord());
    expect(result.success).toBe(false);
    expect(result.failureReason).toBeTruthy();
  });

  it('RollbackEngine class wraps rollback', async () => {
    await fs.writeFile(join(backupDir, 'package.json'), '{"name":"original"}');
    await fs.writeFile(join(backupDir, 'package-lock.json'), '{}');
    await fs.writeFile(manifestPath, '{"name":"modified"}');
    const engine = new RollbackEngine();
    const result = await engine.rollback(makeRecord());
    expect(result.success).toBe(true);
  });
});

describe('RollbackEngine.listBackups', () => {
  it('returns empty array when no backups directory exists', async () => {
    const engine = new RollbackEngine();
    const backups = await engine.listBackups(join(testDir, 'no-such-dir'));
    expect(backups).toEqual([]);
  });

  it('returns BackupRecords sorted most-recent-first', async () => {
    // Create two backup dirs with different timestamps
    const backupsRoot = join(testDir, '.dependency-resolver-backups');
    const dir1 = join(backupsRoot, '20260101-120000-aaa1');
    const dir2 = join(backupsRoot, '20260303-120000-bbb2');
    await fs.mkdir(dir1, { recursive: true });
    await fs.mkdir(dir2, { recursive: true });

    const record1: BackupRecord = {
      backupDir: dir1, manifestPath, lockfilePath, backedUpAt: '2026-01-01T12:00:00Z',
      manifestExists: true, lockfileExists: true,
    };
    const record2: BackupRecord = {
      backupDir: dir2, manifestPath, lockfilePath, backedUpAt: '2026-03-03T12:00:00Z',
      manifestExists: true, lockfileExists: true,
    };

    await fs.writeFile(join(dir1, 'backup-record.json'), JSON.stringify(record1));
    await fs.writeFile(join(dir2, 'backup-record.json'), JSON.stringify(record2));

    const engine = new RollbackEngine();
    const backups = await engine.listBackups(testDir);
    expect(backups).toHaveLength(2);
    // Most recent first
    expect(backups[0].backedUpAt).toBe('2026-03-03T12:00:00Z');
    expect(backups[1].backedUpAt).toBe('2026-01-01T12:00:00Z');
  });
});
