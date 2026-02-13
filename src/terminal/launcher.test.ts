/**
 * TDD tests for the Wetty launcher and graceful shutdown.
 *
 * All tests mock child_process.spawn -- no real Wetty processes are
 * spawned. Covers TERM-01 (launcher starts Wetty with config) and
 * TERM-03 (graceful shutdown with cleanup).
 *
 * @module terminal/launcher.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { launchWetty, shutdownWetty } from './launcher.js';
import type { WettyProcess } from './types.js';
import type { TerminalConfig } from '../integration/config/terminal-types.js';

// ---------------------------------------------------------------------------
// Mock child_process.spawn
// ---------------------------------------------------------------------------

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

/**
 * Create a mock ChildProcess with EventEmitter behavior, pid,
 * stdout, stderr, and a kill method.
 */
function createMockChildProcess(pid: number = 12345): ChildProcess {
  const child = new EventEmitter() as ChildProcess & EventEmitter;
  (child as any).pid = pid;
  (child as any).stdout = new EventEmitter();
  (child as any).stderr = new EventEmitter();
  (child as any).stdin = null;
  (child as any).stdio = [null, (child as any).stdout, (child as any).stderr];
  (child as any).kill = vi.fn().mockReturnValue(true);
  (child as any).killed = false;
  (child as any).connected = false;
  (child as any).exitCode = null;
  (child as any).signalCode = null;
  (child as any).spawnargs = [];
  (child as any).spawnfile = '';

  // ref/unref for keeping/releasing event loop
  (child as any).ref = vi.fn();
  (child as any).unref = vi.fn();
  (child as any).disconnect = vi.fn();
  (child as any).send = vi.fn();
  (child as any)[Symbol.dispose] = vi.fn();

  return child;
}

/** Default terminal config matching Phase 123 defaults. */
const DEFAULT_CONFIG: TerminalConfig = {
  port: 11338,
  base_path: '/terminal',
  auth_mode: 'none',
  theme: 'dark',
  session_name: 'dev',
};

/** Helper to get the mocked spawn function. */
async function getMockedSpawn() {
  const cp = await import('node:child_process');
  return vi.mocked(cp.spawn);
}

// ---------------------------------------------------------------------------
// launchWetty -- spawns with correct arguments
// ---------------------------------------------------------------------------

describe('launchWetty -- spawns with correct arguments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('spawns wetty with --port and --base from config', async () => {
    const mockChild = createMockChildProcess(1001);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    await launchWetty({ config: DEFAULT_CONFIG });

    expect(spawn).toHaveBeenCalledWith(
      'wetty',
      expect.arrayContaining(['--port', '11338', '--base', '/terminal']),
      expect.any(Object),
    );
  });

  it('passes --command when command option is provided', async () => {
    const mockChild = createMockChildProcess(1002);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    await launchWetty({ config: DEFAULT_CONFIG, command: 'bash' });

    expect(spawn).toHaveBeenCalledWith(
      'wetty',
      expect.arrayContaining(['--command', 'bash']),
      expect.any(Object),
    );
  });

  it('passes --allow-iframe when allowIframe is true (default)', async () => {
    const mockChild = createMockChildProcess(1003);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    await launchWetty({ config: DEFAULT_CONFIG });

    expect(spawn).toHaveBeenCalledWith(
      'wetty',
      expect.arrayContaining(['--allow-iframe']),
      expect.any(Object),
    );
  });

  it('omits --allow-iframe when allowIframe is false', async () => {
    const mockChild = createMockChildProcess(1004);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    await launchWetty({ config: DEFAULT_CONFIG, allowIframe: false });

    const calledArgs = spawn.mock.calls[0]![1] as string[];
    expect(calledArgs).not.toContain('--allow-iframe');
  });
});

// ---------------------------------------------------------------------------
// launchWetty -- process state tracking
// ---------------------------------------------------------------------------

describe('launchWetty -- process state tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns WettyProcess with status running and pid from spawn', async () => {
    const mockChild = createMockChildProcess(2001);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    const result = await launchWetty({ config: DEFAULT_CONFIG });

    expect(result.status).toBe('running');
    expect(result.pid).toBe(2001);
  });

  it('sets url to http://localhost:{port}{base_path}', async () => {
    const mockChild = createMockChildProcess(2002);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    const result = await launchWetty({
      config: { ...DEFAULT_CONFIG, port: 8080, base_path: '/term' },
    });

    expect(result.url).toBe('http://localhost:8080/term');
  });

  it('sets startedAt to an ISO timestamp string', async () => {
    const mockChild = createMockChildProcess(2003);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('spawn'));

    const before = new Date().toISOString();
    const result = await launchWetty({ config: DEFAULT_CONFIG });
    const after = new Date().toISOString();

    expect(result.startedAt).not.toBeNull();
    expect(result.startedAt! >= before).toBe(true);
    expect(result.startedAt! <= after).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// launchWetty -- error handling
// ---------------------------------------------------------------------------

describe('launchWetty -- error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns WettyProcess with status error when spawn emits error', async () => {
    const mockChild = createMockChildProcess(3001);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('error', new Error('spawn ENOENT')));

    const result = await launchWetty({ config: DEFAULT_CONFIG });

    expect(result.status).toBe('error');
  });

  it('sets error message from spawn error', async () => {
    const mockChild = createMockChildProcess(3002);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);
    process.nextTick(() => mockChild.emit('error', new Error('spawn ENOENT')));

    const result = await launchWetty({ config: DEFAULT_CONFIG });

    expect(result.error).toBe('spawn ENOENT');
  });
});

// ---------------------------------------------------------------------------
// shutdownWetty -- graceful shutdown
// ---------------------------------------------------------------------------

describe('shutdownWetty -- graceful shutdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends SIGTERM to process pid', async () => {
    const mockChild = createMockChildProcess(4001);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);

    // Launch first to register the process
    process.nextTick(() => mockChild.emit('spawn'));
    const proc = await launchWetty({ config: DEFAULT_CONFIG });

    // Start shutdown and simulate process exit
    const shutdownPromise = shutdownWetty(proc);
    process.nextTick(() => mockChild.emit('close', 0, 'SIGTERM'));
    await vi.runAllTimersAsync();
    await shutdownPromise;

    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('resolves when process exits after SIGTERM', async () => {
    const mockChild = createMockChildProcess(4002);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);

    process.nextTick(() => mockChild.emit('spawn'));
    const proc = await launchWetty({ config: DEFAULT_CONFIG });

    const shutdownPromise = shutdownWetty(proc);
    process.nextTick(() => mockChild.emit('close', 0, 'SIGTERM'));
    await vi.runAllTimersAsync();
    await shutdownPromise;

    expect(proc.status).toBe('stopped');
  });

  it('sends SIGKILL after gracePeriodMs if process does not exit', async () => {
    const mockChild = createMockChildProcess(4003);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);

    process.nextTick(() => mockChild.emit('spawn'));
    const proc = await launchWetty({ config: DEFAULT_CONFIG });

    const shutdownPromise = shutdownWetty(proc, { gracePeriodMs: 100 });

    // Advance past grace period without process exiting
    await vi.advanceTimersByTimeAsync(101);

    // Now process exits from the SIGKILL
    mockChild.emit('close', null, 'SIGKILL');
    await shutdownPromise;

    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    expect(mockChild.kill).toHaveBeenCalledWith('SIGKILL');
  });
});

// ---------------------------------------------------------------------------
// shutdownWetty -- edge cases
// ---------------------------------------------------------------------------

describe('shutdownWetty -- edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw if process pid is null (already exited)', async () => {
    const proc: WettyProcess = {
      pid: null,
      status: 'stopped',
      url: 'http://localhost:3000/terminal',
      startedAt: new Date().toISOString(),
      stoppedAt: new Date().toISOString(),
      error: null,
    };

    await expect(shutdownWetty(proc)).resolves.not.toThrow();
  });

  it('does not throw if process.kill throws ESRCH (already gone)', async () => {
    const mockChild = createMockChildProcess(5002);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);

    process.nextTick(() => mockChild.emit('spawn'));
    const proc = await launchWetty({ config: DEFAULT_CONFIG });

    // Make kill throw ESRCH
    (mockChild.kill as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const err = new Error('kill ESRCH') as NodeJS.ErrnoException;
      err.code = 'ESRCH';
      throw err;
    });

    // Process already gone, so emit close immediately
    process.nextTick(() => mockChild.emit('close', null, null));
    await expect(shutdownWetty(proc)).resolves.not.toThrow();
  });

  it('updates WettyProcess status to stopped and sets stoppedAt', async () => {
    const mockChild = createMockChildProcess(5003);
    const spawn = await getMockedSpawn();
    spawn.mockReturnValue(mockChild);

    process.nextTick(() => mockChild.emit('spawn'));
    const proc = await launchWetty({ config: DEFAULT_CONFIG });

    expect(proc.stoppedAt).toBeNull();

    const shutdownPromise = shutdownWetty(proc);
    process.nextTick(() => mockChild.emit('close', 0, 'SIGTERM'));
    await shutdownPromise;

    expect(proc.status).toBe('stopped');
    expect(proc.stoppedAt).not.toBeNull();
    // stoppedAt should be a valid ISO string
    expect(() => new Date(proc.stoppedAt!).toISOString()).not.toThrow();
  });
});
