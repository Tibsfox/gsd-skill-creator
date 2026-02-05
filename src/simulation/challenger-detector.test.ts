import { describe, it, expect } from 'vitest';
import { detectChallengers, isWeakMatch } from './challenger-detector.js';
import type { SkillPrediction } from '../types/simulation.js';

describe('detectChallengers', () => {
  /**
   * Helper to create a mock SkillPrediction.
   */
  const createPrediction = (
    name: string,
    similarity: number,
    wouldActivate = true
  ): SkillPrediction => ({
    skillName: name,
    similarity,
    confidence: similarity * 100,
    confidenceLevel:
      similarity >= 0.85 ? 'high' : similarity >= 0.7 ? 'medium' : similarity >= 0.5 ? 'low' : 'none',
    wouldActivate,
  });

  it('should return empty challengers when no winner', () => {
    const predictions = [
      createPrediction('skill-a', 0.6, false),
      createPrediction('skill-b', 0.5, false),
    ];

    const result = detectChallengers(null, predictions);

    expect(result.challengers).toHaveLength(0);
    expect(result.tooCloseToCall).toBe(false);
    expect(result.competitionMargin).toBeNull();
  });

  it('should detect challengers within margin and above floor', () => {
    const winner = createPrediction('winner', 0.85);
    const predictions = [
      winner,
      createPrediction('challenger', 0.8), // Within 0.1 margin, above 0.5 floor
      createPrediction('distant', 0.6), // Outside margin
    ];

    const result = detectChallengers(winner, predictions);

    expect(result.challengers).toHaveLength(1);
    expect(result.challengers[0].skillName).toBe('challenger');
  });

  it('should not include challengers below floor', () => {
    const winner = createPrediction('winner', 0.55);
    const predictions = [
      winner,
      createPrediction('below-floor', 0.48), // Within margin but below floor
    ];

    const result = detectChallengers(winner, predictions, { margin: 0.1, floor: 0.5 });

    expect(result.challengers).toHaveLength(0);
  });

  it('should detect too-close-to-call situations', () => {
    const winner = createPrediction('winner', 0.8);
    const predictions = [
      winner,
      createPrediction('very-close', 0.79), // Only 1% difference
    ];

    const result = detectChallengers(winner, predictions);

    expect(result.tooCloseToCall).toBe(true);
    expect(result.competitionMargin).toBeCloseTo(0.01);
  });

  it('should not flag as too-close-to-call when margin >= 2%', () => {
    const winner = createPrediction('winner', 0.8);
    const predictions = [
      winner,
      createPrediction('close-enough', 0.77), // 3% difference
    ];

    const result = detectChallengers(winner, predictions);

    expect(result.tooCloseToCall).toBe(false);
    expect(result.competitionMargin).toBeCloseTo(0.03);
  });

  it('should handle multiple challengers sorted by similarity', () => {
    const winner = createPrediction('winner', 0.85);
    const predictions = [
      winner,
      createPrediction('challenger-1', 0.82), // Closest
      createPrediction('challenger-2', 0.78), // Second closest
      createPrediction('distant', 0.6), // Outside margin
    ];

    const result = detectChallengers(winner, predictions);

    expect(result.challengers).toHaveLength(2);
    expect(result.challengers[0].skillName).toBe('challenger-1');
    expect(result.challengers[1].skillName).toBe('challenger-2');
  });

  it('should use custom margin configuration', () => {
    const winner = createPrediction('winner', 0.85);
    const predictions = [
      winner,
      createPrediction('wider-challenger', 0.7), // Would be outside default margin
    ];

    // With wider margin (0.2), this should be a challenger
    const result = detectChallengers(winner, predictions, { margin: 0.2, floor: 0.5 });

    expect(result.challengers).toHaveLength(1);
    expect(result.challengers[0].skillName).toBe('wider-challenger');
  });

  it('should use custom floor configuration', () => {
    const winner = createPrediction('winner', 0.6);
    const predictions = [
      winner,
      createPrediction('low-challenger', 0.55), // Within margin, but check floor
    ];

    // With higher floor (0.6), this should NOT be a challenger
    const result = detectChallengers(winner, predictions, { margin: 0.1, floor: 0.6 });

    expect(result.challengers).toHaveLength(0);
  });
});

describe('isWeakMatch', () => {
  it('should identify weak matches below threshold but above 0.4', () => {
    const pred: SkillPrediction = {
      skillName: 'test',
      similarity: 0.55,
      confidence: 55,
      confidenceLevel: 'low',
      wouldActivate: false,
    };

    expect(isWeakMatch(pred, 0.75)).toBe(true);
  });

  it('should not flag very low scores as weak match', () => {
    const pred: SkillPrediction = {
      skillName: 'test',
      similarity: 0.35,
      confidence: 35,
      confidenceLevel: 'none',
      wouldActivate: false,
    };

    expect(isWeakMatch(pred, 0.75)).toBe(false);
  });

  it('should return false for null winner', () => {
    expect(isWeakMatch(null, 0.75)).toBe(false);
  });

  it('should return false when similarity is at threshold', () => {
    const pred: SkillPrediction = {
      skillName: 'test',
      similarity: 0.75,
      confidence: 75,
      confidenceLevel: 'medium',
      wouldActivate: true,
    };

    expect(isWeakMatch(pred, 0.75)).toBe(false);
  });

  it('should return true for similarity exactly at 0.4', () => {
    const pred: SkillPrediction = {
      skillName: 'test',
      similarity: 0.4,
      confidence: 40,
      confidenceLevel: 'none',
      wouldActivate: false,
    };

    expect(isWeakMatch(pred, 0.75)).toBe(true);
  });
});
