/**
 * Three-tier alert renderer for the MC-1 Control Surface.
 *
 * Consumes ICD-01 ALERT_SURFACE and GATE_SIGNAL events from EventEnvelope
 * objects and produces renderable view models for UI consumption. Supports
 * three tiers:
 *
 * - Nominal (silent): no visible output, pass-through
 * - Advisory (panel rise): attention-needed alert with message, source, category
 * - Gate (full suspension): blocks mission flow, requires Go/No-Go/Redirect
 *
 * Gate responses are emitted as valid ICD-01 GATE_RESPONSE envelopes via
 * a configurable callback.
 *
 * This is a pure state machine with no I/O except the optional gate
 * response callback.
 */

import { createEnvelope } from '../message-envelope.js';
import type { EventEnvelope } from '../message-envelope.js';
import { AlertSurfacePayloadSchema, GateSignalPayloadSchema } from '../icd/icd-01.js';
import type { GateDecision } from '../types.js';

// ============================================================================
// View Model Types (discriminated union on `tier`)
// ============================================================================

/** Nominal tier: no visible output, silent pass-through. */
export interface NominalView {
  tier: 'nominal';
}

/** Advisory tier: panel-rise view model with alert details. */
export interface AdvisoryView {
  tier: 'advisory';
  message: string;
  source_agent: string;
  category: string;
  resolution?: string;
  timestamp: string;
}

/** Gate tier: full suspension view model with criteria and action buttons. */
export interface GateView {
  tier: 'gate';
  gate_type: string;
  blocking_phase: string;
  criteria: Array<{ name: string; met: boolean; evidence?: string }>;
  deadline: string;
  context?: string;
  buttons: ['go', 'no_go', 'redirect'];
  gate_signal_id: string;
}

/** Discriminated union of all alert view tiers. */
export type AlertView = NominalView | AdvisoryView | GateView;

// ============================================================================
// Configuration
// ============================================================================

/** Configuration for the AlertRenderer. */
export interface AlertRendererConfig {
  /** Callback invoked when a gate response is emitted. */
  onGateResponse?: (envelope: EventEnvelope) => void;
}

// ============================================================================
// Internal State
// ============================================================================

interface MissionAlertState {
  current_tier: 'nominal' | 'advisory' | 'gate';
  advisory?: AdvisoryView;
  gate?: GateView;
  gate_signal_envelope_id?: string;
}

// ============================================================================
// AlertRenderer Class
// ============================================================================

/**
 * Three-tier alert renderer.
 *
 * Processes EventEnvelope objects and maintains per-mission alert state.
 * Query the current view for any mission via getView(). Respond to gates
 * via respondToGate().
 */
export class AlertRenderer {
  private readonly missions: Map<string, MissionAlertState> = new Map();
  private readonly config: AlertRendererConfig;

  constructor(config?: AlertRendererConfig) {
    this.config = config ?? {};
  }

  /**
   * Process an incoming event envelope.
   *
   * Routes TELEMETRY_UPDATE, ALERT_SURFACE, and GATE_SIGNAL events to the
   * appropriate handler. All other event types are silently ignored.
   */
  processEvent(envelope: EventEnvelope): void {
    switch (envelope.type) {
      case 'TELEMETRY_UPDATE':
        this.processTelemetry(envelope);
        break;
      case 'ALERT_SURFACE':
        this.processAlert(envelope);
        break;
      case 'GATE_SIGNAL':
        this.processGate(envelope);
        break;
      default:
        // Silently ignore event types the alert renderer doesn't consume
        break;
    }
  }

  /**
   * Get the current alert view for a mission.
   *
   * Returns NominalView if the mission is unknown or has no active alerts.
   */
  getView(missionId: string): AlertView {
    const state = this.missions.get(missionId);
    if (!state || state.current_tier === 'nominal') {
      return { tier: 'nominal' };
    }
    if (state.current_tier === 'advisory' && state.advisory) {
      return { ...state.advisory };
    }
    if (state.current_tier === 'gate' && state.gate) {
      return { ...state.gate };
    }
    return { tier: 'nominal' };
  }

  /**
   * Get all active alerts across all missions.
   *
   * Returns entries where the tier is not 'nominal'.
   */
  getActiveAlerts(): Array<{ mission_id: string; view: AlertView }> {
    const active: Array<{ mission_id: string; view: AlertView }> = [];
    for (const [missionId, state] of this.missions.entries()) {
      if (state.current_tier !== 'nominal') {
        active.push({ mission_id: missionId, view: this.getView(missionId) });
      }
    }
    return active;
  }

  /**
   * Check if a mission is suspended by an active gate.
   */
  isSuspended(missionId: string): boolean {
    const state = this.missions.get(missionId);
    return state?.current_tier === 'gate';
  }

  /**
   * Respond to an active gate.
   *
   * Constructs a GATE_RESPONSE envelope and emits it via the onGateResponse
   * callback. Clears the gate from the mission state.
   *
   * @returns true if the gate was found and response was emitted, false otherwise
   */
  respondToGate(
    missionId: string,
    gateSignalId: string,
    decision: GateDecision,
    reasoning: string,
    responder: string,
    conditions?: string[],
  ): boolean {
    const state = this.missions.get(missionId);
    if (!state || state.current_tier !== 'gate' || state.gate_signal_envelope_id !== gateSignalId) {
      return false;
    }

    // Build GATE_RESPONSE payload
    const payload: Record<string, unknown> = {
      decision,
      reasoning,
      responder,
      gate_signal_id: gateSignalId,
    };
    if (conditions !== undefined) {
      payload.conditions = conditions;
    }

    // Create envelope
    const envelope = createEnvelope({
      source: 'MC-1',
      destination: 'ME-1',
      type: 'GATE_RESPONSE',
      payload,
      correlation: gateSignalId,
      requires_ack: false,
    });

    // Emit via callback
    if (this.config.onGateResponse) {
      this.config.onGateResponse(envelope);
    }

    // Clear gate -- return to nominal
    state.current_tier = 'nominal';
    state.gate = undefined;
    state.gate_signal_envelope_id = undefined;

    return true;
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  /**
   * Process a TELEMETRY_UPDATE event.
   *
   * Clears advisory alerts (fresh telemetry means the advisory condition passed).
   * Does NOT clear gates -- only explicit respondToGate clears gates.
   */
  private processTelemetry(envelope: EventEnvelope): void {
    const missionId = this.extractMissionIdFromTelemetry(envelope);
    if (!missionId) return;

    const state = this.getOrCreateState(missionId);

    // Advisory clears on fresh telemetry; gate does NOT
    if (state.current_tier === 'advisory') {
      state.current_tier = 'nominal';
      state.advisory = undefined;
    }
  }

  /**
   * Process an ALERT_SURFACE event.
   *
   * Creates an AdvisoryView and sets the mission state to advisory tier.
   */
  private processAlert(envelope: EventEnvelope): void {
    const parsed = AlertSurfacePayloadSchema.safeParse(envelope.payload);
    if (!parsed.success) return;

    const payload = parsed.data;
    const missionId = this.extractMissionIdFromAlert(envelope);

    const state = this.getOrCreateState(missionId);

    if (payload.alert_level === 'advisory') {
      const advisory: AdvisoryView = {
        tier: 'advisory',
        message: payload.message,
        source_agent: payload.source_agent,
        category: payload.category,
        timestamp: envelope.timestamp,
      };
      if (payload.resolution !== undefined) {
        advisory.resolution = payload.resolution;
      }

      state.current_tier = 'advisory';
      state.advisory = advisory;
    }
  }

  /**
   * Process a GATE_SIGNAL event.
   *
   * Creates a GateView and sets the mission state to gate tier.
   */
  private processGate(envelope: EventEnvelope): void {
    const parsed = GateSignalPayloadSchema.safeParse(envelope.payload);
    if (!parsed.success) return;

    const payload = parsed.data;
    const missionId = this.extractMissionIdFromAlert(envelope);

    const state = this.getOrCreateState(missionId);

    const gate: GateView = {
      tier: 'gate',
      gate_type: payload.gate_type,
      blocking_phase: payload.blocking_phase,
      criteria: payload.criteria.map((c) => {
        const entry: { name: string; met: boolean; evidence?: string } = {
          name: c.name,
          met: c.met,
        };
        if (c.evidence !== undefined) {
          entry.evidence = c.evidence;
        }
        return entry;
      }),
      deadline: payload.deadline,
      buttons: ['go', 'no_go', 'redirect'],
      gate_signal_id: envelope.id,
    };
    if (payload.context !== undefined) {
      gate.context = payload.context;
    }

    state.current_tier = 'gate';
    state.gate = gate;
    state.gate_signal_envelope_id = envelope.id;
  }

  /**
   * Extract mission ID from a TELEMETRY_UPDATE payload.
   */
  private extractMissionIdFromTelemetry(envelope: EventEnvelope): string | null {
    const payload = envelope.payload as Record<string, unknown>;
    if (typeof payload.mission_id === 'string') {
      return payload.mission_id;
    }
    return null;
  }

  /**
   * Extract mission ID from an ALERT_SURFACE or GATE_SIGNAL event.
   *
   * Priority: correlation > payload.mission_id > most recent mission > default key
   */
  private extractMissionIdFromAlert(envelope: EventEnvelope): string {
    // Check correlation
    if (envelope.correlation && this.missions.has(envelope.correlation)) {
      return envelope.correlation;
    }
    if (envelope.correlation) {
      return envelope.correlation;
    }

    // Check payload for mission_id
    const payload = envelope.payload as Record<string, unknown>;
    if (typeof payload.mission_id === 'string') {
      return payload.mission_id;
    }

    // Fall back to most recently created mission
    let lastKey: string | null = null;
    for (const key of this.missions.keys()) {
      lastKey = key;
    }

    return lastKey ?? '__default__';
  }

  /**
   * Get or create a MissionAlertState for the given mission ID.
   */
  private getOrCreateState(missionId: string): MissionAlertState {
    let state = this.missions.get(missionId);
    if (!state) {
      state = { current_tier: 'nominal' };
      this.missions.set(missionId, state);
    }
    return state;
  }
}
