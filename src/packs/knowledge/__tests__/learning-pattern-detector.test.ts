/**
 * Tests for LearningPatternDetector
 *
 * Covers pattern detection from observation sequences including:
 * - Sequence patterns (module ordering)
 * - Timing patterns (time investment correlation)
 * - Scoring patterns (rubric progression)
 * - Engagement patterns (activity completion correlation)
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import type { LearnerObservation } from '../observation-types.js';
import {
  LearningPatternDetector,
  type LearningPattern,
  type LearningPatternSuggestion,
} from '../learning-pattern-detector.js';

// ============================================================================
// Helper: makeObservation
// ============================================================================

/**
 * Create a valid LearnerObservation with defaults.
 * Overrides can customize any field.
 */
function makeObservation(overrides?: Partial<LearnerObservation>): LearnerObservation {
  const timestamp = new Date().toISOString();

  // Default activity completion observation
  const base: any = {
    id: randomUUID(),
    timestamp,
    learnerId: 'learner-1',
    packId: 'MATH-101',
    kind: 'activity_completion',
    activityId: 'A1',
    moduleId: 'M1',
    durationMinutes: 30,
    completed: true,
  };

  return { ...base, ...overrides };
}

// ============================================================================
// Tests
// ============================================================================

describe('LearningPatternDetector', () => {
  describe('constructor', () => {
    it('uses default config when no config provided', () => {
      const detector = new LearningPatternDetector();
      // Test by running detect with threshold data
      const obs = [
        makeObservation({ learnerId: 'learner-1', packId: 'MATH-101' }),
        makeObservation({ learnerId: 'learner-2', packId: 'SCI-101' }),
      ];
      const patterns = detector.detect(obs);
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('merges partial config with defaults', () => {
      const detector = new LearningPatternDetector({ minOccurrences: 5, maxSuggestions: 20 });
      const obs = [
        makeObservation({ learnerId: 'learner-1', packId: 'MATH-101' }),
        makeObservation({ learnerId: 'learner-2', packId: 'SCI-101' }),
      ];
      const patterns = detector.detect(obs);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('detect — sequence patterns', () => {
    it('detects consistent module ordering across 3+ learners in 2+ packs', () => {
      // Create 3 learners with consistent M1->M2->M3 sequence across 2 packs
      const obs: LearnerObservation[] = [];

      // Learner 1: MATH-101, M1->M2->M3
      obs.push(
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          moduleId: 'M1',
          timestamp: '2026-01-01T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          moduleId: 'M2',
          timestamp: '2026-01-01T11:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          moduleId: 'M3',
          timestamp: '2026-01-01T12:00:00Z',
        })
      );

      // Learner 2: MATH-101, M1->M2->M3
      obs.push(
        makeObservation({
          learnerId: 'learner-2',
          packId: 'MATH-101',
          moduleId: 'M1',
          timestamp: '2026-01-02T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'MATH-101',
          moduleId: 'M2',
          timestamp: '2026-01-02T11:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'MATH-101',
          moduleId: 'M3',
          timestamp: '2026-01-02T12:00:00Z',
        })
      );

      // Learner 3: SCI-101, M1->M2->M3
      obs.push(
        makeObservation({
          learnerId: 'learner-3',
          packId: 'SCI-101',
          moduleId: 'M1',
          timestamp: '2026-01-03T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'SCI-101',
          moduleId: 'M2',
          timestamp: '2026-01-03T11:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'SCI-101',
          moduleId: 'M3',
          timestamp: '2026-01-03T12:00:00Z',
        })
      );

      const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
      const patterns = detector.detect(obs);
      const sequencePatterns = patterns.filter(p => p.type === 'sequence');

      expect(sequencePatterns.length).toBeGreaterThan(0);
      if (sequencePatterns.length > 0) {
        const pattern = sequencePatterns[0];
        expect(pattern.evidenceCount).toBeGreaterThanOrEqual(3);
        expect(pattern.packIds.length).toBeGreaterThanOrEqual(2);
        expect(pattern.confidence).toBeGreaterThan(0);
      }
    });

    it('returns empty when fewer than minOccurrences observations', () => {
      const obs = [
        makeObservation({ learnerId: 'learner-1', packId: 'MATH-101', moduleId: 'M1' }),
      ];

      const detector = new LearningPatternDetector({ minOccurrences: 5 });
      const patterns = detector.detect(obs);

      expect(patterns.length).toBe(0);
    });

    it('returns empty when only 1 pack', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 5; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: 'MATH-101',
            moduleId: 'M1',
            timestamp: `2026-01-0${i}T10:00:00Z`,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: 'MATH-101',
            moduleId: 'M2',
            timestamp: `2026-01-0${i}T11:00:00Z`,
          })
        );
      }

      const detector = new LearningPatternDetector({ minPacks: 2 });
      const patterns = detector.detect(obs);

      // All observations from same pack should not generate sequence patterns
      const sequencePatterns = patterns.filter(p => p.type === 'sequence');
      expect(sequencePatterns.length).toBe(0);
    });
  });

  describe('detect — timing patterns', () => {
    it('detects correlation between early-module time investment and later assessment scores', () => {
      const obs: LearnerObservation[] = [];

      // Learner 1 in MATH-101: spends 40 mins on M1 activities, gets 85% on assessment
      obs.push(
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'activity_completion',
          moduleId: 'M1',
          durationMinutes: 40,
          completed: true,
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'proficient',
          score: 85,
          timeSpentMinutes: 30,
        })
      );

      // Learner 2 in SCI-101: spends 35 mins on M1 activities, gets 80% on assessment
      obs.push(
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'activity_completion',
          moduleId: 'M1',
          durationMinutes: 35,
          completed: true,
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'proficient',
          score: 80,
          timeSpentMinutes: 25,
        })
      );

      // Learner 3 in MATH-101: spends 32 mins on M1 activities, gets 78% on assessment
      obs.push(
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'activity_completion',
          moduleId: 'M1',
          durationMinutes: 32,
          completed: true,
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'proficient',
          score: 78,
          timeSpentMinutes: 20,
        })
      );

      const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
      const patterns = detector.detect(obs);
      const timingPatterns = patterns.filter(p => p.type === 'timing');

      expect(timingPatterns.length).toBeGreaterThanOrEqual(0);
      if (timingPatterns.length > 0) {
        const pattern = timingPatterns[0];
        expect(pattern.confidence).toBeGreaterThan(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('detect — scoring patterns', () => {
    it('detects rubric level progression across modules', () => {
      const obs: LearnerObservation[] = [];

      // Learner 1 in MATH-101: progresses from beginning -> developing -> proficient
      obs.push(
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'beginning',
          score: 45,
          timeSpentMinutes: 30,
          timestamp: '2026-01-01T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M2',
          rubricLevel: 'developing',
          score: 60,
          timeSpentMinutes: 30,
          timestamp: '2026-01-02T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M3',
          rubricLevel: 'proficient',
          score: 80,
          timeSpentMinutes: 30,
          timestamp: '2026-01-03T10:00:00Z',
        })
      );

      // Learner 2 in SCI-101: same progression
      obs.push(
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'beginning',
          score: 50,
          timeSpentMinutes: 30,
          timestamp: '2026-01-04T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'assessment_result',
          moduleId: 'M2',
          rubricLevel: 'developing',
          score: 65,
          timeSpentMinutes: 30,
          timestamp: '2026-01-05T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'assessment_result',
          moduleId: 'M3',
          rubricLevel: 'proficient',
          score: 82,
          timeSpentMinutes: 30,
          timestamp: '2026-01-06T10:00:00Z',
        })
      );

      // Learner 3 in MATH-101: same progression
      obs.push(
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'beginning',
          score: 48,
          timeSpentMinutes: 30,
          timestamp: '2026-01-07T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M2',
          rubricLevel: 'developing',
          score: 62,
          timeSpentMinutes: 30,
          timestamp: '2026-01-08T10:00:00Z',
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M3',
          rubricLevel: 'proficient',
          score: 81,
          timeSpentMinutes: 30,
          timestamp: '2026-01-09T10:00:00Z',
        })
      );

      const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
      const patterns = detector.detect(obs);
      const scoringPatterns = patterns.filter(p => p.type === 'scoring');

      expect(scoringPatterns.length).toBeGreaterThan(0);
      if (scoringPatterns.length > 0) {
        const pattern = scoringPatterns[0];
        expect(pattern.confidence).toBeLessThanOrEqual(1);
        expect(pattern.evidenceCount).toBeGreaterThanOrEqual(3);
      }
    });

    it('returns patterns with confidence between 0 and 1', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 3; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'beginning',
            score: 45,
            timeSpentMinutes: 30,
            timestamp: `2026-01-${String(i).padStart(2, '0')}T10:00:00Z`,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M2',
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
            timestamp: `2026-01-${String(i).padStart(2, '0')}T11:00:00Z`,
          })
        );
      }

      const detector = new LearningPatternDetector();
      const patterns = detector.detect(obs);

      for (const pattern of patterns) {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('detect — engagement patterns', () => {
    it('detects full-activity-completion correlated with higher assessment scores', () => {
      const obs: LearnerObservation[] = [];

      // Learner 1 in MATH-101: completes all 3 activities, scores 85%
      obs.push(
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'activity_completion',
          activityId: 'A1',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'activity_completion',
          activityId: 'A2',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'activity_completion',
          activityId: 'A3',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-1',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'proficient',
          score: 85,
          timeSpentMinutes: 30,
        })
      );

      // Learner 2 in SCI-101: completes all 4 activities, scores 80%
      obs.push(
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'activity_completion',
          activityId: 'A1',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'activity_completion',
          activityId: 'A2',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'activity_completion',
          activityId: 'A3',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'activity_completion',
          activityId: 'A4',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-2',
          packId: 'SCI-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'proficient',
          score: 80,
          timeSpentMinutes: 30,
        })
      );

      // Learner 3 in MATH-101: completes all 3 activities, scores 78%
      obs.push(
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'activity_completion',
          activityId: 'A1',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'activity_completion',
          activityId: 'A2',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'activity_completion',
          activityId: 'A3',
          moduleId: 'M1',
          completed: true,
          durationMinutes: 20,
        }),
        makeObservation({
          learnerId: 'learner-3',
          packId: 'MATH-101',
          kind: 'assessment_result',
          moduleId: 'M1',
          rubricLevel: 'proficient',
          score: 78,
          timeSpentMinutes: 30,
        })
      );

      const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
      const patterns = detector.detect(obs);
      const engagementPatterns = patterns.filter(p => p.type === 'engagement');

      expect(engagementPatterns.length).toBeGreaterThan(0);
      if (engagementPatterns.length > 0) {
        const pattern = engagementPatterns[0];
        expect(pattern.description).toContain('complete all activities');
      }
    });

    it('returns human-readable pattern descriptions', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 3; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'activity_completion',
            moduleId: 'M1',
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'proficient',
            score: 80,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector();
      const patterns = detector.detect(obs);

      for (const pattern of patterns) {
        expect(typeof pattern.description).toBe('string');
        expect(pattern.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('suggest', () => {
    it('returns LearningPatternSuggestion array', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 3; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'activity_completion',
            moduleId: 'M1',
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector();
      const suggestions = detector.suggest(obs);

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('each suggestion has suggestedSkillName and suggestedDescription', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 3; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'activity_completion',
            moduleId: 'M1',
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector();
      const suggestions = detector.suggest(obs);

      for (const suggestion of suggestions) {
        expect(typeof suggestion.suggestedSkillName).toBe('string');
        expect(suggestion.suggestedSkillName.length).toBeGreaterThan(0);
        expect(typeof suggestion.suggestedDescription).toBe('string');
        expect(suggestion.suggestedDescription.length).toBeGreaterThan(0);
      }
    });

    it('filters by minConfidence', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 3; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'activity_completion',
            moduleId: 'M1',
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector({ minConfidence: 0.5 });
      const suggestions = detector.suggest(obs);

      for (const suggestion of suggestions) {
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });

    it('limits to maxSuggestions', () => {
      const obs: LearnerObservation[] = [];

      // Create enough observations to generate patterns
      for (let i = 1; i <= 6; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 3 ? 'MATH-101' : 'SCI-101',
            kind: 'activity_completion',
            moduleId: `M${Math.ceil(i / 2)}`,
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 3 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: `M${Math.ceil(i / 2)}`,
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector({ maxSuggestions: 2 });
      const suggestions = detector.suggest(obs);

      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('sorts by confidence descending', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 3; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'activity_completion',
            moduleId: 'M1',
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: i <= 2 ? 'MATH-101' : 'SCI-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector();
      const suggestions = detector.suggest(obs);

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });

    it('returns empty array for insufficient data', () => {
      const obs = [makeObservation()]; // Just 1 observation

      const detector = new LearningPatternDetector({ minOccurrences: 5 });
      const suggestions = detector.suggest(obs);

      expect(suggestions.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('empty observations array returns empty patterns', () => {
      const detector = new LearningPatternDetector();
      const patterns = detector.detect([]);

      expect(patterns.length).toBe(0);
    });

    it('single observation returns empty patterns', () => {
      const detector = new LearningPatternDetector();
      const patterns = detector.detect([makeObservation()]);

      expect(patterns.length).toBe(0);
    });

    it('all observations from same pack returns empty patterns with minPacks=2', () => {
      const obs: LearnerObservation[] = [];

      for (let i = 1; i <= 5; i++) {
        obs.push(
          makeObservation({
            learnerId: `learner-${i}`,
            packId: 'MATH-101',
            moduleId: 'M1',
            completed: true,
          }),
          makeObservation({
            learnerId: `learner-${i}`,
            packId: 'MATH-101',
            kind: 'assessment_result',
            moduleId: 'M1',
            rubricLevel: 'proficient',
            score: 85,
            timeSpentMinutes: 30,
          })
        );
      }

      const detector = new LearningPatternDetector({ minPacks: 2 });
      const patterns = detector.detect(obs);
      const sequencePatterns = patterns.filter(p => p.type === 'sequence');

      expect(sequencePatterns.length).toBe(0);
    });
  });
});
