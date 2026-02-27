/**
 * Phase 456 verification tests for DACP retrospective analyzer.
 * Tests RA-01 through RA-06: drift score calculation, pattern detection,
 * promotion/demotion recommendations, and cooldown enforcement.
 *
 * @module test/dacp/retrospective
 */

import { describe, it, expect } from 'vitest';

import { calculateDriftScore } from '../../src/dacp/retrospective/drift.js';
import {
  analyzePatterns,
  PROMOTION_THRESHOLD,
  DEMOTION_THRESHOLD,
  type HandoffOutcomeWithType,
} from '../../src/dacp/retrospective/analyzer.js';
import type { HandoffOutcome, HandoffPattern, FidelityLevel } from '../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeOutcome(overrides: Partial<HandoffOutcome & { handoff_type?: string }> = {}): HandoffOutcomeWithType {
  return {
    bundle_id: `bundle-${Math.random().toString(36).slice(2)}`,
    fidelity_level: 2,
    intent_alignment: 0.9,
    rework_required: false,
    tokens_spent_interpreting: 500,
    code_modifications: 1,
    verification_pass: true,
    timestamp: new Date().toISOString(),
    handoff_type: 'planner->executor:task',
    ...overrides,
  };
}

function makePattern(overrides: Partial<HandoffPattern> = {}): HandoffPattern {
  return {
    id: 'pattern-test',
    type: 'planner->executor:task',
    source_agent_type: 'planner',
    target_agent_type: 'executor',
    opcode: 'EXEC',
    observed_count: 0,
    avg_drift_score: 0,
    max_drift_score: 0,
    current_fidelity: 2,
    recommended_fidelity: 2,
    last_observed: new Date().toISOString(),
    promotion_history: [],
    contributing_bundles: [],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Retrospective Analyzer (RA-01 to RA-06)', () => {
  // RA-01: Perfect handoff drift score
  it('RA-01: perfect handoff produces drift score near 0.0', () => {
    const outcome = makeOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
    });

    const drift = calculateDriftScore(outcome);
    expect(drift.score).toBe(0);
    expect(drift.components.intent_miss).toBe(0);
    expect(drift.components.rework_penalty).toBe(0);
    expect(drift.components.verification_penalty).toBe(0);
    expect(drift.components.modification_penalty).toBe(0);
  });

  // RA-02: Failed handoff drift score near 1.0
  it('RA-02: failed handoff produces high drift score', () => {
    const outcome = makeOutcome({
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: false,
      code_modifications: 15,
    });

    const drift = calculateDriftScore(outcome);
    expect(drift.score).toBeGreaterThan(0.8);
    expect(drift.components.intent_miss).toBeGreaterThan(0);
    expect(drift.components.rework_penalty).toBeGreaterThan(0);
    expect(drift.components.verification_penalty).toBeGreaterThan(0);
  });

  // RA-03: Promotion triggered by consecutive high-drift outcomes
  it('RA-03: 3+ consecutive high-drift outcomes trigger promotion', () => {
    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 4; i++) {
      outcomes.push(makeOutcome({
        intent_alignment: 0.3, // Will produce drift > 0.3
        rework_required: true,
        verification_pass: false,
        code_modifications: 5,
        handoff_type: 'planner->executor:task',
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      }));
    }

    const result = analyzePatterns(outcomes, []);
    expect(result.promotions_recommended.length).toBeGreaterThanOrEqual(1);
  });

  // RA-04: Demotion triggered by consecutive low-drift outcomes
  it('RA-04: 10+ consecutive low-drift outcomes trigger demotion', () => {
    const existingPattern = makePattern({
      current_fidelity: 2,
      observed_count: 20,
    });

    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 12; i++) {
      outcomes.push(makeOutcome({
        intent_alignment: 1.0,
        rework_required: false,
        verification_pass: true,
        code_modifications: 0,
        handoff_type: 'planner->executor:task',
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      }));
    }

    const result = analyzePatterns(outcomes, [existingPattern]);
    expect(result.demotions_recommended.length).toBeGreaterThanOrEqual(1);
  });

  // RA-05: New pattern creation
  it('RA-05: new handoff type creates a new pattern', () => {
    const outcomes: HandoffOutcomeWithType[] = [
      makeOutcome({ handoff_type: 'new-type->agent:novel' }),
    ];

    const result = analyzePatterns(outcomes, []);
    expect(result.patterns_created).toBe(1);
  });

  // RA-06: Analysis with zero outcomes returns empty report
  it('RA-06: zero outcomes returns empty analysis report', () => {
    const result = analyzePatterns([], []);
    expect(result.patterns_created).toBe(0);
    expect(result.patterns_updated).toBe(0);
    expect(result.promotions_recommended).toHaveLength(0);
    expect(result.demotions_recommended).toHaveLength(0);
    expect(result.summary.total_handoffs_analyzed).toBe(0);
  });
});

describe('Cooldown Enforcement', () => {
  it('promotion within 7-day cooldown is blocked', () => {
    const recentPromotion = {
      from: 1 as FidelityLevel,
      to: 2 as FidelityLevel,
      reason: 'High drift',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    };

    const existingPattern = makePattern({
      current_fidelity: 2,
      promotion_history: [recentPromotion],
    });

    // Create outcomes that would normally trigger promotion
    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 5; i++) {
      outcomes.push(makeOutcome({
        intent_alignment: 0.2,
        rework_required: true,
        verification_pass: false,
        code_modifications: 8,
        handoff_type: 'planner->executor:task',
      }));
    }

    const result = analyzePatterns(outcomes, [existingPattern]);
    // Should NOT recommend promotion due to cooldown
    expect(result.promotions_recommended).toHaveLength(0);
  });

  it('demotion within 14-day cooldown is blocked', () => {
    const recentDemotion = {
      from: 3 as FidelityLevel,
      to: 2 as FidelityLevel,
      reason: 'Low drift',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    };

    const existingPattern = makePattern({
      current_fidelity: 2,
      promotion_history: [recentDemotion],
    });

    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 12; i++) {
      outcomes.push(makeOutcome({
        intent_alignment: 1.0,
        rework_required: false,
        verification_pass: true,
        code_modifications: 0,
        handoff_type: 'planner->executor:task',
      }));
    }

    const result = analyzePatterns(outcomes, [existingPattern]);
    // Should NOT recommend demotion due to 14-day cooldown
    expect(result.demotions_recommended).toHaveLength(0);
  });
});
