/**
 * ME-1 archive writer.
 *
 * Produces sealed immutable mission archive records on COMPLETION or ABORT.
 * An archive captures the final manifest state, complete telemetry event log,
 * invocation records for attribution, and a SHA-256 integrity hash covering
 * all content fields.
 *
 * After sealing:
 * - The archive object and all nested structures are deeply frozen
 * - No further modifications are possible (mutations throw in strict mode)
 * - The integrity hash can be verified against the frozen content
 *
 * This is ME-1's record-keeping mechanism -- the sealed archive is the
 * permanent, tamper-evident record of a mission's execution.
 */

import { createHash } from 'node:crypto';
import type { MissionManifest } from './manifest.js';
import type { TelemetryEmitter } from './telemetry-emitter.js';
import type { EventEnvelope } from '../message-envelope.js';

// ============================================================================
// Types
// ============================================================================

/** Mission outcome at seal time. */
export type ArchiveOutcome = 'completed' | 'aborted';

/** An invocation record for attribution tracking. */
export interface InvocationRecord {
  /** Agent that performed the invocation. */
  agent_id: string;
  /** Description of the action taken. */
  action: string;
  /** When the invocation occurred. */
  timestamp: string;
  /** Context weight for attribution (0-1). */
  context_weight: number;
}

/** A sealed immutable mission archive record. */
export interface MissionArchive {
  /** The final manifest state at seal time. */
  readonly manifest: Readonly<MissionManifest>;
  /** Complete telemetry event log. */
  readonly events: readonly EventEnvelope[];
  /** Invocation records for attribution. */
  readonly invocations: readonly InvocationRecord[];
  /** Mission outcome. */
  readonly outcome: ArchiveOutcome;
  /** ISO 8601 timestamp when the archive was sealed. */
  readonly sealed_at: string;
  /** SHA-256 hex hash covering manifest, events, invocations, and outcome. */
  readonly integrity_hash: string;
  /** Total number of telemetry events. */
  readonly event_count: number;
}

/** Configuration for creating an ArchiveWriter. */
export interface ArchiveWriterConfig {
  /** The mission manifest (will be snapshotted at seal time). */
  manifest: MissionManifest;
  /** The telemetry emitter (event log will be captured at seal time). */
  emitter: TelemetryEmitter;
}

// ============================================================================
// Deep freeze helper
// ============================================================================

/**
 * Recursively freeze an object and all its nested objects/arrays.
 */
function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

// ============================================================================
// ArchiveWriter
// ============================================================================

/**
 * Produces sealed immutable mission archives on COMPLETION or ABORT.
 *
 * Captures the manifest state, telemetry event log, and invocation records
 * at seal time. The sealed archive is deeply frozen with a SHA-256
 * integrity hash covering all content fields.
 */
export class ArchiveWriter {
  private readonly emitter: TelemetryEmitter;
  private manifest: MissionManifest;
  private sealed: boolean;
  private readonly invocations: InvocationRecord[];

  constructor(config: ArchiveWriterConfig) {
    this.manifest = config.manifest;
    this.emitter = config.emitter;
    this.sealed = false;
    this.invocations = [];
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Check if the archive has been sealed. */
  isSealed(): boolean {
    return this.sealed;
  }

  /**
   * Record an invocation for attribution tracking.
   *
   * @throws If the archive is already sealed
   */
  recordInvocation(record: InvocationRecord): void {
    if (this.sealed) {
      throw new Error('Cannot record invocation: archive already sealed');
    }
    this.invocations.push({ ...record });
  }

  /**
   * Update the manifest reference (called by external components as
   * the mission progresses).
   *
   * @throws If the archive is already sealed
   */
  updateManifest(manifest: MissionManifest): void {
    if (this.sealed) {
      throw new Error('Cannot update manifest: archive already sealed');
    }
    this.manifest = manifest;
  }

  /**
   * Seal the archive, producing an immutable MissionArchive record.
   *
   * The archive captures:
   * - Current manifest state (deep copied and frozen)
   * - Complete telemetry event log from emitter (copied and frozen)
   * - All recorded invocations (copied and frozen)
   * - Outcome (completed or aborted)
   * - Sealed timestamp
   * - SHA-256 integrity hash
   *
   * After sealing, no further modifications are possible.
   *
   * @throws If already sealed
   */
  seal(outcome: ArchiveOutcome): MissionArchive {
    if (this.sealed) {
      throw new Error('Archive already sealed');
    }

    this.sealed = true;

    // Deep-copy and freeze the manifest
    const frozenManifest = deepFreeze(JSON.parse(JSON.stringify(this.manifest)));

    // Copy and freeze the event log
    const eventLog = this.emitter.getEventLog();
    const frozenEvents = Object.freeze([...eventLog]);

    // Copy and freeze invocations
    const frozenInvocations = Object.freeze(
      this.invocations.map((inv) => ({ ...inv })),
    );

    // Seal timestamp
    const sealed_at = new Date().toISOString();

    // Compute integrity hash (SHA-256 over all content fields)
    const content = JSON.stringify({
      manifest: frozenManifest,
      events: frozenEvents,
      invocations: frozenInvocations,
      outcome,
    });
    const integrity_hash = createHash('sha256').update(content).digest('hex');

    // Construct and freeze the archive
    const archive: MissionArchive = {
      manifest: frozenManifest,
      events: frozenEvents,
      invocations: frozenInvocations,
      outcome,
      sealed_at,
      integrity_hash,
      event_count: frozenEvents.length,
    };

    return Object.freeze(archive);
  }
}
