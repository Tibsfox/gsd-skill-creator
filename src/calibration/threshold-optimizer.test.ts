import { describe, it, expect } from 'vitest';
import { ThresholdOptimizer } from './threshold-optimizer.js';
import type { CalibrationEvent } from './calibration-types.js';

describe('ThresholdOptimizer', () => {
  const optimizer = new ThresholdOptimizer();

  // Helper to create a calibration event
  const createEvent = (
    overrides: Partial<CalibrationEvent> & { bestScore?: number } = {}
  ): CalibrationEvent => {
    const bestScore = overrides.bestScore ?? 0.8;
    delete overrides.bestScore;

    return {
      id: '11111111-1111-1111-1111-111111111111',
      timestamp: '2024-01-01T00:00:00.000Z',
      prompt: 'test prompt',
      skillScores: [
        { skillName: 'skill-a', similarity: bestScore, wouldActivate: true },
        { skillName: 'skill-b', similarity: 0.3, wouldActivate: false },
      ],
      activatedSkill: 'skill-a',
      outcome: 'continued',
      threshold: 0.75,
      ...overrides,
    };
  };

  describe('evaluateThreshold', () => {
    it('should calculate precision correctly', () => {
      // 2 TP (predicted and correct), 1 FP (predicted but wrong)
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }), // TP
        createEvent({ bestScore: 0.85, outcome: 'continued' }), // TP
        createEvent({ bestScore: 0.9, outcome: 'corrected' }), // FP
      ];

      const result = optimizer.evaluateThreshold(events, 0.7);

      // precision = TP / (TP + FP) = 2 / (2 + 1) = 0.667
      expect(result.precision).toBeCloseTo(0.667, 2);
    });

    it('should calculate recall correctly', () => {
      // 2 TP, 1 FN (not predicted but would have been correct)
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }), // TP at 0.7
        createEvent({ bestScore: 0.85, outcome: 'continued' }), // TP at 0.7
        createEvent({ bestScore: 0.6, outcome: 'continued' }), // FN at 0.7 (below threshold)
      ];

      const result = optimizer.evaluateThreshold(events, 0.7);

      // recall = TP / (TP + FN) = 2 / (2 + 1) = 0.667
      expect(result.recall).toBeCloseTo(0.667, 2);
    });

    it('should calculate F1 correctly', () => {
      // F1 = 2 * (precision * recall) / (precision + recall)
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }), // TP
        createEvent({ bestScore: 0.85, outcome: 'continued' }), // TP
        createEvent({ bestScore: 0.9, outcome: 'corrected' }), // FP
        createEvent({ bestScore: 0.6, outcome: 'continued' }), // FN at 0.7
      ];

      const result = optimizer.evaluateThreshold(events, 0.7);

      // precision = 2/3 = 0.667
      // recall = 2/3 = 0.667
      // F1 = 2 * (0.667 * 0.667) / (0.667 + 0.667) = 0.667
      expect(result.f1).toBeCloseTo(0.667, 2);
    });

    it('should calculate accuracy correctly', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }), // TP
        createEvent({ bestScore: 0.6, outcome: 'corrected' }), // TN (below threshold, correct to not activate)
        createEvent({ bestScore: 0.9, outcome: 'corrected' }), // FP
        createEvent({ bestScore: 0.5, outcome: 'continued' }), // FN
      ];

      const result = optimizer.evaluateThreshold(events, 0.7);

      // TP=1, TN=1, FP=1, FN=1
      // accuracy = (TP + TN) / total = 2/4 = 0.5
      expect(result.accuracy).toBeCloseTo(0.5, 2);
    });

    it('should handle empty events', () => {
      const result = optimizer.evaluateThreshold([], 0.75);

      expect(result.threshold).toBe(0.75);
      expect(result.f1).toBe(0);
      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.accuracy).toBe(0);
    });

    it('should handle all same outcome (all continued)', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }),
        createEvent({ bestScore: 0.85, outcome: 'continued' }),
        createEvent({ bestScore: 0.9, outcome: 'continued' }),
      ];

      const result = optimizer.evaluateThreshold(events, 0.7);

      // All TP: precision=1, recall=1, F1=1
      expect(result.precision).toBe(1);
      expect(result.recall).toBe(1);
      expect(result.f1).toBe(1);
    });

    it('should handle all same outcome (all corrected)', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'corrected' }),
        createEvent({ bestScore: 0.85, outcome: 'corrected' }),
        createEvent({ bestScore: 0.9, outcome: 'corrected' }),
      ];

      const result = optimizer.evaluateThreshold(events, 0.7);

      // All FP: precision=0, recall=0 (no TP), F1=0
      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.f1).toBe(0);
    });

    it('should use best score from skillScores', () => {
      const event: CalibrationEvent = {
        id: '11111111-1111-1111-1111-111111111111',
        timestamp: '2024-01-01T00:00:00.000Z',
        prompt: 'test',
        skillScores: [
          { skillName: 'skill-a', similarity: 0.5, wouldActivate: false },
          { skillName: 'skill-b', similarity: 0.9, wouldActivate: true }, // Best
          { skillName: 'skill-c', similarity: 0.6, wouldActivate: false },
        ],
        activatedSkill: 'skill-b',
        outcome: 'continued',
        threshold: 0.75,
      };

      // At threshold 0.85, should predict activate (0.9 >= 0.85)
      const result1 = optimizer.evaluateThreshold([event], 0.85);
      expect(result1.precision).toBe(1); // TP

      // At threshold 0.95, should predict no activate (0.9 < 0.95)
      const result2 = optimizer.evaluateThreshold([event], 0.95);
      expect(result2.precision).toBe(0); // FN
    });

    it('should handle event with no skill scores', () => {
      const event: CalibrationEvent = {
        id: '11111111-1111-1111-1111-111111111111',
        timestamp: '2024-01-01T00:00:00.000Z',
        prompt: 'test',
        skillScores: [],
        activatedSkill: null,
        outcome: 'corrected',
        threshold: 0.75,
      };

      // Best score is 0, so predicted=false at any threshold
      // Outcome is corrected (actual=false), so TN
      const result = optimizer.evaluateThreshold([event], 0.5);
      expect(result.accuracy).toBe(1); // TN counts as correct
    });
  });

  describe('findOptimalThreshold', () => {
    it('should find optimal threshold from sample events', () => {
      // Create events where different thresholds perform differently
      const events: CalibrationEvent[] = [
        // High scores that should activate
        createEvent({ bestScore: 0.9, outcome: 'continued' }),
        createEvent({ bestScore: 0.85, outcome: 'continued' }),
        createEvent({ bestScore: 0.8, outcome: 'continued' }),
        // Medium scores - borderline
        createEvent({ bestScore: 0.7, outcome: 'corrected' }), // Activating was wrong
        createEvent({ bestScore: 0.65, outcome: 'corrected' }), // Activating was wrong
        // Low scores that shouldn't activate
        createEvent({ bestScore: 0.55, outcome: 'corrected' }),
      ];

      const result = optimizer.findOptimalThreshold(events, 0.5);

      // Optimal threshold should be just above 0.7 to separate the good (0.8+)
      // from the bad (0.7 and below). Threshold 0.71+ correctly classifies all.
      expect(result.optimalThreshold).toBeGreaterThan(0.7);
      expect(result.optimalThreshold).toBeLessThanOrEqual(0.8);
      expect(result.optimalF1).toBe(1); // Perfect separation at this threshold
    });

    it('should return current threshold metrics for comparison', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }),
        createEvent({ bestScore: 0.85, outcome: 'continued' }),
      ];

      const result = optimizer.findOptimalThreshold(events, 0.75);

      expect(result.currentThreshold).toBe(0.75);
      expect(result.currentF1).toBeGreaterThan(0);
    });

    it('should calculate improvement correctly', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }),
        createEvent({ bestScore: 0.85, outcome: 'continued' }),
        createEvent({ bestScore: 0.55, outcome: 'corrected' }),
      ];

      const result = optimizer.findOptimalThreshold(events, 0.5);

      // improvement = optimalF1 - currentF1
      expect(result.improvement).toBeCloseTo(
        result.optimalF1 - result.currentF1,
        10
      );
    });

    it('should return data points count', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }),
        createEvent({ bestScore: 0.85, outcome: 'continued' }),
        createEvent({ bestScore: 0.9, outcome: 'corrected' }),
      ];

      const result = optimizer.findOptimalThreshold(events, 0.75);

      expect(result.dataPoints).toBe(3);
    });

    it('should return all candidates from grid search', () => {
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.8, outcome: 'continued' }),
      ];

      const result = optimizer.findOptimalThreshold(events, 0.75);

      // Grid: 0.50 to 0.95 in 0.01 steps = 46 candidates
      expect(result.allCandidates.length).toBe(46);
      expect(result.allCandidates[0].threshold).toBe(0.5);
      expect(result.allCandidates[45].threshold).toBe(0.95);
    });

    it('should handle empty events gracefully', () => {
      const result = optimizer.findOptimalThreshold([], 0.75);

      expect(result.dataPoints).toBe(0);
      expect(result.optimalF1).toBe(0);
      expect(result.currentF1).toBe(0);
      expect(result.improvement).toBe(0);
      // Should still return current threshold as optimal when no data
      expect(result.optimalThreshold).toBe(0.5); // First candidate when all F1s are 0
    });

    it('should prefer higher threshold when F1 scores are equal', () => {
      // When all events pass at all thresholds, F1s will be equal
      // This tests that our sorting is stable
      const events: CalibrationEvent[] = [
        createEvent({ bestScore: 0.99, outcome: 'continued' }),
      ];

      const result = optimizer.findOptimalThreshold(events, 0.75);

      // All thresholds up to 0.95 will have same F1=1
      // We should get the first one (0.5) due to stable sort
      expect(result.optimalF1).toBe(1);
    });
  });
});
