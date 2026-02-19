/**
 * Tests for ICD-01 (MC-1/ME-1) payload schemas.
 *
 * Covers all 5 event types on the highest-traffic AMIGA interface:
 * - TelemetryUpdatePayloadSchema: phase progress, team status, checkpoints, resources
 * - AlertSurfacePayloadSchema: alert level, source agent, message, category
 * - GateSignalPayloadSchema: gate type, blocking phase, criteria, deadline
 * - GateResponsePayloadSchema: decision, reasoning, responder, correlation
 * - CommandDispatchPayloadSchema: command type, target agent, parameters
 *
 * Also validates convenience exports:
 * - ICD_01_SCHEMAS mapping object
 * - ICD_01_META metadata object
 */

import { describe, it, expect } from 'vitest';
import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
  GateResponsePayloadSchema,
  CommandDispatchPayloadSchema,
  ICD_01_SCHEMAS,
  ICD_01_META,
} from '../icd/icd-01.js';

// ============================================================================
// TelemetryUpdatePayloadSchema
// ============================================================================

describe('TelemetryUpdatePayloadSchema', () => {
  const validPayload = {
    mission_id: 'mission-2026-02-17-001',
    phase: 'EXECUTION',
    progress: 75,
    team_status: {
      CS: { status: 'green', agent_count: 3 },
      ME: { status: 'amber', agent_count: 3 },
    },
    checkpoints: [
      { name: 'schema-validation', completed: true, timestamp: '2026-02-17T14:30:00Z' },
      { name: 'integration-test', completed: false },
    ],
    resources: { cpu_percent: 42.5, memory_mb: 1024, active_agents: 8 },
  };

  it('accepts a valid telemetry update payload', () => {
    const result = TelemetryUpdatePayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    const result = TelemetryUpdatePayloadSchema.safeParse({
      ...validPayload,
      extra_field: 'should-pass',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing mission_id', () => {
    const { mission_id: _, ...without } = validPayload;
    expect(TelemetryUpdatePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects progress > 100', () => {
    expect(
      TelemetryUpdatePayloadSchema.safeParse({ ...validPayload, progress: 101 }).success,
    ).toBe(false);
  });

  it('rejects progress < 0', () => {
    expect(
      TelemetryUpdatePayloadSchema.safeParse({ ...validPayload, progress: -1 }).success,
    ).toBe(false);
  });

  it('rejects invalid phase value', () => {
    expect(
      TelemetryUpdatePayloadSchema.safeParse({ ...validPayload, phase: 'INVALID' }).success,
    ).toBe(false);
  });

  it('rejects missing team_status', () => {
    const { team_status: _, ...without } = validPayload;
    expect(TelemetryUpdatePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects missing checkpoints', () => {
    const { checkpoints: _, ...without } = validPayload;
    expect(TelemetryUpdatePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects missing resources', () => {
    const { resources: _, ...without } = validPayload;
    expect(TelemetryUpdatePayloadSchema.safeParse(without).success).toBe(false);
  });
});

// ============================================================================
// AlertSurfacePayloadSchema
// ============================================================================

describe('AlertSurfacePayloadSchema', () => {
  const validPayload = {
    alert_level: 'advisory',
    source_agent: 'ME-2',
    message: 'Phase engine detected resource contention',
    category: 'resource',
  };

  it('accepts a valid alert surface payload', () => {
    expect(AlertSurfacePayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts payload with optional resolution', () => {
    expect(
      AlertSurfacePayloadSchema.safeParse({
        ...validPayload,
        resolution: 'Scale down non-critical agents',
      }).success,
    ).toBe(true);
  });

  it('accepts payload with optional expires_at', () => {
    expect(
      AlertSurfacePayloadSchema.safeParse({
        ...validPayload,
        expires_at: '2026-02-17T15:00:00Z',
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      AlertSurfacePayloadSchema.safeParse({
        ...validPayload,
        extra: true,
      }).success,
    ).toBe(true);
  });

  it('rejects missing alert_level', () => {
    const { alert_level: _, ...without } = validPayload;
    expect(AlertSurfacePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty message', () => {
    expect(
      AlertSurfacePayloadSchema.safeParse({ ...validPayload, message: '' }).success,
    ).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(
      AlertSurfacePayloadSchema.safeParse({ ...validPayload, category: 'unknown' }).success,
    ).toBe(false);
  });

  it('rejects invalid source_agent', () => {
    expect(
      AlertSurfacePayloadSchema.safeParse({ ...validPayload, source_agent: 'BAD-ID' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// GateSignalPayloadSchema
// ============================================================================

describe('GateSignalPayloadSchema', () => {
  const validPayload = {
    gate_type: 'phase_transition',
    blocking_phase: 'REVIEW_GATE',
    criteria: [
      { name: 'unit-tests-pass', met: true, evidence: '47/47 tests passed' },
      { name: 'code-review-approved', met: true },
      { name: 'no-critical-bugs', met: false },
    ],
    deadline: '2026-02-17T18:00:00Z',
  };

  it('accepts a valid gate signal payload', () => {
    expect(GateSignalPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts payload with optional context', () => {
    expect(
      GateSignalPayloadSchema.safeParse({
        ...validPayload,
        context: 'Awaiting bug fix from ME-2 before gate can pass',
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      GateSignalPayloadSchema.safeParse({
        ...validPayload,
        extra_data: 42,
      }).success,
    ).toBe(true);
  });

  it('rejects missing gate_type', () => {
    const { gate_type: _, ...without } = validPayload;
    expect(GateSignalPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty criteria array', () => {
    expect(
      GateSignalPayloadSchema.safeParse({ ...validPayload, criteria: [] }).success,
    ).toBe(false);
  });

  it('rejects invalid blocking_phase', () => {
    expect(
      GateSignalPayloadSchema.safeParse({ ...validPayload, blocking_phase: 'INVALID' }).success,
    ).toBe(false);
  });

  it('rejects missing deadline', () => {
    const { deadline: _, ...without } = validPayload;
    expect(GateSignalPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('accepts human_review gate type', () => {
    expect(
      GateSignalPayloadSchema.safeParse({
        ...validPayload,
        gate_type: 'human_review',
      }).success,
    ).toBe(true);
  });
});

// ============================================================================
// GateResponsePayloadSchema
// ============================================================================

describe('GateResponsePayloadSchema', () => {
  const validPayload = {
    decision: 'go',
    reasoning: 'All criteria met, phase can proceed',
    responder: 'CS-1',
    gate_signal_id: 'evt-12345-abcde',
  };

  it('accepts a valid gate response payload', () => {
    expect(GateResponsePayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts human responder', () => {
    expect(
      GateResponsePayloadSchema.safeParse({
        ...validPayload,
        responder: 'human',
      }).success,
    ).toBe(true);
  });

  it('accepts redirect with conditions', () => {
    expect(
      GateResponsePayloadSchema.safeParse({
        ...validPayload,
        decision: 'redirect',
        conditions: ['Fix critical bug ME-2/BUG-001', 'Re-run integration tests'],
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      GateResponsePayloadSchema.safeParse({
        ...validPayload,
        metadata: { reviewed_at: '2026-02-17T15:00:00Z' },
      }).success,
    ).toBe(true);
  });

  it('rejects missing decision', () => {
    const { decision: _, ...without } = validPayload;
    expect(GateResponsePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty reasoning', () => {
    expect(
      GateResponsePayloadSchema.safeParse({ ...validPayload, reasoning: '' }).success,
    ).toBe(false);
  });

  it('rejects missing gate_signal_id', () => {
    const { gate_signal_id: _, ...without } = validPayload;
    expect(GateResponsePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects invalid decision value', () => {
    expect(
      GateResponsePayloadSchema.safeParse({ ...validPayload, decision: 'maybe' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// CommandDispatchPayloadSchema
// ============================================================================

describe('CommandDispatchPayloadSchema', () => {
  const validPayload = {
    command: 'STATUS',
    target_agent: 'ME-2',
    mission_id: 'mission-2026-02-17-001',
  };

  it('accepts a valid command dispatch payload', () => {
    expect(CommandDispatchPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts LAUNCH without mission_id', () => {
    expect(
      CommandDispatchPayloadSchema.safeParse({
        command: 'LAUNCH',
        target_agent: 'ME-1',
      }).success,
    ).toBe(true);
  });

  it('accepts broadcast target', () => {
    expect(
      CommandDispatchPayloadSchema.safeParse({
        ...validPayload,
        target_agent: 'broadcast',
      }).success,
    ).toBe(true);
  });

  it('accepts command with parameters', () => {
    expect(
      CommandDispatchPayloadSchema.safeParse({
        command: 'REDIRECT',
        target_agent: 'ME-2',
        mission_id: 'mission-2026-02-17-001',
        parameters: { new_phase: 'PLANNING', reason: 'scope change' },
      }).success,
    ).toBe(true);
  });

  it('accepts all 8 command types', () => {
    const commands = ['LAUNCH', 'STATUS', 'REDIRECT', 'REVIEW', 'HOLD', 'RESUME', 'ABORT', 'DEBRIEF'];
    for (const command of commands) {
      expect(
        CommandDispatchPayloadSchema.safeParse({ ...validPayload, command }).success,
      ).toBe(true);
    }
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      CommandDispatchPayloadSchema.safeParse({
        ...validPayload,
        issued_by: 'human',
      }).success,
    ).toBe(true);
  });

  it('rejects missing command', () => {
    const { command: _, ...without } = validPayload;
    expect(CommandDispatchPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects invalid command string', () => {
    expect(
      CommandDispatchPayloadSchema.safeParse({ ...validPayload, command: 'INVALID' }).success,
    ).toBe(false);
  });

  it('rejects non-AgentID non-broadcast target', () => {
    expect(
      CommandDispatchPayloadSchema.safeParse({ ...validPayload, target_agent: 'bad-target' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// ICD_01_SCHEMAS
// ============================================================================

describe('ICD_01_SCHEMAS', () => {
  it('maps all 5 event type strings to payload schemas', () => {
    expect(Object.keys(ICD_01_SCHEMAS)).toHaveLength(5);
    expect(ICD_01_SCHEMAS).toHaveProperty('TELEMETRY_UPDATE');
    expect(ICD_01_SCHEMAS).toHaveProperty('ALERT_SURFACE');
    expect(ICD_01_SCHEMAS).toHaveProperty('GATE_SIGNAL');
    expect(ICD_01_SCHEMAS).toHaveProperty('GATE_RESPONSE');
    expect(ICD_01_SCHEMAS).toHaveProperty('COMMAND_DISPATCH');
  });

  it('each entry has safeParse method', () => {
    for (const schema of Object.values(ICD_01_SCHEMAS)) {
      expect(typeof schema.safeParse).toBe('function');
    }
  });
});

// ============================================================================
// ICD_01_META
// ============================================================================

describe('ICD_01_META', () => {
  it('has correct ICD metadata', () => {
    expect(ICD_01_META.id).toBe('ICD-01');
    expect(ICD_01_META.name).toBe('MC-1/ME-1 Interface');
    expect(ICD_01_META.parties).toEqual(['MC-1', 'ME-1']);
    expect(ICD_01_META.event_types).toEqual([
      'TELEMETRY_UPDATE',
      'ALERT_SURFACE',
      'GATE_SIGNAL',
      'GATE_RESPONSE',
      'COMMAND_DISPATCH',
    ]);
  });
});
