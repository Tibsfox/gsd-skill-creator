import { listen } from "@tauri-apps/api/event";
import type { ClaudeStatusEvent, StatusCallback } from "./types";

/**
 * Real-time session status monitor.
 *
 * Subscribes to "claude:status" Tauri events from the Rust backend.
 * Provides a pub/sub API so multiple UI components (taskbar, session list)
 * can react to status changes independently.
 */
export class SessionMonitor {
  private listeners: Set<StatusCallback> = new Set();
  private unlisten: (() => void) | null = null;
  private started = false;

  /** Start listening for status events from Rust backend */
  async start(): Promise<void> {
    // TODO: implement
    throw new Error("Not implemented");
  }

  /** Stop listening and clean up */
  async stop(): Promise<void> {
    // TODO: implement
    throw new Error("Not implemented");
  }

  /** Subscribe to status changes. Returns unsubscribe function. */
  subscribe(callback: StatusCallback): () => void {
    // TODO: implement
    throw new Error("Not implemented");
  }

  /** Check if monitor is active */
  isActive(): boolean {
    return this.started;
  }

  /** Get current listener count (for diagnostics) */
  listenerCount(): number {
    return this.listeners.size;
  }
}
