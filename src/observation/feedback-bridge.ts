import { createHash } from 'crypto';
import { SignalBus } from '../chipset/blitter/signals.js';
import type { CompletionSignal } from '../chipset/blitter/types.js';
import { PatternStore } from '../storage/pattern-store.js';

/**
 * Bridges Blitter CompletionSignal events to PatternStore 'feedback' category,
 * making execution outcomes available for the Copper learning cycle and DriftMonitor.
 *
 * Listens on the SignalBus for 'completion' events and automatically stores
 * structured feedback entries containing operation outcome data (status, exit code,
 * duration, stdout hash). Copper can then read these entries during its next
 * evaluation cycle to inform list refinement.
 *
 * Satisfies: FEED-04 (Blitter feedback events flow to Copper learning).
 */
export class FeedbackBridge {
  private bus: SignalBus;
  private store: PatternStore;
  private listener: ((signal: CompletionSignal) => void) | null = null;

  constructor(bus: SignalBus, store: PatternStore) {
    this.bus = bus;
    this.store = store;
  }

  /**
   * Register a listener on the SignalBus for 'completion' events.
   * Idempotent: calling start() when already started is a no-op.
   */
  start(): void {
    if (this.listener) return;

    this.listener = (signal: CompletionSignal) => {
      this.storeFeedback(signal).catch(err => {
        console.warn('FeedbackBridge: failed to store feedback:', err);
      });
    };

    this.bus.on('completion', this.listener);
  }

  /**
   * Unregister the listener from the SignalBus.
   * Idempotent: calling stop() when already stopped is a no-op.
   */
  stop(): void {
    if (!this.listener) return;
    this.bus.off('completion', this.listener);
    this.listener = null;
  }

  /**
   * Extract feedback data from a CompletionSignal and persist it to PatternStore.
   */
  private async storeFeedback(signal: CompletionSignal): Promise<void> {
    const stdoutHash = createHash('sha256')
      .update(signal.result.stdout)
      .digest('hex');

    await this.store.append('feedback', {
      operationId: signal.operationId,
      status: signal.status,
      exitCode: signal.result.exitCode,
      durationMs: signal.result.durationMs,
      stdoutHash,
      timestamp: signal.timestamp,
      ...(signal.error ? { error: signal.error } : {}),
    });
  }
}
