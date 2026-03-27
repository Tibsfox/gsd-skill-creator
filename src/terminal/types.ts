/**
 * Type definitions for the terminal service layer.
 *
 * Defines process lifecycle, launch/shutdown options, health checks,
 * and composite service status. Used by launcher.ts and (later) the
 * process manager to orchestrate Wetty child processes.
 *
 * @module terminal/types
 */

import type { TerminalConfig } from '../integration/config/terminal-types.js';

/** Process lifecycle states. */
export type ProcessStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

/** Represents a running (or recently exited) Wetty process. */
export interface WettyProcess {
  /** OS process ID, null if not started or already exited. */
  pid: number | null;
  /** Current lifecycle status. */
  status: ProcessStatus;
  /** URL where Wetty is accessible (e.g., http://localhost:3000/terminal). */
  url: string;
  /** When the process was started (ISO timestamp). */
  startedAt: string | null;
  /** When the process stopped (ISO timestamp), null if still running. */
  stoppedAt: string | null;
  /** Last error message, if any. */
  error: string | null;
}

/** Options for launching Wetty. */
export interface LaunchOptions {
  /** Terminal config (port, base_path, etc.). */
  config: TerminalConfig;
  /** Shell command Wetty should run (default: user's $SHELL or 'bash'). */
  command?: string;
  /** Whether to allow iframe embedding (adds --allow-iframe flag). Default: true. */
  allowIframe?: boolean;
}

/** Options for shutdown behavior. */
export interface ShutdownOptions {
  /** Milliseconds to wait after SIGTERM before sending SIGKILL. Default: 5000. */
  gracePeriodMs?: number;
}

/** Result of a health check probe. */
export interface HealthCheckResult {
  /** Whether Wetty responded successfully. */
  healthy: boolean;
  /** HTTP status code, if a response was received. */
  statusCode: number | null;
  /** Response time in milliseconds. */
  responseTimeMs: number;
  /** Error message if probe failed. */
  error: string | null;
}

/** Overall service status combining process state and health. */
export interface ServiceStatus {
  /** Process lifecycle status. */
  process: ProcessStatus;
  /** PID if running, null otherwise. */
  pid: number | null;
  /** URL where Wetty is accessible. */
  url: string;
  /** Whether the last health check passed. */
  healthy: boolean;
  /** Uptime in milliseconds, null if not running. */
  uptimeMs: number | null;
}
