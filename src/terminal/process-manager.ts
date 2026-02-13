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
import type { ServiceStatus } from './types.js';

/**
 * Manages a single Wetty terminal process lifecycle.
 *
 * Provides idempotent start/stop, live health status, and restart.
 * Consumers should use this class rather than calling launcher/health
 * directly.
 */
export class TerminalProcessManager {
  constructor(_config: TerminalConfig) {}
  async start(): Promise<ServiceStatus> { throw new Error('not implemented'); }
  async stop(): Promise<ServiceStatus> { throw new Error('not implemented'); }
  async status(): Promise<ServiceStatus> { throw new Error('not implemented'); }
  async restart(): Promise<ServiceStatus> { throw new Error('not implemented'); }
}
