/**
 * Terminal process manager -- orchestrates Wetty lifecycle.
 *
 * Composes launcher (start/stop) and health check into a unified
 * API with start(), stop(), status(), restart() operations.
 * Each operation is independently callable (TERM-04).
 *
 * @module terminal/process-manager
 */

import type { TerminalConfig } from '../integration/config/terminal-types.js';
import type { WettyProcess, ServiceStatus } from './types.js';
import { launchWetty, shutdownWetty } from './launcher.js';
import { checkHealth } from './health.js';
import { buildSessionCommand } from './session.js';

/**
 * Manages a single Wetty terminal process lifecycle.
 *
 * Provides idempotent start/stop, live health status, and restart.
 * Consumers should use this class rather than calling launcher/health
 * directly.
 */
export class TerminalProcessManager {
  private readonly config: TerminalConfig;
  private process: WettyProcess | null = null;

  constructor(config: TerminalConfig) {
    this.config = config;
  }

  /**
   * Launch the Wetty terminal process.
   *
   * Idempotent: if already running, returns current status without
   * re-launching. Health is false initially -- call status() for
   * a live health check.
   */
  async start(): Promise<ServiceStatus> {
    // Idempotent: already running means no-op
    if (this.process !== null && this.process.status === 'running') {
      return this.buildStatus(false);
    }

    const command = buildSessionCommand(this.config.session_name);
    this.process = await launchWetty({ config: this.config, command });
    return this.buildStatus(false);
  }

  /**
   * Gracefully shut down the Wetty terminal process.
   *
   * Idempotent: if already stopped (or never started), returns
   * stopped status without error.
   */
  async stop(): Promise<ServiceStatus> {
    // Idempotent: nothing to stop
    if (this.process === null || this.process.status === 'stopped') {
      this.process = null;
      return this.stoppedStatus();
    }

    await shutdownWetty(this.process);
    this.process = null;
    return this.stoppedStatus();
  }

  /**
   * Get current service status with live health check.
   *
   * When running, probes the Wetty endpoint to determine health.
   * When stopped, returns stopped status without probing.
   */
  async status(): Promise<ServiceStatus> {
    if (this.process === null || this.process.status !== 'running') {
      return this.stoppedStatus();
    }

    const health = await checkHealth(this.process.url);
    const uptimeMs = this.calculateUptime();

    return {
      process: 'running',
      pid: this.process.pid,
      url: this.process.url,
      healthy: health.healthy,
      uptimeMs,
    };
  }

  /**
   * Restart the terminal process (stop then start).
   *
   * If not currently running, performs a clean start.
   */
  async restart(): Promise<ServiceStatus> {
    if (this.process !== null && this.process.status === 'running') {
      await this.stop();
    }
    return this.start();
  }

  /** Build the URL from config. */
  private buildUrl(): string {
    return `http://localhost:${this.config.port}${this.config.base_path}`;
  }

  /** Build a ServiceStatus from current process state. */
  private buildStatus(healthy: boolean): ServiceStatus {
    if (this.process === null) {
      return this.stoppedStatus();
    }

    return {
      process: this.process.status === 'running' ? 'running' : this.process.status,
      pid: this.process.pid,
      url: this.process.url,
      healthy,
      uptimeMs: this.calculateUptime(),
    };
  }

  /** Build a stopped ServiceStatus. */
  private stoppedStatus(): ServiceStatus {
    return {
      process: 'stopped',
      pid: null,
      url: this.buildUrl(),
      healthy: false,
      uptimeMs: null,
    };
  }

  /** Calculate uptime from process startedAt to now. */
  private calculateUptime(): number | null {
    if (this.process === null || this.process.startedAt === null) {
      return null;
    }
    return Date.now() - new Date(this.process.startedAt).getTime();
  }
}
