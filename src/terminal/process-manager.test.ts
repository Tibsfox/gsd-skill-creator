/**
 * Tests for TerminalProcessManager.
 *
 * Mocks launcher.js and health.js at the module level so we
 * test orchestration logic without spawning real processes or
 * making HTTP requests.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { WettyProcess, HealthCheckResult } from './types.js';
import { DEFAULT_TERMINAL_CONFIG } from '../integration/config/terminal-schema.js';

// Mock the launcher, health, and session modules
vi.mock('./launcher.js', () => ({
  launchWetty: vi.fn(),
  shutdownWetty: vi.fn(),
}));
vi.mock('./health.js', () => ({
  checkHealth: vi.fn(),
}));
vi.mock('./session.js', () => ({
  buildSessionCommand: vi.fn(),
  listTmuxSessions: vi.fn(),
}));

// Import after mocks are set up
import { launchWetty, shutdownWetty } from './launcher.js';
import { checkHealth } from './health.js';
import { buildSessionCommand } from './session.js';
import { TerminalProcessManager } from './process-manager.js';

const mockLaunchWetty = launchWetty as Mock;
const mockShutdownWetty = shutdownWetty as Mock;
const mockCheckHealth = checkHealth as Mock;
const mockBuildSessionCommand = buildSessionCommand as Mock;

/** Helper: build a mock WettyProcess for launchWetty return value. */
function mockWettyProcess(overrides: Partial<WettyProcess> = {}): WettyProcess {
  return {
    pid: 12345,
    status: 'running',
    url: `http://localhost:${DEFAULT_TERMINAL_CONFIG.port}${DEFAULT_TERMINAL_CONFIG.base_path}`,
    startedAt: '2026-02-13T10:00:00.000Z',
    stoppedAt: null,
    error: null,
    ...overrides,
  };
}

/** Helper: build a healthy HealthCheckResult. */
function mockHealthy(): HealthCheckResult {
  return {
    healthy: true,
    statusCode: 200,
    responseTimeMs: 50,
    error: null,
  };
}

/** Helper: build an unhealthy HealthCheckResult. */
function mockUnhealthy(): HealthCheckResult {
  return {
    healthy: false,
    statusCode: null,
    responseTimeMs: 0,
    error: 'Connection refused',
  };
}

describe('TerminalProcessManager', () => {
  let manager: TerminalProcessManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new TerminalProcessManager(DEFAULT_TERMINAL_CONFIG);

    // Default mock implementations
    mockLaunchWetty.mockResolvedValue(mockWettyProcess());
    mockShutdownWetty.mockResolvedValue(undefined);
    mockCheckHealth.mockResolvedValue(mockHealthy());
  });

  // ---------------------------------------------------------------
  // start() -- launching
  // ---------------------------------------------------------------
  describe('start() -- launching', () => {
    it('calls launchWetty with config-derived LaunchOptions', async () => {
      await manager.start();

      expect(mockLaunchWetty).toHaveBeenCalledOnce();
      const opts = mockLaunchWetty.mock.calls[0][0];
      expect(opts.config).toEqual(DEFAULT_TERMINAL_CONFIG);
    });

    it('returns ServiceStatus with process=running', async () => {
      const result = await manager.start();

      expect(result.process).toBe('running');
    });

    it('returns ServiceStatus with pid from WettyProcess', async () => {
      const result = await manager.start();

      expect(result.pid).toBe(12345);
    });

    it('returns ServiceStatus with url from config', async () => {
      const result = await manager.start();

      const expectedUrl = `http://localhost:${DEFAULT_TERMINAL_CONFIG.port}${DEFAULT_TERMINAL_CONFIG.base_path}`;
      expect(result.url).toBe(expectedUrl);
    });

    it('sets healthy=false initially (health check runs on status())', async () => {
      const result = await manager.start();

      expect(result.healthy).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // start() -- already running
  // ---------------------------------------------------------------
  describe('start() -- already running', () => {
    it('does NOT call launchWetty when already running', async () => {
      await manager.start();
      mockLaunchWetty.mockClear();

      await manager.start();

      expect(mockLaunchWetty).not.toHaveBeenCalled();
    });

    it('returns current ServiceStatus with existing pid', async () => {
      await manager.start();
      const result = await manager.start();

      expect(result.process).toBe('running');
      expect(result.pid).toBe(12345);
    });
  });

  // ---------------------------------------------------------------
  // stop() -- shutdown
  // ---------------------------------------------------------------
  describe('stop() -- shutdown', () => {
    it('calls shutdownWetty with the active WettyProcess', async () => {
      await manager.start();
      await manager.stop();

      expect(mockShutdownWetty).toHaveBeenCalledOnce();
      const proc = mockShutdownWetty.mock.calls[0][0];
      expect(proc.pid).toBe(12345);
    });

    it('returns ServiceStatus with process=stopped and pid=null', async () => {
      await manager.start();
      const result = await manager.stop();

      expect(result.process).toBe('stopped');
      expect(result.pid).toBeNull();
    });

    it('sets healthy=false after stop', async () => {
      await manager.start();
      const result = await manager.stop();

      expect(result.healthy).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // stop() -- already stopped
  // ---------------------------------------------------------------
  describe('stop() -- already stopped', () => {
    it('does NOT call shutdownWetty when already stopped', async () => {
      const result = await manager.stop();

      expect(mockShutdownWetty).not.toHaveBeenCalled();
      expect(result.process).toBe('stopped');
    });

    it('returns ServiceStatus with process=stopped', async () => {
      const result = await manager.stop();

      expect(result.process).toBe('stopped');
      expect(result.pid).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // status() -- health integration
  // ---------------------------------------------------------------
  describe('status() -- health integration', () => {
    it('calls checkHealth with the Wetty URL when process is running', async () => {
      await manager.start();
      await manager.status();

      const expectedUrl = `http://localhost:${DEFAULT_TERMINAL_CONFIG.port}${DEFAULT_TERMINAL_CONFIG.base_path}`;
      expect(mockCheckHealth).toHaveBeenCalledWith(expectedUrl);
    });

    it('returns ServiceStatus with healthy=true when health check passes', async () => {
      mockCheckHealth.mockResolvedValue(mockHealthy());

      await manager.start();
      const result = await manager.status();

      expect(result.healthy).toBe(true);
    });

    it('returns ServiceStatus with healthy=false when health check fails', async () => {
      mockCheckHealth.mockResolvedValue(mockUnhealthy());

      await manager.start();
      const result = await manager.status();

      expect(result.healthy).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // status() -- when stopped
  // ---------------------------------------------------------------
  describe('status() -- when stopped', () => {
    it('returns process=stopped, healthy=false, pid=null without calling checkHealth', async () => {
      const result = await manager.status();

      expect(result.process).toBe('stopped');
      expect(result.healthy).toBe(false);
      expect(result.pid).toBeNull();
      expect(result.uptimeMs).toBeNull();
      expect(mockCheckHealth).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // restart()
  // ---------------------------------------------------------------
  describe('restart()', () => {
    it('calls shutdownWetty then launchWetty in sequence', async () => {
      await manager.start();
      mockLaunchWetty.mockClear();

      const newProc = mockWettyProcess({ pid: 67890 });
      mockLaunchWetty.mockResolvedValue(newProc);

      await manager.restart();

      expect(mockShutdownWetty).toHaveBeenCalledOnce();
      expect(mockLaunchWetty).toHaveBeenCalledOnce();

      // shutdownWetty should have been called before launchWetty
      const shutdownOrder = mockShutdownWetty.mock.invocationCallOrder[0];
      const launchOrder = mockLaunchWetty.mock.invocationCallOrder[0];
      expect(shutdownOrder).toBeLessThan(launchOrder);
    });

    it('returns ServiceStatus with process=running and new pid', async () => {
      await manager.start();

      const newProc = mockWettyProcess({ pid: 67890 });
      mockLaunchWetty.mockResolvedValue(newProc);

      const result = await manager.restart();

      expect(result.process).toBe('running');
      expect(result.pid).toBe(67890);
    });

    it('works correctly when not currently running (just starts)', async () => {
      const result = await manager.restart();

      expect(mockShutdownWetty).not.toHaveBeenCalled();
      expect(mockLaunchWetty).toHaveBeenCalledOnce();
      expect(result.process).toBe('running');
    });
  });

  // ---------------------------------------------------------------
  // uptimeMs
  // ---------------------------------------------------------------
  describe('uptimeMs', () => {
    it('returns null when stopped', async () => {
      const result = await manager.status();

      expect(result.uptimeMs).toBeNull();
    });

    it('returns positive number when running (based on startedAt timestamp)', async () => {
      // Use a past startedAt so uptimeMs is clearly positive
      const pastProc = mockWettyProcess({
        startedAt: new Date(Date.now() - 5000).toISOString(),
      });
      mockLaunchWetty.mockResolvedValue(pastProc);

      await manager.start();
      const result = await manager.status();

      expect(result.uptimeMs).toBeTypeOf('number');
      expect(result.uptimeMs).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------
  // start() -- session binding
  // ---------------------------------------------------------------
  describe('start() -- session binding', () => {
    it('calls buildSessionCommand with config.session_name', async () => {
      mockBuildSessionCommand.mockReturnValue('tmux attach -t dev || tmux new -s dev');

      await manager.start();

      expect(mockBuildSessionCommand).toHaveBeenCalledWith('dev');
    });

    it('passes session command to launchWetty as command option', async () => {
      mockBuildSessionCommand.mockReturnValue('tmux attach -t dev || tmux new -s dev');

      await manager.start();

      expect(mockLaunchWetty).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'tmux attach -t dev || tmux new -s dev' }),
      );
    });

    it('uses custom session_name from config', async () => {
      const customConfig = { ...DEFAULT_TERMINAL_CONFIG, session_name: 'work' };
      const customManager = new TerminalProcessManager(customConfig);
      mockBuildSessionCommand.mockReturnValue('tmux attach -t work || tmux new -s work');

      await customManager.start();

      expect(mockBuildSessionCommand).toHaveBeenCalledWith('work');
    });

    it('does not rebuild session command when already running (idempotent)', async () => {
      mockBuildSessionCommand.mockReturnValue('tmux attach -t dev || tmux new -s dev');

      await manager.start();
      mockBuildSessionCommand.mockClear();

      await manager.start();

      expect(mockBuildSessionCommand).not.toHaveBeenCalled();
    });
  });
});
