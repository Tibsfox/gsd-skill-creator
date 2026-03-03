/**
 * Creates timestamped backup copies of manifest and lockfile before any
 * modification. Backup must succeed before the caller writes anything.
 *
 * RSLV-01 implementation.
 */

import { promises as fs } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import type { BackupRecord } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a timestamped + random backup directory name. */
function backupDirName(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('');
  const timePart = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
  const random = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${datePart}-${timePart}-${random}`;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Creates a backup of the manifest (and optionally the lockfile) in a
 * timestamped subdirectory adjacent to the manifest.
 *
 * Also writes `backup-record.json` into the backup directory so that
 * RollbackEngine.listBackups() can reconstruct BackupRecord without memory.
 *
 * Throws if:
 * - manifestPath does not exist (nothing to back up)
 * - backup directory creation fails
 * - manifest copy fails
 */
export async function createBackup(
  manifestPath: string,
  lockfilePath: string | null,
): Promise<BackupRecord> {
  // Verify manifest exists
  try {
    await fs.access(manifestPath);
  } catch {
    throw new Error(`Cannot create backup: manifest not found at ${manifestPath}`);
  }

  // Create backup directory
  const manifestDir = dirname(manifestPath);
  const backupsRoot = join(manifestDir, '.dependency-resolver-backups');
  const backupDir = join(backupsRoot, backupDirName());
  await fs.mkdir(backupDir, { recursive: true });

  // Copy manifest
  await fs.copyFile(manifestPath, join(backupDir, basename(manifestPath)));

  // Copy lockfile if provided and exists
  let lockfileExists = false;
  if (lockfilePath !== null) {
    try {
      await fs.access(lockfilePath);
      await fs.copyFile(lockfilePath, join(backupDir, basename(lockfilePath)));
      lockfileExists = true;
    } catch {
      // Lockfile doesn't exist — not an error, just record it
      lockfileExists = false;
    }
  }

  const record: BackupRecord = {
    backupDir,
    manifestPath,
    lockfilePath,
    backedUpAt: new Date().toISOString(),
    manifestExists: true,
    lockfileExists,
  };

  // Write backup-record.json for listBackups() discovery
  await fs.writeFile(
    join(backupDir, 'backup-record.json'),
    JSON.stringify(record, null, 2),
    'utf-8',
  );

  return record;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for createBackup, providing a stateful API surface. */
export class ManifestBackup {
  create(manifestPath: string, lockfilePath: string | null): Promise<BackupRecord> {
    return createBackup(manifestPath, lockfilePath);
  }
}
