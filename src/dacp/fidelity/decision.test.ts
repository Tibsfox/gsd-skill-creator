/**
 * Tests for the DACP fidelity decision model.
 *
 * Validates determineFidelity, assessDataComplexity, and clampFidelityChange
 * across 20+ scenarios covering all fidelity levels and edge cases.
 *
 * @module dacp/fidelity/decision.test
 */

import { describe, it, expect } from 'vitest';
import type { FidelityDecision } from '../types.js';
import {
  determineFidelity,
  assessDataComplexity,
  clampFidelityChange,
} from './decision.js';

// ============================================================================
// Helpers
// ============================================================================

function makeDecision(overrides: Partial<FidelityDecision> = {}): FidelityDecision {
  return {
    handoff_type: 'task-assignment',
    data_complexity: 'none',
    historical_drift_rate: 0,
    available_skills: 0,
    token_budget_remaining: 100_000,
    safety_critical: false,
    ...overrides,
  };
}

// ============================================================================
// assessDataComplexity
// ============================================================================

describe('assessDataComplexity', () => {
  it('returns "none" for null', () => {
    expect(assessDataComplexity(null)).toBe('none');
  });

  it('returns "none" for undefined', () => {
    expect(assessDataComplexity(undefined)).toBe('none');
  });

  it('returns "simple" for non-object primitives', () => {
    expect(assessDataComplexity(42)).toBe('simple');
    expect(assessDataComplexity('hello')).toBe('simple');
    expect(assessDataComplexity(true)).toBe('simple');
  });

  it('returns "simple" for shallow objects with few fields', () => {
    expect(assessDataComplexity({ a: 1, b: 2 })).toBe('simple');
  });

  it('returns "simple" for depth=1, fields<=5', () => {
    expect(assessDataComplexity({ a: 1, b: 2, c: 3, d: 4, e: 5 })).toBe('simple');
  });

  it('returns "structured" for depth<=3, fields<=20', () => {
    expect(assessDataComplexity({
      a: 1, b: 2, c: 3, d: 4, e: 5, f: 6,
      nested: { x: 1, y: 2 },
    })).toBe('structured');
  });

  it('returns "complex" for deeply nested objects', () => {
    expect(assessDataComplexity({
      level1: {
        level2: {
          level3: {
            level4: { deep: true },
          },
        },
      },
    })).toBe('complex');
  });

  it('returns "complex" for objects with many fields', () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 25; i++) {
      obj[`field_${i}`] = i;
    }
    expect(assessDataComplexity(obj)).toBe('complex');
  });

  it('returns "simple" for arrays of primitives', () => {
    expect(assessDataComplexity([1, 2, 3])).toBe('simple');
  });

  it('returns "structured" for arrays of objects', () => {
    expect(assessDataComplexity([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
      { a: 5, b: 6 },
      { a: 7, b: 8 },
      { a: 9, b: 10 },
      { a: 11, b: 12 },
    ])).toBe('structured');
  });
});

// ============================================================================
// clampFidelityChange
// ============================================================================

describe('clampFidelityChange', () => {
  it('returns proposed when within 1 step (up)', () => {
    expect(clampFidelityChange(1, 2)).toBe(2);
  });

  it('returns proposed when within 1 step (down)', () => {
    expect(clampFidelityChange(2, 1)).toBe(1);
  });

  it('returns proposed when same as current', () => {
    expect(clampFidelityChange(2, 2)).toBe(2);
  });

  it('clamps upward jump: 0 -> 3 becomes 1', () => {
    expect(clampFidelityChange(0, 3)).toBe(1);
  });

  it('clamps downward jump: 3 -> 0 becomes 2', () => {
    expect(clampFidelityChange(3, 0)).toBe(2);
  });

  it('clamps 0 -> 2 to 1', () => {
    expect(clampFidelityChange(0, 2)).toBe(1);
  });

  it('clamps 3 -> 1 to 2', () => {
    expect(clampFidelityChange(3, 1)).toBe(2);
  });

  it('clamps 1 -> 4 to 2', () => {
    expect(clampFidelityChange(1, 4)).toBe(2);
  });

  it('clamps 4 -> 1 to 3', () => {
    expect(clampFidelityChange(4, 1)).toBe(3);
  });
});

// ============================================================================
// determineFidelity — 20 test scenarios for FIDEL-06 (85% accuracy)
// ============================================================================

describe('determineFidelity', () => {
  // Scenario 1: Status report, no data, no drift -> Level 0
  it('scenario 1: status report, no data, no drift -> Level 0', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'status-report',
      data_complexity: 'none',
      historical_drift_rate: 0,
      available_skills: 0,
    }))).toBe(0);
  });

  // Scenario 2: Simple config update, low drift -> Level 1
  it('scenario 2: simple config update, low drift -> Level 1', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'configuration-update',
      data_complexity: 'simple',
      historical_drift_rate: 0.05,
      available_skills: 0,
    }))).toBe(1);
  });

  // Scenario 3: Complex task assignment, high drift, 4 skills -> Level 3
  it('scenario 3: complex task assignment, high drift, 4 skills -> Level 3', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'complex',
      historical_drift_rate: 0.5,
      available_skills: 4,
    }))).toBe(3);
  });

  // Scenario 4: Safety-critical patch delivery -> Level 3
  it('scenario 4: safety-critical patch delivery -> Level 3', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'patch-delivery',
      data_complexity: 'simple',
      historical_drift_rate: 0,
      available_skills: 0,
      safety_critical: true,
    }))).toBe(3);
  });

  // Scenario 5: Research handoff, simple data, no drift -> Level 1
  it('scenario 5: research handoff, simple data, no drift -> Level 1', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'research-handoff',
      data_complexity: 'simple',
      historical_drift_rate: 0,
      available_skills: 0,
    }))).toBe(1);
  });

  // Scenario 6: Data transformation, complex data, 2 skills, drift=0.4 -> Level 3
  it('scenario 6: data transformation, complex data, 2 skills, drift=0.4 -> Level 3', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'data-transformation',
      data_complexity: 'complex',
      historical_drift_rate: 0.4,
      available_skills: 2,
    }))).toBe(3);
  });

  // Scenario 7: Question escalation, no data -> Level 0
  it('scenario 7: question escalation, no data -> Level 0', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'question-escalation',
      data_complexity: 'none',
      historical_drift_rate: 0.1,
      available_skills: 1,
    }))).toBe(0);
  });

  // Scenario 8: Task assignment, structured data, 1 skill, drift=0.1 -> Level 2
  it('scenario 8: task assignment, structured data, 1 skill, drift=0.1 -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.1,
      available_skills: 1,
    }))).toBe(2);
  });

  // Scenario 9: Verification request, complex data, drift=0.2, 3 skills -> Level 3
  it('scenario 9: verification request, complex data, drift=0.2, 3 skills -> Level 3', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'verification-request',
      data_complexity: 'complex',
      historical_drift_rate: 0.2,
      available_skills: 3,
    }))).toBe(3);
  });

  // Scenario 10: Config update, structured data, 0 skills, drift=0.05 -> Level 2
  it('scenario 10: config update, structured data, 0 skills, drift=0.05 -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'configuration-update',
      data_complexity: 'structured',
      historical_drift_rate: 0.05,
      available_skills: 0,
    }))).toBe(2);
  });

  // Scenario 11: Token budget < 20K, complex data -> Level 1 (capped)
  it('scenario 11: token budget < 20K, complex data -> Level 1 (capped)', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'data-transformation',
      data_complexity: 'complex',
      historical_drift_rate: 0.1,
      available_skills: 2,
      token_budget_remaining: 15_000,
    }))).toBe(1);
  });

  // Scenario 12: High drift (0.5), no matching skills -> Level 1
  it('scenario 12: high drift (0.5), no matching skills -> Level 1', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.5,
      available_skills: 0,
    }))).toBe(1);
  });

  // Scenario 13: High drift (0.35), 1 skill -> Level 2
  it('scenario 13: high drift (0.35), 1 skill -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.35,
      available_skills: 1,
    }))).toBe(2);
  });

  // Scenario 14: Medium drift (0.18), complex data, 0 skills -> Level 2
  it('scenario 14: medium drift (0.18), complex data, 0 skills -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'complex',
      historical_drift_rate: 0.18,
      available_skills: 0,
    }))).toBe(2);
  });

  // Scenario 15: Simple data, moderate drift (0.25) -> Level 1
  it('scenario 15: simple data, moderate drift (0.25) -> Level 1', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'simple',
      historical_drift_rate: 0.25,
      available_skills: 0,
    }))).toBe(1);
  });

  // Scenario 16: Structured data, 3 skills, no drift -> Level 2
  it('scenario 16: structured data, 3 skills, no drift -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0,
      available_skills: 3,
    }))).toBe(2);
  });

  // Scenario 17: No data, safety_critical=true -> Level 3
  it('scenario 17: no data, safety_critical=true -> Level 3', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'status-report',
      data_complexity: 'none',
      historical_drift_rate: 0,
      available_skills: 0,
      safety_critical: true,
    }))).toBe(3);
  });

  // Scenario 18: Complex data, 5 skills, drift=0.1 -> Level 2
  it('scenario 18: complex data, 5 skills, drift=0.1 -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'data-transformation',
      data_complexity: 'complex',
      historical_drift_rate: 0.1,
      available_skills: 5,
    }))).toBe(2);
  });

  // Scenario 19: Token budget 15K, simple data -> Level 1 (capped)
  it('scenario 19: token budget 15K, simple data -> Level 1 (capped)', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'configuration-update',
      data_complexity: 'simple',
      historical_drift_rate: 0,
      available_skills: 0,
      token_budget_remaining: 15_000,
    }))).toBe(1);
  });

  // Scenario 20: Structured data, 0 skills, drift=0.0 -> Level 2
  it('scenario 20: structured data, 0 skills, drift=0.0 -> Level 2', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0,
      available_skills: 0,
    }))).toBe(2);
  });

  // Extra: Level 0 for empty string intent handoff
  it('extra: defaults to Level 2 for structured data, no other signals', () => {
    expect(determineFidelity(makeDecision({
      data_complexity: 'structured',
      historical_drift_rate: 0,
      available_skills: 0,
    }))).toBe(2);
  });

  // Extra: high drift with many skills -> Level 3
  it('extra: high drift (0.4) with 3+ skills -> Level 3', () => {
    expect(determineFidelity(makeDecision({
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.4,
      available_skills: 3,
    }))).toBe(3);
  });
});
