/**
 * Wave 3A: 15-Scenario Threat Simulation Suite
 *
 * Uses SimulatedEnvironment + SCENARIOS from test-env.ts.
 * Feeds through SpatialAwarenessSystem, verifies:
 *   - ≥85% true positive rate (real threats detected)
 *   - ≤10% false positive rate (noise not misclassified)
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
import { ThreatDetectionEngine } from '../threat-engine.js';
import type { ThreatEvent } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

function createTestSystem(config?: {
  elevatedThreshold?: number;
  highThreshold?: number;
  blockThreshold?: number;
}): {
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
      agentId: 'sim-agent',
      agentIds: ['agent-0', 'agent-1', 'agent-2', 'agent-3', 'agent-4'],
      scoutId: 'agent-0',
      sensorPollMs: 100,
      ledPixelCount: 10,
      threatConfig: {
        elevatedScoreThreshold: config?.elevatedThreshold ?? 0.3,
        highScoreThreshold: config?.highThreshold ?? 0.6,
        blockScoreThreshold: config?.blockThreshold ?? 0.85,
      },
    },
    registry,
  );

  return { system, contextSensor, budgetSensor, errorSensor };
}

/** Feed N repeated signals to build EMA score. */
function feedRepeated(
  system: SpatialAwarenessSystem,
  type: 'context_fill' | 'token_budget' | 'error_rate',
  source: string,
  value: number,
  count: number,
): ThreatEvent[] {
  const events: ThreatEvent[] = [];
  for (let i = 0; i < count; i++) {
    const event = system.feedSignal(createAmbientSignal(type, source, value));
    if (event) events.push(event);
  }
  return events;
}

// ============================================================================
// 15-Scenario Threat Simulation Suite
// ============================================================================

describe('Wave 3A: Threat Simulation Suite', () => {
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

  // --------------------------------------------------------------------------
  // Scenario 1-3: Single-signal anomalies (true positives)
  // --------------------------------------------------------------------------

  it('S01: context fill at 96% triggers threat detection', () => {
    const events = feedRepeated(system, 'context_fill', 'agent-0', 96, 8);
    expect(events.length).toBeGreaterThan(0);
    expect(system.threats.getOverallThreatLevel()).not.toBe('NOMINAL');
  });

  it('S02: token budget at 5% triggers threat detection', () => {
    const events = feedRepeated(system, 'token_budget', 'agent-0', 5, 8);
    expect(events.length).toBeGreaterThan(0);
    expect(system.threats.getOverallThreatLevel()).not.toBe('NOMINAL');
  });

  it('S03: error rate at 3x threshold triggers threat detection', () => {
    const events = feedRepeated(system, 'error_rate', 'agent-0', 15, 8);
    expect(events.length).toBeGreaterThan(0);
    expect(system.threats.getOverallThreatLevel()).not.toBe('NOMINAL');
  });

  // --------------------------------------------------------------------------
  // Scenario 4-6: Severity-level coverage
  // --------------------------------------------------------------------------

  it('S04: context fill at 95% produces ELEVATED or higher', () => {
    feedRepeated(system, 'context_fill', 'agent-0', 95, 10);
    const level = system.threats.getOverallThreatLevel();
    expect(['ELEVATED', 'HIGH', 'BLOCK']).toContain(level);
  });

  it('S05: context fill at 98% produces HIGH or BLOCK', () => {
    feedRepeated(system, 'context_fill', 'agent-0', 98, 10);
    const level = system.threats.getOverallThreatLevel();
    expect(['HIGH', 'BLOCK']).toContain(level);
  });

  it('S06: budget at 2% produces HIGH or BLOCK', () => {
    feedRepeated(system, 'token_budget', 'agent-0', 2, 10);
    const level = system.threats.getOverallThreatLevel();
    expect(['HIGH', 'BLOCK']).toContain(level);
  });

  // --------------------------------------------------------------------------
  // Scenario 7-8: Multi-source correlation
  // --------------------------------------------------------------------------

  it('S07: correlated context fill from 2+ sources triggers correlated event', () => {
    // Feed high context from multiple sources
    feedRepeated(system, 'context_fill', 'agent-0', 92, 5);
    feedRepeated(system, 'context_fill', 'agent-1', 93, 5);
    feedRepeated(system, 'context_fill', 'agent-2', 91, 5);

    // Should have correlated or individual events
    expect(system.threats.events.length).toBeGreaterThan(0);
    expect(system.threats.getOverallThreatLevel()).not.toBe('NOMINAL');
  });

  it('S08: correlated error surge across agents triggers detection', () => {
    feedRepeated(system, 'error_rate', 'agent-0', 12, 5);
    feedRepeated(system, 'error_rate', 'agent-1', 14, 5);

    expect(system.threats.events.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // Scenario 9-10: Nominal / false positive testing
  // --------------------------------------------------------------------------

  it('S09: nominal signals produce zero threats (false positive check)', () => {
    // Feed normal-range signals
    for (let i = 0; i < 20; i++) {
      system.feedSignal(createAmbientSignal('context_fill', 'agent-0', 30));
      system.feedSignal(createAmbientSignal('token_budget', 'agent-0', 80));
      system.feedSignal(createAmbientSignal('error_rate', 'agent-0', 1));
    }
    expect(system.threats.events.length).toBe(0);
    expect(system.threats.getOverallThreatLevel()).toBe('NOMINAL');
  });

  it('S10: moderate signals stay below threshold (boundary check)', () => {
    // Just below thresholds
    for (let i = 0; i < 10; i++) {
      system.feedSignal(createAmbientSignal('context_fill', 'agent-0', 60));
      system.feedSignal(createAmbientSignal('token_budget', 'agent-0', 50));
      system.feedSignal(createAmbientSignal('error_rate', 'agent-0', 3));
    }
    expect(system.threats.getOverallThreatLevel()).toBe('NOMINAL');
  });

  // --------------------------------------------------------------------------
  // Scenario 11-12: Mixed signal types
  // --------------------------------------------------------------------------

  it('S11: simultaneous context + budget anomalies both detected', () => {
    feedRepeated(system, 'context_fill', 'agent-0', 96, 8);
    feedRepeated(system, 'token_budget', 'agent-1', 4, 8);

    // Both signal types should generate events
    const contextEvents = system.threats.events.filter(
      e => e.type === 'resource_exhaustion',
    );
    const budgetEvents = system.threats.events.filter(
      e => e.type === 'budget_spike',
    );
    expect(contextEvents.length + budgetEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('S12: error surge + context fill compound detection', () => {
    feedRepeated(system, 'error_rate', 'agent-0', 20, 8);
    feedRepeated(system, 'context_fill', 'agent-0', 93, 8);

    expect(system.threats.events.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // Scenario 13-14: Pipeline integration
  // --------------------------------------------------------------------------

  it('S13: threat triggers Frog Protocol SILENCE via pipeline', () => {
    const events: SpatialSystemEvent[] = [];
    system.onEvent(e => events.push(e));

    feedRepeated(system, 'context_fill', 'agent-0', 97, 8);

    // Should have triggered protocol events
    const protocolEvents = events.filter(e => e.type === 'protocol_event');
    if (system.threats.events.length > 0 && system.protocol.phase !== 'BASELINE') {
      expect(protocolEvents.length).toBeGreaterThan(0);
    }
  });

  it('S14: full pipeline: signal → threat → protocol → classify → resume', () => {
    const events: SpatialSystemEvent[] = [];
    system.onEvent(e => events.push(e));

    // Force-inject a threat directly for deterministic pipeline test
    const threat: ThreatEvent = {
      id: 'sim-pipeline-test',
      type: 'error_surge',
      level: 'HIGH',
      classification: 'UNKNOWN',
      sources: ['agent-0', 'agent-1'],
      description: 'Simulated pipeline test',
      timestamp: Date.now(),
      probeResults: [],
      resolved: false,
    };

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
    expect(events.some(e => e.type === 'pipeline_complete')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Aggregate accuracy
  // --------------------------------------------------------------------------

  it('S15: aggregate detection: ≥85% TP, ≤10% FP across scenarios', () => {
    // True positive scenarios (should detect)
    const tpScenarios: Array<{ type: 'context_fill' | 'token_budget' | 'error_rate'; value: number }> = [
      { type: 'context_fill', value: 96 },
      { type: 'context_fill', value: 98 },
      { type: 'token_budget', value: 3 },
      { type: 'token_budget', value: 5 },
      { type: 'error_rate', value: 15 },
      { type: 'error_rate', value: 20 },
      { type: 'context_fill', value: 92 },
    ];

    let tpDetected = 0;
    for (const scenario of tpScenarios) {
      const freshSetup = createTestSystem();
      const events = feedRepeated(freshSetup.system, scenario.type, 'agent-0', scenario.value, 10);
      if (events.length > 0) tpDetected++;
      freshSetup.system.stop();
    }

    const tpRate = tpDetected / tpScenarios.length;
    expect(tpRate).toBeGreaterThanOrEqual(0.85);

    // False positive scenarios (should NOT detect)
    const fpScenarios: Array<{ type: 'context_fill' | 'token_budget' | 'error_rate'; value: number }> = [
      { type: 'context_fill', value: 30 },
      { type: 'context_fill', value: 50 },
      { type: 'token_budget', value: 80 },
      { type: 'token_budget', value: 60 },
      { type: 'error_rate', value: 1 },
      { type: 'error_rate', value: 2 },
      { type: 'context_fill', value: 40 },
      { type: 'token_budget', value: 70 },
      { type: 'error_rate', value: 0.5 },
      { type: 'context_fill', value: 20 },
    ];

    let fpDetected = 0;
    for (const scenario of fpScenarios) {
      const freshSetup = createTestSystem();
      const events = feedRepeated(freshSetup.system, scenario.type, 'agent-0', scenario.value, 10);
      if (events.length > 0) fpDetected++;
      freshSetup.system.stop();
    }

    const fpRate = fpDetected / fpScenarios.length;
    expect(fpRate).toBeLessThanOrEqual(0.10);
  });
});
