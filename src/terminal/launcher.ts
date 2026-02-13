/**
 * Wetty process launcher and graceful shutdown.
 *
 * Spawns Wetty as a child process using config from Phase 123,
 * tracks process lifecycle state, and provides graceful shutdown
 * with SIGTERM -> timeout -> SIGKILL escalation.
 *
 * @module terminal/launcher
 */

import type { WettyProcess, LaunchOptions, ShutdownOptions } from './types.js';

export async function launchWetty(_options: LaunchOptions): Promise<WettyProcess> {
  throw new Error('not implemented');
}

export async function shutdownWetty(_process: WettyProcess, _options?: ShutdownOptions): Promise<void> {
  throw new Error('not implemented');
}
