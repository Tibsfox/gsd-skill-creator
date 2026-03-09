/**
 * Wave 3C: Pause/Resume State Preservation Validation
 *
 * CF-14: zero work loss across pause/resume cycles.
 * Scout-first re-engagement verified across 10 cycles.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommBus, createCommBus } from '../comm-bus.js';
import { ChorusProtocol, createChorusProtocol } from '../chorus-proto.js';
import type { ChorusEvent, AgentSnapshot } from '../chorus-proto.js';
import {
  SpatialAwarenessSystem,
  createSpatialSystem,
} from '../integration.js';
import {
  DefaultSensorRegistry,
  ContextFillSensor,
  TokenBudgetSensor,
  ErrorRateSensor,
} from '../sensor-interface.js';
import type { ThreatEvent } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

const AGENT_IDS = ['agent-0', 'agent-1', 'agent-2', 'agent-3', 'agent-4'];

function setupChorus(): {
  bus: CommBus;
  chorus: ChorusProtocol;
} {
  const bus = createCommBus();
  bus.registerAgent('_chorus_proto_internal');
  const chorus = createChorusProtocol(bus);

  for (const id of AGENT_IDS) {
    bus.registerAgent(id);
    chorus.registerAgent(id);
  }

  // Set agent-0 as scout
  chorus.setScoutReady('agent-0', true);

  // Set resume order
  for (let i = 0; i < AGENT_IDS.length; i++) {
    chorus.setResumeOrder(AGENT_IDS[i], i);
  }

  return { bus, chorus };
}

function createIntegrationSystem(): {
  system: SpatialAwarenessSystem;
} {
  const registry = new DefaultSensorRegistry();
  registry.register(new ContextFillSensor(100));
  registry.register(new TokenBudgetSensor(100));
  registry.register(new ErrorRateSensor(100));

  const system = createSpatialSystem(
    {
      agentId: 'test-agent',
      agentIds: AGENT_IDS,
      scoutId: 'agent-0',
      sensorPollMs: 100,
      ledPixelCount: 10,
    },
    registry,
  );

  return { system };
}

function makeThreat(id: string): ThreatEvent {
  return {
    id,
    type: 'error_surge',
    level: 'HIGH',
    classification: 'UNKNOWN',
    sources: ['agent-0', 'agent-1'],
    description: `Threat ${id}`,
    timestamp: Date.now(),
    probeResults: [],
    resolved: false,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Wave 3C: Pause/Resume State Preservation', () => {
  describe('CF-14: Zero work loss on single pause/resume', () => {
    it('captures snapshot of all agents on pause', () => {
      const { chorus } = setupChorus();

      // Set up work states
      const workStates = new Map<string, Record<string, unknown>>();
      for (const id of AGENT_IDS) {
        workStates.set(id, { task: `working-on-${id}`, progress: 42 });
      }

      const result = chorus.pause('agent-0', workStates);

      expect(result.success).toBe(true);
      expect(result.agentsPaused).toBe(AGENT_IDS.length);
      expect(result.snapshots.length).toBe(AGENT_IDS.length);

      // Every snapshot has work state preserved
      for (const snapshot of result.snapshots) {
        expect(snapshot.workState).toBeDefined();
        expect((snapshot.workState as any).task).toContain('working-on-');
        expect((snapshot.workState as any).progress).toBe(42);
      }
    });

    it('restores all agent states on resume', () => {
      const { chorus } = setupChorus();

      // Transition agents to different phases before pause
      chorus.transitionPhase('agent-0', 'ASSESS');
      chorus.transitionPhase('agent-1', 'PROBE');
      chorus.transitionPhase('agent-2', 'ASSESS');

      // Capture phases
      const prePausePhases = new Map<string, string>();
      for (const id of AGENT_IDS) {
        prePausePhases.set(id, chorus.getAgentState(id)!.phase);
      }

      // Pause
      chorus.pause('agent-0');
      expect(chorus.isPaused()).toBe(true);

      // Resume
      const result = chorus.resume('agent-0');
      expect(result.success).toBe(true);
      expect(result.statesRestored).toBe(AGENT_IDS.length);

      // Verify phases restored from snapshots
      for (const id of AGENT_IDS) {
        const state = chorus.getAgentState(id)!;
        expect(state.paused).toBe(false);
        expect(state.phase).toBe(prePausePhases.get(id));
      }
    });

    it('preserves pending messages in snapshots', () => {
      const { bus, chorus } = setupChorus();

      // Send some messages before pause
      bus.emit('agent-0', 'BROADCAST', 'BASELINE', { msg: 'pre-pause' });
      bus.emit('agent-1', 'BROADCAST', 'BASELINE', { msg: 'also-pre-pause' });

      const result = chorus.pause('agent-0');

      // Snapshots should include pending messages from each agent's history
      const agent0Snapshot = result.snapshots.find(s => s.agentId === 'agent-0')!;
      expect(agent0Snapshot.pendingMessages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scout-first re-engagement', () => {
    it('scout resumes before followers', () => {
      const { chorus } = setupChorus();
      const events: ChorusEvent[] = [];
      chorus.onEvent(e => events.push(e));

      chorus.pause('agent-0');
      chorus.resume('agent-0');

      // Scout deployed event should come before full resume
      const scoutIdx = events.findIndex(e => e.type === 'scout_deployed');
      const fullIdx = events.findIndex(e => e.type === 'full_resume');
      expect(scoutIdx).toBeLessThan(fullIdx);
      expect(scoutIdx).toBeGreaterThanOrEqual(0);
    });

    it('scout is the scoutReady agent (agent-0)', () => {
      const { chorus } = setupChorus();
      const events: ChorusEvent[] = [];
      chorus.onEvent(e => events.push(e));

      chorus.pause('agent-0');
      const result = chorus.resume('agent-0');

      expect(result.scoutId).toBe('agent-0');

      const scoutEvent = events.find(e => e.type === 'scout_deployed') as any;
      expect(scoutEvent.agentId).toBe('agent-0');
    });

    it('all agents resume — not just scout', () => {
      const { chorus } = setupChorus();

      chorus.pause('agent-0');
      const result = chorus.resume('agent-0');

      expect(result.agentsResumed).toBe(AGENT_IDS.length);
      for (const id of AGENT_IDS) {
        expect(chorus.getAgentState(id)!.paused).toBe(false);
      }
    });
  });

  describe('10 consecutive pause/resume cycles', () => {
    it('completes 10 cycles with zero state loss', () => {
      const { chorus } = setupChorus();

      for (let cycle = 0; cycle < 10; cycle++) {
        // Set unique work state each cycle
        const workStates = new Map<string, Record<string, unknown>>();
        for (const id of AGENT_IDS) {
          workStates.set(id, { cycle, task: `cycle-${cycle}-${id}` });
        }

        // Pause
        const pauseResult = chorus.pause('agent-0', workStates);
        expect(pauseResult.success).toBe(true);
        expect(pauseResult.agentsPaused).toBe(AGENT_IDS.length);
        expect(chorus.isPaused()).toBe(true);

        // Verify snapshots captured this cycle's work state
        for (const snapshot of pauseResult.snapshots) {
          expect((snapshot.workState as any).cycle).toBe(cycle);
        }

        // Resume
        const resumeResult = chorus.resume('agent-0');
        expect(resumeResult.success).toBe(true);
        expect(resumeResult.agentsResumed).toBe(AGENT_IDS.length);
        expect(chorus.isPaused()).toBe(false);

        // All agents should be unpaused
        for (const id of AGENT_IDS) {
          expect(chorus.getAgentState(id)!.paused).toBe(false);
        }
      }
    });

    it('scout-first pattern holds across all 10 cycles', () => {
      const { chorus } = setupChorus();
      const events: ChorusEvent[] = [];
      chorus.onEvent(e => events.push(e));

      for (let cycle = 0; cycle < 10; cycle++) {
        chorus.pause('agent-0');
        chorus.resume('agent-0');
      }

      // Should have 10 scout_deployed events, all with agent-0
      const scoutEvents = events.filter(e => e.type === 'scout_deployed') as any[];
      expect(scoutEvents.length).toBe(10);
      for (const e of scoutEvents) {
        expect(e.agentId).toBe('agent-0');
      }

      // 10 full_resume events
      const fullEvents = events.filter(e => e.type === 'full_resume');
      expect(fullEvents.length).toBe(10);
    });

    it('heartbeats update on each resume', () => {
      const { chorus } = setupChorus();

      for (let cycle = 0; cycle < 10; cycle++) {
        const beforePause = Date.now();
        chorus.pause('agent-0');
        chorus.resume('agent-0');

        // All agents should have lastBeat >= beforePause
        for (const id of AGENT_IDS) {
          expect(chorus.getAgentState(id)!.lastBeat).toBeGreaterThanOrEqual(beforePause);
        }
      }
    });
  });

  describe('edge cases', () => {
    it('resume without pause returns failure', () => {
      const { chorus } = setupChorus();
      const result = chorus.resume('agent-0');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not paused');
    });

    it('double pause is idempotent via bus handler', () => {
      const { chorus } = setupChorus();

      chorus.pause('agent-0');
      expect(chorus.isPaused()).toBe(true);

      // Second pause goes through bus which is idempotent
      chorus.pause('agent-1');
      expect(chorus.isPaused()).toBe(true);
    });

    it('phase transitions blocked while paused', () => {
      const { chorus } = setupChorus();

      chorus.pause('agent-0');
      const result = chorus.transitionPhase('agent-1', 'ASSESS');
      expect(result).toBe(false);
    });
  });

  describe('integration: Frog Protocol cycle with state preservation', () => {
    it('full protocol cycle preserves state through pause/resume', () => {
      const { system } = createIntegrationSystem();

      const threat = makeThreat('state-pres-1');
      system.protocol.ingestThreat(threat);
      expect(system.protocol.phase).toBe('SILENCE');
      expect(system.chorus.isPaused()).toBe(true);

      // Advance through assessment
      system.protocol.advanceToAssess();
      system.protocol.advanceToProbe();

      const cycle = system.protocol.activeCycle!;
      system.protocol.submitProbeResult({
        probeId: cycle.probeDispatches[0].probeId,
        result: 'safe',
        scoutId: 'agent-0',
        timestamp: Date.now(),
      });

      system.protocol.classify();
      expect(system.protocol.phase).toBe('RESUME');

      // Initiate resume — should unpause chorus with scout-first
      system.protocol.initiateResume();
      expect(system.protocol.phase).toBe('BASELINE');
      expect(system.chorus.isPaused()).toBe(false);

      system.stop();
    });

    it('3 sequential protocol cycles maintain state integrity', () => {
      const { system } = createIntegrationSystem();

      for (let i = 0; i < 3; i++) {
        const threat = makeThreat(`integrity-${i}`);
        system.protocol.ingestThreat(threat);
        expect(system.protocol.phase).toBe('SILENCE');

        system.protocol.advanceToAssess();
        system.protocol.advanceToProbe();
        const cycle = system.protocol.activeCycle!;
        system.protocol.submitProbeResult({
          probeId: cycle.probeDispatches[0].probeId,
          result: 'safe',
          scoutId: 'agent-0',
          timestamp: Date.now(),
        });
        system.protocol.classify();
        system.protocol.initiateResume();

        expect(system.protocol.phase).toBe('BASELINE');
        expect(system.protocol.completedCycles.length).toBe(i + 1);
      }

      system.stop();
    });
  });
});
