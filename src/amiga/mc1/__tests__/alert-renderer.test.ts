/**
 * Tests for the three-tier alert renderer.
 *
 * Validates nominal (silent), advisory (panel rise), and gate (full suspension)
 * tiers, gate response emission, alert lifecycle management, and StubME1
 * integration.
 */

import { describe, it, expect } from 'vitest';
import {
  AlertRenderer,
  type AlertView,
  type NominalView,
  type AdvisoryView,
  type GateView,
  type AlertRendererConfig,
} from '../alert-renderer.js';
import {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createGateSequence,
  createFullLifecycleSequence,
} from '../stub-me1.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';
import { GateResponsePayloadSchema } from '../../icd/icd-01.js';

// ============================================================================
// Helpers
// ============================================================================

function makeAlertEnvelope(overrides: {
  alert_level: string;
  source_agent: string;
  message: string;
  category: string;
  resolution?: string;
  correlation?: string;
}): EventEnvelope {
  return createEnvelope({
    source: 'ME-1',
    destination: 'MC-1',
    type: 'ALERT_SURFACE',
    payload: {
      alert_level: overrides.alert_level,
      source_agent: overrides.source_agent,
      message: overrides.message,
      category: overrides.category,
      ...(overrides.resolution !== undefined ? { resolution: overrides.resolution } : {}),
    },
    correlation: overrides.correlation ?? null,
  });
}

function makeGateEnvelope(overrides?: {
  correlation?: string;
  context?: string;
}): EventEnvelope {
  return createEnvelope({
    source: 'ME-1',
    destination: 'MC-1',
    type: 'GATE_SIGNAL',
    payload: {
      gate_type: 'human_review',
      blocking_phase: 'REVIEW_GATE',
      criteria: [
        { name: 'Tests pass', met: true, evidence: 'All green' },
        { name: 'Docs reviewed', met: false },
      ],
      deadline: '2026-02-18T15:00:00.000Z',
      ...(overrides?.context !== undefined ? { context: overrides.context } : {}),
    },
    requires_ack: true,
    correlation: overrides?.correlation ?? null,
  });
}

function makeTelemetryEnvelope(missionId: string): EventEnvelope {
  return createEnvelope({
    source: 'ME-1',
    destination: 'MC-1',
    type: 'TELEMETRY_UPDATE',
    payload: {
      mission_id: missionId,
      phase: 'EXECUTION',
      progress: 50,
      team_status: {
        CS: { status: 'green', agent_count: 3 },
        ME: { status: 'green', agent_count: 3 },
        CE: { status: 'green', agent_count: 3 },
      },
      checkpoints: [{ name: 'cp-1', completed: true, timestamp: '2026-02-18T10:00:00Z' }],
      resources: { cpu_percent: 25, memory_mb: 512, active_agents: 9 },
    },
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('AlertRenderer', () => {
  // --------------------------------------------------------------------------
  // 1. Instantiation
  // --------------------------------------------------------------------------
  describe('instantiation', () => {
    it('creates a renderer with no active alerts', () => {
      const renderer = new AlertRenderer();
      expect(renderer.getActiveAlerts()).toEqual([]);
    });

    it('returns NominalView for an unknown mission', () => {
      const renderer = new AlertRenderer();
      const view = renderer.getView('unknown-mission');
      expect(view).toEqual({ tier: 'nominal' });
    });
  });

  // --------------------------------------------------------------------------
  // 2. Nominal tier (silent)
  // --------------------------------------------------------------------------
  describe('nominal tier', () => {
    it('returns nominal view after processing telemetry', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';
      const envelope = makeTelemetryEnvelope(missionId);

      renderer.processEvent(envelope);

      const view = renderer.getView(missionId);
      expect(view).toEqual({ tier: 'nominal' });
    });

    it('has no alert details in nominal view', () => {
      const renderer = new AlertRenderer();
      const view = renderer.getView('mission-2026-02-18-001') as NominalView;
      expect(view.tier).toBe('nominal');
      expect(Object.keys(view)).toEqual(['tier']);
    });

    it('never produces advisories or gates from telemetry only', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      // Process multiple telemetry events
      for (let i = 0; i < 5; i++) {
        renderer.processEvent(makeTelemetryEnvelope(missionId));
      }

      expect(renderer.getView(missionId).tier).toBe('nominal');
      expect(renderer.getActiveAlerts()).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Advisory tier (panel rise)
  // --------------------------------------------------------------------------
  describe('advisory tier', () => {
    it('produces AdvisoryView from ALERT_SURFACE event', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      // First process some telemetry so the mission exists
      renderer.processEvent(makeTelemetryEnvelope(missionId));

      const alertEnvelope = makeAlertEnvelope({
        alert_level: 'advisory',
        source_agent: 'ME-2',
        message: 'Resource pressure detected',
        category: 'resource',
        correlation: missionId,
      });

      renderer.processEvent(alertEnvelope);

      const view = renderer.getView(missionId);
      expect(view.tier).toBe('advisory');

      const advisory = view as AdvisoryView;
      expect(advisory.message).toBe('Resource pressure detected');
      expect(advisory.source_agent).toBe('ME-2');
      expect(advisory.category).toBe('resource');
      expect(advisory.timestamp).toBeDefined();
    });

    it('includes optional resolution when provided', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));

      const alertEnvelope = makeAlertEnvelope({
        alert_level: 'advisory',
        source_agent: 'ME-2',
        message: 'Resource pressure detected',
        category: 'resource',
        resolution: 'Consider scaling active agents',
        correlation: missionId,
      });

      renderer.processEvent(alertEnvelope);

      const view = renderer.getView(missionId) as AdvisoryView;
      expect(view.resolution).toBe('Consider scaling active agents');
    });

    it('lists advisory in active alerts', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      renderer.processEvent(
        makeAlertEnvelope({
          alert_level: 'advisory',
          source_agent: 'ME-2',
          message: 'Test advisory',
          category: 'resource',
          correlation: missionId,
        }),
      );

      const active = renderer.getActiveAlerts();
      expect(active.length).toBe(1);
      expect(active[0].mission_id).toBe(missionId);
      expect(active[0].view.tier).toBe('advisory');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Gate tier (full suspension)
  // --------------------------------------------------------------------------
  describe('gate tier', () => {
    it('produces GateView from GATE_SIGNAL event', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));

      const gateEnvelope = makeGateEnvelope({ correlation: missionId });
      renderer.processEvent(gateEnvelope);

      const view = renderer.getView(missionId);
      expect(view.tier).toBe('gate');

      const gate = view as GateView;
      expect(gate.gate_type).toBe('human_review');
      expect(gate.blocking_phase).toBe('REVIEW_GATE');
      expect(gate.criteria).toHaveLength(2);
      expect(gate.criteria[0]).toEqual({ name: 'Tests pass', met: true, evidence: 'All green' });
      expect(gate.criteria[1]).toEqual({ name: 'Docs reviewed', met: false });
      expect(gate.deadline).toBe('2026-02-18T15:00:00.000Z');
      expect(gate.buttons).toEqual(['go', 'no_go', 'redirect']);
      expect(gate.gate_signal_id).toBe(gateEnvelope.id);
    });

    it('includes optional context when provided', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));

      const gateEnvelope = makeGateEnvelope({
        correlation: missionId,
        context: 'Final integration review before launch',
      });
      renderer.processEvent(gateEnvelope);

      const view = renderer.getView(missionId) as GateView;
      expect(view.context).toBe('Final integration review before launch');
    });

    it('lists gate in active alerts', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      renderer.processEvent(makeGateEnvelope({ correlation: missionId }));

      const active = renderer.getActiveAlerts();
      expect(active.length).toBe(1);
      expect(active[0].view.tier).toBe('gate');
    });

    it('marks mission as suspended', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      renderer.processEvent(makeGateEnvelope({ correlation: missionId }));

      expect(renderer.isSuspended(missionId)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Gate response emission (go)
  // --------------------------------------------------------------------------
  describe('gate response emission', () => {
    it('emits valid GATE_RESPONSE envelope on go decision', () => {
      const responses: EventEnvelope[] = [];
      const renderer = new AlertRenderer({
        onGateResponse: (env) => responses.push(env),
      });
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      const gateEnvelope = makeGateEnvelope({ correlation: missionId });
      renderer.processEvent(gateEnvelope);

      const responded = renderer.respondToGate(
        missionId,
        gateEnvelope.id,
        'go',
        'All criteria met',
        'human',
      );

      expect(responded).toBe(true);
      expect(responses).toHaveLength(1);

      const response = responses[0];
      expect(response.source).toBe('MC-1');
      expect(response.destination).toBe('ME-1');
      expect(response.type).toBe('GATE_RESPONSE');
      expect(response.requires_ack).toBe(false);

      // Validate against ICD-01 schema
      const parsed = GateResponsePayloadSchema.safeParse(response.payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe('go');
        expect(parsed.data.reasoning).toBe('All criteria met');
        expect(parsed.data.responder).toBe('human');
        expect(parsed.data.gate_signal_id).toBe(gateEnvelope.id);
      }
    });

    it('clears suspension after gate response', () => {
      const renderer = new AlertRenderer({
        onGateResponse: () => {},
      });
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      const gateEnvelope = makeGateEnvelope({ correlation: missionId });
      renderer.processEvent(gateEnvelope);

      expect(renderer.isSuspended(missionId)).toBe(true);

      renderer.respondToGate(missionId, gateEnvelope.id, 'go', 'LGTM', 'human');

      expect(renderer.isSuspended(missionId)).toBe(false);
      expect(renderer.getView(missionId)).toEqual({ tier: 'nominal' });
    });
  });

  // --------------------------------------------------------------------------
  // 6. Gate response with no_go
  // --------------------------------------------------------------------------
  describe('gate response no_go', () => {
    it('handles no_go decision correctly', () => {
      const responses: EventEnvelope[] = [];
      const renderer = new AlertRenderer({
        onGateResponse: (env) => responses.push(env),
      });
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      const gateEnvelope = makeGateEnvelope({ correlation: missionId });
      renderer.processEvent(gateEnvelope);

      renderer.respondToGate(missionId, gateEnvelope.id, 'no_go', 'Tests failing', 'human');

      const parsed = GateResponsePayloadSchema.safeParse(responses[0].payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe('no_go');
      }

      // Gate is cleared
      expect(renderer.getActiveAlerts()).toEqual([]);
      expect(renderer.isSuspended(missionId)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Gate response with redirect and conditions
  // --------------------------------------------------------------------------
  describe('gate response redirect with conditions', () => {
    it('includes conditions in redirect response', () => {
      const responses: EventEnvelope[] = [];
      const renderer = new AlertRenderer({
        onGateResponse: (env) => responses.push(env),
      });
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      const gateEnvelope = makeGateEnvelope({ correlation: missionId });
      renderer.processEvent(gateEnvelope);

      renderer.respondToGate(
        missionId,
        gateEnvelope.id,
        'redirect',
        'Needs rework',
        'human',
        ['Adjust scope', 'Re-run tests'],
      );

      const parsed = GateResponsePayloadSchema.safeParse(responses[0].payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe('redirect');
        expect(parsed.data.conditions).toEqual(['Adjust scope', 'Re-run tests']);
      }

      // Gate is cleared
      expect(renderer.getActiveAlerts()).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Alert lifecycle management
  // --------------------------------------------------------------------------
  describe('alert lifecycle', () => {
    it('clears advisory on subsequent telemetry', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      // Set up advisory
      renderer.processEvent(makeTelemetryEnvelope(missionId));
      renderer.processEvent(
        makeAlertEnvelope({
          alert_level: 'advisory',
          source_agent: 'ME-2',
          message: 'Test alert',
          category: 'resource',
          correlation: missionId,
        }),
      );
      expect(renderer.getView(missionId).tier).toBe('advisory');

      // New telemetry clears advisory
      renderer.processEvent(makeTelemetryEnvelope(missionId));
      expect(renderer.getView(missionId)).toEqual({ tier: 'nominal' });
    });

    it('does NOT clear gate on subsequent telemetry', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      renderer.processEvent(makeGateEnvelope({ correlation: missionId }));
      expect(renderer.getView(missionId).tier).toBe('gate');

      // Telemetry does NOT clear gates
      renderer.processEvent(makeTelemetryEnvelope(missionId));
      expect(renderer.getView(missionId).tier).toBe('gate');
      expect(renderer.isSuspended(missionId)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Multiple missions
  // --------------------------------------------------------------------------
  describe('multiple missions', () => {
    it('tracks alerts independently per mission', () => {
      const renderer = new AlertRenderer();
      const mission1 = 'mission-2026-02-18-001';
      const mission2 = 'mission-2026-02-18-002';

      renderer.processEvent(makeTelemetryEnvelope(mission1));
      renderer.processEvent(makeTelemetryEnvelope(mission2));

      // Advisory on mission 1
      renderer.processEvent(
        makeAlertEnvelope({
          alert_level: 'advisory',
          source_agent: 'ME-2',
          message: 'Advisory on mission 1',
          category: 'resource',
          correlation: mission1,
        }),
      );

      // Gate on mission 2
      renderer.processEvent(makeGateEnvelope({ correlation: mission2 }));

      expect(renderer.getView(mission1).tier).toBe('advisory');
      expect(renderer.getView(mission2).tier).toBe('gate');

      const active = renderer.getActiveAlerts();
      expect(active.length).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Invalid gate response
  // --------------------------------------------------------------------------
  describe('invalid gate response', () => {
    it('returns false for nonexistent gate', () => {
      const responses: EventEnvelope[] = [];
      const renderer = new AlertRenderer({
        onGateResponse: (env) => responses.push(env),
      });

      const result = renderer.respondToGate('nonexistent', 'bad-id', 'go', 'reason', 'human');

      expect(result).toBe(false);
      expect(responses).toHaveLength(0);
    });

    it('returns false for mismatched gate signal ID', () => {
      const responses: EventEnvelope[] = [];
      const renderer = new AlertRenderer({
        onGateResponse: (env) => responses.push(env),
      });
      const missionId = 'mission-2026-02-18-001';

      renderer.processEvent(makeTelemetryEnvelope(missionId));
      renderer.processEvent(makeGateEnvelope({ correlation: missionId }));

      const result = renderer.respondToGate(missionId, 'wrong-id', 'go', 'reason', 'human');

      expect(result).toBe(false);
      expect(responses).toHaveLength(0);
      // Gate is still active
      expect(renderer.isSuspended(missionId)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Integration with StubME1 sequences
  // --------------------------------------------------------------------------
  describe('StubME1 integration', () => {
    it('shows advisory tier from advisory sequence', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-001';
      const stub = new StubME1(createAdvisorySequence(missionId));

      let advisorySeen = false;
      let event = stub.next();
      while (event !== null) {
        renderer.processEvent(event);
        if (renderer.getView(missionId).tier === 'advisory') {
          advisorySeen = true;
        }
        event = stub.next();
      }

      expect(advisorySeen).toBe(true);
    });

    it('shows gate tier with suspension from gate sequence', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-002';
      const stub = new StubME1(createGateSequence(missionId));

      let gateSeen = false;
      let event = stub.next();
      while (event !== null) {
        renderer.processEvent(event);
        if (renderer.getView(missionId).tier === 'gate') {
          gateSeen = true;
          // Check suspension while gate is active
          expect(renderer.isSuspended(missionId)).toBe(true);
        }
        event = stub.next();
      }

      expect(gateSeen).toBe(true);
    });

    it('handles full lifecycle sequence', () => {
      const renderer = new AlertRenderer();
      const missionId = 'mission-2026-02-18-003';
      const stub = new StubME1(createFullLifecycleSequence(missionId));

      let advisorySeen = false;
      let gateSeen = false;

      let event = stub.next();
      while (event !== null) {
        renderer.processEvent(event);
        const view = renderer.getView(missionId);
        if (view.tier === 'advisory') advisorySeen = true;
        if (view.tier === 'gate') gateSeen = true;
        event = stub.next();
      }

      expect(advisorySeen).toBe(true);
      expect(gateSeen).toBe(true);
    });
  });
});
