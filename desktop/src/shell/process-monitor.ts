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
  private readonly indicators = new Map<string, ProcessIndicator>();
  private readonly listeners = new Set<ProcessChangeCallback>();

  /** Update the status of a specific process */
  updateStatus(id: string, status: ProcessStatus): void {
    const existing = this.indicators.get(id);
    if (!existing) return;
    this.indicators.set(id, { ...existing, status });
    this.notify();
  }

  /** Register a new process to monitor */
  registerProcess(id: string, label: string, initialStatus: ProcessStatus): void {
    this.indicators.set(id, { id, label, status: initialStatus });
    this.notify();
  }

  /** Remove a process from monitoring */
  removeProcess(id: string): void {
    if (!this.indicators.has(id)) return;
    this.indicators.delete(id);
    this.notify();
  }

  /** Get current snapshot of all process indicators */
  getIndicators(): readonly ProcessIndicator[] {
    return Array.from(this.indicators.values());
  }

  /** Subscribe to indicator changes. Returns unsubscribe. */
  onChange(callback: ProcessChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /** Destroy and clean up */
  destroy(): void {
    this.indicators.clear();
    this.listeners.clear();
  }

  private notify(): void {
    const snapshot = this.getIndicators();
    this.listeners.forEach((cb) => cb(snapshot));
  }
}
