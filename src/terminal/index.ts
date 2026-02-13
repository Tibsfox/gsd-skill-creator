/**
 * Terminal service module -- Wetty process management.
 *
 * Public API for launching, monitoring, and controlling the Wetty
 * terminal service. Consumers should import from this module.
 *
 * @module terminal
 */

// Types
export type {
  ProcessStatus,
  WettyProcess,
  LaunchOptions,
  ShutdownOptions,
  HealthCheckResult,
  ServiceStatus,
} from './types.js';

// Launcher (low-level)
export { launchWetty, shutdownWetty } from './launcher.js';

// Health check
export { checkHealth } from './health.js';

// Session binding
export { listTmuxSessions, buildSessionCommand } from './session.js';

// Process manager (high-level API)
export { TerminalProcessManager } from './process-manager.js';
