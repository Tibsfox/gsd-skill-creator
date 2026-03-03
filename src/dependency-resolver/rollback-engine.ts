/**
 * Restores manifest and lockfile from a BackupRecord to pre-modification state.
 *
 * RSLV-04 implementation.
 *
 * Never throws — returns success=false with failureReason on any error.
 */

import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';
import type { BackupRecord, RollbackResult } from './types.js';

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Restores the manifest and (if applicable) lockfile from a BackupRecord.
 *
 * Returns success=false (not thrown) on:
 * - Missing backup directory
 * - File copy failure
 */
export async function rollback(record: BackupRecord): Promise<RollbackResult> {
  // Check backup directory exists
  try {
    await fs.access(record.backupDir);
  } catch {
    return {
      success: false,
      backupDir: record.backupDir,
      restoredFiles: [],
      failureReason: `Backup directory not found: ${record.backupDir}`,
    };
  }

  const restoredFiles: string[] = [];

  try {
    // Restore manifest
    const manifestFilename = basename(record.manifestPath);
    await fs.copyFile(
      join(record.backupDir, manifestFilename),
      record.manifestPath,
    );
    restoredFiles.push(record.manifestPath);

    // Restore lockfile if it existed at backup time
    if (record.lockfileExists && record.lockfilePath !== null) {
      const lockfileFilename = basename(record.lockfilePath);
      await fs.copyFile(
        join(record.backupDir, lockfileFilename),
        record.lockfilePath,
      );
      restoredFiles.push(record.lockfilePath);
    }

    return {
      success: true,
      backupDir: record.backupDir,
      restoredFiles,
      failureReason: null,
    };
  } catch (err) {
    return {
      success: false,
      backupDir: record.backupDir,
      restoredFiles,
      failureReason: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing rollback() and listBackups() methods. */
export class RollbackEngine {
  rollback(record: BackupRecord): Promise<RollbackResult> {
    return rollback(record);
  }

  /**
   * Scans the `.dependency-resolver-backups/` directory adjacent to manifestDir
   * for backup records and returns them sorted most-recent-first.
   *
   * Returns [] when no backups directory or backup records exist.
   */
  async listBackups(manifestDir: string): Promise<BackupRecord[]> {
    const backupsRoot = join(manifestDir, '.dependency-resolver-backups');
    let entries: string[];

    try {
      const dirEntries = await fs.readdir(backupsRoot);
      entries = dirEntries;
    } catch {
      return [];
    }

    const records: BackupRecord[] = [];

    for (const entry of entries) {
      const recordFile = join(backupsRoot, entry, 'backup-record.json');
      try {
        const content = await fs.readFile(recordFile, 'utf-8');
        const record = JSON.parse(content) as BackupRecord;
        records.push(record);
      } catch {
        // Skip entries without a valid backup-record.json
      }
    }

    // Sort most-recent-first by backedUpAt
    return records.sort((a, b) => {
      if (a.backedUpAt > b.backedUpAt) return -1;
      if (a.backedUpAt < b.backedUpAt) return 1;
      return 0;
    });
  }
}
