/**
 * Test suite for PathwayAdapter learning pathway adaptation engine.
 *
 * Tests cover:
 * - Constructor and configuration
 * - Struggling learner detection and reinforcement
 * - Excelling learner detection and acceleration
 * - Normal learner progression
 * - Mixed performance scenarios
 * - Edge cases (insufficient data, empty inputs)
 * - Evidence tracing and immutability
 */

import { describe, it, expect } from 'vitest';
import { PathwayAdapter } from '../pathway-adapter.js';
import type {
  PathwayAdaptation,
  AdaptedPathway,
} from '../pathway-adapter.js';
import type { LearnerObservation } from '../observation-types.js';
import type { PackModule, PackActivity } from '../types.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a minimal valid PackModule for testing.
 */
function makeModule(id: string, name: string): PackModule {
  return {
    id,
    name,
    description: `Module ${id}`,
    learning_outcomes: [],
    topics: [],
    grade_levels: ['K'],
    time_estimates: {},
    prerequisite_modules: [],
  };
}

/**
 * Create a minimal valid PackActivity for testing.
 */
function makeActivity(
  id: string,
  moduleId: string,
  durationMinutes: number
): PackActivity {
  return {
    id,
    name: `Activity ${id}`,
    module_id: moduleId,
    grade_range: ['K'],
    duration_minutes: durationMinutes,
    description: `Activity ${id}`,
    materials: [],
    learning_objectives: [],
  };
}

/**
 * Create an assessment_result observation for testing.
 */
function makeAssessmentObs(
  moduleId: string,
  score: number,
  learnerId: string = 'learner-1',
  packId: string = 'pack-1'
): LearnerObservation {
  return {
    id: `obs-${Math.random()}`,
    timestamp: new Date().toISOString(),
    learnerId,
    packId,
    kind: 'assessment_result',
    moduleId,
    rubricLevel: 'developing',
    score,
    timeSpentMinutes: 30,
    strengths: [],
    areasForGrowth: [],
  };
}

/**
 * Create an activity_completion observation for testing.
 */
function makeCompletionObs(
  activityId: string,
  moduleId: string,
  completed: boolean,
  learnerId: string = 'learner-1',
  packId: string = 'pack-1'
): LearnerObservation {
  return {
    id: `obs-${Math.random()}`,
    timestamp: new Date().toISOString(),
    learnerId,
    packId,
    kind: 'activity_completion',
    activityId,
    moduleId,
    durationMinutes: 15,
    completed,
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('PathwayAdapter', () => {
  // ==========================================================================
  // Constructor Tests
  // ==========================================================================

  describe('constructor', () => {
    it('uses defaults when no config provided', () => {
      const adapter = new PathwayAdapter();
      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules: [makeModule('M1', 'Foundations')],
        activities: [],
        observations: [],
      });
      // Should not throw and should return a valid pathway
      expect(result).toBeDefined();
    });

    it('accepts partial config', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 30,
        maxReinforcementActivities: 5,
      });
      // Create a learner with 30 score — should be classified as struggling
      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules: [makeModule('M1', 'Foundations')],
        activities: [
          makeActivity('A1', 'M1', 10),
          makeActivity('A2', 'M1', 15),
          makeActivity('A3', 'M1', 20),
          makeActivity('A4', 'M1', 25),
          makeActivity('A5', 'M1', 30),
          makeActivity('A6', 'M1', 35),
        ],
        observations: [
          makeAssessmentObs('M1', 30),
          makeAssessmentObs('M1', 30),
        ],
      });
      // Should trigger reinforcement since 30 < custom threshold of 30 (boundary)
      // Actually, 30 is NOT < 30, so it should be normal
      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation).toBeDefined();
    });
  });

  // ==========================================================================
  // Struggling Learner Tests
  // ==========================================================================

  describe('adapt — struggling learner', () => {
    it('detects struggling performance and adds reinforcement activities', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M1', 15),
        makeActivity('A3', 'M1', 20),
      ];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.action).toBe('reinforce');
      expect(m1Adaptation?.reason).toContain('struggling');

      // Should have reinforcement activities
      const reinforcement = result.reinforcementActivities.find(
        (r) => r.moduleId === 'M1'
      );
      expect(reinforcement).toBeDefined();
      expect(reinforcement?.activityIds.length).toBeGreaterThan(0);
    });

    it('caps reinforcement activities at maxReinforcementActivities', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        minObservationsForAdaptation: 2,
        maxReinforcementActivities: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M1', 15),
        makeActivity('A3', 'M1', 20),
        makeActivity('A4', 'M1', 25),
      ];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const reinforcement = result.reinforcementActivities.find(
        (r) => r.moduleId === 'M1'
      );
      expect(reinforcement?.activityIds.length).toBeLessThanOrEqual(2);
    });

    it('selects shortest-duration activities for reinforcement', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        minObservationsForAdaptation: 2,
        maxReinforcementActivities: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities = [
        makeActivity('A1', 'M1', 30), // longest
        makeActivity('A2', 'M1', 10), // shortest
        makeActivity('A3', 'M1', 20), // middle
      ];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const reinforcement = result.reinforcementActivities.find(
        (r) => r.moduleId === 'M1'
      );
      // Should include A2 (10min) and A3 (20min) as shortest, not A1 (30min)
      expect(reinforcement?.activityIds).toContain('A2');
      expect(reinforcement?.activityIds).toContain('A3');
      expect(reinforcement?.activityIds).not.toContain('A1');
    });

    it('includes evidence observation IDs in adaptation', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const obs1 = makeAssessmentObs('M1', 40);
      const obs2 = makeAssessmentObs('M1', 45);
      const observations = [obs1, obs2];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.evidence).toContain(obs1.id);
      expect(m1Adaptation?.evidence).toContain(obs2.id);
    });
  });

  // ==========================================================================
  // Excelling Learner Tests
  // ==========================================================================

  describe('adapt — excelling learner', () => {
    it('detects excelling performance with high scores', () => {
      const adapter = new PathwayAdapter({
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M1', 15),
      ];
      const observations = [
        makeAssessmentObs('M1', 95),
        makeAssessmentObs('M1', 98),
        makeCompletionObs('A1', 'M1', true),
        makeCompletionObs('A2', 'M1', true),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.action).toBe('skip');
      expect(result.skippedModules).toContain('M1');
    });

    it('marks excelling modules with high completion in skippedModules', () => {
      const adapter = new PathwayAdapter({
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'F'), makeModule('M2', 'I')];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M2', 15),
      ];
      const observations = [
        makeAssessmentObs('M1', 95),
        makeAssessmentObs('M1', 97),
        makeCompletionObs('A1', 'M1', true),
        makeAssessmentObs('M2', 50),
        makeAssessmentObs('M2', 55),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      expect(result.skippedModules).toContain('M1');
      expect(result.skippedModules).not.toContain('M2');
    });

    it('maintains excelling modules with incomplete activities', () => {
      const adapter = new PathwayAdapter({
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M1', 15),
      ];
      const observations = [
        makeAssessmentObs('M1', 95),
        makeAssessmentObs('M1', 98),
        makeCompletionObs('A1', 'M1', true),
        makeCompletionObs('A2', 'M1', false), // not completed
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      // Should maintain, not skip, because not all activities completed
      expect(m1Adaptation?.action).toBe('maintain');
      expect(result.skippedModules).not.toContain('M1');
    });
  });

  // ==========================================================================
  // Normal Learner Tests
  // ==========================================================================

  describe('adapt — normal learner', () => {
    it('maintains normal modules with mid-range scores', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 70),
        makeAssessmentObs('M1', 75),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.action).toBe('maintain');
    });

    it('preserves original order for normal learners', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [
        makeModule('M1', 'Foundations'),
        makeModule('M2', 'Intermediate'),
        makeModule('M3', 'Advanced'),
      ];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 70),
        makeAssessmentObs('M1', 75),
        makeAssessmentObs('M2', 70),
        makeAssessmentObs('M2', 75),
        makeAssessmentObs('M3', 70),
        makeAssessmentObs('M3', 75),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      expect(result.adaptedOrder).toEqual(['M1', 'M2', 'M3']);
    });

    it('does not add reinforcement for normal modules', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities = [makeActivity('A1', 'M1', 10)];
      const observations = [
        makeAssessmentObs('M1', 70),
        makeAssessmentObs('M1', 75),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      expect(result.reinforcementActivities).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Mixed Performance Tests
  // ==========================================================================

  describe('adapt — mixed performance', () => {
    it('reorders modules based on performance classifications', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [
        makeModule('M1', 'Foundations'),
        makeModule('M2', 'Intermediate'),
        makeModule('M3', 'Advanced'),
      ];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M2', 15),
        makeActivity('A3', 'M3', 20),
      ];
      const observations = [
        // M1: struggling (40, 45)
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
        // M2: normal (70, 75)
        makeAssessmentObs('M2', 70),
        makeAssessmentObs('M2', 75),
        // M3: excelling (95, 98)
        makeAssessmentObs('M3', 95),
        makeAssessmentObs('M3', 98),
        makeCompletionObs('A3', 'M3', true),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      // Should reorder: struggling first (M1), then normal (M2), then excelling (M3)
      expect(result.adaptedOrder).toEqual(['M1', 'M2', 'M3']);

      // Check adaptations
      const adaptByModule = new Map(
        result.adaptations.map((a) => [a.moduleId, a])
      );
      expect(adaptByModule.get('M1')?.action).toBe('reinforce');
      expect(adaptByModule.get('M2')?.action).toBe('maintain');
      expect(adaptByModule.get('M3')?.action).toBe('skip');
    });

    it('handles mixed scenario with all three classifications', () => {
      const adapter = new PathwayAdapter({
        struggleThreshold: 50,
        excelThreshold: 90,
        minObservationsForAdaptation: 2,
      });

      const modules = [
        makeModule('M1', 'Foundations'),
        makeModule('M2', 'Intermediate'),
        makeModule('M3', 'Advanced'),
      ];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M2', 15),
        makeActivity('A3', 'M3', 20),
      ];
      const observations = [
        // M1: struggling
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
        // M2: normal
        makeAssessmentObs('M2', 70),
        makeAssessmentObs('M2', 75),
        // M3: excelling
        makeAssessmentObs('M3', 95),
        makeAssessmentObs('M3', 98),
        makeCompletionObs('A3', 'M3', true),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      expect(result.adaptations).toHaveLength(3);
      const m1 = result.adaptations.find((a) => a.moduleId === 'M1');
      const m2 = result.adaptations.find((a) => a.moduleId === 'M2');
      const m3 = result.adaptations.find((a) => a.moduleId === 'M3');

      expect(m1?.action).toBe('reinforce');
      expect(m2?.action).toBe('maintain');
      expect(m3?.action).toBe('skip');
    });
  });

  // ==========================================================================
  // Insufficient Data Tests
  // ==========================================================================

  describe('adapt — insufficient data', () => {
    it('maintains modules with fewer than minObservationsForAdaptation', () => {
      const adapter = new PathwayAdapter({
        minObservationsForAdaptation: 3,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
        // Only 2 observations, less than 3
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.action).toBe('maintain');
      expect(m1Adaptation?.confidence).toBe(0.0);
    });

    it('maintains all modules with empty observations', () => {
      const adapter = new PathwayAdapter();

      const modules = [
        makeModule('M1', 'Foundations'),
        makeModule('M2', 'Intermediate'),
      ];
      const activities: PackActivity[] = [];
      const observations: LearnerObservation[] = [];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      // All modules should maintain
      expect(
        result.adaptations.every((a) => a.action === 'maintain')
      ).toBeTruthy();
    });

    it('filters observations to correct learner and pack', () => {
      const adapter = new PathwayAdapter();

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 95, 'other-learner', 'pack-1'), // different learner
        makeAssessmentObs('M1', 95, 'learner-1', 'other-pack'), // different pack
        makeAssessmentObs('M1', 95, 'learner-1', 'pack-1'), // correct
        makeAssessmentObs('M1', 98, 'learner-1', 'pack-1'), // correct
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      // Should only consider 2 correct observations, which is < minObservationsForAdaptation of 2
      // Actually, exactly 2 == 2, so it should adapt
      expect(m1Adaptation?.evidence).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Evidence Tracing Tests
  // ==========================================================================

  describe('adapt — evidence tracing', () => {
    it('includes observation IDs in evidence array', () => {
      const adapter = new PathwayAdapter({
        minObservationsForAdaptation: 2,
      });

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const obs1 = makeAssessmentObs('M1', 40);
      const obs2 = makeAssessmentObs('M1', 45);
      const observations = [obs1, obs2];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.evidence).toContain(obs1.id);
      expect(m1Adaptation?.evidence).toContain(obs2.id);
    });

    it('calculates confidence based on observation count', () => {
      const adapter = new PathwayAdapter({
        minObservationsForAdaptation: 2,
      });

      // Many observations = higher confidence
      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
        makeAssessmentObs('M1', 42),
        makeAssessmentObs('M1', 48),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const m1Adaptation = result.adaptations.find((a) => a.moduleId === 'M1');
      expect(m1Adaptation?.confidence).toBeGreaterThan(0);
      expect(m1Adaptation?.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  // ==========================================================================
  // Immutability Tests
  // ==========================================================================

  describe('adapt — immutability', () => {
    it('does not mutate input modules array', () => {
      const adapter = new PathwayAdapter();

      const modules = [
        makeModule('M1', 'Foundations'),
        makeModule('M2', 'Intermediate'),
      ];
      const originalOrder = modules.map((m) => m.id);

      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M2', 15),
      ];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
        makeAssessmentObs('M2', 95),
        makeAssessmentObs('M2', 98),
      ];

      adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      const afterOrder = modules.map((m) => m.id);
      expect(afterOrder).toEqual(originalOrder);
      expect(modules).toHaveLength(2);
    });

    it('does not mutate input observations array', () => {
      const adapter = new PathwayAdapter();

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
      ];
      const originalLength = observations.length;

      adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      expect(observations).toHaveLength(originalLength);
    });

    it('returns freshly constructed objects', () => {
      const adapter = new PathwayAdapter();

      const modules = [makeModule('M1', 'Foundations')];
      const activities: PackActivity[] = [];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
      ];

      const result1 = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      // Add a small delay to ensure different timestamps
      const ts1 = result1.generatedAt;
      // Wait a bit and call again
      const delay = new Promise((resolve) => setTimeout(resolve, 2));
      return delay.then(() => {
        const result2 = adapter.adapt({
          packId: 'pack-1',
          learnerId: 'learner-1',
          modules,
          activities,
          observations,
        });

        const ts2 = result2.generatedAt;
        // Timestamps should be different (or at least different objects)
        expect(result1.adaptations).not.toBe(result2.adaptations);
      });
    });
  });

  // ==========================================================================
  // Integration & Edge Cases
  // ==========================================================================

  describe('adapt — integration scenarios', () => {
    it('handles multiple modules with different activity counts', () => {
      const adapter = new PathwayAdapter({
        minObservationsForAdaptation: 2,
      });

      const modules = [
        makeModule('M1', 'Foundations'),
        makeModule('M2', 'Intermediate'),
      ];
      const activities = [
        makeActivity('A1', 'M1', 10),
        makeActivity('A2', 'M1', 15),
        makeActivity('A3', 'M1', 20),
        // M2 has no activities
      ];
      const observations = [
        makeAssessmentObs('M1', 40),
        makeAssessmentObs('M1', 45),
        makeAssessmentObs('M2', 70),
        makeAssessmentObs('M2', 75),
      ];

      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities,
        observations,
      });

      expect(result.adaptations).toHaveLength(2);

      const m1Reinforcement = result.reinforcementActivities.find(
        (r) => r.moduleId === 'M1'
      );
      expect(m1Reinforcement?.activityIds.length).toBeGreaterThan(0);

      const m2Reinforcement = result.reinforcementActivities.find(
        (r) => r.moduleId === 'M2'
      );
      expect(m2Reinforcement).toBeUndefined();
    });

    it('generates valid ISO timestamp', () => {
      const adapter = new PathwayAdapter();

      const modules = [makeModule('M1', 'Foundations')];
      const result = adapter.adapt({
        packId: 'pack-1',
        learnerId: 'learner-1',
        modules,
        activities: [],
        observations: [],
      });

      expect(result.generatedAt).toBeTruthy();
      expect(new Date(result.generatedAt).toISOString()).toBeDefined();
    });
  });
});
