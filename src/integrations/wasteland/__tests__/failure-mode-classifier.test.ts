/**
 * Tests for Failure Mode Classifier — Layer 1 failure analysis.
 *
 * Covers:
 * - classifyFailure: maps reasons to 6 failure classes
 * - classifyFailures: batch classification from observation events
 * - createFailureSignatureStore: add, get, match, distribution
 * - bayesianAttribution: agent-side vs task-side attribution
 */

import { describe, it, expect } from 'vitest';
import {
  classifyFailure,
  classifyFailures,
  createFailureSignatureStore,
  bayesianAttribution,
} from '../failure-mode-classifier.js';
import type { ObservationEvent, AgentProfile } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeEvent(overrides: Partial<ObservationEvent> = {}): ObservationEvent {
  return {
    id: 'evt-1',
    timestamp: '2026-03-27T00:00:00Z',
    eventType: 'task-failed',
    agentId: 'agent-1',
    taskId: 'task-1',
    townId: 'town-1',
    metadata: {},
    ...overrides,
  };
}

function makeProfile(taskType: string, capability: number): AgentProfile {
  return {
    agentId: 'agent-1',
    vector: {
      dimensions: { [taskType]: capability },
      totalTasks: 100,
      successRate: capability,
      lastUpdated: '2026-03-27T00:00:00Z',
    },
    townIds: ['town-1'],
    taskHistory: [],
  };
}

// ============================================================================
// classifyFailure
// ============================================================================

describe('classifyFailure', () => {
  it('classifies capability-related failures', () => {
    expect(classifyFailure('Agent lacks capability for this task')).toBe('capability-gap');
    expect(classifyFailure('skill-mismatch detected')).toBe('capability-gap');
    expect(classifyFailure('not_qualified for task')).toBe('capability-gap');
  });

  it('classifies scope-related failures', () => {
    expect(classifyFailure('unclear requirements')).toBe('scope-gap');
    expect(classifyFailure('ambiguous specification')).toBe('scope-gap');
  });

  it('classifies dependency failures', () => {
    expect(classifyFailure('missing dependency')).toBe('dependency-gap');
    expect(classifyFailure('blocked_by upstream task')).toBe('dependency-gap');
  });

  it('classifies timeouts', () => {
    expect(classifyFailure('task timed out after 5m')).toBe('timeout');
    expect(classifyFailure('exceeded deadline')).toBe('timeout');
  });

  it('classifies communication failures', () => {
    expect(classifyFailure('handoff to next agent failed')).toBe('communication-failure');
    expect(classifyFailure('lost connection to town')).toBe('communication-failure');
  });

  it('classifies safety violations', () => {
    expect(classifyFailure('safety boundary violated')).toBe('safety-violation');
    expect(classifyFailure('forbidden operation attempted')).toBe('safety-violation');
  });

  it('defaults to scope-gap for unknown reasons', () => {
    expect(classifyFailure('something went wrong')).toBe('scope-gap');
    expect(classifyFailure('')).toBe('scope-gap');
  });
});

// ============================================================================
// classifyFailures
// ============================================================================

describe('classifyFailures', () => {
  it('classifies only task-failed events', () => {
    const events = [
      makeEvent({ eventType: 'task-failed', metadata: { reason: 'timeout' } }),
      makeEvent({ eventType: 'task-completed', metadata: { reason: 'success' } }),
      makeEvent({ eventType: 'task-failed', metadata: { reason: 'safety violation' } }),
    ];
    const results = classifyFailures(events);
    expect(results).toHaveLength(2);
    expect(results[0].failureClass).toBe('timeout');
    expect(results[1].failureClass).toBe('safety-violation');
  });

  it('returns empty for no failures', () => {
    expect(classifyFailures([makeEvent({ eventType: 'task-completed' })])).toHaveLength(0);
  });

  it('handles missing reason metadata', () => {
    const results = classifyFailures([makeEvent({ metadata: {} })]);
    expect(results).toHaveLength(1);
    expect(results[0].failureClass).toBe('scope-gap'); // default
  });
});

// ============================================================================
// FailureSignatureStore
// ============================================================================

describe('createFailureSignatureStore', () => {
  it('adds and retrieves signatures', () => {
    const store = createFailureSignatureStore();
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const sig = store.addFailure(event, 'timeout');

    expect(sig.failureClass).toBe('timeout');
    expect(sig.taskType).toBe('build');
    expect(sig.occurrences).toBe(1);
    expect(store.getSignatures()).toHaveLength(1);
  });

  it('increments occurrences for same failure class + task type', () => {
    const store = createFailureSignatureStore();
    const event = makeEvent({ metadata: { taskType: 'build' } });
    store.addFailure(event, 'timeout');
    const sig = store.addFailure(event, 'timeout');

    expect(sig.occurrences).toBe(2);
    expect(store.getSignatures()).toHaveLength(1);
  });

  it('creates separate signatures for different task types', () => {
    const store = createFailureSignatureStore();
    store.addFailure(makeEvent({ metadata: { taskType: 'build' } }), 'timeout');
    store.addFailure(makeEvent({ metadata: { taskType: 'test' } }), 'timeout');

    expect(store.getSignatures()).toHaveLength(2);
  });

  it('matches by task type', () => {
    const store = createFailureSignatureStore();
    store.addFailure(makeEvent({ metadata: { taskType: 'build' } }), 'timeout');

    expect(store.matchSignature('build', {})).not.toBeNull();
    expect(store.matchSignature('deploy', {})).toBeNull();
  });

  it('computes class distribution', () => {
    const store = createFailureSignatureStore();
    store.addFailure(makeEvent({ metadata: { taskType: 'a' } }), 'timeout');
    store.addFailure(makeEvent({ metadata: { taskType: 'a' } }), 'timeout');
    store.addFailure(makeEvent({ metadata: { taskType: 'b' } }), 'safety-violation');

    const dist = store.getClassDistribution();
    expect(dist.get('timeout')).toBe(2);
    expect(dist.get('safety-violation')).toBe(1);
  });

  it('includes preventative action in signature', () => {
    const store = createFailureSignatureStore();
    const sig = store.addFailure(makeEvent({ metadata: { taskType: 'x' } }), 'capability-gap');
    expect(sig.preventativeAction).toContain('capability');
  });
});

// ============================================================================
// bayesianAttribution
// ============================================================================

describe('bayesianAttribution', () => {
  it('attributes to agent-side when agent has low capability', () => {
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const profile = makeProfile('build', 0.1); // low capability
    const result = bayesianAttribution(event, profile, 0.8); // task usually succeeds

    expect(result.agentSideProbability).toBeGreaterThan(0.5);
    expect(result.taskSideProbability).toBeLessThan(0.5);
  });

  it('attributes to task-side when task has low success rate', () => {
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const profile = makeProfile('build', 0.9); // high capability
    const result = bayesianAttribution(event, profile, 0.1); // task rarely succeeds

    expect(result.taskSideProbability).toBeGreaterThan(0.5);
    expect(result.agentSideProbability).toBeLessThan(0.5);
  });

  it('returns 50/50 when no agent profile', () => {
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const result = bayesianAttribution(event, undefined, 0.5);

    expect(result.agentSideProbability).toBe(0.5);
    expect(result.taskSideProbability).toBe(0.5);
  });

  it('includes evidence strings', () => {
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const profile = makeProfile('build', 0.7);
    const result = bayesianAttribution(event, profile, 0.6);

    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence.some(e => e.includes('success rate'))).toBe(true);
  });

  it('confidence is high when attribution is clear', () => {
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const profile = makeProfile('build', 0.05); // very low capability
    const result = bayesianAttribution(event, profile, 0.95); // task almost always succeeds

    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('confidence is low when attribution is uncertain', () => {
    const event = makeEvent({ metadata: { reason: 'timeout', taskType: 'build' } });
    const profile = makeProfile('build', 0.5); // middling
    const result = bayesianAttribution(event, profile, 0.5);

    expect(result.confidence).toBe(0);
  });

  it('classifies the failure in the result', () => {
    const event = makeEvent({ metadata: { reason: 'safety violation' } });
    const result = bayesianAttribution(event, undefined, 0.5);
    expect(result.failureClass).toBe('safety-violation');
  });
});
