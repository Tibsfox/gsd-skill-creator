import type { ProcessIndicator, ProcessStatus } from "./types";

/** Callback for process status changes */
export type ProcessChangeCallback = (indicators: readonly ProcessIndicator[]) => void;

/**
 * Aggregates background process status into a unified indicator list.
 *
 * Monitors:
 * - Claude sessions (via SessionMonitor)
 * - File watcher (via watcher status)
 * - Terminal/PTY (active sessions)
 *
 * Provides a snapshot API and change notification.
 */
export class ProcessMonitor {
  /** Update the status of a specific process */
  updateStatus(_id: string, _status: ProcessStatus): void {
    throw new Error("Not implemented");
  }

  /** Register a new process to monitor */
  registerProcess(_id: string, _label: string, _initialStatus: ProcessStatus): void {
    throw new Error("Not implemented");
  }

  /** Remove a process from monitoring */
  removeProcess(_id: string): void {
    throw new Error("Not implemented");
  }

  /** Get current snapshot of all process indicators */
  getIndicators(): readonly ProcessIndicator[] {
    throw new Error("Not implemented");
  }

  /** Subscribe to indicator changes. Returns unsubscribe. */
  onChange(_callback: ProcessChangeCallback): () => void {
    throw new Error("Not implemented");
  }

  /** Destroy and clean up */
  destroy(): void {
    throw new Error("Not implemented");
  }
}
