/**
 * CF-M3-01: AMTP schema round-trip tests.
 *
 * Validates:
 *   - toCanonical → fromCanonical is a lossless round-trip
 *   - validateDecisionTrace accepts valid traces and rejects invalid ones
 *   - Optional fields are normalised correctly in canonical form
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  DecisionTraceSchema,
  toCanonical,
  fromCanonical,
  validateDecisionTrace,
} from '../schema.js';
import type { DecisionTrace } from '../../types/memory.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTrace(overrides: Partial<DecisionTrace> = {}): DecisionTrace {
  return {
    id: randomUUID(),
    ts: Date.now(),
    actor: 'skill:test-skill',
    intent: 'Sort a list of items by priority',
    reasoning: 'Chose merge-sort for stable O(n log n) guarantees',
    constraints: ['max-tokens:1000', 'no-external-calls'],
    alternatives: ['bubble-sort: too slow', 'quicksort: unstable'],
    outcome: 'Sorted 42 items in 12ms',
    refs: {
      teachId: 'teach-001',
      entityIds: ['entity-a', 'entity-b'],
    },
    ...overrides,
  };
}

// ─── DecisionTraceSchema validation ───────────────────────────────────────────

describe('DecisionTraceSchema', () => {
  it('accepts a fully populated valid trace', () => {
    const trace = makeTrace();
    expect(() => DecisionTraceSchema.parse(trace)).not.toThrow();
  });

  it('accepts a trace without optional fields (outcome, teachId, entityIds)', () => {
    const trace: DecisionTrace = {
      id: randomUUID(),
      ts: 1000,
      actor: 'agent:planner',
      intent: 'Plan the next release',
      reasoning: 'Linear plan chosen for simplicity',
      constraints: [],
      alternatives: [],
      refs: {},
    };
    expect(() => DecisionTraceSchema.parse(trace)).not.toThrow();
  });

  it('rejects trace with invalid UUID id', () => {
    const result = validateDecisionTrace({ ...makeTrace(), id: 'not-a-uuid' });
    expect(result.ok).toBe(false);
  });

  it('rejects trace with negative ts', () => {
    const result = validateDecisionTrace({ ...makeTrace(), ts: -1 });
    expect(result.ok).toBe(false);
  });

  it('rejects trace with empty actor', () => {
    const result = validateDecisionTrace({ ...makeTrace(), actor: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects trace with empty intent', () => {
    const result = validateDecisionTrace({ ...makeTrace(), intent: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(validateDecisionTrace(null).ok).toBe(false);
    expect(validateDecisionTrace('string').ok).toBe(false);
    expect(validateDecisionTrace(42).ok).toBe(false);
  });
});

// ─── toCanonical ──────────────────────────────────────────────────────────────

describe('toCanonical', () => {
  it('preserves all fields of a fully populated trace', () => {
    const trace = makeTrace();
    const c = toCanonical(trace);
    expect(c.id).toBe(trace.id);
    expect(c.ts).toBe(trace.ts);
    expect(c.actor).toBe(trace.actor);
    expect(c.intent).toBe(trace.intent);
    expect(c.reasoning).toBe(trace.reasoning);
    expect(c.constraints).toEqual(trace.constraints);
    expect(c.alternatives).toEqual(trace.alternatives);
    expect(c.outcome).toBe(trace.outcome);
    expect(c.refs.teachId).toBe(trace.refs.teachId);
    expect(c.refs.entityIds).toEqual(trace.refs.entityIds);
  });

  it('normalises absent outcome to empty string', () => {
    const trace = makeTrace({ outcome: undefined });
    const c = toCanonical(trace);
    expect(c.outcome).toBe('');
  });

  it('normalises absent teachId to empty string', () => {
    const trace = makeTrace({ refs: { entityIds: ['e1'] } });
    const c = toCanonical(trace);
    expect(c.refs.teachId).toBe('');
  });

  it('normalises absent entityIds to empty array', () => {
    const trace = makeTrace({ refs: { teachId: 'teach-x' } });
    const c = toCanonical(trace);
    expect(c.refs.entityIds).toEqual([]);
  });

  it('throws on invalid input', () => {
    expect(() => toCanonical({ id: 'bad' } as DecisionTrace)).toThrow();
  });
});

// ─── fromCanonical ────────────────────────────────────────────────────────────

describe('fromCanonical', () => {
  it('restores outcome when non-empty', () => {
    const trace = makeTrace();
    const c = toCanonical(trace);
    const restored = fromCanonical(c);
    expect(restored.outcome).toBe(trace.outcome);
  });

  it('omits outcome when canonical outcome is empty string', () => {
    const trace = makeTrace({ outcome: undefined });
    const c = toCanonical(trace);
    const restored = fromCanonical(c);
    expect(restored.outcome).toBeUndefined();
  });

  it('omits teachId when canonical teachId is empty string', () => {
    const trace = makeTrace({ refs: {} });
    const c = toCanonical(trace);
    const restored = fromCanonical(c);
    expect(restored.refs.teachId).toBeUndefined();
  });

  it('omits entityIds when canonical entityIds is empty', () => {
    const trace = makeTrace({ refs: { teachId: 'teach-x' } });
    const c = toCanonical(trace);
    const restored = fromCanonical(c);
    expect(restored.refs.entityIds).toBeUndefined();
  });
});

// ─── Round-trip (CF-M3-01) ────────────────────────────────────────────────────

describe('round-trip (CF-M3-01)', () => {
  it('toCanonical → fromCanonical is lossless for fully populated trace', () => {
    const original = makeTrace();
    const restored = fromCanonical(toCanonical(original));
    expect(restored.id).toBe(original.id);
    expect(restored.ts).toBe(original.ts);
    expect(restored.actor).toBe(original.actor);
    expect(restored.intent).toBe(original.intent);
    expect(restored.reasoning).toBe(original.reasoning);
    expect(restored.constraints).toEqual(original.constraints);
    expect(restored.alternatives).toEqual(original.alternatives);
    expect(restored.outcome).toBe(original.outcome);
    expect(restored.refs.teachId).toBe(original.refs.teachId);
    expect(restored.refs.entityIds).toEqual(original.refs.entityIds);
  });

  it('round-trip is stable for traces without optional fields', () => {
    const original: DecisionTrace = {
      id: randomUUID(),
      ts: 5000,
      actor: 'agent:test',
      intent: 'Run analysis',
      reasoning: 'Default path selected',
      constraints: [],
      alternatives: [],
      refs: {},
    };
    const restored = fromCanonical(toCanonical(original));
    expect(restored.outcome).toBeUndefined();
    expect(restored.refs.teachId).toBeUndefined();
    expect(restored.refs.entityIds).toBeUndefined();
  });

  it('toCanonical(fromCanonical(c)) deep-equals c', () => {
    const trace = makeTrace();
    const canonical = toCanonical(trace);
    const restored = fromCanonical(canonical);
    const reCanonical = toCanonical(restored);
    expect(reCanonical).toEqual(canonical);
  });
});
