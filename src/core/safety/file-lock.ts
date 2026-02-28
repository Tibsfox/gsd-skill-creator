/**
 * File-based mutual exclusion for CLI operations.
 *
 * Prevents concurrent CLI operations from corrupting shared state by using
 * lockfiles with PID tracking and stale lock detection. Uses O_EXCL flag
 * for atomic lockfile creation to avoid race conditions.
 *
 * Implements ACL-07: File-based locks prevent concurrent CLI operations.
 */

import { z } from 'zod';
import { open, readFile, unlink, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { hostname } from 'os';

// ============================================================================
// Zod Schemas
// ============================================================================

const LockInfoSchema = z.object({
  pid: z.number(),
  operation: z.string(),
  acquiredAt: z.string(),
  hostname: z.string(),
}).passthrough();

// ============================================================================
// TypeScript Types
// ============================================================================

export interface LockInfo {
  pid: number;
  operation: string;
  acquiredAt: string;
  hostname: string;
}

export type LockAcquireResult =
  | { acquired: true; release: () => Promise<void> }
  | { acquired: false; holder: LockInfo; message: string };

/**
 * Custom error for lock-related failures.
 */
export class LockError extends Error {
  override name = 'LockError' as const;

  constructor(message: string) {
    super(message);
  }
}

// ============================================================================
// FileLock
// ============================================================================

/**
 * File-based mutual exclusion for CLI operations.
 *
 * Uses O_EXCL flag for atomic lockfile creation. Detects and cleans up
 * stale locks from crashed processes by checking if the holding PID is alive.
 */
export class FileLock {
  private readonly lockPath: string;
  private released = false;

  constructor(lockPath: string = '.claude/.skill-creator.lock') {
    this.lockPath = lockPath;
  }

  /**
   * Attempt to acquire the lock for the given operation.
   *
   * If lockfile exists and holding PID is dead, removes stale lock and retries.
   * If lockfile exists and holding PID is alive, returns failure with clear message.
   *
   * Uses O_EXCL flag for atomic check-and-create.
   */
  async acquire(operation: string): Promise<LockAcquireResult> {
    return this.tryAcquire(operation, true);
  }

  /**
   * Release the lock. Removes lockfile from disk.
   *
   * Idempotent: no-op if already released or lockfile doesn't exist.
   * Only releases if current PID matches lock holder.
   */
  async release(): Promise<void> {
    if (this.released) return;

    try {
      // Verify we own the lock before releasing
      const info = await this.getLockInfo();
      if (info && info.pid === process.pid) {
        await unlink(this.lockPath);
      }
      this.released = true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Already removed
        this.released = true;
        return;
      }
      throw err;
    }
  }

  /**
   * Check if the lock is currently held by an alive process.
   *
   * Returns false if no lockfile exists or if the holding PID is dead (stale).
   */
  async isLocked(): Promise<boolean> {
    const info = await this.getLockInfo();
    if (!info) return false;

    return this.isPidAlive(info.pid);
  }

  /**
   * Read and parse the lockfile.
   *
   * @returns Parsed LockInfo, or null if no lockfile or corrupt content.
   */
  async getLockInfo(): Promise<LockInfo | null> {
    let content: string;
    try {
      content = await readFile(this.lockPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }

    try {
      const parsed = JSON.parse(content);
      const result = LockInfoSchema.safeParse(parsed);
      if (!result.success) return null;
      return result.data as LockInfo;
    } catch {
      // Corrupt lockfile
      return null;
    }
  }

  /**
   * Internal: attempt to acquire with optional stale lock retry.
   */
  private async tryAcquire(operation: string, allowRetry: boolean): Promise<LockAcquireResult> {
    // Ensure parent directory exists
    await mkdir(dirname(this.lockPath), { recursive: true });

    const lockInfo: LockInfo = {
      pid: process.pid,
      operation,
      acquiredAt: new Date().toISOString(),
      hostname: hostname(),
    };

    try {
      // O_CREAT | O_EXCL: fails if file already exists (atomic)
      const handle = await open(this.lockPath, 'wx');
      await handle.writeFile(JSON.stringify(lockInfo), 'utf-8');
      await handle.close();

      this.released = false;

      // Create a release function that captures the lock path
      const lockPath = this.lockPath;
      const release = async () => {
        try {
          const content = await readFile(lockPath, 'utf-8');
          const info = JSON.parse(content) as LockInfo;
          if (info.pid === process.pid) {
            await unlink(lockPath);
          }
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw err;
          }
        }
      };

      return { acquired: true, release };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw err;
      }

      // Lockfile exists -- read it and check if holder is alive
      const existingInfo = await this.getLockInfo();
      if (!existingInfo) {
        // Corrupt lockfile -- remove and retry
        if (allowRetry) {
          try { await unlink(this.lockPath); } catch { /* ignore */ }
          return this.tryAcquire(operation, false);
        }
        throw new LockError('Unable to read existing lockfile');
      }

      // Check if holding PID is alive
      if (!this.isPidAlive(existingInfo.pid)) {
        // Stale lock -- remove and retry
        if (allowRetry) {
          try { await unlink(this.lockPath); } catch { /* ignore */ }
          return this.tryAcquire(operation, false);
        }
        throw new LockError('Stale lock detected but retry exhausted');
      }

      // Lock is held by alive process
      return {
        acquired: false,
        holder: existingInfo,
        message: `Lock held by PID ${existingInfo.pid} (operation: ${existingInfo.operation}, acquired: ${existingInfo.acquiredAt}). Another skill-creator instance is running.`,
      };
    }
  }

  /**
   * Check if a PID is alive using process.kill(pid, 0).
   *
   * Signal 0 checks existence without sending a signal.
   * ESRCH means the process does not exist.
   */
  private isPidAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
