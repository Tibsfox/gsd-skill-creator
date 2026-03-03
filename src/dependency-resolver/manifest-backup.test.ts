import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createBackup, ManifestBackup } from './manifest-backup.js';

// ─── Test setup ───────────────────────────────────────────────────────────────

let testDir: string;
let manifestPath: string;
let lockfilePath: string;

beforeEach(async () => {
  testDir = await fs.mkdtemp(join(tmpdir(), 'manifest-backup-test-'));
  manifestPath = join(testDir, 'package.json');
  lockfilePath = join(testDir, 'package-lock.json');
  // Create a sample manifest
  await fs.writeFile(manifestPath, JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2));
});

afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createBackup', () => {
  it('creates backup directory with timestamped name', async () => {
    const record = await createBackup(manifestPath, null);
    expect(record.backupDir).toContain('.dependency-resolver-backups');
    const stat = await fs.stat(record.backupDir);
    expect(stat.isDirectory()).toBe(true);
  });

  it('copies manifest file into backup directory', async () => {
    const record = await createBackup(manifestPath, null);
    const backupManifest = join(record.backupDir, 'package.json');
    const content = await fs.readFile(backupManifest, 'utf-8');
    expect(content).toContain('"name": "test"');
  });

  it('copies lockfile when it exists', async () => {
    await fs.writeFile(lockfilePath, '{"lockfileVersion":2}');
    const record = await createBackup(manifestPath, lockfilePath);
    expect(record.lockfileExists).toBe(true);
    const backupLockfile = join(record.backupDir, 'package-lock.json');
    const content = await fs.readFile(backupLockfile, 'utf-8');
    expect(content).toContain('"lockfileVersion"');
  });

  it('records lockfileExists=false when lockfile path provided but file absent', async () => {
    // lockfilePath does not exist (not created in beforeEach)
    const record = await createBackup(manifestPath, lockfilePath);
    expect(record.lockfileExists).toBe(false);
  });

  it('records lockfileExists=false when lockfilePath=null', async () => {
    const record = await createBackup(manifestPath, null);
    expect(record.lockfileExists).toBe(false);
    expect(record.lockfilePath).toBeNull();
  });

  it('populates all BackupRecord fields correctly', async () => {
    await fs.writeFile(lockfilePath, '{}');
    const record = await createBackup(manifestPath, lockfilePath);
    expect(record.manifestPath).toBe(manifestPath);
    expect(record.lockfilePath).toBe(lockfilePath);
    expect(record.manifestExists).toBe(true);
    expect(record.lockfileExists).toBe(true);
    expect(record.backedUpAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    expect(record.backupDir).toBeTruthy();
  });

  it('returns absolute path for backupDir', async () => {
    const record = await createBackup(manifestPath, null);
    expect(record.backupDir.startsWith('/')).toBe(true);
  });

  it('throws when manifest does not exist', async () => {
    const nonExistent = join(testDir, 'nonexistent.json');
    await expect(createBackup(nonExistent, null)).rejects.toThrow();
  });

  it('writes backup-record.json into backup directory', async () => {
    const record = await createBackup(manifestPath, null);
    const recordFile = join(record.backupDir, 'backup-record.json');
    const content = JSON.parse(await fs.readFile(recordFile, 'utf-8'));
    expect(content.manifestPath).toBe(manifestPath);
    expect(content.backupDir).toBe(record.backupDir);
  });

  it('ManifestBackup class wraps createBackup', async () => {
    const backup = new ManifestBackup();
    const record = await backup.create(manifestPath, null);
    expect(record.manifestExists).toBe(true);
    expect(record.backupDir).toContain('.dependency-resolver-backups');
  });
});
