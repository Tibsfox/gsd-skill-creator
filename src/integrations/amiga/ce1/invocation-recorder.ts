/**
 * CE-1 invocation recorder.
 *
 * The event-driven bridge between ME-1's telemetry stream and CE-1's
 * attribution ledger. The recorder accepts EventEnvelope messages via
 * its handleEvent() method, filters for LEDGER_ENTRY events, validates
 * payloads against ICD-02, and appends valid entries to the attribution
 * ledger.
 *
 * Key design principle (CMON-03): The recorder has NO direct dependency
 * on ME-1's TelemetryEmitter. It accepts any EventEnvelope via handleEvent().
 * In production, the event bus wires TelemetryEmitter's onEmit callback to
 * the recorder's handleEvent method. ME-1 code is never modified -- the
 * recorder is a passive listener on the event stream.
 *
 * Key design principle (CMON-04): The recorder does not transform the
 * LEDGER_ENTRY payload. It passes it directly to the attribution ledger
 * after ICD-02 validation. The payload already contains context_weight,
 * timestamp, phase, agent_id, and dependency_tree with depth decay.
 */

import { AttributionLedger } from './attribution-ledger.js';
import { LedgerEntryPayloadSchema } from '../icd/icd-02.js';
import type { LedgerEntryPayload } from '../icd/icd-02.js';
import type { EventEnvelope } from '../message-envelope.js';

// ============================================================================
// Types
// ============================================================================

/** Diagnostic statistics for the recorder. */
export interface RecorderStats {
  /** Total events received (all types). */
  totalEventsReceived: number;
  /** LEDGER_ENTRY events successfully captured to ledger. */
  ledgerEntriesCaptured: number;
  /** Events that failed validation or ledger append. */
  errors: number;
}

/** Configuration for the InvocationRecorder. */
export interface InvocationRecorderConfig {
  /** The attribution ledger to append captured entries to. */
  ledger: AttributionLedger;
}

// ============================================================================
// InvocationRecorder
// ============================================================================

/**
 * Event-driven recorder that captures LEDGER_ENTRY events and appends
 * them to the attribution ledger.
 *
 * The recorder is a passive component: it does not initiate communication
 * with any other AMIGA component. It simply receives events via handleEvent()
 * and processes LEDGER_ENTRY events.
 */
export class InvocationRecorder {
  private readonly ledger: AttributionLedger;
  private recording: boolean;
  private stats: RecorderStats;

  constructor(config: InvocationRecorderConfig) {
    this.ledger = config.ledger;
    this.recording = false;
    this.stats = {
      totalEventsReceived: 0,
      ledgerEntriesCaptured: 0,
      errors: 0,
    };
  }

  /** Whether the recorder is actively recording. */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Start recording. Events received via handleEvent will be processed.
   *
   * @throws If already recording
   */
  start(): void {
    if (this.recording) {
      throw new Error('Recorder already started');
    }
    this.recording = true;
  }

  /**
   * Stop recording. Events received via handleEvent will be ignored.
   *
   * @throws If not recording
   */
  stop(): void {
    if (!this.recording) {
      throw new Error('Recorder not started');
    }
    this.recording = false;
  }

  /**
   * Handle an incoming event envelope.
   *
   * Called by the event bus (e.g., wired to TelemetryEmitter.onEmit).
   *
   * - Ignores events when not recording
   * - Ignores non-LEDGER_ENTRY events
   * - Validates LEDGER_ENTRY payload against ICD-02
   * - Appends valid entries to the attribution ledger
   * - Tracks errors gracefully (no throws)
   *
   * @param envelope - The event envelope to process
   */
  handleEvent(envelope: EventEnvelope): void {
    // Ignore when not recording (do not increment any stats)
    if (!this.recording) return;

    this.stats.totalEventsReceived++;

    // Only process LEDGER_ENTRY events
    if (envelope.type !== 'LEDGER_ENTRY') return;

    try {
      // Validate payload against ICD-02 schema
      const validated = LedgerEntryPayloadSchema.parse(envelope.payload);

      // Append to the attribution ledger
      this.ledger.append(validated);

      this.stats.ledgerEntriesCaptured++;
    } catch {
      // Swallow the error -- increment error count instead
      this.stats.errors++;
    }
  }

  /** Get diagnostic statistics. */
  getStats(): RecorderStats {
    return { ...this.stats };
  }
}
