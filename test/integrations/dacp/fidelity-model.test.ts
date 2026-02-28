/**
 * Phase 456 verification tests for DACP fidelity decision model.
 * 20 scenario accuracy validation (TEST-03): >=85% accuracy required.
 * Also tests assessDataComplexity and clampFidelityChange.
 *
 * @module test/dacp/fidelity-model
 */

import { describe, it, expect } from 'vitest';

import {
  determineFidelity,
  assessDataComplexity,
  clampFidelityChange,
} from '../../../src/dacp/fidelity/decision.js';
import type { FidelityDecision, FidelityLevel } from '../../../src/dacp/types.js';

// ============================================================================
// Scenario Definitions
// ============================================================================

interface FidelityScenario {
  id: number;
  description: string;
  input: FidelityDecision;
  expected: FidelityLevel;
}

const SCENARIOS: FidelityScenario[] = [
  {
    id: 1,
    description: 'Simple status report, no drift, no skills -> Level 0',
    input: {
      handoff_type: 'status-report',
      data_complexity: 'none',
      historical_drift_rate: 0.0,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 0,
  },
  {
    id: 2,
    description: 'Simple report, low drift, some skills -> Level 0',
    input: {
      handoff_type: 'status-report',
      data_complexity: 'none',
      historical_drift_rate: 0.05,
      available_skills: 2,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 0,
  },
  {
    id: 3,
    description: 'Task assignment, no data -> Level 0',
    input: {
      handoff_type: 'task-assignment',
      data_complexity: 'none',
      historical_drift_rate: 0.1,
      available_skills: 1,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 0,
  },
  {
    id: 4,
    description: 'Config update, simple data, low drift -> Level 1',
    input: {
      handoff_type: 'config-update',
      data_complexity: 'simple',
      historical_drift_rate: 0.05,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 1,
  },
  {
    id: 5,
    description: 'Task with structured data, low drift -> Level 1 or 2',
    input: {
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.05,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2, // Rule 12: structured data, no skills -> Level 2
  },
  {
    id: 6,
    description: 'Verification request, schema needed -> Level 1 or 2',
    input: {
      handoff_type: 'verification-request',
      data_complexity: 'structured',
      historical_drift_rate: 0.1,
      available_skills: 1,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2, // Rule 10: structured + skills -> Level 2
  },
  {
    id: 7,
    description: 'Transform with structured data, moderate drift -> Level 2',
    input: {
      handoff_type: 'transform',
      data_complexity: 'structured',
      historical_drift_rate: 0.2,
      available_skills: 1,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2,
  },
  {
    id: 8,
    description: 'Task with structured data, moderate drift -> Level 2',
    input: {
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.2,
      available_skills: 2,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2,
  },
  {
    id: 9,
    description: 'Research handoff, complex data, low drift -> Level 2',
    input: {
      handoff_type: 'research',
      data_complexity: 'complex',
      historical_drift_rate: 0.05,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2,
  },
  {
    id: 10,
    description: 'Complex transform, available scripts -> Level 3',
    input: {
      handoff_type: 'transform',
      data_complexity: 'complex',
      historical_drift_rate: 0.2,
      available_skills: 3,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 3,
  },
  {
    id: 11,
    description: 'Task with high drift (>0.3), any complexity -> Level 2+',
    input: {
      handoff_type: 'task-assignment',
      data_complexity: 'simple',
      historical_drift_rate: 0.35,
      available_skills: 1,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2,
  },
  {
    id: 12,
    description: 'Safety-critical handoff, any data -> Level 3',
    input: {
      handoff_type: 'agent-spawn',
      data_complexity: 'simple',
      historical_drift_rate: 0.0,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: true,
    },
    expected: 3,
  },
  {
    id: 13,
    description: 'Safety-critical + high drift -> Level 3',
    input: {
      handoff_type: 'error-escalation',
      data_complexity: 'complex',
      historical_drift_rate: 0.5,
      available_skills: 5,
      token_budget_remaining: 50000,
      safety_critical: true,
    },
    expected: 3, // safety_critical always -> 3
  },
  {
    id: 14,
    description: 'Complex data + high drift + available scripts -> Level 3',
    input: {
      handoff_type: 'transform',
      data_complexity: 'complex',
      historical_drift_rate: 0.4,
      available_skills: 4,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 3,
  },
  {
    id: 15,
    description: 'Simple data, very high drift (>0.5) -> Level 2',
    input: {
      handoff_type: 'task-assignment',
      data_complexity: 'simple',
      historical_drift_rate: 0.55,
      available_skills: 1,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2,
  },
  {
    id: 16,
    description: 'No skills, complex data -> Level 2',
    input: {
      handoff_type: 'research',
      data_complexity: 'complex',
      historical_drift_rate: 0.1,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2, // Rule 8: complex data -> Level 2
  },
  {
    id: 17,
    description: 'Token budget <20K, complex data -> Level 1',
    input: {
      handoff_type: 'transform',
      data_complexity: 'complex',
      historical_drift_rate: 0.2,
      available_skills: 3,
      token_budget_remaining: 15000,
      safety_critical: false,
    },
    expected: 1,
  },
  {
    id: 18,
    description: 'Token budget <10K, any data -> Level 1',
    input: {
      handoff_type: 'task-assignment',
      data_complexity: 'structured',
      historical_drift_rate: 0.1,
      available_skills: 2,
      token_budget_remaining: 8000,
      safety_critical: false,
    },
    expected: 1,
  },
  {
    id: 19,
    description: 'Moderate drift + safety-critical -> Level 3',
    input: {
      handoff_type: 'verification',
      data_complexity: 'structured',
      historical_drift_rate: 0.2,
      available_skills: 2,
      token_budget_remaining: 50000,
      safety_critical: true,
    },
    expected: 3,
  },
  {
    id: 20,
    description: 'Zero drift, complex data, many skills -> Level 2',
    input: {
      handoff_type: 'research',
      data_complexity: 'complex',
      historical_drift_rate: 0.0,
      available_skills: 10,
      token_budget_remaining: 50000,
      safety_critical: false,
    },
    expected: 2,
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('Fidelity Decision Model — 20 Scenario Accuracy (TEST-03)', () => {
  // Run each scenario individually for clear test output
  for (const scenario of SCENARIOS) {
    it(`Scenario ${scenario.id}: ${scenario.description}`, () => {
      const actual = determineFidelity(scenario.input);
      // Log for debugging
      if (actual !== scenario.expected) {
        console.log(
          `  [MISMATCH] Scenario ${scenario.id}: expected Level ${scenario.expected}, got Level ${actual}`,
        );
      }
      expect(actual).toBe(scenario.expected);
    });
  }

  // Aggregate accuracy check
  it('overall accuracy is >=85% (17/20 minimum)', () => {
    let matches = 0;
    for (const scenario of SCENARIOS) {
      const actual = determineFidelity(scenario.input);
      if (actual === scenario.expected) matches++;
    }
    const accuracy = matches / SCENARIOS.length;
    console.log(`  Fidelity model accuracy: ${matches}/${SCENARIOS.length} (${(accuracy * 100).toFixed(1)}%)`);
    expect(matches).toBeGreaterThanOrEqual(17);
  });
});

describe('Data Complexity Classification', () => {
  it('null -> none', () => {
    expect(assessDataComplexity(null)).toBe('none');
  });

  it('undefined -> none', () => {
    expect(assessDataComplexity(undefined)).toBe('none');
  });

  it('primitive string -> simple', () => {
    expect(assessDataComplexity('hello')).toBe('simple');
  });

  it('flat object with few fields -> simple', () => {
    expect(assessDataComplexity({ a: 1, b: 2 })).toBe('simple');
  });

  it('moderate nesting -> structured', () => {
    expect(assessDataComplexity({
      a: { b: 1 },
      c: { d: 2 },
      e: 3,
      f: 4,
      g: 5,
      h: 6,
    })).toBe('structured');
  });

  it('deep nesting with many fields -> complex', () => {
    const deep = {
      level1: {
        level2: {
          level3: {
            level4: { value: 1 },
          },
        },
        extra: Array.from({ length: 25 }, (_, i) => ({ id: i })),
      },
    };
    expect(assessDataComplexity(deep)).toBe('complex');
  });
});

describe('Fidelity Change Clamping (SAFE-02)', () => {
  it('same level returns same level', () => {
    expect(clampFidelityChange(2, 2)).toBe(2);
  });

  it('adjacent level passes through', () => {
    expect(clampFidelityChange(1, 2)).toBe(2);
    expect(clampFidelityChange(2, 1)).toBe(1);
  });

  it('jump of 2+ clamped to 1 step up', () => {
    expect(clampFidelityChange(0, 3)).toBe(1);
    expect(clampFidelityChange(1, 3)).toBe(2);
  });

  it('jump of 2+ clamped to 1 step down', () => {
    expect(clampFidelityChange(3, 0)).toBe(2);
    expect(clampFidelityChange(4, 1)).toBe(3);
  });
});
