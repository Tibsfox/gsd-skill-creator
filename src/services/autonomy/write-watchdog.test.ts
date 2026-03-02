/**
 * Tests for filesystem write watchdog.
 *
 * Covers:
 * - WriteWatchdog lifecycle: start, stop, isRunning
 * - recordWrite: timer reset behavior
 * - check/getStatus: timeout detection
 * - onTimeout: callback firing and one-shot behavior
 * - Edge cases: double start, double stop, recordWrite before start,
 *   check before start, zero timeout
 * - createWatchdog factory function
 *
 * Uses vi.useFakeTimers() for deterministic time control.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WriteWatchdog,
  createWatchdog,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_CHECK_INTERVAL_MS,
} from './write-watchdog.js';

// ============================================================================
// Setup/teardown for fake timers
// ============================================================================

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ============================================================================
// Named constants
// ============================================================================

describe('named constants', () => {
  it('should export DEFAULT_TIMEOUT_MS as 600000 (10 minutes)', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(600000);
  });

  it('should export DEFAULT_CHECK_INTERVAL_MS as 120000 (2 minutes)', () => {
    expect(DEFAULT_CHECK_INTERVAL_MS).toBe(120000);
  });
});

// ============================================================================
// WriteWatchdog lifecycle
// ============================================================================

describe('WriteWatchdog lifecycle', () => {
  it('should not be running before start()', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    expect(wd.isRunning()).toBe(false);
  });

  it('should be running after start()', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    expect(wd.isRunning()).toBe(true);
    wd.stop();
  });

  it('should not be running after stop()', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    wd.stop();
    expect(wd.isRunning()).toBe(false);
  });

  it('should be a no-op to start() twice', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    wd.start(); // should not create duplicate timers
    expect(wd.isRunning()).toBe(true);
    wd.stop();
  });

  it('should be a no-op to stop() twice', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    wd.stop();
    wd.stop(); // should not throw
    expect(wd.isRunning()).toBe(false);
  });
});

// ============================================================================
// check/getStatus
// ============================================================================

describe('check/getStatus', () => {
  it('should return isTimedOut: false right after start', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    const status = wd.check();
    expect(status.isTimedOut).toBe(false);
    expect(status.silentMs).toBeLessThanOrEqual(1);
    wd.stop();
  });

  it('should detect timeout after timeoutMs elapses', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout, timeoutMs: 600000 });
    wd.start();
    vi.advanceTimersByTime(600001);
    const status = wd.check();
    expect(status.isTimedOut).toBe(true);
    expect(status.silentMs).toBeGreaterThanOrEqual(600000);
    wd.stop();
  });

  it('should report silentMinutes correctly', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout, timeoutMs: 600000 });
    wd.start();
    vi.advanceTimersByTime(300000); // 5 minutes
    const status = wd.check();
    expect(status.silentMinutes).toBe(5);
    wd.stop();
  });

  it('should include actionable message on timeout', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout, timeoutMs: 60000 });
    wd.start();
    vi.advanceTimersByTime(60001);
    const status = wd.check();
    expect(status.message).toContain('no writes');
    expect(status.message).toContain('Halting');
    wd.stop();
  });

  it('getStatus should be alias for check', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    const checkResult = wd.check();
    const statusResult = wd.getStatus();
    expect(checkResult.isTimedOut).toBe(statusResult.isTimedOut);
    wd.stop();
  });

  it('should return isTimedOut: false when check() before start()', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    const status = wd.check();
    expect(status.isTimedOut).toBe(false);
  });
});

// ============================================================================
// recordWrite
// ============================================================================

describe('recordWrite', () => {
  it('should reset the timer', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout, timeoutMs: 60000 });
    wd.start();
    vi.advanceTimersByTime(50000); // 50 seconds
    wd.recordWrite('/some/file.ts');
    vi.advanceTimersByTime(50000); // another 50 seconds
    const status = wd.check();
    // Should not be timed out because recordWrite reset at 50s
    expect(status.isTimedOut).toBe(false);
    expect(status.silentMs).toBeLessThanOrEqual(50001);
    wd.stop();
  });

  it('should accept optional file path', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    wd.recordWrite('/path/to/file.ts');
    const status = wd.check();
    expect(status.isTimedOut).toBe(false);
    wd.stop();
  });

  it('should work without file path', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.start();
    wd.recordWrite();
    const status = wd.check();
    expect(status.isTimedOut).toBe(false);
    wd.stop();
  });

  it('should be valid to call before start()', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({ onTimeout });
    wd.recordWrite('/early/write.ts');
    // Should not throw
    expect(wd.isRunning()).toBe(false);
  });
});

// ============================================================================
// onTimeout callback
// ============================================================================

describe('onTimeout callback', () => {
  it('should fire when timeout is detected via periodic check', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({
      onTimeout,
      timeoutMs: 60000,
      checkIntervalMs: 30000,
    });
    wd.start();
    vi.advanceTimersByTime(90000); // past timeout, interval fires
    expect(onTimeout).toHaveBeenCalledTimes(1);
    wd.stop();
  });

  it('should fire exactly once per timeout (no re-trigger)', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({
      onTimeout,
      timeoutMs: 60000,
      checkIntervalMs: 10000,
    });
    wd.start();
    // Advance well past timeout, multiple intervals fire
    vi.advanceTimersByTime(120000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    wd.stop();
  });

  it('should re-arm after recordWrite()', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({
      onTimeout,
      timeoutMs: 60000,
      checkIntervalMs: 10000,
    });
    wd.start();
    vi.advanceTimersByTime(70000); // first timeout fires
    expect(onTimeout).toHaveBeenCalledTimes(1);

    wd.recordWrite(); // re-arm
    vi.advanceTimersByTime(70000); // second timeout fires
    expect(onTimeout).toHaveBeenCalledTimes(2);
    wd.stop();
  });

  it('should pass WatchdogStatus to callback', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({
      onTimeout,
      timeoutMs: 60000,
      checkIntervalMs: 30000,
    });
    wd.start();
    vi.advanceTimersByTime(90000);
    expect(onTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        isTimedOut: true,
        silentMs: expect.any(Number),
        silentMinutes: expect.any(Number),
        message: expect.stringContaining('no writes'),
      })
    );
    wd.stop();
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('edge cases', () => {
  it('should immediately timeout when timeoutMs is 0', () => {
    const onTimeout = vi.fn();
    const wd = new WriteWatchdog({
      onTimeout,
      timeoutMs: 0,
      checkIntervalMs: 1000,
    });
    wd.start();
    vi.advanceTimersByTime(1001); // first interval check
    expect(onTimeout).toHaveBeenCalledTimes(1);
    wd.stop();
  });
});

// ============================================================================
// createWatchdog factory
// ============================================================================

describe('createWatchdog', () => {
  it('should create a functional WriteWatchdog instance', () => {
    const onTimeout = vi.fn();
    const wd = createWatchdog(onTimeout);
    expect(wd).toBeInstanceOf(WriteWatchdog);
    wd.start();
    expect(wd.isRunning()).toBe(true);
    wd.stop();
  });

  it('should accept options', () => {
    const onTimeout = vi.fn();
    const wd = createWatchdog(onTimeout, { timeoutMs: 30000 });
    wd.start();
    vi.advanceTimersByTime(30001);
    const status = wd.check();
    expect(status.isTimedOut).toBe(true);
    wd.stop();
  });
});

// ============================================================================
// File-based persistence
// ============================================================================

import type { WatchdogFileState, WatchdogPersistIO } from './write-watchdog.js';

describe('file-based persistence', () => {
  /** Create a mock IO that stores data in memory */
  function makeMockIO(): WatchdogPersistIO & { stored: Map<string, string> } {
    const stored = new Map<string, string>();
    return {
      stored,
      writeFile: vi.fn(async (path: string, content: string) => {
        stored.set(path, content);
      }),
      readFile: vi.fn(async (path: string) => {
        const data = stored.get(path);
        if (data === undefined) throw new Error('ENOENT: file not found');
        return data;
      }),
    };
  }

  describe('WatchdogFileState interface shape', () => {
    it('should have all required fields when persisted', async () => {
      const onTimeout = vi.fn();
      const wd = new WriteWatchdog({ onTimeout, timeoutMs: 300000 });
      wd.start();
      wd.recordWrite('/some/file.ts');

      const io = makeMockIO();
      await wd.persistState('/tmp/watchdog-state.json', 'session-abc', io);

      const raw = io.stored.get('/tmp/watchdog-state.json');
      expect(raw).toBeDefined();
      const state: WatchdogFileState = JSON.parse(raw!);

      expect(state).toHaveProperty('last_write_at');
      expect(state).toHaveProperty('last_file');
      expect(state).toHaveProperty('session_id');
      expect(state).toHaveProperty('started_at');
      expect(state).toHaveProperty('timeout_ms');

      expect(typeof state.last_write_at).toBe('string');
      expect(typeof state.session_id).toBe('string');
      expect(typeof state.started_at).toBe('string');
      expect(typeof state.timeout_ms).toBe('number');

      wd.stop();
    });
  });

  describe('persistState', () => {
    it('should write valid JSON with all required fields', async () => {
      const onTimeout = vi.fn();
      const wd = new WriteWatchdog({ onTimeout, timeoutMs: 600000 });
      wd.start();
      wd.recordWrite('/path/to/code.ts');

      const io = makeMockIO();
      await wd.persistState('/state.json', 'sess-1', io);

      expect(io.writeFile).toHaveBeenCalledTimes(1);
      expect(io.writeFile).toHaveBeenCalledWith('/state.json', expect.any(String));

      const state: WatchdogFileState = JSON.parse(io.stored.get('/state.json')!);
      expect(state.session_id).toBe('sess-1');
      expect(state.timeout_ms).toBe(600000);
      expect(state.last_file).toBe('/path/to/code.ts');
      expect(new Date(state.last_write_at).getTime()).not.toBeNaN();
      expect(new Date(state.started_at).getTime()).not.toBeNaN();

      wd.stop();
    });

    it('should use injectable IO (not direct fs)', async () => {
      const onTimeout = vi.fn();
      const wd = new WriteWatchdog({ onTimeout });
      wd.start();

      const io = makeMockIO();
      await wd.persistState('/custom/path.json', 'sess-2', io);

      expect(io.writeFile).toHaveBeenCalledTimes(1);
      expect(io.writeFile).toHaveBeenCalledWith('/custom/path.json', expect.any(String));

      wd.stop();
    });

    it('should serialize last_file as null when no file path recorded', async () => {
      const onTimeout = vi.fn();
      const wd = new WriteWatchdog({ onTimeout });
      wd.start();
      // recordWrite without a file path
      wd.recordWrite();

      const io = makeMockIO();
      await wd.persistState('/state.json', 'sess-3', io);

      const state: WatchdogFileState = JSON.parse(io.stored.get('/state.json')!);
      expect(state.last_file).toBeNull();

      wd.stop();
    });
  });

  describe('loadState', () => {
    it('should read and return parsed state', async () => {
      const io = makeMockIO();
      const stateObj: WatchdogFileState = {
        last_write_at: '2026-03-01T12:00:00.000Z',
        last_file: '/test/file.ts',
        session_id: 'sess-load',
        started_at: '2026-03-01T11:00:00.000Z',
        timeout_ms: 600000,
      };
      io.stored.set('/state.json', JSON.stringify(stateObj));

      const loaded = await WriteWatchdog.loadState('/state.json', io);

      expect(loaded).not.toBeNull();
      expect(loaded!.session_id).toBe('sess-load');
      expect(loaded!.last_file).toBe('/test/file.ts');
      expect(loaded!.timeout_ms).toBe(600000);
    });

    it('should return null for missing file (readFile throws)', async () => {
      const io = makeMockIO();
      // Don't store anything -- readFile will throw ENOENT

      const loaded = await WriteWatchdog.loadState('/nonexistent.json', io);
      expect(loaded).toBeNull();
    });

    it('should return null for corrupt JSON', async () => {
      const io = makeMockIO();
      io.stored.set('/state.json', '{ broken json !!!');

      const loaded = await WriteWatchdog.loadState('/state.json', io);
      expect(loaded).toBeNull();
    });
  });
});
