/**
 * Wetty process launcher and graceful shutdown.
 *
 * Spawns Wetty as a child process using config from Phase 123,
 * tracks process lifecycle state, and provides graceful shutdown
 * with SIGTERM -> timeout -> SIGKILL escalation.
 *
 * @module terminal/launcher
 */

import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import type { WettyProcess, LaunchOptions, ShutdownOptions } from './types.js';

/**
 * Map of active child processes keyed by PID.
 *
 * Used by shutdownWetty to retrieve the ChildProcess reference
 * for sending signals. Entries are removed on process close.
 *
 * @internal Exported for testing only.
 */
export const activeProcesses = new Map<number, ChildProcess>();

/** Default grace period before escalating to SIGKILL (ms). */
const DEFAULT_GRACE_PERIOD_MS = 5000;

/**
 * Launch a Wetty terminal server as a child process.
 *
 * Builds CLI arguments from the provided config, spawns `wetty`,
 * and returns a WettyProcess that tracks lifecycle state. The
 * returned promise resolves once the process emits 'spawn' (success)
 * or 'error' (failure).
 *
 * @param options - Launch options including terminal config
 * @returns WettyProcess with pid, status, url, and timestamps
 */
export async function launchWetty(options: LaunchOptions): Promise<WettyProcess> {
  const { config, command, allowIframe } = options;

  // Build CLI args from config
  const args: string[] = [
    '--port', String(config.port),
    '--base', config.base_path,
  ];

  if (command !== undefined) {
    args.push('--command', command);
  }

  if (allowIframe !== false) {
    args.push('--allow-iframe');
  }

  // Spawn Wetty as a direct child (not detached) so it dies with parent
  const child = spawn('wetty', args, {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Build the process state object
  const proc: WettyProcess = {
    pid: child.pid ?? null,
    status: 'starting',
    url: `http://localhost:${config.port}${config.base_path}`,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    error: null,
  };

  // Track the child process for shutdown
  if (child.pid != null) {
    activeProcesses.set(child.pid, child);
  }

  // Clean up on close
  child.on('close', () => {
    if (proc.status !== 'stopping' && proc.status !== 'stopped') {
      proc.status = 'stopped';
      proc.stoppedAt = new Date().toISOString();
    }
    if (proc.pid != null) {
      activeProcesses.delete(proc.pid);
    }
  });

  // Wait for either 'spawn' (success) or 'error' (failure)
  return new Promise<WettyProcess>((resolve) => {
    child.on('spawn', () => {
      proc.status = 'running';
      resolve(proc);
    });

    child.on('error', (err: Error) => {
      proc.status = 'error';
      proc.error = err.message;
      if (proc.pid != null) {
        activeProcesses.delete(proc.pid);
      }
      resolve(proc);
    });
  });
}

/**
 * Gracefully shut down a Wetty process.
 *
 * Sends SIGTERM and waits up to `gracePeriodMs` for the process to
 * exit. If it does not exit within the grace period, escalates to
 * SIGKILL. Handles cases where the process has already exited.
 *
 * @param proc - The WettyProcess to shut down (mutated in place)
 * @param options - Shutdown options (grace period)
 */
export async function shutdownWetty(proc: WettyProcess, options?: ShutdownOptions): Promise<void> {
  const gracePeriodMs = options?.gracePeriodMs ?? DEFAULT_GRACE_PERIOD_MS;

  // Already stopped or never started
  if (proc.pid == null || proc.status === 'stopped') {
    return;
  }

  proc.status = 'stopping';

  const child = activeProcesses.get(proc.pid);

  // Process reference already cleaned up
  if (!child) {
    proc.status = 'stopped';
    proc.stoppedAt = new Date().toISOString();
    return;
  }

  // Send SIGTERM
  try {
    child.kill('SIGTERM');
  } catch (err: unknown) {
    // ESRCH means process already gone -- that's fine
    if ((err as NodeJS.ErrnoException).code === 'ESRCH') {
      proc.status = 'stopped';
      proc.stoppedAt = new Date().toISOString();
      activeProcesses.delete(proc.pid);
      return;
    }
    throw err;
  }

  // Wait for process to exit, escalating to SIGKILL after grace period
  return new Promise<void>((resolve) => {
    let escalationTimer: ReturnType<typeof setTimeout> | null = null;

    // Set up SIGKILL escalation timer
    escalationTimer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // Process may have already exited between SIGTERM and SIGKILL
      }
    }, gracePeriodMs);

    child.on('close', () => {
      if (escalationTimer != null) {
        clearTimeout(escalationTimer);
      }
      proc.status = 'stopped';
      proc.stoppedAt = new Date().toISOString();
      activeProcesses.delete(proc.pid!);
      resolve();
    });
  });
}
