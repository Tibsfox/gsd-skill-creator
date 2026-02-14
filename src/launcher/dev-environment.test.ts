/**
 * Tests for DevEnvironmentManager.
 *
 * Mocks both TerminalProcessManager and DashboardService via
 * dependency injection. Verifies unified start/stop/status lifecycle,
 * idempotency, and graceful handling of partial failures using
 * Promise.allSettled.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ServiceStatus } from '../terminal/types.js';
import type { DashboardServiceStatus } from './types.js';
import { DevEnvironmentManager } from './dev-environment.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Default terminal status (running). */
function runningTerminalStatus(): ServiceStatus {
  return {
    process: 'running',
    pid: 12345,
    url: 'http://localhost:3000/terminal',
    healthy: false,
    uptimeMs: 100,
  };
}

/** Default terminal status (stopped). */
function stoppedTerminalStatus(): ServiceStatus {
  return {
    process: 'stopped',
    pid: null,
    url: 'http://localhost:3000/terminal',
    healthy: false,
    uptimeMs: null,
  };
}

/** Default dashboard status (running). */
function runningDashboardStatus(): DashboardServiceStatus {
  return {
    process: 'running',
    lastGeneratedAt: new Date().toISOString(),
    pagesGenerated: 3,
    watching: true,
    planningDir: '/tmp/planning',
    outputDir: '/tmp/output',
  };
}

/** Default dashboard status (stopped). */
function stoppedDashboardStatus(): DashboardServiceStatus {
  return {
    process: 'stopped',
    lastGeneratedAt: null,
    pagesGenerated: 0,
    watching: false,
    planningDir: '/tmp/planning',
    outputDir: '/tmp/output',
  };
}

/** Create a mock terminal manager with start/stop/status/restart. */
function mockTerminalManager() {
  return {
    start: vi.fn<() => Promise<ServiceStatus>>().mockResolvedValue(runningTerminalStatus()),
    stop: vi.fn<() => Promise<ServiceStatus>>().mockResolvedValue(stoppedTerminalStatus()),
    status: vi.fn<() => Promise<ServiceStatus>>().mockResolvedValue(runningTerminalStatus()),
    restart: vi.fn<() => Promise<ServiceStatus>>().mockResolvedValue(runningTerminalStatus()),
  };
}

/** Create a mock dashboard service with start/stop/status. */
function mockDashboardService() {
  return {
    start: vi.fn<() => Promise<DashboardServiceStatus>>().mockResolvedValue(runningDashboardStatus()),
    stop: vi.fn<() => Promise<DashboardServiceStatus>>().mockResolvedValue(stoppedDashboardStatus()),
    status: vi.fn<() => DashboardServiceStatus>().mockReturnValue(runningDashboardStatus()),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DevEnvironmentManager', () => {
  let terminal: ReturnType<typeof mockTerminalManager>;
  let dashboard: ReturnType<typeof mockDashboardService>;
  let manager: DevEnvironmentManager;

  beforeEach(() => {
    terminal = mockTerminalManager();
    dashboard = mockDashboardService();
    manager = new DevEnvironmentManager({ terminal, dashboard });
  });

  // ---------------------------------------------------------------
  // start()
  // ---------------------------------------------------------------
  describe('start()', () => {
    it('launches both terminal and dashboard services', async () => {
      const status = await manager.start();

      expect(terminal.start).toHaveBeenCalledOnce();
      expect(dashboard.start).toHaveBeenCalledOnce();
      expect(status.terminal.process).toBe('running');
      expect(status.dashboard.process).toBe('running');
    });

    it('is idempotent when already running', async () => {
      await manager.start();
      await manager.start();

      // Each service's start() is called twice -- they handle their own idempotency
      expect(terminal.start).toHaveBeenCalledTimes(2);
      expect(dashboard.start).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------
  // stop()
  // ---------------------------------------------------------------
  describe('stop()', () => {
    it('shuts down both services', async () => {
      await manager.start();
      const status = await manager.stop();

      expect(terminal.stop).toHaveBeenCalledOnce();
      expect(dashboard.stop).toHaveBeenCalledOnce();
      expect(status.terminal.process).toBe('stopped');
      expect(status.dashboard.process).toBe('stopped');
    });

    it('is idempotent when already stopped', async () => {
      const status = await manager.stop();

      expect(status.terminal.process).toBe('stopped');
      expect(status.dashboard.process).toBe('stopped');
    });
  });

  // ---------------------------------------------------------------
  // status()
  // ---------------------------------------------------------------
  describe('status()', () => {
    it('returns combined state of both services', async () => {
      await manager.start();
      const status = await manager.status();

      expect(status.terminal).toBeDefined();
      expect(status.dashboard).toBeDefined();
      expect(status.terminal.process).toBe('running');
      expect(status.terminal.pid).toBe(12345);
      expect(status.dashboard.process).toBe('running');
      expect(status.dashboard.pagesGenerated).toBe(3);
    });
  });

  // ---------------------------------------------------------------
  // Partial failure handling
  // ---------------------------------------------------------------
  describe('partial failure handling', () => {
    it('start() handles terminal failure gracefully', async () => {
      terminal.start.mockRejectedValueOnce(new Error('terminal crashed'));

      const status = await manager.start();

      // Dashboard should still be called and succeed
      expect(dashboard.start).toHaveBeenCalledOnce();
      expect(status.dashboard.process).toBe('running');
      // Terminal should show error status
      expect(status.terminal.process).toBe('error');
    });

    it('start() handles dashboard failure gracefully', async () => {
      dashboard.start.mockRejectedValueOnce(new Error('dashboard crashed'));

      const status = await manager.start();

      // Terminal should still be called and succeed
      expect(terminal.start).toHaveBeenCalledOnce();
      expect(status.terminal.process).toBe('running');
      // Dashboard should show stopped status
      expect(status.dashboard.process).toBe('stopped');
    });

    it('stop() handles partial stop gracefully', async () => {
      await manager.start();

      terminal.stop.mockRejectedValueOnce(new Error('terminal stop failed'));

      const status = await manager.stop();

      // Dashboard should still be stopped
      expect(dashboard.stop).toHaveBeenCalledOnce();
      expect(status.dashboard.process).toBe('stopped');
      // Terminal shows error since stop failed
      expect(status.terminal.process).toBe('error');
    });
  });
});
