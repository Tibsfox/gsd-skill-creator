/**
 * Dev environment manager -- composes terminal and dashboard services.
 *
 * Provides a unified start/stop/status API that launches both services
 * concurrently using Promise.allSettled, ensuring one service failure
 * does not prevent the other from starting or stopping.
 *
 * Satisfies: LAUN-01 (start both), LAUN-02 (stop both), LAUN-03 (status).
 *
 * @module launcher/dev-environment
 */

import type { ServiceStatus } from '../terminal/types.js';
import type {
  DashboardServiceStatus,
  DevEnvironmentConfig,
  DevEnvironmentStatus,
} from './types.js';
import { TerminalProcessManager } from '../terminal/process-manager.js';
import { DashboardService } from './dashboard-service.js';
import type { DashboardGeneratorFn } from './dashboard-service.js';

// ---------------------------------------------------------------------------
// Dependency injection interface
// ---------------------------------------------------------------------------

/** Minimal interface for the terminal service dependency. */
interface TerminalDep {
  start(): Promise<ServiceStatus>;
  stop(): Promise<ServiceStatus>;
  status(): Promise<ServiceStatus>;
}

/** Minimal interface for the dashboard service dependency. */
interface DashboardDep {
  start(): Promise<DashboardServiceStatus>;
  stop(): Promise<DashboardServiceStatus>;
  status(): DashboardServiceStatus;
}

/** Dependencies injected into DevEnvironmentManager. */
export interface DevEnvironmentDeps {
  terminal: TerminalDep;
  dashboard: DashboardDep;
}

// ---------------------------------------------------------------------------
// Fallback status values (used when Promise.allSettled rejects)
// ---------------------------------------------------------------------------

/** Fallback terminal status on error. */
function errorTerminalStatus(): ServiceStatus {
  return {
    process: 'error',
    pid: null,
    url: '',
    healthy: false,
    uptimeMs: null,
  };
}

/** Fallback dashboard status on error. */
function errorDashboardStatus(): DashboardServiceStatus {
  return {
    process: 'stopped',
    lastGeneratedAt: null,
    pagesGenerated: 0,
    watching: false,
    planningDir: '',
    outputDir: '',
  };
}

// ---------------------------------------------------------------------------
// DevEnvironmentManager
// ---------------------------------------------------------------------------

/**
 * Manages the full dev environment lifecycle: terminal + dashboard.
 *
 * Use dependency injection (constructor) for testing, or the static
 * `fromConfig()` factory for production usage.
 */
export class DevEnvironmentManager {
  private readonly terminal: TerminalDep;
  private readonly dashboard: DashboardDep;

  constructor(deps: DevEnvironmentDeps) {
    this.terminal = deps.terminal;
    this.dashboard = deps.dashboard;
  }

  /**
   * Create a DevEnvironmentManager from configuration.
   *
   * Constructs real TerminalProcessManager and DashboardService
   * instances from the provided config.
   */
  static fromConfig(
    config: DevEnvironmentConfig,
    generateFn?: DashboardGeneratorFn,
  ): DevEnvironmentManager {
    const terminal = new TerminalProcessManager(config.terminal);
    const dashboard = new DashboardService(config.dashboard, generateFn);
    return new DevEnvironmentManager({ terminal, dashboard });
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Start both terminal and dashboard services concurrently.
   *
   * Uses Promise.allSettled so one service failure does not prevent the
   * other from starting. Returns combined status reflecting both results.
   */
  async start(): Promise<DevEnvironmentStatus> {
    const [terminalResult, dashboardResult] = await Promise.allSettled([
      this.terminal.start(),
      this.dashboard.start(),
    ]);

    const terminalStatus =
      terminalResult.status === 'fulfilled'
        ? terminalResult.value
        : errorTerminalStatus();

    const dashboardStatus =
      dashboardResult.status === 'fulfilled'
        ? dashboardResult.value
        : errorDashboardStatus();

    return { terminal: terminalStatus, dashboard: dashboardStatus };
  }

  /**
   * Stop both terminal and dashboard services concurrently.
   *
   * Uses Promise.allSettled so one service failure does not prevent the
   * other from stopping. Returns combined status reflecting both results.
   */
  async stop(): Promise<DevEnvironmentStatus> {
    const [terminalResult, dashboardResult] = await Promise.allSettled([
      this.terminal.stop(),
      this.dashboard.stop(),
    ]);

    const terminalStatus =
      terminalResult.status === 'fulfilled'
        ? terminalResult.value
        : errorTerminalStatus();

    const dashboardStatus =
      dashboardResult.status === 'fulfilled'
        ? dashboardResult.value
        : errorDashboardStatus();

    return { terminal: terminalStatus, dashboard: dashboardStatus };
  }

  /**
   * Get the combined status of both services.
   *
   * Terminal status is async (live health probe), dashboard status is
   * synchronous (in-memory state). Both are queried concurrently.
   */
  async status(): Promise<DevEnvironmentStatus> {
    const [terminalResult] = await Promise.allSettled([
      this.terminal.status(),
    ]);

    const terminalStatus =
      terminalResult.status === 'fulfilled'
        ? terminalResult.value
        : errorTerminalStatus();

    const dashboardStatus = this.dashboard.status();

    return { terminal: terminalStatus, dashboard: dashboardStatus };
  }
}
