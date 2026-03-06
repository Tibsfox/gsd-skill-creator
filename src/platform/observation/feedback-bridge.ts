/**
 * feedback-bridge.ts — Signal Intake: Execution Outcome Capture
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * FeedbackBridge is the first observer on the SignalBus. It listens for
 * CompletionSignal events and writes structured feedback records to PatternStore
 * 'feedback' category. Each record captures the outcome of an agent operation:
 * status, exit code, duration, and a SHA-256 hash of stdout.
 *
 * WHY IT EXISTS
 * -------------
 * The Copper learning cycle needs to know: "Did this operation succeed, fail,
 * or time out?" FeedbackBridge is how that information flows from Blitter
 * (the execution layer) to Copper (the learning layer).
 *
 * DriftMonitor also reads from 'feedback' to track consecutive mismatches
 * between actual and expected outputs — the post-promotion validation signal.
 *
 * DESIGN: THE TWO LISTENERS STORY
 * ---------------------------------
 * FeedbackBridge and SequenceRecorder both call bus.on('completion').
 * They both process the same event. They write to different JSONL files.
 * No locks. No conflicts. Zero interference.
 *
 * This is not a coincidence — it's the core architectural discovery of Batch 3.
 * From CENTERCAMP-PERSONAL-JOURNAL, "The Story of the Two Listeners":
 * "It proved that separation of concerns is more powerful than shared optimization."
 *
 * FeedbackBridge answers: "Did it work?" (status, exit code, duration)
 * SequenceRecorder answers: "What did it do?" (operation type, cluster, risks)
 * Different questions. Different storage. Both correct simultaneously.
 *
 * STORAGE
 * -------
 * Records are written to PatternStore 'feedback' category (JSONL, append-only).
 * Each record contains:
 *   - operationId: the unique identifier of the completed operation
 *   - status: 'success' | 'failure' | 'error' | 'timeout'
 *   - exitCode: process exit code (0 = success by convention)
 *   - durationMs: wall-clock time for the operation
 *   - stdoutHash: SHA-256 of stdout (for drift detection via DriftMonitor)
 *   - timestamp: Unix milliseconds from the CompletionSignal
 *   - error: present only if signal.error is defined
 *
 * STDOUT HASHING
 * --------------
 * stdout is hashed rather than stored verbatim. This is intentional:
 * - Verbatim stdout would bloat the feedback store with redundant content
 * - Hashes are sufficient for DriftMonitor's variance detection
 * - Hash collision probability with SHA-256 is negligible for this use case
 * The hash algorithm matches DeterminismAnalyzer's hashing for consistent output comparison.
 *
 * ERROR HANDLING
 * --------------
 * storeFeedback() is called inside a .catch() from the listener. If storage fails
 * (e.g., disk full, permissions), a warning is logged but the error is not rethrown.
 * The SignalBus listener must not throw — throwing would destabilize the bus.
 * Silent failure on feedback write is preferable to crashing the application.
 *
 * SATISFIES
 * ---------
 * FEED-04: Blitter feedback events flow to Copper learning cycle.
 *
 * @see SequenceRecorder (sequence-recorder.ts) — the parallel listener that
 *   coexists with this module on the same SignalBus
 * @see DriftMonitor (drift-monitor.ts) — reads 'feedback' records to detect
 *   output drift in promoted scripts
 * @see PatternStore (core/storage/pattern-store.ts) — the durable JSONL store
 *   this module writes to
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "The Story of the Two Listeners"
 *   explains the parallel listener architecture
 * @see BATCH-3-RETROSPECTIVE.md — Lex's debrief: "Signal categories don't
 *   interfere because PatternStore isolation is at the category key"
 */

import { createHash } from 'crypto';
import { SignalBus } from '../../services/chipset/blitter/signals.js';
import type { CompletionSignal } from '../../services/chipset/blitter/types.js';
import { PatternStore } from '../../core/storage/pattern-store.js';

/**
 * Bridges Blitter CompletionSignal events to PatternStore 'feedback' category,
 * making execution outcomes available for the Copper learning cycle and DriftMonitor.
 *
 * Listens on the SignalBus for 'completion' events and automatically stores
 * structured feedback entries containing operation outcome data (status, exit code,
 * duration, stdout hash). Copper can then read these entries during its next
 * evaluation cycle to inform list refinement.
 *
 * Lifecycle:
 *   new FeedbackBridge(bus, store) — construct, does not register listener
 *   .start()                       — register listener (idempotent)
 *   ...completion events fire...   — each writes one 'feedback' record
 *   .stop()                        — unregister listener (idempotent)
 *
 * Satisfies: FEED-04 (Blitter feedback events flow to Copper learning).
 */
export class FeedbackBridge {
  private bus: SignalBus;
  private store: PatternStore;
  /** Stored reference to the listener function, enabling idempotent start/stop */
  private listener: ((signal: CompletionSignal) => void) | null = null;

  constructor(bus: SignalBus, store: PatternStore) {
    this.bus = bus;
    this.store = store;
  }

  /**
   * Register a listener on the SignalBus for 'completion' events.
   * Idempotent: calling start() when already started is a no-op.
   *
   * The listener is async-safe: storeFeedback() errors are caught and logged
   * but do not propagate to the SignalBus. This is critical — a throwing listener
   * would break all other listeners on the same event.
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
   * Call during application shutdown to allow clean resource cleanup.
   */
  stop(): void {
    if (!this.listener) return;
    this.bus.off('completion', this.listener);
    this.listener = null;
  }

  /**
   * Extract feedback data from a CompletionSignal and persist it to PatternStore.
   *
   * stdout is hashed (SHA-256) rather than stored verbatim for storage efficiency
   * and drift detection compatibility with DriftMonitor. The hash is sufficient
   * for determining whether a script's output has changed between runs.
   *
   * error field is conditionally spread: included only when signal.error is defined,
   * keeping feedback records lean for the common success case.
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
