import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SimulatedEnvironment,
  SCENARIOS,
  createMockAgent,
  DEFAULT_NOISE,
  LOW_NOISE,
  HIGH_NOISE,
} from '../test-env.js';

describe('Spatial Awareness — Test Environment (0C)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createMockAgent', () => {
    it('creates an agent with initial values', () => {
      const agent = createMockAgent('alpha', 0);
      expect(agent.id).toBe('agent-0');
      expect(agent.name).toBe('alpha');
      expect(agent.state).toBe('active');
      expect(agent.contextFill).toBeGreaterThanOrEqual(20);
      expect(agent.contextFill).toBeLessThanOrEqual(50);
      expect(agent.tokenBudget).toBeGreaterThanOrEqual(70);
    });
  });

  describe('SimulatedEnvironment', () => {
    it('creates 5 agents by default', () => {
      const env = new SimulatedEnvironment();
      expect(env.agents).toHaveLength(5);
      expect(env.agents[0].name).toBe('alpha');
      expect(env.agents[4].name).toBe('echo');
    });

    it('creates sensor streams for each agent', () => {
      const env = new SimulatedEnvironment();
      const sensors = env.sensorRegistry.getAll();
      // 3 sensors per agent (context, budget, errors) × 5 agents = 15
      expect(sensors).toHaveLength(15);
    });

    it('starts and stops cleanly', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment();
      expect(env.running).toBe(false);

      env.start(100);
      expect(env.running).toBe(true);

      env.stop();
      expect(env.running).toBe(false);
    });

    it('ticks and updates agent state', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment(undefined, LOW_NOISE);
      const initialFill = env.agents[0].contextFill;

      env.start(100);
      vi.advanceTimersByTime(500); // 5 ticks

      expect(env.tickCount).toBe(5);
      // Context should have drifted slightly
      expect(env.agents[0].contextFill).not.toBe(initialFill);

      env.stop();
    });

    it('injects anomalies', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment();
      const anomaly = env.injectAnomaly({
        type: 'budget_spike',
        severity: 'ELEVATED',
        duration: 5_000,
      });

      expect(anomaly.active).toBe(false);
      env.start(100);

      // Anomaly activates immediately (no delay)
      vi.advanceTimersByTime(100);
      expect(anomaly.active).toBe(true);
      expect(env.threats).toHaveLength(1);
      expect(env.threats[0].type).toBe('budget_spike');

      // Anomaly resolves after duration
      vi.advanceTimersByTime(5_000);
      expect(anomaly.active).toBe(false);
      expect(anomaly.event.resolved).toBe(true);

      env.stop();
    });

    it('injects delayed anomalies', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment();
      env.injectAnomaly({
        type: 'agent_silence',
        targetAgent: 'agent-0',
        severity: 'HIGH',
        duration: 3_000,
        delay: 2_000,
      });

      env.start(100);
      vi.advanceTimersByTime(1_500);
      expect(env.threats).toHaveLength(0);

      vi.advanceTimersByTime(1_000); // now at 2.5s, past delay
      expect(env.threats).toHaveLength(1);
      expect(env.agents[0].state).toBe('blocked');

      env.stop();
    });

    it('emits events to subscribers', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment();
      const events: string[] = [];
      env.subscribe(e => events.push(e.type));

      env.injectAnomaly({
        type: 'error_surge',
        severity: 'ELEVATED',
        duration: 1_000,
      });

      env.start(100);
      vi.advanceTimersByTime(200);
      expect(events).toContain('tick');
      expect(events).toContain('threat');

      vi.advanceTimersByTime(1_000);
      expect(events).toContain('threat_resolved');

      env.stop();
    });

    it('builds spatial model for an agent', () => {
      const env = new SimulatedEnvironment();
      const model = env.getSpatialModel('agent-0');

      expect(model).not.toBeNull();
      expect(model!.agentId).toBe('agent-0');
      expect(model!.dimensions).toHaveLength(2);
      expect(model!.threatLevel).toBe('NOMINAL');
      expect(model!.peerCount).toBe(4);
    });

    it('returns null for unknown agent', () => {
      const env = new SimulatedEnvironment();
      expect(env.getSpatialModel('nonexistent')).toBeNull();
    });

    it('reflects threat level in spatial model', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment();
      env.injectAnomaly({
        type: 'safety_approach',
        severity: 'BLOCK',
        duration: 5_000,
      });

      env.start(100);
      vi.advanceTimersByTime(200);

      const model = env.getSpatialModel('agent-0');
      expect(model!.threatLevel).toBe('BLOCK');

      env.stop();
    });

    it('records coordination messages', () => {
      const env = new SimulatedEnvironment();
      env.recordMessage({
        id: 'msg-1',
        tier: 'BROADCAST',
        sender: 'flight',
        recipients: [],
        phase: 'SILENCE',
        payload: {},
        timestamp: Date.now(),
        ttl: 30_000,
      });

      expect(env.messages).toHaveLength(1);
      expect(env.messages[0].tier).toBe('BROADCAST');
    });

    it('resets to initial state', () => {
      vi.useFakeTimers();
      const env = new SimulatedEnvironment();
      env.injectAnomaly({ type: 'error_surge', severity: 'HIGH', duration: 5_000 });
      env.start(100);
      vi.advanceTimersByTime(500);

      env.reset();
      expect(env.running).toBe(false);
      expect(env.tickCount).toBe(0);
      expect(env.threats).toHaveLength(0);
      expect(env.messages).toHaveLength(0);
      for (const agent of env.agents) {
        expect(agent.state).toBe('active');
      }
    });
  });

  describe('Noise configurations', () => {
    it('LOW_NOISE has smaller variance than DEFAULT', () => {
      expect(LOW_NOISE.contextFillJitter).toBeLessThan(DEFAULT_NOISE.contextFillJitter);
      expect(LOW_NOISE.errorRateVariance).toBeLessThan(DEFAULT_NOISE.errorRateVariance);
    });

    it('HIGH_NOISE has larger variance than DEFAULT', () => {
      expect(HIGH_NOISE.contextFillJitter).toBeGreaterThan(DEFAULT_NOISE.contextFillJitter);
      expect(HIGH_NOISE.signalNoiseRatio).toBeLessThan(DEFAULT_NOISE.signalNoiseRatio);
    });
  });

  describe('Scenario presets', () => {
    it('nominal creates a low-noise environment', () => {
      const env = SCENARIOS.nominal();
      expect(env.agents).toHaveLength(5);
    });

    it('dependencyFailure targets agent-2', () => {
      const env = SCENARIOS.dependencyFailure();
      // Anomaly is queued but not yet active
      expect(env.threats).toHaveLength(0);
    });

    it('cascadingFailure creates 3 staggered anomalies', () => {
      vi.useFakeTimers();
      const env = SCENARIOS.cascadingFailure();
      env.start(100);

      vi.advanceTimersByTime(200);
      expect(env.threats.length).toBeGreaterThanOrEqual(1);

      vi.advanceTimersByTime(4_000);
      expect(env.threats.length).toBeGreaterThanOrEqual(2);

      vi.advanceTimersByTime(3_000);
      expect(env.threats.length).toBe(3);

      env.stop();
    });

    it('noisyButSafe has high noise but no threats', () => {
      vi.useFakeTimers();
      const env = SCENARIOS.noisyButSafe();
      env.start(100);
      vi.advanceTimersByTime(2_000);

      expect(env.threats).toHaveLength(0);
      env.stop();
    });

    it('rapidAnomalies creates 5 successive anomalies', () => {
      vi.useFakeTimers();
      const env = SCENARIOS.rapidAnomalies();
      env.start(100);

      vi.advanceTimersByTime(6_000);
      expect(env.threats.length).toBeGreaterThanOrEqual(5);

      env.stop();
    });
  });
});
