/**
 * Offload signal system: completion signal creation and event bus
 * for notifying downstream consumers (Copper synchronization, etc.)
 * when offload operations finish executing.
 *
 * The signal bus follows an event emitter pattern with on/off/once/waitFor
 * semantics, keeping the offload decoupled from specific consumers.
 */

import type { CompletionSignal, OffloadResult } from './types.js';
import { CompletionSignalSchema } from './types.js';

/**
 * Create a CompletionSignal from an OffloadResult.
 *
 * Status determination priority:
 *   1. error option provided → 'error'
 *   2. result.timedOut → 'timeout'
 *   3. exitCode === 0 → 'success'
 *   4. otherwise → 'failure'
 *
 * @param result - The execution result to derive the signal from
 * @param options - Optional error message for spawn/system failures
 * @returns Validated CompletionSignal
 */
export function createCompletionSignal(
  result: OffloadResult,
  options?: { error?: string },
): CompletionSignal {
  let status: CompletionSignal['status'];

  if (options?.error) {
    status = 'error';
  } else if (result.timedOut) {
    status = 'timeout';
  } else if (result.exitCode === 0) {
    status = 'success';
  } else {
    status = 'failure';
  }

  const signal = {
    operationId: result.operationId,
    status,
    result,
    timestamp: new Date().toISOString(),
    error: options?.error,
  };

  return CompletionSignalSchema.parse(signal);
}

/** Callback type for signal listeners. */
type SignalListener = (signal: CompletionSignal) => void;

/**
 * Event bus for offload completion signals.
 *
 * Supports standard event patterns: on, off, once, and waitFor.
 * Keyed by event type (typically 'completion') to allow future
 * expansion to additional signal types.
 */
export class SignalBus {
  private listeners: Map<string, SignalListener[]> = new Map();
  private onceListeners: Map<string, SignalListener[]> = new Map();

  /**
   * Register a persistent listener for an event type.
   *
   * @param event - Event type to listen for (e.g., 'completion')
   * @param callback - Function to call when the event fires
   */
  on(event: string, callback: SignalListener): void {
    const list = this.listeners.get(event) ?? [];
    list.push(callback);
    this.listeners.set(event, list);
  }

  /**
   * Remove a previously registered listener.
   *
   * @param event - Event type the listener was registered on
   * @param callback - The exact function reference to remove
   */
  off(event: string, callback: SignalListener): void {
    const list = this.listeners.get(event);
    if (!list) return;
    const idx = list.indexOf(callback);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }

  /**
   * Register a listener that fires only once, then auto-removes.
   *
   * @param event - Event type to listen for
   * @param callback - Function to call on first emission
   */
  once(event: string, callback: SignalListener): void {
    const list = this.onceListeners.get(event) ?? [];
    list.push(callback);
    this.onceListeners.set(event, list);
  }

  /**
   * Emit a completion signal, notifying all registered listeners.
   *
   * Persistent listeners (on) are called first, then one-time
   * listeners (once) are called and removed.
   *
   * @param signal - The completion signal to broadcast
   */
  emit(signal: CompletionSignal): void {
    // Notify persistent listeners
    const persistent = this.listeners.get('completion');
    if (persistent) {
      for (const cb of persistent) {
        cb(signal);
      }
    }

    // Notify and remove once-listeners
    const oneTime = this.onceListeners.get('completion');
    if (oneTime) {
      for (const cb of oneTime) {
        cb(signal);
      }
      this.onceListeners.delete('completion');
    }
  }

  /**
   * Returns a promise that resolves on the next signal emission.
   *
   * Internally uses once() to register a temporary listener.
   *
   * @param event - Event type to wait for
   * @returns Promise resolving with the next emitted signal
   */
  waitFor(event: string): Promise<CompletionSignal> {
    return new Promise<CompletionSignal>((resolve) => {
      this.once(event, resolve);
    });
  }
}
