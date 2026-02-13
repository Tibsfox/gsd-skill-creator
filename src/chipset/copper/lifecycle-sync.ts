/**
 * GSD lifecycle event bridge for Pipeline WAIT instructions.
 *
 * LifecycleSync provides the event synchronization mechanism between
 * the GSD workflow (which emits lifecycle events like phase-start,
 * tests-passing, etc.) and the Pipeline executor (which blocks on WAIT
 * instructions until the matching event fires).
 *
 * Events are ephemeral -- they are not stored. A waitFor() call only
 * resolves when a future emit() fires. Past emissions are not replayed.
 */

import type { GsdLifecycleEvent } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A resolved lifecycle event with metadata.
 */
export interface LifecycleEvent {
  /** The GSD lifecycle event name. */
  name: GsdLifecycleEvent;

  /** ISO 8601 timestamp when the event was emitted. */
  timestamp: string;
}

/** Internal waiter entry tracking a pending promise. */
interface Waiter {
  resolve: (event: GsdLifecycleEvent) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

// ============================================================================
// LifecycleSync
// ============================================================================

/**
 * Lightweight event bridge for GSD lifecycle events.
 *
 * WAIT instructions call `waitFor()` which returns a promise.
 * External GSD workflow integration calls `emit()` when lifecycle
 * events occur. The promise resolves when the matching event fires.
 */
export class LifecycleSync {
  /** Pending waiters keyed by event name. */
  private waiters = new Map<GsdLifecycleEvent, Waiter[]>();

  /**
   * Wait for a specific GSD lifecycle event.
   *
   * Returns a promise that resolves with the event name when `emit()`
   * is called for that event. If a timeout is specified, the promise
   * rejects with a timeout error if the event does not fire in time.
   *
   * @param event - The GSD lifecycle event to wait for
   * @param options - Optional configuration (timeoutMs)
   * @returns Promise that resolves with the event name
   */
  waitFor(
    event: GsdLifecycleEvent,
    options?: { timeoutMs?: number },
  ): Promise<GsdLifecycleEvent> {
    return new Promise<GsdLifecycleEvent>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject };

      // Set up timeout if requested
      if (options?.timeoutMs !== undefined) {
        waiter.timer = setTimeout(() => {
          // Remove this waiter from the map
          const eventWaiters = this.waiters.get(event);
          if (eventWaiters) {
            const idx = eventWaiters.indexOf(waiter);
            if (idx !== -1) {
              eventWaiters.splice(idx, 1);
            }
            if (eventWaiters.length === 0) {
              this.waiters.delete(event);
            }
          }
          reject(new Error(`Timeout waiting for lifecycle event: ${event}`));
        }, options.timeoutMs);
      }

      // Register the waiter
      const existing = this.waiters.get(event);
      if (existing) {
        existing.push(waiter);
      } else {
        this.waiters.set(event, [waiter]);
      }
    });
  }

  /**
   * Emit a GSD lifecycle event, resolving all pending waiters for it.
   *
   * If no waiters are registered for this event, this is a no-op.
   * Events are not stored -- only currently-waiting promises are resolved.
   *
   * @param event - The GSD lifecycle event that occurred
   */
  emit(event: GsdLifecycleEvent): void {
    const eventWaiters = this.waiters.get(event);
    if (!eventWaiters) {
      return; // No waiters, nothing to do
    }

    // Resolve all waiters and clear their timers
    for (const waiter of eventWaiters) {
      if (waiter.timer !== undefined) {
        clearTimeout(waiter.timer);
      }
      waiter.resolve(event);
    }

    // All waiters consumed
    this.waiters.delete(event);
  }

  /**
   * Reset the lifecycle sync, rejecting all pending waiters.
   *
   * Used for cleanup when an executor is aborted or when starting
   * a fresh execution cycle.
   */
  reset(): void {
    for (const [, eventWaiters] of this.waiters) {
      for (const waiter of eventWaiters) {
        if (waiter.timer !== undefined) {
          clearTimeout(waiter.timer);
        }
        waiter.reject(new Error('LifecycleSync reset'));
      }
    }
    this.waiters.clear();
  }
}
