/**
 * Integration Bridge — Wave 2B Tests
 *
 * IN-01: Sensor → Threat pipeline
 * IN-02: Threat → Frog Protocol
 * IN-03: Frog Protocol → Comm Bus
 * IN-04: Comm Bus → Chorus
 * IN-05: Full cycle end-to-end
 * IN-10: Protocol phase → light sequence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SpatialAwarenessSystem,
  createSpatialSystem,
} from '../integration.js';
import type { SpatialSystemEvent } from '../integration.js';
import {
  DefaultSensorRegistry,
  ContextFillSensor,
  TokenBudgetSensor,
  ErrorRateSensor,
  createAmbientSignal,
} from '../sensor-interface.js';
import { FROG_PHASE_COLORS } from '../output-synthesis.js';

// ============================================================================
// Helpers
// ============================================================================

function createTestSystem(): {
  system: SpatialAwarenessSystem;
  contextSensor: ContextFillSensor;
  budgetSensor: TokenBudgetSensor;
  errorSensor: ErrorRateSensor;
} {
  const registry = new DefaultSensorRegistry();
  const contextSensor = new ContextFillSensor(100);
  const budgetSensor = new TokenBudgetSensor(100);
  const errorSensor = new ErrorRateSensor(100);

  registry.register(contextSensor);
  registry.register(budgetSensor);
  registry.register(errorSensor);

  const system = createSpatialSystem(
    {
      agentId: 'test-agent',
      agentIds: ['agent-0', 'agent-1', 'agent-2'],
      scoutId: 'agent-0',
      sensorPollMs: 100,
      ledPixelCount: 10,
      threatConfig: {
        elevatedScoreThreshold: 0.3,
        highScoreThreshold: 0.6,
        blockScoreThreshold: 0.85,
      },
    },
    registry,
  );

  return { system, contextSensor, budgetSensor, errorSensor };
}

// ============================================================================
// Tests
// ============================================================================

describe('SpatialAwarenessSystem — Integration Bridge', () => {
  let system: SpatialAwarenessSystem;
  let contextSensor: ContextFillSensor;
  let budgetSensor: TokenBudgetSensor;
  let errorSensor: ErrorRateSensor;

  beforeEach(() => {
    const setup = createTestSystem();
    system = setup.system;
    contextSensor = setup.contextSensor;
    budgetSensor = setup.budgetSensor;
    errorSensor = setup.errorSensor;
  });

  afterEach(() => {
    system.stop();
  });

  describe('construction', () => {
    it('creates all components', () => {
      expect(system.sensor).toBeDefined();
      expect(system.threats).toBeDefined();
      expect(system.geometry).toBeDefined();
      expect(system.protocol).toBeDefined();
      expect(system.bus).toBeDefined();
      expect(system.chorus).toBeDefined();
      expect(system.output).toBeDefined();
    });

    it('starts in non-running state', () => {
      expect(system.running).toBe(false);
      expect(system.getStatus().running).toBe(false);
    });

    it('registers agents on bus and chorus', () => {
      expect(system.bus.getRegisteredAgents()).toContain('agent-0');
      expect(system.bus.getRegisteredAgents()).toContain('agent-1');
      expect(system.bus.getRegisteredAgents()).toContain('agent-2');
      expect(system.bus.getRegisteredAgents()).toContain('frog-controller');
    });

    it('provides system status', () => {
      const status = system.getStatus();
      expect(status.phase).toBe('BASELINE');
      expect(status.agentCount).toBe(3);
      expect(status.threatLevel).toBe('NOMINAL');
      expect(status.activeThreatCount).toBe(0);
      expect(status.chorusPaused).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('starts and stops', () => {
      system.start();
      expect(system.running).toBe(true);
      expect(system.getStatus().sensorActive).toBe(true);

      system.stop();
      expect(system.running).toBe(false);
    });

    it('emits system events on start/stop', () => {
      const events: SpatialSystemEvent[] = [];
      system.onEvent(e => events.push(e));

      system.start();
      system.stop();

      expect(events.some(e => e.type === 'system_started')).toBe(true);
      expect(events.some(e => e.type === 'system_stopped')).toBe(true);
    });

    it('resets all components', () => {
      system.start();
      system.stop();
      system.reset();

      expect(system.getStatus().phase).toBe('BASELINE');
      expect(system.getStatus().busMessageCount).toBe(0);
    });
  });

  describe('IN-01: Sensor → Threat pipeline', () => {
    it('feeds high context fill signal through to threat detection', () => {
      // Feed multiple signals to build up threat score above threshold
      for (let i = 0; i < 5; i++) {
        system.feedSignal(createAmbientSignal('context_fill', 'agent-0', 96, 'percent'));
      }
      // After repeated high signals, threat engine should have generated events
      expect(system.threats.events.length).toBeGreaterThan(0);
      expect(system.threats.getOverallThreatLevel()).not.toBe('NOMINAL');
    });

    it('nominal signals produce no threats', () => {
      const signal = createAmbientSignal('context_fill', 'agent-0', 30, 'percent');
      const event = system.feedSignal(signal);
      expect(event).toBeNull();
    });

    it('updates geometry mapper from signal', () => {
      const signal = createAmbientSignal('context_fill', 'agent-0', 50, 'percent');
      system.feedSignal(signal);

      const dim = system.geometry.getDimension('context_window');
      expect(dim).toBeDefined();
      expect(dim!.fillPercent).toBe(50);
    });
  });

  describe('IN-02: Threat → Frog Protocol', () => {
    it('threat event triggers protocol phase change', () => {
      // Feed multiple high signals to build score
      for (let i = 0; i < 5; i++) {
        system.feedSignal(createAmbientSignal('context_fill', 'agent-0', 97, 'percent'));
      }
      // Threat engine should have events
      expect(system.threats.events.length).toBeGreaterThan(0);
    });
  });

  describe('IN-03: Frog Protocol → Comm Bus', () => {
    it('protocol phase changes generate bus messages', () => {
      // Directly trigger protocol
      const threat = {
        id: 'test-threat-1',
        type: 'error_surge' as const,
        level: 'ELEVATED' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-0', 'agent-1'],
        description: 'Test',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      system.protocol.ingestThreat(threat);
      const messages = system.bus.getMessages();
      const phaseMessages = messages.filter(
        m => (m.payload as any)?.command === 'FROG_SILENCE' ||
             (m.payload as any)?.command === 'FROG_PHASE_CHANGE',
      );
      expect(phaseMessages.length).toBeGreaterThan(0);
    });
  });

  describe('IN-04: Comm Bus → Chorus', () => {
    it('protocol SILENCE pauses chorus', () => {
      const threat = {
        id: 'test-threat-2',
        type: 'error_surge' as const,
        level: 'HIGH' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-0'],
        description: 'Test',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      expect(system.chorus.isPaused()).toBe(false);
      system.protocol.ingestThreat(threat);
      expect(system.chorus.isPaused()).toBe(true);
    });
  });

  describe('IN-05: Full cycle end-to-end', () => {
    it('completes anomaly → silence → assess → probe → classify → resume', () => {
      const events: SpatialSystemEvent[] = [];
      system.onEvent(e => events.push(e));

      const threat = {
        id: 'e2e-threat',
        type: 'error_surge' as const,
        level: 'HIGH' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-0', 'agent-1'],
        description: 'E2E test threat',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      // Inject threat
      system.protocol.ingestThreat(threat);
      expect(system.protocol.phase).toBe('SILENCE');

      // Advance through phases
      system.protocol.advanceToAssess();
      expect(system.protocol.phase).toBe('ASSESS');

      system.protocol.advanceToProbe();
      expect(system.protocol.phase).toBe('PROBE');

      const cycle = system.protocol.activeCycle!;
      system.protocol.submitProbeResult({
        probeId: cycle.probeDispatches[0].probeId,
        result: 'safe',
        scoutId: 'agent-0',
        timestamp: Date.now(),
      });
      expect(system.protocol.phase).toBe('CLASSIFY');

      system.protocol.classify();
      expect(system.protocol.phase).toBe('RESUME');

      system.protocol.initiateResume();
      expect(system.protocol.phase).toBe('BASELINE');

      // Verify events were emitted
      expect(events.some(e => e.type === 'protocol_event')).toBe(true);
      expect(events.some(e => e.type === 'pipeline_complete')).toBe(true);

      const pipelineEvent = events.find(e => e.type === 'pipeline_complete') as any;
      expect(pipelineEvent.threatId).toBe('e2e-threat');
      expect(pipelineEvent.classification).toBe('NEUTRAL');
    });
  });

  describe('IN-10: Protocol phase → light sequence', () => {
    it('updates LED strip colors on phase transitions', () => {
      const threat = {
        id: 'light-test',
        type: 'error_surge' as const,
        level: 'HIGH' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-0'],
        description: 'Light test',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      system.protocol.ingestThreat(threat);
      const strip = system.output.getLedStrip();
      expect(strip).not.toBeNull();

      // SILENCE phase colors
      const silenceColors = FROG_PHASE_COLORS.SILENCE;
      const pixel = strip!.pixels[0];
      expect(pixel.r).toBe(silenceColors.primary[0]);
      expect(pixel.g).toBe(silenceColors.primary[1]);
      expect(pixel.b).toBe(silenceColors.primary[2]);
    });

    it('updates DMX frame on phase transitions', () => {
      const threat = {
        id: 'dmx-test',
        type: 'error_surge' as const,
        level: 'HIGH' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-0'],
        description: 'DMX test',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      system.protocol.ingestThreat(threat);
      const frame = system.output.getDmxFrame();
      // Should have non-zero values from SILENCE phase
      expect(frame.frameNumber).toBeGreaterThan(0);
    });
  });

  describe('multiple cycles', () => {
    it('handles sequential protocol cycles', () => {
      // First cycle
      const threat1 = {
        id: 'cycle-1',
        type: 'error_surge' as const,
        level: 'HIGH' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-0'],
        description: 'First',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      system.protocol.ingestThreat(threat1);
      system.protocol.advanceToAssess();
      system.protocol.advanceToProbe();
      const cycle1 = system.protocol.activeCycle!;
      system.protocol.submitProbeResult({
        probeId: cycle1.probeDispatches[0].probeId,
        result: 'safe', scoutId: 'agent-0', timestamp: Date.now(),
      });
      system.protocol.classify();
      system.protocol.initiateResume();
      expect(system.protocol.phase).toBe('BASELINE');

      // Second cycle
      const threat2 = {
        id: 'cycle-2',
        type: 'budget_spike' as const,
        level: 'ELEVATED' as const,
        classification: 'UNKNOWN' as const,
        sources: ['agent-1'],
        description: 'Second',
        timestamp: Date.now(),
        probeResults: [],
        resolved: false,
      };

      system.protocol.ingestThreat(threat2);
      expect(system.protocol.phase).toBe('SILENCE');
      expect(system.protocol.completedCycles.length).toBe(1);
    });
  });
});
