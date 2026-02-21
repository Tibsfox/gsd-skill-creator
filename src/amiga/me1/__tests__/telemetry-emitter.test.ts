/**
 * Tests for ME-1 TelemetryEmitter class.
 *
 * Covers: TELEMETRY_UPDATE, ALERT_SURFACE, GATE_SIGNAL emission,
 * event log, onEmit callback, validation guards.
 */

import { describe, it, expect, vi } from 'vitest';
import { TelemetryEmitter } from '../telemetry-emitter.js';
import { TelemetryUpdatePayloadSchema, AlertSurfacePayloadSchema, GateSignalPayloadSchema } from '../../icd/icd-01.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MISSION_ID = 'mission-2026-02-18-001';
const NOW = '2026-02-18T12:00:00Z';
const DEADLINE = '2026-02-20T00:00:00Z';

function createEmitter(onEmit?: (event: unknown) => void) {
  return new TelemetryEmitter({ mission_id: MISSION_ID, onEmit: onEmit as undefined });
}

function telemetryData() {
  return {
    phase: 'BRIEFING' as const,
    progress: 25,
    team_status: { ME: { status: 'green' as const, agent_count: 3 } },
    checkpoints: [{ name: 'Init', completed: true, timestamp: NOW }],
    resources: { cpu_percent: 42, memory_mb: 512, active_agents: 3 },
  };
}

function alertData() {
  return {
    alert_level: 'advisory' as const,
    source_agent: 'ME-1',
    message: 'Memory usage above 80%',
    category: 'resource' as const,
  };
}

function gateData() {
  return {
    gate_type: 'phase_transition' as const,
    blocking_phase: 'REVIEW_GATE' as const,
    criteria: [{ name: 'Tests pass', met: true, evidence: 'All 40 tests green' }],
    deadline: DEADLINE,
  };
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('TelemetryEmitter constructor', () => {
  it('creates an emitter instance', () => {
    const emitter = createEmitter();
    expect(emitter).toBeInstanceOf(TelemetryEmitter);
  });

  it('starts with an empty event log', () => {
    const emitter = createEmitter();
    expect(emitter.getEventLog()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// emitTelemetry (TELEMETRY_UPDATE)
// ---------------------------------------------------------------------------

describe('emitTelemetry', () => {
  it('returns a valid EventEnvelope', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    const result = EventEnvelopeSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('has type TELEMETRY_UPDATE', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    expect(event.type).toBe('TELEMETRY_UPDATE');
  });

  it('has source ME-3', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    expect(event.source).toBe('ME-3');
  });

  it('has destination MC-1', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    expect(event.destination).toBe('MC-1');
  });

  it('has requires_ack false', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    expect(event.requires_ack).toBe(false);
  });

  it('payload passes TelemetryUpdatePayloadSchema validation', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    const result = TelemetryUpdatePayloadSchema.safeParse(event.payload);
    expect(result.success).toBe(true);
  });

  it('envelope passes EventEnvelopeSchema validation', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    const result = EventEnvelopeSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('payload contains the mission_id from config', () => {
    const emitter = createEmitter();
    const event = emitter.emitTelemetry(telemetryData());
    expect((event.payload as Record<string, unknown>).mission_id).toBe(MISSION_ID);
  });
});

// ---------------------------------------------------------------------------
// emitAlert (ALERT_SURFACE)
// ---------------------------------------------------------------------------

describe('emitAlert', () => {
  it('returns a valid EventEnvelope', () => {
    const emitter = createEmitter();
    const event = emitter.emitAlert(alertData());
    const result = EventEnvelopeSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('has type ALERT_SURFACE', () => {
    const emitter = createEmitter();
    const event = emitter.emitAlert(alertData());
    expect(event.type).toBe('ALERT_SURFACE');
  });

  it('has source ME-3 and destination MC-1', () => {
    const emitter = createEmitter();
    const event = emitter.emitAlert(alertData());
    expect(event.source).toBe('ME-3');
    expect(event.destination).toBe('MC-1');
  });

  it('payload passes AlertSurfacePayloadSchema validation', () => {
    const emitter = createEmitter();
    const event = emitter.emitAlert(alertData());
    const result = AlertSurfacePayloadSchema.safeParse(event.payload);
    expect(result.success).toBe(true);
  });

  it('includes optional resolution and expires_at when provided', () => {
    const emitter = createEmitter();
    const data = {
      ...alertData(),
      resolution: 'Restart the agent',
      expires_at: DEADLINE,
    };
    const event = emitter.emitAlert(data);
    const payload = event.payload as Record<string, unknown>;
    expect(payload.resolution).toBe('Restart the agent');
    expect(payload.expires_at).toBe(DEADLINE);
  });
});

// ---------------------------------------------------------------------------
// emitGateSignal (GATE_SIGNAL)
// ---------------------------------------------------------------------------

describe('emitGateSignal', () => {
  it('returns a valid EventEnvelope', () => {
    const emitter = createEmitter();
    const event = emitter.emitGateSignal(gateData());
    const result = EventEnvelopeSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('has type GATE_SIGNAL', () => {
    const emitter = createEmitter();
    const event = emitter.emitGateSignal(gateData());
    expect(event.type).toBe('GATE_SIGNAL');
  });

  it('has requires_ack true', () => {
    const emitter = createEmitter();
    const event = emitter.emitGateSignal(gateData());
    expect(event.requires_ack).toBe(true);
  });

  it('payload passes GateSignalPayloadSchema validation', () => {
    const emitter = createEmitter();
    const event = emitter.emitGateSignal(gateData());
    const result = GateSignalPayloadSchema.safeParse(event.payload);
    expect(result.success).toBe(true);
  });

  it('includes optional context when provided', () => {
    const emitter = createEmitter();
    const data = { ...gateData(), context: 'Phase 4 blocked on test results' };
    const event = emitter.emitGateSignal(data);
    expect((event.payload as Record<string, unknown>).context).toBe(
      'Phase 4 blocked on test results',
    );
  });
});

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

describe('event log', () => {
  it('returns array of length 3 after emitting 3 events', () => {
    const emitter = createEmitter();
    emitter.emitTelemetry(telemetryData());
    emitter.emitAlert(alertData());
    emitter.emitGateSignal(gateData());
    expect(emitter.getEventLog()).toHaveLength(3);
  });

  it('events are in emission order (FIFO)', () => {
    const emitter = createEmitter();
    emitter.emitTelemetry(telemetryData());
    emitter.emitAlert(alertData());
    emitter.emitGateSignal(gateData());
    const log = emitter.getEventLog();
    expect(log[0].type).toBe('TELEMETRY_UPDATE');
    expect(log[1].type).toBe('ALERT_SURFACE');
    expect(log[2].type).toBe('GATE_SIGNAL');
  });

  it('each event in the log is a valid EventEnvelope', () => {
    const emitter = createEmitter();
    emitter.emitTelemetry(telemetryData());
    emitter.emitAlert(alertData());
    emitter.emitGateSignal(gateData());
    for (const event of emitter.getEventLog()) {
      const result = EventEnvelopeSchema.safeParse(event);
      expect(result.success).toBe(true);
    }
  });

  it('clearEventLog resets the log to empty', () => {
    const emitter = createEmitter();
    emitter.emitTelemetry(telemetryData());
    emitter.emitAlert(alertData());
    expect(emitter.getEventLog()).toHaveLength(2);
    emitter.clearEventLog();
    expect(emitter.getEventLog()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// onEmit callback
// ---------------------------------------------------------------------------

describe('onEmit callback', () => {
  it('accepts optional onEmit callback in constructor', () => {
    const cb = vi.fn();
    const emitter = new TelemetryEmitter({ mission_id: MISSION_ID, onEmit: cb });
    expect(emitter).toBeInstanceOf(TelemetryEmitter);
  });

  it('callback is invoked on each emit with the event as argument', () => {
    const cb = vi.fn();
    const emitter = new TelemetryEmitter({ mission_id: MISSION_ID, onEmit: cb });
    const event = emitter.emitTelemetry(telemetryData());
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(event);
  });

  it('callback fires for all event types', () => {
    const cb = vi.fn();
    const emitter = new TelemetryEmitter({ mission_id: MISSION_ID, onEmit: cb });
    emitter.emitTelemetry(telemetryData());
    emitter.emitAlert(alertData());
    emitter.emitGateSignal(gateData());
    expect(cb).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// Validation guards
// ---------------------------------------------------------------------------

describe('validation guards', () => {
  it('emitTelemetry throws if progress is out of 0-100 range', () => {
    const emitter = createEmitter();
    expect(() => emitter.emitTelemetry({ ...telemetryData(), progress: 150 })).toThrow();
  });

  it('emitAlert throws if message is empty string', () => {
    const emitter = createEmitter();
    expect(() => emitter.emitAlert({ ...alertData(), message: '' })).toThrow();
  });

  it('emitGateSignal throws if criteria array is empty', () => {
    const emitter = createEmitter();
    expect(() => emitter.emitGateSignal({ ...gateData(), criteria: [] })).toThrow();
  });
});
