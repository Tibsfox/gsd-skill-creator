/**
 * StagingBridge -- Bridges staging intake events to inbox notification
 * handling and quarantine alerts.
 *
 * Uses callback injection for testability. The `handleIntakeComplete()`
 * and `handleQuarantine()` methods can be called directly in tests; the
 * `start()` method wires up Tauri IPC listeners.
 *
 * @module pipeline/staging-bridge
 * @since Phase 383
 */

import type { StagingQuarantinePayload, StagingStatus } from "../ipc/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StagingIntakeCompletePayload {
  file_path: string;
  destination: string;
  notification_id: string;
}

export interface StagingBridgeConfig {
  onNotification: (payload: StagingIntakeCompletePayload) => void;
  onQuarantine?: (payload: StagingQuarantinePayload) => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class StagingBridge {
  private config: StagingBridgeConfig;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  constructor(config: StagingBridgeConfig) {
    this.config = config;
  }

  /** Handle an intake completion event directly. */
  handleIntakeComplete(payload: StagingIntakeCompletePayload): void {
    if (this.destroyed) return;
    this.config.onNotification(payload);
  }

  /** Handle a quarantine event directly. */
  handleQuarantine(payload: StagingQuarantinePayload): void {
    if (this.destroyed) return;
    this.config.onQuarantine?.(payload);
  }

  /**
   * Poll staging status. Accepts an injectable getter for testability.
   */
  async getStatus(
    getStagingStatus?: () => Promise<StagingStatus>,
  ): Promise<StagingStatus> {
    const getter =
      getStagingStatus ??
      (async () => {
        const { getStagingStatus: ipcGet } = await import("../ipc/commands");
        return ipcGet();
      });

    return getter();
  }

  /**
   * Start listening to Tauri IPC events. Requires Tauri runtime.
   * For testing, use `handleIntakeComplete()` / `handleQuarantine()` directly.
   */
  async start(): Promise<void> {
    const { listen } = await import("@tauri-apps/api/event");
    const { onStagingQuarantine } = await import("../ipc/events");

    const unsubComplete = await listen<StagingIntakeCompletePayload>(
      "staging:intake_complete",
      (event) => {
        this.handleIntakeComplete(event.payload);
      },
    );
    this.unsubscribers.push(unsubComplete);

    const unsubQuarantine = await onStagingQuarantine(
      (payload: StagingQuarantinePayload) => {
        this.handleQuarantine(payload);
      },
    );
    this.unsubscribers.push(unsubQuarantine);
  }

  /** Unsubscribe from all IPC listeners and mark bridge as destroyed. */
  destroy(): void {
    this.destroyed = true;
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}

export function createStagingBridge(
  config: StagingBridgeConfig,
): StagingBridge {
  return new StagingBridge(config);
}
