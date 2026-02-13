/**
 * Type definitions for the unified launcher module.
 *
 * Defines dashboard service configuration and status, plus the
 * combined DevEnvironment types that compose terminal + dashboard
 * services into a single programmatic API.
 *
 * @module launcher/types
 */

import type { ServiceStatus } from '../terminal/types.js';
import type { TerminalConfig } from '../integration/config/terminal-types.js';

// ---------------------------------------------------------------------------
// Dashboard Service
// ---------------------------------------------------------------------------

/** Configuration for the dashboard service. */
export interface DashboardServiceConfig {
  /** Path to the .planning/ directory. */
  planningDir: string;
  /** Path to the output directory for generated HTML. */
  outputDir: string;
  /** Auto-refresh interval in ms (default: 5000). */
  refreshInterval?: number;
  /** Debounce interval for file watcher in ms (default: 800). */
  debounceMs?: number;
}

/** Status of the dashboard service. */
export interface DashboardServiceStatus {
  /** Whether the service is running (generating + watching). */
  process: 'running' | 'stopped';
  /** Last generation timestamp (ISO string), null if never generated. */
  lastGeneratedAt: string | null;
  /** Number of pages generated in last run. */
  pagesGenerated: number;
  /** Whether the file watcher is active. */
  watching: boolean;
  /** The planning directory being watched. */
  planningDir: string;
  /** The output directory for HTML. */
  outputDir: string;
}

// ---------------------------------------------------------------------------
// Dev Environment (combined)
// ---------------------------------------------------------------------------

/** Combined status of both services in the dev environment. */
export interface DevEnvironmentStatus {
  /** Terminal service status. */
  terminal: ServiceStatus;
  /** Dashboard service status. */
  dashboard: DashboardServiceStatus;
}

/** Configuration for the unified dev environment. */
export interface DevEnvironmentConfig {
  /** Terminal configuration. */
  terminal: TerminalConfig;
  /** Dashboard service configuration. */
  dashboard: DashboardServiceConfig;
}
