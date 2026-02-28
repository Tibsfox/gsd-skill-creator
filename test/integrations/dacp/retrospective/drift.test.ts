/**
 * Tests for DACP retrospective drift score calculation.
 *
 * Verifies the retrospective-tuned composite drift score calculation
 * with weights: intent 40%, rework 30%, verification 20%, modification 10%.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDriftScore,
  determineRecommendation,
} from '../../../../src/dacp/retrospective/drift.js';
import type { HandoffOutcome, FidelityLevel } from '../../../../src/dacp/types.js';

/** Factory for HandoffOutcome test data */
function makeHandoffOutcome(
  overrides: Partial<HandoffOutcome> = {},
): HandoffOutcome {
  return {
    bundle_id: overrides.bundle_id ?? `bundle-${Math.random().toString(36).slice(2, 8)}`,
    fidelity_level: overrides.fidelity_level ?? 1,
    intent_alignment: overrides.intent_alignment ?? 0.8,
    rework_required: overrides.rework_required ?? false,
    tokens_spent_interpreting: overrides.tokens_spent_interpreting ?? 100,
    code_modifications: overrides.code_modifications ?? 1,
    verification_pass: overrides.verification_pass ?? true,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
  };
}

describe('calculateDriftScore', () => {
  it('produces score 0.0 for a perfect handoff', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
    });
    const result = calculateDriftScore(outcome);
    expect(result.score).toBe(0.0);
  });

  it('produces score 1.0 for complete failure', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: false,
      code_modifications: 10,
    });
    const result = calculateDriftScore(outcome);
    expect(result.score).toBe(1.0);
  });

  it('weights intent miss at 40%', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.5,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
    });
    const result = calculateDriftScore(outcome);
    expect(result.components.intent_miss).toBeCloseTo(0.2, 5);
    expect(result.score).toBeCloseTo(0.2, 5);
  });

  it('weights rework penalty at 30%', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: true,
      verification_pass: true,
      code_modifications: 0,
    });
    const result = calculateDriftScore(outcome);
    expect(result.components.rework_penalty).toBe(0.3);
    expect(result.score).toBeCloseTo(0.3, 5);
  });

  it('weights verification penalty at 20%', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: false,
      code_modifications: 0,
    });
    const result = calculateDriftScore(outcome);
    expect(result.components.verification_penalty).toBe(0.2);
    expect(result.score).toBeCloseTo(0.2, 5);
  });

  it('weights modification penalty at 10%, capped at 0.1', () => {
    const outcome5 = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 5,
    });
    const result5 = calculateDriftScore(outcome5);
    expect(result5.components.modification_penalty).toBeCloseTo(0.05, 5);
    expect(result5.score).toBeCloseTo(0.05, 5);

    const outcome20 = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 20,
    });
    const result20 = calculateDriftScore(outcome20);
    expect(result20.components.modification_penalty).toBe(0.1);
    expect(result20.score).toBeCloseTo(0.1, 5);
  });

  it('clamps score to max 1.0', () => {
    // Even with extreme values, score should not exceed 1.0
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: false,
      code_modifications: 100,
    });
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeLessThanOrEqual(1.0);
  });

  it('returns recommendation "promote" when score > 0.3', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: true,
      code_modifications: 0,
      fidelity_level: 1,
    });
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.recommendation).toBe('promote');
  });

  it('returns recommendation "demote" when score < 0.05 and level > 0', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
      fidelity_level: 2,
    });
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeLessThan(0.05);
    expect(result.recommendation).toBe('demote');
  });

  it('returns recommendation "maintain" when score is between 0.05 and 0.3', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.85,
      rework_required: false,
      verification_pass: true,
      code_modifications: 2,
      fidelity_level: 1,
    });
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeGreaterThanOrEqual(0.05);
    expect(result.score).toBeLessThanOrEqual(0.3);
    expect(result.recommendation).toBe('maintain');
  });

  it('sets recommended_level to current + 1 when promoting (capped at 4)', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: false,
      code_modifications: 10,
      fidelity_level: 2,
    });
    const result = calculateDriftScore(outcome);
    expect(result.recommendation).toBe('promote');
    expect(result.recommended_level).toBe(3);
  });

  it('caps recommended_level at 4 when promoting from level 4', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: false,
      code_modifications: 10,
      fidelity_level: 4,
    });
    const result = calculateDriftScore(outcome);
    expect(result.recommendation).toBe('promote');
    expect(result.recommended_level).toBe(4);
  });

  it('sets recommended_level to current - 1 when demoting (floored at 0)', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
      fidelity_level: 3,
    });
    const result = calculateDriftScore(outcome);
    expect(result.recommendation).toBe('demote');
    expect(result.recommended_level).toBe(2);
  });

  it('does not set recommended_level when recommendation is maintain', () => {
    const outcome = makeHandoffOutcome({
      intent_alignment: 0.85,
      rework_required: false,
      verification_pass: true,
      code_modifications: 2,
      fidelity_level: 1,
    });
    const result = calculateDriftScore(outcome);
    expect(result.recommendation).toBe('maintain');
    expect(result.recommended_level).toBeUndefined();
  });
});

describe('determineRecommendation', () => {
  it('returns "promote" when score > 0.3', () => {
    expect(determineRecommendation(0.31, 1 as FidelityLevel)).toBe('promote');
    expect(determineRecommendation(0.8, 0 as FidelityLevel)).toBe('promote');
  });

  it('returns "demote" when score < 0.05 and currentLevel > 0', () => {
    expect(determineRecommendation(0.04, 2 as FidelityLevel)).toBe('demote');
    expect(determineRecommendation(0.0, 1 as FidelityLevel)).toBe('demote');
  });

  it('returns "maintain" when score < 0.05 but level is 0', () => {
    expect(determineRecommendation(0.01, 0 as FidelityLevel)).toBe('maintain');
  });

  it('returns "maintain" when score is exactly 0.3', () => {
    expect(determineRecommendation(0.3, 1 as FidelityLevel)).toBe('maintain');
  });

  it('returns "maintain" when score is exactly 0.05', () => {
    expect(determineRecommendation(0.05, 2 as FidelityLevel)).toBe('maintain');
  });

  it('returns "maintain" when score is between 0.05 and 0.3', () => {
    expect(determineRecommendation(0.15, 1 as FidelityLevel)).toBe('maintain');
  });
});
