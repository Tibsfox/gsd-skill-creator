/**
 * ME-1 telemetry emitter.
 *
 * Produces valid ICD-01 events for the ME-1 component, covering phase
 * progress (TELEMETRY_UPDATE), alerts (ALERT_SURFACE), and gate signals
 * (GATE_SIGNAL). All events are wrapped in EventEnvelope with source
 * 'ME-3' (telemetry emitter agent) and destination 'MC-1' (Mission Control).
 *
 * The emitter:
 * - Validates every payload against its ICD-01 schema before wrapping
 * - Maintains an internal event log for inspection/replay
 * - Supports an onEmit callback for real-time event streaming
 */

import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
} from '../icd/icd-01.js';
import { createEnvelope } from '../message-envelope.js';
import type { EventEnvelope } from '../message-envelope.js';
import type { PhaseStatus, AlertLevel } from '../types.js';

// ============================================================================
// Config
// ============================================================================

/** Configuration for the TelemetryEmitter. */
export interface TelemetryEmitterConfig {
  /** Mission identifier for payload enrichment. */
  mission_id: string;
  /** Optional callback invoked on every emission. */
  onEmit?: (event: EventEnvelope) => void;
}

// ============================================================================
// TelemetryEmitter
// ============================================================================

/**
 * Emits ICD-01 telemetry events for the ME-1 component.
 *
 * All emitted events are validated against their ICD-01 payload schemas
 * and wrapped in EventEnvelope with routing fields per the AMIGA routing
 * table (source: ME-3, destination: MC-1).
 */
export class TelemetryEmitter {
  private readonly config: TelemetryEmitterConfig;
  private readonly eventLog: EventEnvelope[];

  constructor(config: TelemetryEmitterConfig) {
    this.config = config;
    this.eventLog = [];
  }

  // --------------------------------------------------------------------------
  // emitTelemetry (TELEMETRY_UPDATE)
  // --------------------------------------------------------------------------

  /**
   * Emit a TELEMETRY_UPDATE event with phase progress data.
   *
   * @param data - Phase progress, team status, checkpoints, and resources
   * @returns The emitted EventEnvelope
   * @throws If the payload fails ICD-01 schema validation
   */
  emitTelemetry(data: {
    phase: PhaseStatus;
    progress: number;
    team_status: Record<string, { status: 'green' | 'amber' | 'red'; agent_count: number }>;
    checkpoints: Array<{ name: string; completed: boolean; timestamp?: string }>;
    resources: { cpu_percent: number; memory_mb: number; active_agents: number };
  }): EventEnvelope {
    const payload = {
      mission_id: this.config.mission_id,
      ...data,
    };

    // Validate against ICD-01 schema (throws on invalid data)
    TelemetryUpdatePayloadSchema.parse(payload);

    const envelope = createEnvelope({
      source: 'ME-3',
      destination: 'MC-1',
      type: 'TELEMETRY_UPDATE',
      payload,
      priority: 'normal',
      requires_ack: false,
    });

    return this.record(envelope);
  }

  // --------------------------------------------------------------------------
  // emitAlert (ALERT_SURFACE)
  // --------------------------------------------------------------------------

  /**
   * Emit an ALERT_SURFACE event.
   *
   * @param data - Alert level, source agent, message, category, and optional fields
   * @returns The emitted EventEnvelope
   * @throws If the payload fails ICD-01 schema validation
   */
  emitAlert(data: {
    alert_level: AlertLevel;
    source_agent: string;
    message: string;
    category: 'resource' | 'phase' | 'agent' | 'system';
    resolution?: string;
    expires_at?: string;
  }): EventEnvelope {
    const payload = { ...data };

    // Validate against ICD-01 schema (throws on invalid data)
    AlertSurfacePayloadSchema.parse(payload);

    const envelope = createEnvelope({
      source: 'ME-3',
      destination: 'MC-1',
      type: 'ALERT_SURFACE',
      payload,
      priority: data.alert_level === 'gate' ? 'high' : 'normal',
      requires_ack: false,
    });

    return this.record(envelope);
  }

  // --------------------------------------------------------------------------
  // emitGateSignal (GATE_SIGNAL)
  // --------------------------------------------------------------------------

  /**
   * Emit a GATE_SIGNAL event (requires_ack=true).
   *
   * @param data - Gate type, blocking phase, criteria, deadline, and optional context
   * @returns The emitted EventEnvelope
   * @throws If the payload fails ICD-01 schema validation
   */
  emitGateSignal(data: {
    gate_type: 'phase_transition' | 'quality_check' | 'integration_verify' | 'human_review';
    blocking_phase: PhaseStatus;
    criteria: Array<{ name: string; met: boolean; evidence?: string }>;
    deadline: string;
    context?: string;
  }): EventEnvelope {
    const payload = { ...data };

    // Validate against ICD-01 schema (throws on invalid data)
    GateSignalPayloadSchema.parse(payload);

    const envelope = createEnvelope({
      source: 'ME-3',
      destination: 'MC-1',
      type: 'GATE_SIGNAL',
      payload,
      priority: 'urgent',
      requires_ack: true,
    });

    return this.record(envelope);
  }

  // --------------------------------------------------------------------------
  // Event log
  // --------------------------------------------------------------------------

  /** Get all emitted events in emission order. */
  getEventLog(): readonly EventEnvelope[] {
    return [...this.eventLog];
  }

  /** Clear the event log. */
  clearEventLog(): void {
    this.eventLog.length = 0;
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /** Record an envelope to the log, fire callback, and return it. */
  private record(envelope: EventEnvelope): EventEnvelope {
    this.eventLog.push(envelope);
    if (this.config.onEmit) {
      this.config.onEmit(envelope);
    }
    return envelope;
  }
}
