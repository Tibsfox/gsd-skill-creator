/**
 * Tests for DACP retrospective pattern analyzer.
 *
 * Verifies pattern detection, promotion/demotion logic, and cooldown
 * enforcement for the retrospective analyzer.
 */

import { describe, it, expect } from 'vitest';
import {
  analyzePatterns,
  PROMOTION_THRESHOLD,
  DEMOTION_THRESHOLD,
} from '../../../../src/integrations/dacp/retrospective/analyzer.js';
import type { HandoffOutcomeWithType } from '../../../../src/integrations/dacp/retrospective/analyzer.js';
import type {
  HandoffPattern,
  FidelityLevel,
  FidelityChange,
  BusOpcode,
} from '../../../../src/integrations/dacp/types.js';

// ============================================================================
// Factory Functions
// ============================================================================

/** Create a HandoffOutcomeWithType with sensible defaults */
function makeOutcome(
  overrides: Partial<HandoffOutcomeWithType> = {},
): HandoffOutcomeWithType {
  return {
    bundle_id: overrides.bundle_id ?? `bundle-${Math.random().toString(36).slice(2, 8)}`,
    fidelity_level: overrides.fidelity_level ?? (1 as FidelityLevel),
    intent_alignment: overrides.intent_alignment ?? 0.8,
    rework_required: overrides.rework_required ?? false,
    tokens_spent_interpreting: overrides.tokens_spent_interpreting ?? 100,
    code_modifications: overrides.code_modifications ?? 1,
    verification_pass: overrides.verification_pass ?? true,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    handoff_type: overrides.handoff_type ?? 'planner->executor:task-assignment',
  };
}

/** Create a high-drift outcome (score > 0.3) */
function makeHighDriftOutcome(
  overrides: Partial<HandoffOutcomeWithType> = {},
): HandoffOutcomeWithType {
  return makeOutcome({
    intent_alignment: 0.0,
    rework_required: true,
    verification_pass: false,
    code_modifications: 5,
    ...overrides,
  });
}

/** Create a low-drift outcome (score < 0.05) */
function makeLowDriftOutcome(
  overrides: Partial<HandoffOutcomeWithType> = {},
): HandoffOutcomeWithType {
  return makeOutcome({
    intent_alignment: 1.0,
    rework_required: false,
    verification_pass: true,
    code_modifications: 0,
    ...overrides,
  });
}

/** Create a HandoffPattern with sensible defaults */
function makePattern(
  overrides: Partial<HandoffPattern> = {},
): HandoffPattern {
  return {
    id: overrides.id ?? `pattern-${Math.random().toString(36).slice(2, 8)}`,
    type: overrides.type ?? 'planner->executor:task-assignment',
    source_agent_type: overrides.source_agent_type ?? 'planner',
    target_agent_type: overrides.target_agent_type ?? 'executor',
    opcode: overrides.opcode ?? ('EXEC' as BusOpcode),
    observed_count: overrides.observed_count ?? 0,
    avg_drift_score: overrides.avg_drift_score ?? 0,
    max_drift_score: overrides.max_drift_score ?? 0,
    current_fidelity: overrides.current_fidelity ?? (1 as FidelityLevel),
    recommended_fidelity: overrides.recommended_fidelity ?? (1 as FidelityLevel),
    last_observed: overrides.last_observed ?? new Date().toISOString(),
    promotion_history: overrides.promotion_history ?? [],
    contributing_bundles: overrides.contributing_bundles ?? [],
  };
}

/** Create a FidelityChange record */
function makeChange(
  from: FidelityLevel,
  to: FidelityLevel,
  daysAgo: number,
  now: Date = new Date(),
): FidelityChange {
  const ts = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    from,
    to,
    reason: to > from ? 'High drift detected' : 'Low drift detected',
    timestamp: ts.toISOString(),
  };
}

// Fixed reference time for deterministic tests
const NOW = new Date('2026-02-27T12:00:00.000Z');

// ============================================================================
// Pattern Detection (RETRO-02)
// ============================================================================

describe('Pattern Detection', () => {
  it('groups outcomes by handoff_type and returns correct total_handoffs_analyzed', () => {
    const outcomes = [
      makeOutcome({ handoff_type: 'type-a' }),
      makeOutcome({ handoff_type: 'type-b' }),
      makeOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    expect(result.summary.total_handoffs_analyzed).toBe(3);
  });

  it('creates new HandoffPattern for previously unseen handoff type', () => {
    const outcomes = [makeOutcome({ handoff_type: 'brand-new-type' })];
    const result = analyzePatterns(outcomes, [], NOW);
    expect(result.patterns_created).toBe(1);
  });

  it('updates existing HandoffPattern statistics when new outcomes arrive', () => {
    const existing = makePattern({
      type: 'planner->executor:task-assignment',
      observed_count: 5,
      avg_drift_score: 0.2,
    });
    const outcomes = [
      makeOutcome({ handoff_type: 'planner->executor:task-assignment' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.patterns_updated).toBe(1);
    expect(result.patterns_created).toBe(0);
  });

  it('calculates correct avg_drift_score per pattern', () => {
    // Two outcomes of the same type with known drift scores
    const outcomes = [
      makeOutcome({
        handoff_type: 'type-a',
        intent_alignment: 1.0,
        rework_required: false,
        verification_pass: true,
        code_modifications: 0,
      }), // score ~0.0
      makeOutcome({
        handoff_type: 'type-a',
        intent_alignment: 0.5,
        rework_required: false,
        verification_pass: true,
        code_modifications: 0,
      }), // score ~0.2
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    // Average should be around 0.1
    expect(result.summary.avg_drift_score).toBeCloseTo(0.1, 1);
  });

  it('identifies highest_drift_pattern and lowest_drift_pattern in summary', () => {
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'high-drift-type' }),
      makeLowDriftOutcome({ handoff_type: 'low-drift-type' }),
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    expect(result.summary.highest_drift_pattern).toBe('high-drift-type');
    expect(result.summary.lowest_drift_pattern).toBe('low-drift-type');
  });

  it('returns empty results for empty outcomes array', () => {
    const result = analyzePatterns([], [], NOW);
    expect(result.patterns_created).toBe(0);
    expect(result.patterns_updated).toBe(0);
    expect(result.promotions_recommended).toEqual([]);
    expect(result.demotions_recommended).toEqual([]);
    expect(result.summary.total_handoffs_analyzed).toBe(0);
  });
});

// ============================================================================
// Promotion Logic (RETRO-03)
// ============================================================================

describe('Promotion Logic', () => {
  it('recommends promotion when 3+ consecutive outcomes exceed drift threshold 0.3', () => {
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    expect(result.promotions_recommended.length).toBe(1);
    expect(result.promotions_recommended[0].type).toBe('type-a');
  });

  it('does NOT recommend promotion when only 2 consecutive outcomes exceed threshold', () => {
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    expect(result.promotions_recommended.length).toBe(0);
  });

  it('does NOT recommend promotion when 3 outcomes exceed threshold but are non-consecutive', () => {
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a', timestamp: '2026-02-27T10:00:00Z' }),
      makeLowDriftOutcome({ handoff_type: 'type-a', timestamp: '2026-02-27T10:01:00Z' }),
      makeHighDriftOutcome({ handoff_type: 'type-a', timestamp: '2026-02-27T10:02:00Z' }),
      makeHighDriftOutcome({ handoff_type: 'type-a', timestamp: '2026-02-27T10:03:00Z' }),
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    // Only the last 2 are consecutive, not 3
    expect(result.promotions_recommended.length).toBe(0);
  });

  it('promotion recommends level + 1', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 1 as FidelityLevel,
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.promotions_recommended.length).toBe(1);
    expect(result.promotions_recommended[0].recommended_fidelity).toBe(2);
  });

  it('promotion capped at FidelityLevel 4', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 4 as FidelityLevel,
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    // Even though drift is high, can't go above 4
    // Should still appear in promotions_recommended but with recommended_fidelity = 4
    // OR not appear if already at max -- spec says bounded to max 1 level, at 4 no promotion possible
    // Since current = 4 and max is 4, no actual change recommended
    expect(result.promotions_recommended.length).toBe(0);
  });
});

// ============================================================================
// Demotion Logic (RETRO-04)
// ============================================================================

describe('Demotion Logic', () => {
  it('recommends demotion when 10+ consecutive outcomes are below drift threshold 0.05', () => {
    const outcomes = Array.from({ length: 10 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 2 as FidelityLevel }),
    );
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 2 as FidelityLevel,
    });
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.demotions_recommended.length).toBe(1);
    expect(result.demotions_recommended[0].type).toBe('type-a');
  });

  it('does NOT recommend demotion when only 9 consecutive outcomes are below threshold', () => {
    const outcomes = Array.from({ length: 9 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 2 as FidelityLevel }),
    );
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 2 as FidelityLevel,
    });
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.demotions_recommended.length).toBe(0);
  });

  it('demotion recommends level - 1', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 2 as FidelityLevel,
    });
    const outcomes = Array.from({ length: 10 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 2 as FidelityLevel }),
    );
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.demotions_recommended.length).toBe(1);
    expect(result.demotions_recommended[0].recommended_fidelity).toBe(1);
  });

  it('demotion floored at FidelityLevel 0', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 0 as FidelityLevel,
    });
    const outcomes = Array.from({ length: 10 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 0 as FidelityLevel }),
    );
    const result = analyzePatterns(outcomes, [existing], NOW);
    // Can't go below 0, so no demotion recommended
    expect(result.demotions_recommended.length).toBe(0);
  });

  it('does NOT recommend demotion when current level is already 0', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 0 as FidelityLevel,
    });
    const outcomes = Array.from({ length: 10 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 0 as FidelityLevel }),
    );
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.demotions_recommended.length).toBe(0);
  });
});

// ============================================================================
// Cooldown Enforcement (RETRO-05 + SAFE-05)
// ============================================================================

describe('Cooldown Enforcement', () => {
  it('respects 7-day promotion cooldown: no promotion if last promotion was < 7 days ago', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 1 as FidelityLevel,
      promotion_history: [makeChange(0 as FidelityLevel, 1 as FidelityLevel, 3, NOW)],
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.promotions_recommended.length).toBe(0);
  });

  it('allows promotion if last promotion was exactly 7 days ago', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 1 as FidelityLevel,
      promotion_history: [makeChange(0 as FidelityLevel, 1 as FidelityLevel, 7, NOW)],
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.promotions_recommended.length).toBe(1);
  });

  it('allows promotion if last promotion was more than 7 days ago', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 1 as FidelityLevel,
      promotion_history: [makeChange(0 as FidelityLevel, 1 as FidelityLevel, 30, NOW)],
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.promotions_recommended.length).toBe(1);
  });

  it('respects 14-day demotion cooldown: no demotion if last demotion was < 14 days ago', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 2 as FidelityLevel,
      promotion_history: [makeChange(3 as FidelityLevel, 2 as FidelityLevel, 5, NOW)],
    });
    const outcomes = Array.from({ length: 10 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 2 as FidelityLevel }),
    );
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.demotions_recommended.length).toBe(0);
  });

  it('allows demotion if last demotion was exactly 14 days ago', () => {
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 2 as FidelityLevel,
      promotion_history: [makeChange(3 as FidelityLevel, 2 as FidelityLevel, 14, NOW)],
    });
    const outcomes = Array.from({ length: 10 }, () =>
      makeLowDriftOutcome({ handoff_type: 'type-a', fidelity_level: 2 as FidelityLevel }),
    );
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.demotions_recommended.length).toBe(1);
  });

  it('fidelity change bounded to max 1 level per recommendation', () => {
    // Even with extremely high drift, should only recommend +1
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 0 as FidelityLevel,
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    expect(result.promotions_recommended.length).toBe(1);
    expect(result.promotions_recommended[0].recommended_fidelity).toBe(1);
    // Should never jump to 2 or higher
    expect(result.promotions_recommended[0].recommended_fidelity - existing.current_fidelity).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('single outcome creates pattern with that outcomes drift score as the average', () => {
    const outcomes = [
      makeOutcome({
        handoff_type: 'solo-type',
        intent_alignment: 0.5,
        rework_required: false,
        verification_pass: true,
        code_modifications: 0,
      }),
    ];
    const result = analyzePatterns(outcomes, [], NOW);
    expect(result.patterns_created).toBe(1);
    // drift score for this outcome: (1-0.5)*0.4 = 0.2
    expect(result.summary.avg_drift_score).toBeCloseTo(0.2, 1);
  });

  it('pattern with mixed promote/demote history respects most recent change for cooldown', () => {
    // Old promotion (30 days ago), then recent demotion (3 days ago)
    // New outcomes are high-drift => should allow promotion (last promotion was 30 days ago, beyond 7-day cooldown)
    const existing = makePattern({
      type: 'type-a',
      current_fidelity: 1 as FidelityLevel,
      promotion_history: [
        makeChange(0 as FidelityLevel, 1 as FidelityLevel, 30, NOW),  // promotion 30 days ago
        makeChange(2 as FidelityLevel, 1 as FidelityLevel, 3, NOW),   // demotion 3 days ago
      ],
    });
    const outcomes = [
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
      makeHighDriftOutcome({ handoff_type: 'type-a' }),
    ];
    const result = analyzePatterns(outcomes, [existing], NOW);
    // Last PROMOTION was 30 days ago (7-day cooldown ok)
    // Last DEMOTION was 3 days ago but we're checking promotion cooldown, not demotion cooldown
    expect(result.promotions_recommended.length).toBe(1);
  });
});

// ============================================================================
// Threshold Constants
// ============================================================================

describe('Threshold Constants', () => {
  it('exports PROMOTION_THRESHOLD with correct values', () => {
    expect(PROMOTION_THRESHOLD.drift_score).toBe(0.3);
    expect(PROMOTION_THRESHOLD.consecutive_required).toBe(3);
    expect(PROMOTION_THRESHOLD.cooldown_days).toBe(7);
  });

  it('exports DEMOTION_THRESHOLD with correct values', () => {
    expect(DEMOTION_THRESHOLD.drift_score).toBe(0.05);
    expect(DEMOTION_THRESHOLD.consecutive_required).toBe(10);
    expect(DEMOTION_THRESHOLD.cooldown_days).toBe(14);
  });
});
