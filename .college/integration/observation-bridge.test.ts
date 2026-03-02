/**
 * Tests for ObservationBridge -- connects concept exploration/translation
 * to the existing SessionObservation pipeline.
 *
 * @module integration/observation-bridge.test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ObservationBridge,
  type CollegeObservationEvent,
  type ObservationBridgeConfig,
} from './observation-bridge.js';
import type { ExplorationResult } from '../college/types.js';
import type { RosettaConcept, DepartmentWing } from '../rosetta-core/types.js';

// ─── Mock Helpers ────────────────────────────────────────────────────────────

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'maillard-reaction',
    name: 'Maillard Reaction',
    domain: 'culinary-arts',
    description: 'Non-enzymatic browning between amino acids and reducing sugars',
    panels: new Map(),
    relationships: [],
    ...overrides,
  };
}

function makeWing(overrides: Partial<DepartmentWing> = {}): DepartmentWing {
  return {
    id: 'food-science',
    name: 'Food Science',
    description: 'Scientific principles behind cooking',
    concepts: ['maillard-reaction'],
    ...overrides,
  };
}

function makeExplorationResult(overrides: Partial<ExplorationResult> = {}): ExplorationResult {
  return {
    path: 'culinary-arts/food-science/maillard-reaction',
    concept: makeConcept(),
    wing: makeWing(),
    departmentId: 'culinary-arts',
    pedagogicalContext: 'Understanding the science behind browning',
    relatedPaths: ['culinary-arts/technique/searing'],
    ...overrides,
  };
}

function makeTranslation() {
  return {
    id: 'translation-1234-abcde',
    primary: {
      panelId: 'python' as const,
      content: 'def maillard(temp, sugar, amino): ...',
      depth: 'active' as const,
      tokenCost: 50,
    },
    concept: makeConcept(),
    panels: {
      primary: 'python' as const,
      secondary: ['lisp' as const],
      rationale: 'Python is best for procedural cooking algorithms',
    },
    dependenciesLoaded: [],
  };
}

function makeConfig(overrides: Partial<ObservationBridgeConfig> = {}): ObservationBridgeConfig {
  return {
    sessionId: 'test-session-001',
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ObservationBridge', () => {
  it('onExploration() emits a CollegeObservationEvent with correct fields', () => {
    const bridge = new ObservationBridge(makeConfig());
    const result = makeExplorationResult();

    const event = bridge.onExploration(result);

    expect(event.type).toBe('exploration');
    expect(event.conceptId).toBe('maillard-reaction');
    expect(event.departmentId).toBe('culinary-arts');
    expect(event.path).toBe('culinary-arts/food-science/maillard-reaction');
    expect(event.timestamp).toBeTypeOf('number');
    expect(event.id).toBeTypeOf('string');
    expect(event.id.length).toBeGreaterThan(0);
  });

  it('onTranslation() emits a CollegeObservationEvent with correct fields', () => {
    const bridge = new ObservationBridge(makeConfig());
    const translation = makeTranslation();

    const event = bridge.onTranslation(translation);

    expect(event.type).toBe('translation');
    expect(event.conceptId).toBe('maillard-reaction');
    expect(event.translationId).toBe('translation-1234-abcde');
    expect(event.panelIds).toEqual(['python']);
    expect(event.timestamp).toBeTypeOf('number');
  });

  it('toSessionObservation() converts events to pipeline-compatible format', () => {
    const bridge = new ObservationBridge(makeConfig({ activeSkills: ['college', 'cooking'] }));
    const explorationResult = makeExplorationResult();
    const translation = makeTranslation();

    bridge.onExploration(explorationResult);
    bridge.onTranslation(translation);
    const events = bridge.flush();

    const observation = bridge.toSessionObservation(events);

    expect(observation.sessionId).toBe('test-session-001');
    expect(observation.topFiles).toContain('culinary-arts/food-science/maillard-reaction');
    expect(observation.topTools).toContain('college-explorer');
    expect(observation.topTools).toContain('rosetta-core');
    expect(observation.activeSkills).toContain('college');
    expect(observation.activeSkills).toContain('cooking');
    expect(observation.metrics.toolCalls).toBe(2);
    expect(observation.durationMinutes).toBeTypeOf('number');
    expect(observation.source).toBe('compact');
    expect(observation.reason).toBe('other');
  });

  it('events with no listener registered do not throw', () => {
    const bridge = new ObservationBridge(makeConfig());
    const result = makeExplorationResult();

    // Should not throw even with no listeners
    expect(() => bridge.onExploration(result)).not.toThrow();
    expect(() => bridge.onTranslation(makeTranslation())).not.toThrow();
  });

  it('multiple listeners receive the same event', () => {
    const bridge = new ObservationBridge(makeConfig());
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    bridge.addListener(listener1);
    bridge.addListener(listener2);

    const result = makeExplorationResult();
    const event = bridge.onExploration(result);

    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledWith(event);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('flush() returns all accumulated events and clears buffer', () => {
    const bridge = new ObservationBridge(makeConfig());

    bridge.onExploration(makeExplorationResult());
    bridge.onTranslation(makeTranslation());
    bridge.onExploration(makeExplorationResult({
      path: 'culinary-arts/technique/searing',
      concept: makeConcept({ id: 'searing' }),
    }));

    const events = bridge.flush();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('exploration');
    expect(events[1].type).toBe('translation');
    expect(events[2].conceptId).toBe('searing');

    // Buffer should be empty after flush
    const secondFlush = bridge.flush();
    expect(secondFlush).toHaveLength(0);
  });

  it('removeListener() stops delivering events to that listener', () => {
    const bridge = new ObservationBridge(makeConfig());
    const listener = vi.fn();

    bridge.addListener(listener);
    bridge.onExploration(makeExplorationResult());
    expect(listener).toHaveBeenCalledTimes(1);

    bridge.removeListener(listener);
    bridge.onExploration(makeExplorationResult());
    expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
  });

  it('default activeSkills contains "college"', () => {
    const bridge = new ObservationBridge(makeConfig());
    bridge.onExploration(makeExplorationResult());
    const events = bridge.flush();
    const observation = bridge.toSessionObservation(events);

    expect(observation.activeSkills).toContain('college');
  });

  it('toSessionObservation() with empty events returns zero-duration observation', () => {
    const bridge = new ObservationBridge(makeConfig());
    const observation = bridge.toSessionObservation([]);

    expect(observation.metrics.toolCalls).toBe(0);
    expect(observation.durationMinutes).toBe(0);
    expect(observation.topFiles).toEqual([]);
    expect(observation.topTools).toEqual([]);
  });
});
