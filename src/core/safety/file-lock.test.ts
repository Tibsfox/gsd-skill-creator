import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileLock, LockError } from './file-lock.js';
import type { LockInfo } from './file-lock.js';

// ============================================================================
// FileLock Tests
// ============================================================================

describe('FileLock', () => {
  let tmpDir: string;
  let lockPath: string;
  let lock: FileLock;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'file-lock-test-'));
    lockPath = join(tmpDir, '.skill-creator.lock');
    lock = new FileLock(lockPath);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // acquire() tests
  // --------------------------------------------------------------------------

  describe('acquire()', () => {
    it('should succeed when no lock exists', async () => {
      const result = await lock.acquire('discover');
      expect(result.acquired).toBe(true);
      if (result.acquired) {
        await result.release();
      }
    });

    it('should write lockfile with PID, operation, timestamp, and hostname', async () => {
      const result = await lock.acquire('create');
      expect(result.acquired).toBe(true);

      const content = await readFile(lockPath, 'utf-8');
      const info: LockInfo = JSON.parse(content);

      expect(info.pid).toBe(process.pid);
      expect(info.operation).toBe('create');
      expect(info.acquiredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(typeof info.hostname).toBe('string');

      if (result.acquired) {
        await result.release();
      }
    });

    it('should fail with clear message when lock held by alive PID', async () => {
      // Acquire first lock
      const first = await lock.acquire('discover');
      expect(first.acquired).toBe(true);

      // Try to acquire second lock from same process (simulates contention)
      const second = await lock.acquire('create');
      expect(second.acquired).toBe(false);
      if (!second.acquired) {
        expect(second.holder.pid).toBe(process.pid);
        expect(second.holder.operation).toBe('discover');
        expect(second.message).toContain(String(process.pid));
        expect(second.message).toContain('discover');
      }

      if (first.acquired) {
        await first.release();
      }
    });

    it('should clean up stale lock from dead PID and acquire', async () => {
      // Write a lockfile with a PID that is guaranteed to be dead
      const staleLock: LockInfo = {
        pid: 2147483646, // Very high PID unlikely to exist
        operation: 'corpus-scan',
        acquiredAt: new Date().toISOString(),
        hostname: 'stale-host',
      };
      await writeFile(lockPath, JSON.stringify(staleLock), 'utf-8');

      // Should detect stale lock, clean it up, and acquire
      const result = await lock.acquire('discover');
      expect(result.acquired).toBe(true);

      if (result.acquired) {
        await result.release();
      }
    });

    it('should create parent directories if needed', async () => {
      const nestedPath = join(tmpDir, 'deep', 'nested', '.lock');
      const nestedLock = new FileLock(nestedPath);

      const result = await nestedLock.acquire('test');
      expect(result.acquired).toBe(true);

      if (result.acquired) {
        await result.release();
      }
    });
  });

  // --------------------------------------------------------------------------
  // release() tests
  // --------------------------------------------------------------------------

  describe('release()', () => {
    it('should remove lockfile from disk', async () => {
      const result = await lock.acquire('discover');
      expect(result.acquired).toBe(true);

      if (result.acquired) {
        await result.release();
      }

      // Lockfile should be gone
      const exists = await lock.isLocked();
      expect(exists).toBe(false);
    });

    it('should be idempotent (double release is no-op)', async () => {
      const result = await lock.acquire('discover');
      expect(result.acquired).toBe(true);

      if (result.acquired) {
        await result.release();
        // Second release should not throw
        await expect(result.release()).resolves.toBeUndefined();
      }
    });

    it('should allow re-acquisition after release', async () => {
      const first = await lock.acquire('discover');
      expect(first.acquired).toBe(true);
      if (first.acquired) {
        await first.release();
      }

      const second = await lock.acquire('create');
      expect(second.acquired).toBe(true);
      if (second.acquired) {
        await second.release();
      }
    });
  });

  // --------------------------------------------------------------------------
  // isLocked() tests
  // --------------------------------------------------------------------------

  describe('isLocked()', () => {
    it('should return false when no lockfile exists', async () => {
      const result = await lock.isLocked();
      expect(result).toBe(false);
    });

    it('should return true when lock is held by alive PID', async () => {
      const acq = await lock.acquire('discover');
      expect(acq.acquired).toBe(true);

      const result = await lock.isLocked();
      expect(result).toBe(true);

      if (acq.acquired) {
        await acq.release();
      }
    });

    it('should return false when lockfile has dead PID (stale)', async () => {
      const staleLock: LockInfo = {
        pid: 2147483646,
        operation: 'discover',
        acquiredAt: new Date().toISOString(),
        hostname: 'stale-host',
      };
      await writeFile(lockPath, JSON.stringify(staleLock), 'utf-8');

      const result = await lock.isLocked();
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // getLockInfo() tests
  // --------------------------------------------------------------------------

  describe('getLockInfo()', () => {
    it('should return null when no lockfile exists', async () => {
      const info = await lock.getLockInfo();
      expect(info).toBeNull();
    });

    it('should return parsed LockInfo when lockfile exists', async () => {
      const acq = await lock.acquire('refine');
      expect(acq.acquired).toBe(true);

      const info = await lock.getLockInfo();
      expect(info).not.toBeNull();
      expect(info!.pid).toBe(process.pid);
      expect(info!.operation).toBe('refine');

      if (acq.acquired) {
        await acq.release();
      }
    });

    it('should return null for corrupt lockfile', async () => {
      await writeFile(lockPath, 'not json at all', 'utf-8');

      const info = await lock.getLockInfo();
      expect(info).toBeNull();
    });
  });
});
