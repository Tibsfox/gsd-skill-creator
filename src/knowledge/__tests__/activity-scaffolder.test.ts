/**
 * Tests for ActivityScaffolder
 *
 * Validates pattern-to-activity conversion, chain insertion, and schema compliance.
 */

import { describe, it, expect } from 'vitest';
import { ActivityScaffolder } from '../activity-scaffolder.js';
import { PackActivitySchema } from '../types.js';
import type { LearningPattern } from '../learning-pattern-detector.js';
import type { PackActivity } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

function makePattern(
  type: 'sequence' | 'timing' | 'scoring' | 'engagement',
  description: string,
  packIds: string[] = ['MATH-101', 'SCI-101'],
  details: Record<string, unknown> = {},
): LearningPattern {
  return {
    id: `lp-${type}-test`,
    type,
    description,
    packIds,
    evidenceCount: 5,
    confidence: 0.7,
    details: {
      moduleSequence: ['M1', 'M2', 'M3'],
      minEarlyModuleMinutes: 30,
      progressionType: 'beginning-to-proficient',
      engagementThreshold: 'all-activities',
      scoreThreshold: 75,
      ...details,
    },
  };
}

function makeActivity(id: string, moduleId: string, name = 'Test Activity'): PackActivity {
  return {
    id,
    name,
    module_id: moduleId,
    grade_range: ['6-12'],
    duration_minutes: 20,
    description: 'Test activity description',
    materials: ['Material 1'],
    learning_objectives: ['Learn something'],
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ActivityScaffolder', () => {
  describe('scaffold — sequence pattern', () => {
    it('generates bridging activity with valid PackActivity shape', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern(
        'sequence',
        'Learners follow module sequence M1 → M2 → M3',
        ['MATH-101'],
        { moduleSequence: ['M1', 'M2', 'M3'] },
      );
      const existing = [makeActivity('act-1', 'MATH-101-M1')];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results).toHaveLength(1);
      const scaff = results[0];
      expect(scaff.sourcePatternId).toBe('lp-sequence-test');
      expect(scaff.activity.name).toContain('Sequence Review');
      expect(scaff.activity.module_id).toBe('MATH-101-M1');

      // Validate against schema
      const validation = PackActivitySchema.safeParse(scaff.activity);
      expect(validation.success).toBe(true);
    });
  });

  describe('scaffold — timing pattern', () => {
    it('generates pacing activity with appropriate duration', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern(
        'timing',
        'Early module time investment correlates with scores',
        ['MATH-101'],
        { minEarlyModuleMinutes: 40 },
      );
      const existing = [makeActivity('act-1', 'MATH-101-M1')];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results).toHaveLength(1);
      const scaff = results[0];
      expect(scaff.activity.duration_minutes).toBeGreaterThanOrEqual(40);
      expect(scaff.activity.name).toContain('Extended Exploration');
    });
  });

  describe('scaffold — scoring pattern', () => {
    it('generates assessment prep activity', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern(
        'scoring',
        'Rubric progression through modules',
        ['MATH-101'],
      );
      const existing = [makeActivity('act-1', 'MATH-101-M1')];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results).toHaveLength(1);
      const scaff = results[0];
      expect(scaff.activity.name).toContain('Assessment Preparation');
      expect(scaff.activity.learning_objectives.length).toBeGreaterThan(0);
    });
  });

  describe('scaffold — engagement pattern', () => {
    it('generates completionist activity', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern(
        'engagement',
        'Full activity completion correlates with high scores',
        ['MATH-101'],
      );
      const existing = [makeActivity('act-1', 'MATH-101-M1')];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results).toHaveLength(1);
      const scaff = results[0];
      expect(scaff.activity.name).toContain('Completionist');
    });
  });

  describe('scaffold — ID uniqueness', () => {
    it('produces unique IDs across multiple calls', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern1 = makePattern('sequence', 'Pattern 1', ['MATH-101']);
      const pattern2 = makePattern('timing', 'Pattern 2', ['MATH-101']);
      const existing: PackActivity[] = [];

      const results1 = scaffolder.scaffold({
        pattern: pattern1,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      const results2 = scaffolder.scaffold({
        pattern: pattern2,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      const id1 = results1[0].activity.id;
      const id2 = results2[0].activity.id;

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^scaff-MATH-101-\d+$/);
      expect(id2).toMatch(/^scaff-MATH-101-\d+$/);
    });
  });

  describe('scaffold — grade_range inheritance', () => {
    it('copies grade range from existing activities in module', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);
      const existing = [makeActivity('act-1', 'MATH-101-M1')];
      existing[0].grade_range = ['3-5'];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results[0].activity.grade_range).toEqual(['3-5']);
    });

    it('falls back to default when no module activities exist', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);
      const existing: PackActivity[] = [];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results[0].activity.grade_range).toEqual(['6-12']);
    });
  });

  describe('scaffold — max cap', () => {
    it('respects maxGeneratedPerPattern config', () => {
      const scaffolder = new ActivityScaffolder({ maxGeneratedPerPattern: 1 });
      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);
      const existing: PackActivity[] = [];

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('scaffoldBatch', () => {
    it('processes multiple patterns and returns flat array', () => {
      const scaffolder = new ActivityScaffolder();
      const patterns = [
        makePattern('sequence', 'Pattern 1', ['MATH-101']),
        makePattern('timing', 'Pattern 2', ['MATH-101']),
        makePattern('scoring', 'Pattern 3', ['MATH-101']),
      ];
      const existing: PackActivity[] = [];

      const results = scaffolder.scaffoldBatch({
        patterns,
        existingActivities: existing,
        packId: 'MATH-101',
      });

      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results.every(r => r.sourcePatternId.startsWith('lp-'))).toBe(true);
    });
  });

  describe('insertIntoChain', () => {
    it('inserts after correct activity', () => {
      const scaffolder = new ActivityScaffolder();
      const chain = [
        makeActivity('act-1', 'MATH-101-M1', 'Activity 1'),
        makeActivity('act-2', 'MATH-101-M1', 'Activity 2'),
      ];

      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);
      const scaffolded = scaffolder.scaffold({
        pattern,
        existingActivities: chain,
        packId: 'MATH-101',
      });

      // Manually set insertAfter for testing
      scaffolded[0].insertAfter = 'act-1';

      const result = scaffolder.insertIntoChain(chain, scaffolded);

      expect(result).toHaveLength(3);
      expect(result[1].id).toBe(scaffolded[0].activity.id);
      expect(result[0].id).toBe('act-1');
      expect(result[2].id).toBe('act-2');
    });
  });

  describe('insertIntoChain — immutability', () => {
    it('does not mutate the input chain array', () => {
      const scaffolder = new ActivityScaffolder();
      const chain = [
        makeActivity('act-1', 'MATH-101-M1'),
        makeActivity('act-2', 'MATH-101-M1'),
      ];
      const originalLength = chain.length;

      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);
      const scaffolded = scaffolder.scaffold({
        pattern,
        existingActivities: chain,
        packId: 'MATH-101',
      });

      scaffolder.insertIntoChain(chain, scaffolded);

      expect(chain).toHaveLength(originalLength);
    });
  });

  describe('schema validation', () => {
    it('validates all generated activities against PackActivitySchema', () => {
      const scaffolder = new ActivityScaffolder();
      const patterns = [
        makePattern('sequence', 'P1', ['MATH-101']),
        makePattern('timing', 'P2', ['MATH-101']),
        makePattern('scoring', 'P3', ['MATH-101']),
        makePattern('engagement', 'P4', ['MATH-101']),
      ];

      for (const pattern of patterns) {
        const results = scaffolder.scaffold({
          pattern,
          existingActivities: [],
          packId: 'MATH-101',
        });

        for (const scaff of results) {
          const validation = PackActivitySchema.safeParse(scaff.activity);
          expect(validation.success).toBe(true);
        }
      }
    });
  });

  describe('empty existing activities', () => {
    it('generates activities and appends (insertAfter = null)', () => {
      const scaffolder = new ActivityScaffolder();
      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: [],
        packId: 'MATH-101',
      });

      expect(results).toHaveLength(1);
      expect(results[0].insertAfter).toBeNull();
    });
  });

  describe('custom config', () => {
    it('uses custom idPrefix', () => {
      const scaffolder = new ActivityScaffolder({ idPrefix: 'custom' });
      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: [],
        packId: 'MATH-101',
      });

      expect(results[0].activity.id).toMatch(/^custom-MATH-101-/);
    });

    it('uses custom defaultDurationMinutes', () => {
      const scaffolder = new ActivityScaffolder({ defaultDurationMinutes: 45 });
      const pattern = makePattern('sequence', 'Pattern', ['MATH-101']);

      const results = scaffolder.scaffold({
        pattern,
        existingActivities: [],
        packId: 'MATH-101',
      });

      expect(results[0].activity.duration_minutes).toBe(45);
    });
  });
});
