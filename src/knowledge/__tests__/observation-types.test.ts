/**
 * Tests for observation type schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  ActivityCompletionSchema,
  AssessmentResultSchema,
  TimeSpentSchema,
  PackLifecycleSchema,
  LearnerObservationSchema,
  type LearnerObservation,
} from '../observation-types.js';

describe('Observation Type Schemas', () => {
  describe('ActivityCompletionSchema', () => {
    it('validates a complete activity completion event', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'activity_completion' as const,
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
        score: 85,
      };

      const result = ActivityCompletionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityId).toBe('act-001');
        expect(result.data.score).toBe(85);
      }
    });

    it('accepts activity completion without optional score', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'activity_completion' as const,
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: false,
      };

      const result = ActivityCompletionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing activityId', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'activity_completion' as const,
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      };

      const result = ActivityCompletionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative duration', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'activity_completion' as const,
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: -5,
        completed: true,
      };

      const result = ActivityCompletionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects score > 100', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'activity_completion' as const,
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
        score: 101,
      };

      const result = ActivityCompletionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('AssessmentResultSchema', () => {
    it('validates a complete assessment result', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'assessment_result' as const,
        moduleId: 'mod-001',
        rubricLevel: 'proficient' as const,
        score: 78,
        timeSpentMinutes: 30,
        strengths: ['demonstrates understanding', 'clear explanations'],
        areasForGrowth: ['needs practice with proofs'],
      };

      const result = AssessmentResultSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rubricLevel).toBe('proficient');
        expect(result.data.strengths.length).toBe(2);
      }
    });

    it('accepts assessment with default empty arrays', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'assessment_result' as const,
        moduleId: 'mod-001',
        rubricLevel: 'beginning' as const,
        score: 45,
        timeSpentMinutes: 15,
      };

      const result = AssessmentResultSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strengths).toEqual([]);
        expect(result.data.areasForGrowth).toEqual([]);
      }
    });

    it('rejects invalid rubricLevel', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'assessment_result' as const,
        moduleId: 'mod-001',
        rubricLevel: 'excellent',
        score: 95,
        timeSpentMinutes: 30,
      };

      const result = AssessmentResultSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing moduleId', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'assessment_result' as const,
        rubricLevel: 'proficient' as const,
        score: 78,
        timeSpentMinutes: 30,
      };

      const result = AssessmentResultSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('TimeSpentSchema', () => {
    it('validates time spent at pack level', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'time_spent' as const,
        minutes: 60,
        sessionDate: '2026-02-20',
      };

      const result = TimeSpentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates time spent at module level', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'time_spent' as const,
        moduleId: 'mod-001',
        minutes: 30,
        sessionDate: '2026-02-20',
      };

      const result = TimeSpentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates time spent at activity level', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'time_spent' as const,
        moduleId: 'mod-001',
        activityId: 'act-001',
        minutes: 20,
        sessionDate: '2026-02-20',
      };

      const result = TimeSpentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects zero minutes', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'time_spent' as const,
        minutes: 0,
        sessionDate: '2026-02-20',
      };

      const result = TimeSpentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing packId', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        kind: 'time_spent' as const,
        minutes: 30,
        sessionDate: '2026-02-20',
      };

      const result = TimeSpentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PackLifecycleSchema', () => {
    it('validates pack_start event', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'pack_start' as const,
      };

      const result = PackLifecycleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates module_start event', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'module_start' as const,
      };

      const result = PackLifecycleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates pack_complete event', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'pack_complete' as const,
      };

      const result = PackLifecycleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid kind', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'invalid_kind',
      };

      const result = PackLifecycleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('LearnerObservationSchema (Discriminated Union)', () => {
    it('parses activity_completion observations', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'activity_completion' as const,
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      };

      const result = LearnerObservationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const obs = result.data as LearnerObservation;
        expect(obs.kind).toBe('activity_completion');
      }
    });

    it('parses assessment_result observations', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'assessment_result' as const,
        moduleId: 'mod-001',
        rubricLevel: 'advanced' as const,
        score: 95,
        timeSpentMinutes: 40,
      };

      const result = LearnerObservationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const obs = result.data as LearnerObservation;
        expect(obs.kind).toBe('assessment_result');
      }
    });

    it('parses time_spent observations', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'time_spent' as const,
        minutes: 45,
        sessionDate: '2026-02-20',
      };

      const result = LearnerObservationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        const obs = result.data as LearnerObservation;
        expect(obs.kind).toBe('time_spent');
      }
    });

    it('parses pack lifecycle observations', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'pack_complete' as const,
      };

      const result = LearnerObservationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects unknown kind', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        timestamp: '2026-02-20T11:42:37.000Z',
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'unknown_observation',
      };

      const result = LearnerObservationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
