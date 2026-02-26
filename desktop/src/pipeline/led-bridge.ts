/**
 * LedBridge -- Bridges service state change IPC events to the taskbar
 * LED panel.
 *
 * Uses a port interface (LedPanelPort) for testability. The
 * `handleStateChange()` method can be called directly in tests; the
 * `start()` method wires up Tauri IPC listeners.
 *
 * @module pipeline/led-bridge
 * @since Phase 383
 */

import type { ServiceStateChangePayload, ServiceState } from "../ipc/types";

// ---------------------------------------------------------------------------
// Port interface (implemented by Phase 377 LED panel component)
// ---------------------------------------------------------------------------

export interface LedPanelPort {
  setServiceState(serviceId: string, status: string, ledColor: string): void;
  getAllStates(): Map<string, { status: string; ledColor: string }>;
}

export interface LedBridgeConfig {
  ledPanel: LedPanelPort;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class LedBridge {
  private ledPanel: LedPanelPort;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  constructor(config: LedBridgeConfig) {
    this.ledPanel = config.ledPanel;
  }

  /**
   * Handle a service state change event directly. Called by Tauri
   * listeners internally and directly by tests.
   */
  handleStateChange(payload: ServiceStateChangePayload): void {
    if (this.destroyed) return;
    this.ledPanel.setServiceState(
      payload.service_id,
      payload.to_status,
      payload.led_color,
    );
  }

  /**
   * Load initial service states and populate the LED panel.
   * Accepts an injectable getter for testability (avoids Tauri import).
   */
  async loadInitialStates(
    getServiceStates?: () => Promise<ServiceState[]>,
  ): Promise<void> {
    const getter =
      getServiceStates ??
      (async () => {
        const { getServiceStates: ipcGet } = await import("../ipc/commands");
        return ipcGet();
      });

    const states = await getter();
    for (const state of states) {
      this.ledPanel.setServiceState(
        state.service_id,
        state.status,
        state.led_color,
      );
    }
  }

  /**
   * Start listening to Tauri IPC events. Requires Tauri runtime.
   * For testing, use `handleStateChange()` directly instead.
   */
  async start(): Promise<void> {
    const { onServiceStateChange } = await import("../ipc/events");
    const unsub = await onServiceStateChange(
      (payload: ServiceStateChangePayload) => {
        this.handleStateChange(payload);
      },
    );
    this.unsubscribers.push(unsub);
    await this.loadInitialStates();
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

export function createLedBridge(config: LedBridgeConfig): LedBridge {
  return new LedBridge(config);
}
