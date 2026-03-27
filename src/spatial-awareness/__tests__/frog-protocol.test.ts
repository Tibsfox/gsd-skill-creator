/**
 * Frog Protocol Controller — Wave 2A Tests
 *
 * CF-06: SILENCE within 500ms
 * CF-07: ASSESS characterization
 * CF-08: PROBE scout-first
 * CF-09: CLASSIFY labels correctly
 * CF-10: RESUME priority order
 * SC-HUM: BLOCK requires human approval
 * SC-RES: No resume during BLOCK
 * EC-01: Anomaly during ASSESS extends assessment
 * EC-03: Scout failure escalates
 * EC-05: Single agent (solo mode)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FrogProtocolController,
  createFrogProtocol,
  DEFAULT_FROG_CONFIG,
} from '../frog-protocol.js';
import type {
  PhaseTransition,
  ProbeResult,
  FrogProtocolEvent,
} from '../frog-protocol.js';
import type { ThreatEvent, FrogPhase } from '../types.js';
import { CommBus, createCommBus } from '../comm-bus.js';
import { ChorusProtocol, createChorusProtocol } from '../chorus-proto.js';
import { OutputSynthesis, createOutputSynthesis } from '../output-synthesis.js';

// ============================================================================
// Helpers
// ============================================================================

function makeThreat(overrides: Partial<ThreatEvent> = {}): ThreatEvent {
  return {
    id: `threat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'error_surge',
    level: 'ELEVATED',
    classification: 'UNKNOWN',
    sources: ['agent-0', 'agent-1'],
    description: 'Test threat',
    timestamp: Date.now(),
    probeResults: [],
    resolved: false,
    ...overrides,
  };
}

function makeProbeResult(probeId: string, result: 'safe' | 'unsafe' | 'inconclusive' = 'safe'): ProbeResult {
  return {
    probeId,
    result,
    scoutId: 'agent-0',
    timestamp: Date.now(),
  };
}

function setupFullSystem(): {
  protocol: FrogProtocolController;
  bus: CommBus;
  chorus: ChorusProtocol;
  output: OutputSynthesis;
} {
  const bus = createCommBus();
  bus.registerAgent('_chorus_proto_internal');
  const chorus = createChorusProtocol(bus);
  const output = createOutputSynthesis();

  const agents = ['agent-0', 'agent-1', 'agent-2'];
  for (const id of agents) {
    bus.registerAgent(id);
    chorus.registerAgent(id);
  }
  bus.registerAgent('frog-controller');

  const protocol = createFrogProtocol();
  protocol.connectBus(bus);
  protocol.connectChorus(chorus);
  protocol.connectOutput(output);
  protocol.registerAgents(agents);
  protocol.setScout('agent-0');
  protocol.start();

  output.initLedStrip(10);

  return { protocol, bus, chorus, output };
}

// ============================================================================
// Tests
// ============================================================================

describe('FrogProtocolController', () => {
  describe('construction and defaults', () => {
    it('starts in BASELINE phase', () => {
      const ctrl = createFrogProtocol();
      expect(ctrl.phase).toBe('BASELINE');
      expect(ctrl.running).toBe(false);
      expect(ctrl.activeCycle).toBeNull();
    });

    it('accepts custom configuration', () => {
      const ctrl = createFrogProtocol({ silenceDurationMs: 10_000 });
      expect(ctrl.getConfig().silenceDurationMs).toBe(10_000);
      expect(ctrl.getConfig().blockRequiresHuman).toBe(true);
    });

    it('provides status', () => {
      const ctrl = createFrogProtocol();
      const status = ctrl.getStatus();
      expect(status.phase).toBe('BASELINE');
      expect(status.activeCycleId).toBeNull();
      expect(status.completedCycles).toBe(0);
    });
  });

  describe('CF-06: SILENCE within 500ms of anomaly detection', () => {
    it('transitions to SILENCE on threat ingestion', () => {
      const { protocol } = setupFullSystem();
      const threat = makeThreat();

      const start = Date.now();
      const transition = protocol.ingestThreat(threat);
      const elapsed = Date.now() - start;

      expect(transition).not.toBeNull();
      expect(transition!.from).toBe('BASELINE');
      expect(transition!.to).toBe('SILENCE');
      expect(protocol.phase).toBe('SILENCE');
      expect(elapsed).toBeLessThan(500);
    });

    it('creates an active cycle', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());

      expect(protocol.activeCycle).not.toBeNull();
      expect(protocol.activeCycle!.completed).toBe(false);
    });

    it('pauses chorus on SILENCE entry', () => {
      const { protocol, chorus } = setupFullSystem();
      protocol.ingestThreat(makeThreat());
      expect(chorus.isPaused()).toBe(true);
    });
  });

  describe('CF-07: ASSESS produces characterization', () => {
    it('advances from SILENCE to ASSESS', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());

      const transition = protocol.advanceToAssess();
      expect(transition).not.toBeNull();
      expect(transition!.to).toBe('ASSESS');
      expect(protocol.phase).toBe('ASSESS');
    });

    it('rejects advance to ASSESS from wrong phase', () => {
      const { protocol } = setupFullSystem();
      expect(protocol.advanceToAssess()).toBeNull();
    });
  });

  describe('CF-08: PROBE dispatches scout-first', () => {
    it('advances from ASSESS to PROBE and dispatches probe', () => {
      const { protocol } = setupFullSystem();
      const events: FrogProtocolEvent[] = [];
      protocol.onEvent(e => events.push(e));

      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      expect(protocol.phase).toBe('PROBE');
      const probeEvents = events.filter(e => e.type === 'probe_dispatched');
      expect(probeEvents.length).toBe(1);
      expect((probeEvents[0] as any).dispatch.scoutId).toBe('agent-0');
    });

    it('sends DIRECTED message to scout via comm bus', () => {
      const { protocol, bus } = setupFullSystem();
      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const directed = bus.getMessages({ tier: 'DIRECTED' });
      expect(directed.length).toBeGreaterThanOrEqual(1);
      const probeMsg = directed.find(m => (m.payload as any).command === 'FROG_PROBE');
      expect(probeMsg).toBeDefined();
    });
  });

  describe('CF-09: CLASSIFY labels correctly', () => {
    it('classifies as NEUTRAL when all probes safe and threat is HIGH', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat({ level: 'HIGH' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      // Submit safe probe result
      const cycle = protocol.activeCycle!;
      const probeId = cycle.probeDispatches[0].probeId;
      protocol.submitProbeResult(makeProbeResult(probeId, 'safe'));

      expect(protocol.phase).toBe('CLASSIFY');
      const result = protocol.classify();
      expect(result).not.toBeNull();
      expect(result!.classification).toBe('NEUTRAL');
    });

    it('classifies as OPPORTUNITY when probes safe and threat is ELEVATED', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat({ level: 'ELEVATED' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const cycle = protocol.activeCycle!;
      const probeId = cycle.probeDispatches[0].probeId;
      protocol.submitProbeResult(makeProbeResult(probeId, 'safe'));

      const result = protocol.classify();
      expect(result!.classification).toBe('OPPORTUNITY');
    });

    it('classifies as THREAT when probe unsafe', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const cycle = protocol.activeCycle!;
      const probeId = cycle.probeDispatches[0].probeId;
      // Unsafe probe triggers immediate escalation to CLASSIFY
      protocol.submitProbeResult(makeProbeResult(probeId, 'unsafe'));

      expect(protocol.phase).toBe('CLASSIFY');
      const result = protocol.classify();
      expect(result!.classification).toBe('THREAT');
    });

    it('auto-advances to RESUME on NEUTRAL classification', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat({ level: 'HIGH' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));
      protocol.classify();

      expect(protocol.phase).toBe('RESUME');
    });

    it('stays in CLASSIFY on THREAT classification', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'unsafe'));
      protocol.classify();

      expect(protocol.phase).toBe('CLASSIFY');
    });
  });

  describe('CF-10: RESUME re-engages in priority order', () => {
    it('completes full cycle: BASELINE→SILENCE→ASSESS→PROBE→CLASSIFY→RESUME→BASELINE', () => {
      const { protocol } = setupFullSystem();

      // Full cycle
      protocol.ingestThreat(makeThreat({ level: 'HIGH' }));
      expect(protocol.phase).toBe('SILENCE');

      protocol.advanceToAssess();
      expect(protocol.phase).toBe('ASSESS');

      protocol.advanceToProbe();
      expect(protocol.phase).toBe('PROBE');

      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));
      expect(protocol.phase).toBe('CLASSIFY');

      protocol.classify();
      expect(protocol.phase).toBe('RESUME');

      protocol.initiateResume();
      expect(protocol.phase).toBe('BASELINE');
      expect(protocol.activeCycle).toBeNull();
      expect(protocol.completedCycles.length).toBe(1);
    });

    it('uses chorus protocol for scout-first resume', () => {
      const { protocol, chorus } = setupFullSystem();

      protocol.ingestThreat(makeThreat({ level: 'HIGH' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));
      protocol.classify();

      expect(chorus.isPaused()).toBe(true);
      protocol.initiateResume();
      expect(chorus.isPaused()).toBe(false);
    });
  });

  describe('SC-HUM: BLOCK threats require human approval', () => {
    it('requires human approval for BLOCK-level threats', () => {
      const { protocol } = setupFullSystem();
      const events: FrogProtocolEvent[] = [];
      protocol.onEvent(e => events.push(e));

      protocol.ingestThreat(makeThreat({ level: 'BLOCK' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));

      protocol.classify();

      // Should stay in CLASSIFY waiting for human
      expect(protocol.phase).toBe('CLASSIFY');
      expect(protocol.getStatus().humanApprovalPending).toBe(true);

      const approvalEvents = events.filter(e => e.type === 'human_approval_required');
      expect(approvalEvents.length).toBe(1);
    });

    it('advances after human approval granted', () => {
      const { protocol } = setupFullSystem();
      const threat = makeThreat({ level: 'BLOCK' });

      protocol.ingestThreat(threat);
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));
      protocol.classify();

      expect(protocol.phase).toBe('CLASSIFY');
      protocol.grantHumanApproval(threat.id);
      expect(protocol.phase).toBe('RESUME');
    });
  });

  describe('SC-RES: No resume while BLOCK active', () => {
    it('blocks resume on BLOCK threat without approval', () => {
      const { protocol } = setupFullSystem();
      const threat = makeThreat({ level: 'BLOCK' });

      protocol.ingestThreat(threat);
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'unsafe'));
      protocol.classify();

      // Try to resolve without human approval
      expect(protocol.resolveThreat(threat.id)).toBeNull();
    });

    it('allows resolve after human approval', () => {
      const { protocol } = setupFullSystem();
      const threat = makeThreat({ level: 'BLOCK' });

      protocol.ingestThreat(threat);
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'unsafe'));
      protocol.classify();

      protocol.grantHumanApproval(threat.id);
      const t = protocol.resolveThreat(threat.id);
      expect(t).not.toBeNull();
      expect(protocol.phase).toBe('RESUME');
    });
  });

  describe('EC-01: Anomaly during ASSESS extends assessment', () => {
    it('emits anomaly_during_assess event', () => {
      const { protocol } = setupFullSystem();
      const events: FrogProtocolEvent[] = [];
      protocol.onEvent(e => events.push(e));

      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();

      // Second threat during ASSESS
      const result = protocol.ingestThreat(makeThreat());
      expect(result).toBeNull(); // No new transition
      expect(protocol.phase).toBe('ASSESS'); // Still in ASSESS

      const extendEvents = events.filter(e => e.type === 'anomaly_during_assess');
      expect(extendEvents.length).toBe(1);
    });
  });

  describe('EC-03: Scout failure during PROBE', () => {
    it('escalates to CLASSIFY on unsafe probe', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const cycle = protocol.activeCycle!;
      const transition = protocol.submitProbeResult(
        makeProbeResult(cycle.probeDispatches[0].probeId, 'unsafe'),
      );

      expect(transition).not.toBeNull();
      expect(transition!.to).toBe('CLASSIFY');
      expect(transition!.trigger).toBe('probe_failure_escalation');
    });
  });

  describe('EC-05: Single agent (solo mode)', () => {
    it('completes full cycle with single agent', () => {
      const bus = createCommBus();
      bus.registerAgent('_chorus_proto_internal');
      const chorus = createChorusProtocol(bus);
      bus.registerAgent('solo');
      bus.registerAgent('frog-controller');
      chorus.registerAgent('solo');

      const protocol = createFrogProtocol();
      protocol.connectBus(bus);
      protocol.connectChorus(chorus);
      protocol.registerAgents(['solo']);
      protocol.setScout('solo');
      protocol.start();

      protocol.ingestThreat(makeThreat({ level: 'HIGH' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));
      protocol.classify();
      protocol.initiateResume();

      expect(protocol.phase).toBe('BASELINE');
      expect(protocol.completedCycles.length).toBe(1);
    });
  });

  describe('inconclusive probes', () => {
    it('dispatches additional probes on inconclusive results', () => {
      const { protocol } = setupFullSystem();
      const events: FrogProtocolEvent[] = [];
      protocol.onEvent(e => events.push(e));

      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'inconclusive'));

      // Should dispatch another probe
      const probeEvents = events.filter(e => e.type === 'probe_dispatched');
      expect(probeEvents.length).toBe(2);
    });

    it('force-classifies after max probe attempts', () => {
      const { protocol } = setupFullSystem();
      protocol.configure({ maxProbeAttempts: 2 });

      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();
      protocol.advanceToProbe();

      // First inconclusive
      let cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'inconclusive'));
      expect(protocol.phase).toBe('PROBE');

      // Second inconclusive — should force classify
      cycle = protocol.activeCycle!;
      const transition = protocol.submitProbeResult(
        makeProbeResult(cycle.probeDispatches[1].probeId, 'inconclusive'),
      );
      expect(transition).not.toBeNull();
      expect(protocol.phase).toBe('CLASSIFY');
    });
  });

  describe('forceBaseline', () => {
    it('returns to BASELINE from any phase', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());
      protocol.advanceToAssess();

      expect(protocol.phase).toBe('ASSESS');
      protocol.forceBaseline();
      expect(protocol.phase).toBe('BASELINE');
      expect(protocol.activeCycle).toBeNull();
    });

    it('is no-op when already in BASELINE', () => {
      const { protocol } = setupFullSystem();
      expect(protocol.forceBaseline()).toBeNull();
    });
  });

  describe('output synthesis integration', () => {
    it('updates output phase on transitions', () => {
      const { protocol, output } = setupFullSystem();

      protocol.ingestThreat(makeThreat());
      expect(output.getPhase()).toBe('SILENCE');

      protocol.advanceToAssess();
      expect(output.getPhase()).toBe('ASSESS');
    });
  });

  describe('transition history', () => {
    it('records all transitions', () => {
      const { protocol } = setupFullSystem();

      protocol.ingestThreat(makeThreat({ level: 'HIGH' }));
      protocol.advanceToAssess();
      protocol.advanceToProbe();
      const cycle = protocol.activeCycle!;
      protocol.submitProbeResult(makeProbeResult(cycle.probeDispatches[0].probeId, 'safe'));
      protocol.classify();
      protocol.initiateResume();

      // BASELINE→SILENCE→ASSESS→PROBE→CLASSIFY→RESUME→BASELINE
      expect(protocol.transitions.length).toBe(6);
      expect(protocol.transitions[0].from).toBe('BASELINE');
      expect(protocol.transitions[0].to).toBe('SILENCE');
      expect(protocol.transitions[5].to).toBe('BASELINE');
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      const { protocol } = setupFullSystem();
      protocol.ingestThreat(makeThreat());

      protocol.reset();
      expect(protocol.phase).toBe('BASELINE');
      expect(protocol.activeCycle).toBeNull();
      expect(protocol.transitions.length).toBe(0);
      expect(protocol.completedCycles.length).toBe(0);
      expect(protocol.running).toBe(false);
    });
  });
});
