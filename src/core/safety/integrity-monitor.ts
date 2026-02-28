/**
 * Snapshot-based change detection for skill/agent directories.
 *
 * Takes snapshots of monitored directories (file paths + content hashes + mtimes)
 * and detects unexpected modifications by cross-referencing against the AuditLogger.
 * Changes are classified as "expected" (matching audit entry) or "unexpected" (no match).
 *
 * Implements ACL-01: Detect unexpected modifications to skill/agent directories.
 */

import { z } from 'zod';
import { createHash } from 'crypto';
import { readFile, writeFile, readdir, stat, mkdir, rename } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { AuditLogger } from './audit-logger.js';
import type { AuditEntry } from './audit-logger.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const FileInfoSchema = z.object({
  hash: z.string(),
  size: z.number(),
  mtime: z.number(),
}).passthrough();

const IntegritySnapshotSchema = z.object({
  createdAt: z.string(),
  directories: z.array(z.string()),
  files: z.record(z.string(), FileInfoSchema),
}).passthrough();

// ============================================================================
// TypeScript Types
// ============================================================================

export interface IntegritySnapshot {
  createdAt: string;
  directories: string[];
  files: Record<string, {
    hash: string;
    size: number;
    mtime: number;
  }>;
}

export interface FileChange {
  type: 'added' | 'removed' | 'modified';
  filePath: string;
  expected: boolean;
}

export interface IntegrityReport {
  checkedAt: string;
  totalFiles: number;
  changes: FileChange[];
  unexpectedChanges: FileChange[];
}

export interface IntegrityMonitorOptions {
  directories?: string[];
  snapshotPath?: string;
  auditLogger?: AuditLogger;
}

// ============================================================================
// IntegrityMonitor
// ============================================================================

/**
 * Snapshot-based change detection for skill/agent directories.
 *
 * Follows the ScanStateStore pattern for atomic writes (write tmp then rename).
 * Cross-references changes against the AuditLogger to classify expected vs unexpected.
 */
export class IntegrityMonitor {
  private readonly directories: string[];
  private readonly snapshotPath: string;
  private readonly auditLogger: AuditLogger;

  constructor(options?: IntegrityMonitorOptions) {
    this.directories = options?.directories ?? ['.claude/skills', '.claude/agents'];
    this.snapshotPath = options?.snapshotPath ?? '.claude/.integrity-snapshot.json';
    this.auditLogger = options?.auditLogger ?? new AuditLogger();
  }

  /**
   * Walk all monitored directories recursively, compute SHA-256 hash of each file.
   * Save snapshot JSON to snapshotPath. Return the snapshot.
   */
  async snapshot(): Promise<IntegritySnapshot> {
    const files: Record<string, { hash: string; size: number; mtime: number }> = {};

    for (const dir of this.directories) {
      await this.walkDirectory(dir, files);
    }

    const snapshot: IntegritySnapshot = {
      createdAt: new Date().toISOString(),
      directories: [...this.directories],
      files,
    };

    // Atomic write: temp file in same directory, then rename
    await mkdir(dirname(this.snapshotPath), { recursive: true });
    const tempPath = join(
      dirname(this.snapshotPath),
      `.integrity-snapshot-${Date.now()}-${Math.random().toString(36).slice(2)}.json.tmp`,
    );

    await writeFile(tempPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    await rename(tempPath, this.snapshotPath);

    return snapshot;
  }

  /**
   * Load saved snapshot, walk directories again, diff to find changes.
   * Cross-reference changes against audit logger to classify expected vs unexpected.
   *
   * @throws Error if no prior snapshot exists
   */
  async check(): Promise<IntegrityReport> {
    // Load saved snapshot
    let snapshotContent: string;
    try {
      snapshotContent = await readFile(this.snapshotPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('No integrity snapshot found');
      }
      throw err;
    }

    const parsed = JSON.parse(snapshotContent);
    const result = IntegritySnapshotSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error('Invalid integrity snapshot format');
    }

    const savedSnapshot = result.data as IntegritySnapshot;

    // Walk directories again for current state
    const currentFiles: Record<string, { hash: string; size: number; mtime: number }> = {};
    for (const dir of this.directories) {
      await this.walkDirectory(dir, currentFiles);
    }

    // Get recent audit entries (24h window)
    const recentEntries = await this.auditLogger.getRecentEntries(24 * 60 * 60 * 1000);

    // Diff: find added, removed, modified
    const changes: FileChange[] = [];

    // Check for added and modified files
    for (const filePath of Object.keys(currentFiles)) {
      if (!(filePath in savedSnapshot.files)) {
        // Added file
        const expected = this.isExpectedChange('added', filePath, recentEntries);
        changes.push({ type: 'added', filePath, expected });
      } else if (currentFiles[filePath].hash !== savedSnapshot.files[filePath].hash) {
        // Modified file
        const expected = this.isExpectedChange('modified', filePath, recentEntries);
        changes.push({ type: 'modified', filePath, expected });
      }
    }

    // Check for removed files
    for (const filePath of Object.keys(savedSnapshot.files)) {
      if (!(filePath in currentFiles)) {
        const expected = this.isExpectedChange('removed', filePath, recentEntries);
        changes.push({ type: 'removed', filePath, expected });
      }
    }

    const unexpectedChanges = changes.filter(c => !c.expected);

    return {
      checkedAt: new Date().toISOString(),
      totalFiles: Object.keys(currentFiles).length,
      changes,
      unexpectedChanges,
    };
  }

  /**
   * Convenience: check if there are any unexpected changes.
   */
  async hasUnexpectedChanges(): Promise<boolean> {
    const report = await this.check();
    return report.unexpectedChanges.length > 0;
  }

  /**
   * Check if a change is expected by cross-referencing audit log entries.
   *
   * Maps change types to appropriate audit operations:
   * - added -> create
   * - modified -> update, refine, migrate, rollback
   * - removed -> delete
   */
  private isExpectedChange(
    changeType: 'added' | 'removed' | 'modified',
    filePath: string,
    auditEntries: AuditEntry[],
  ): boolean {
    const matchingEntries = auditEntries.filter(e => e.filePath === filePath);
    if (matchingEntries.length === 0) return false;

    switch (changeType) {
      case 'added':
        return matchingEntries.some(e => e.operation === 'create');
      case 'modified':
        return matchingEntries.some(e =>
          e.operation === 'update' ||
          e.operation === 'refine' ||
          e.operation === 'migrate' ||
          e.operation === 'rollback'
        );
      case 'removed':
        return matchingEntries.some(e => e.operation === 'delete');
      default:
        return false;
    }
  }

  /**
   * Recursively walk a directory and compute SHA-256 hashes for all files.
   */
  private async walkDirectory(
    dir: string,
    files: Record<string, { hash: string; size: number; mtime: number }>,
  ): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Directory doesn't exist yet -- treat as empty
        return;
      }
      throw err;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, files);
      } else if (entry.isFile()) {
        const content = await readFile(fullPath, 'utf-8');
        const hash = createHash('sha256').update(content).digest('hex');
        const fileStat = await stat(fullPath);

        files[fullPath] = {
          hash,
          size: fileStat.size,
          mtime: fileStat.mtimeMs,
        };
      }
    }
  }
}
