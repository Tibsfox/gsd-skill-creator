/**
 * Tests for AMIGA EventEnvelope bridge for knowledge pack interaction events.
 *
 * Validates KnowledgeEventBridge converts LearnerObservation records to
 * valid AMIGA EventEnvelope format with proper event type mapping, priority
 * escalation, and correlation tracking.
 */

import { describe, it, expect } from 'vitest';
import { KnowledgeEventBridge, KNOWLEDGE_EVENT_TYPES } from '../event-bridge.js';
import type { LearnerObservation } from '../observation-types.js';
import { EventEnvelopeSchema } from '../../../amiga/message-envelope.js';

// ============================================================================
// Test Observation Fixtures
// ============================================================================

/**
 * Inline LearnerObservation shape matching 254-01 schema.
 * These fixtures stand in for the observation-types that will be created
 * in the parallel 254-01 plan.
 */

const createActivityCompletion = (): LearnerObservation => ({
  id: 'obs-ac-001',
  timestamp: new Date().toISOString(),
  learnerId: 'learner-001',
  packId: 'MATH-101',
  kind: 'activity_completion' as const,
  activityId: 'activity-m1-a1',
  moduleId: 'MATH-M1',
  durationMinutes: 25,
  completed: true,
  score: 85,
});

const createAssessmentResult = (): LearnerObservation => ({
  id: 'obs-ar-001',
  timestamp: new Date().toISOString(),
  learnerId: 'learner-001',
  packId: 'MATH-101',
  kind: 'assessment_result' as const,
  moduleId: 'MATH-M1',
  rubricLevel: 'proficient' as const,
  score: 78,
  timeSpentMinutes: 15,
  strengths: ['pattern recognition'],
  areasForGrowth: ['symbolic notation'],
});

const createTimeSpent = (): LearnerObservation => ({
  id: 'obs-ts-001',
  timestamp: new Date().toISOString(),
  learnerId: 'learner-001',
  packId: 'MATH-101',
  kind: 'time_spent' as const,
  moduleId: 'MATH-M1',
  activityId: 'activity-m1-a1',
  minutes: 45,
  sessionDate: '2026-02-20',
});

const createModuleStart = (): LearnerObservation =>
  ({
    id: 'obs-ms-001',
    timestamp: new Date().toISOString(),
    learnerId: 'learner-001',
    packId: 'MATH-101',
    kind: 'module_start',
  }) as LearnerObservation;

const createPackStart = (): LearnerObservation => ({
  id: 'obs-ps-001',
  timestamp: new Date().toISOString(),
  learnerId: 'learner-001',
  packId: 'MATH-101',
  kind: 'pack_start' as const,
});

const createPackComplete = (): LearnerObservation => ({
  id: 'obs-pc-001',
  timestamp: new Date().toISOString(),
  learnerId: 'learner-001',
  packId: 'MATH-101',
  kind: 'pack_complete' as const,
});

// ============================================================================
// Tests
// ============================================================================

describe('KnowledgeEventBridge', () => {
  // ========================================================================
  // KNOWLEDGE_EVENT_TYPES Mapping
  // ========================================================================

  describe('KNOWLEDGE_EVENT_TYPES', () => {
    it('maps all 6 observation kinds to KNOWLEDGE_ prefixed strings', () => {
      expect(KNOWLEDGE_EVENT_TYPES.activity_completion).toBe(
        'KNOWLEDGE_ACTIVITY_COMPLETED',
      );
      expect(KNOWLEDGE_EVENT_TYPES.assessment_result).toBe(
        'KNOWLEDGE_ASSESSMENT_RECORDED',
      );
      expect(KNOWLEDGE_EVENT_TYPES.time_spent).toBe('KNOWLEDGE_TIME_LOGGED');
      expect(KNOWLEDGE_EVENT_TYPES.module_start).toBe(
        'KNOWLEDGE_MODULE_STARTED',
      );
      expect(KNOWLEDGE_EVENT_TYPES.pack_start).toBe('KNOWLEDGE_PACK_STARTED');
      expect(KNOWLEDGE_EVENT_TYPES.pack_complete).toBe(
        'KNOWLEDGE_PACK_COMPLETED',
      );
    });
  });

  // ========================================================================
  // Constructor
  // ========================================================================

  describe('constructor', () => {
    it('defaults to OPS-1 source and broadcast destination', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.source).toBe('OPS-1');
      expect(envelope.destination).toBe('broadcast');
    });

    it('accepts custom source and destination', () => {
      const bridge = new KnowledgeEventBridge({
        source: 'ME-1',
        destination: 'GL-1',
      });
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.source).toBe('ME-1');
      expect(envelope.destination).toBe('GL-1');
    });
  });

  // ========================================================================
  // toEnvelope - activity_completion
  // ========================================================================

  describe('toEnvelope - activity_completion', () => {
    it('creates envelope with correct event type and payload', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.type).toBe('KNOWLEDGE_ACTIVITY_COMPLETED');
      expect(envelope.source).toBe('OPS-1');
      expect(envelope.destination).toBe('broadcast');
      expect(envelope.priority).toBe('normal');
      expect(envelope.payload.packId).toBe('MATH-101');
      expect(envelope.payload.activityId).toBe('activity-m1-a1');
      expect(envelope.payload.moduleId).toBe('MATH-M1');
      expect(envelope.payload.durationMinutes).toBe(25);
      expect(envelope.payload.completed).toBe(true);
      expect(envelope.payload.score).toBe(85);
    });

    it('sets correlation ID to packId', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.correlation).toBe('MATH-101');
    });

    it('generates UUID id field', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(typeof envelope.id).toBe('string');
      expect(envelope.id.length).toBeGreaterThan(0);
    });

    it('includes ISO 8601 timestamp', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
      );
    });

    it('sets requires_ack to false', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createActivityCompletion();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.requires_ack).toBe(false);
    });
  });

  // ========================================================================
  // toEnvelope - assessment_result
  // ========================================================================

  describe('toEnvelope - assessment_result', () => {
    it('creates envelope with correct event type and payload', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createAssessmentResult();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.type).toBe('KNOWLEDGE_ASSESSMENT_RECORDED');
      expect(envelope.priority).toBe('normal');
      expect(envelope.payload.moduleId).toBe('MATH-M1');
      expect(envelope.payload.rubricLevel).toBe('proficient');
      expect(envelope.payload.score).toBe(78);
      expect(envelope.payload.timeSpentMinutes).toBe(15);
    });

    it('preserves array fields in payload', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createAssessmentResult();
      const envelope = bridge.toEnvelope(obs);

      expect(Array.isArray(envelope.payload.strengths)).toBe(true);
      expect(Array.isArray(envelope.payload.areasForGrowth)).toBe(true);
    });
  });

  // ========================================================================
  // toEnvelope - pack_complete (priority escalation)
  // ========================================================================

  describe('toEnvelope - pack_complete (priority escalation)', () => {
    it('sets priority to high for pack_complete events', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createPackComplete();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.type).toBe('KNOWLEDGE_PACK_COMPLETED');
      expect(envelope.priority).toBe('high');
    });

    it('sets priority to normal for non-pack_complete events', () => {
      const bridge = new KnowledgeEventBridge();

      const timeSpentEnv = bridge.toEnvelope(createTimeSpent());
      expect(timeSpentEnv.priority).toBe('normal');

      const moduleStartEnv = bridge.toEnvelope(createModuleStart());
      expect(moduleStartEnv.priority).toBe('normal');

      const assessmentEnv = bridge.toEnvelope(createAssessmentResult());
      expect(assessmentEnv.priority).toBe('normal');
    });
  });

  // ========================================================================
  // toEnvelope - time_spent
  // ========================================================================

  describe('toEnvelope - time_spent', () => {
    it('creates envelope with correct event type', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createTimeSpent();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.type).toBe('KNOWLEDGE_TIME_LOGGED');
      expect(envelope.payload.minutes).toBe(45);
      expect(envelope.payload.sessionDate).toBe('2026-02-20');
    });
  });

  // ========================================================================
  // toEnvelope - module_start and pack_start
  // ========================================================================

  describe('toEnvelope - module_start and pack_start', () => {
    it('creates envelope for module_start', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createModuleStart();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.type).toBe('KNOWLEDGE_MODULE_STARTED');
      expect(envelope.priority).toBe('normal');
    });

    it('creates envelope for pack_start', () => {
      const bridge = new KnowledgeEventBridge();
      const obs = createPackStart();
      const envelope = bridge.toEnvelope(obs);

      expect(envelope.type).toBe('KNOWLEDGE_PACK_STARTED');
      expect(envelope.priority).toBe('normal');
    });
  });

  // ========================================================================
  // toEnvelopes Batch Conversion
  // ========================================================================

  describe('toEnvelopes', () => {
    it('converts multiple observations to envelopes', () => {
      const bridge = new KnowledgeEventBridge();
      const observations = [
        createActivityCompletion(),
        createAssessmentResult(),
        createPackComplete(),
      ];

      const envelopes = bridge.toEnvelopes(observations);

      expect(envelopes).toHaveLength(3);
      expect(envelopes[0].type).toBe('KNOWLEDGE_ACTIVITY_COMPLETED');
      expect(envelopes[1].type).toBe('KNOWLEDGE_ASSESSMENT_RECORDED');
      expect(envelopes[2].type).toBe('KNOWLEDGE_PACK_COMPLETED');
    });

    it('returns envelopes in same order as input', () => {
      const bridge = new KnowledgeEventBridge();
      const observations = [
        createAssessmentResult(),
        createTimeSpent(),
        createActivityCompletion(),
      ];

      const envelopes = bridge.toEnvelopes(observations);

      expect(envelopes[0].type).toBe('KNOWLEDGE_ASSESSMENT_RECORDED');
      expect(envelopes[1].type).toBe('KNOWLEDGE_TIME_LOGGED');
      expect(envelopes[2].type).toBe('KNOWLEDGE_ACTIVITY_COMPLETED');
    });
  });

  // ========================================================================
  // Schema Validation
  // ========================================================================

  describe('EventEnvelopeSchema validation', () => {
    it('produces envelopes that pass schema validation', () => {
      const bridge = new KnowledgeEventBridge();
      const observations = [
        createActivityCompletion(),
        createAssessmentResult(),
        createTimeSpent(),
        createModuleStart(),
        createPackStart(),
        createPackComplete(),
      ];

      for (const obs of observations) {
        const envelope = bridge.toEnvelope(obs);
        const result = EventEnvelopeSchema.safeParse(envelope);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBeDefined();
          expect(result.data.timestamp).toBeDefined();
          expect(result.data.source).toBeDefined();
          expect(result.data.destination).toBeDefined();
          expect(result.data.type).toBeDefined();
          expect(result.data.priority).toBeDefined();
          expect(result.data.payload).toBeDefined();
          expect(result.data.correlation).toBeDefined();
          expect(result.data.requires_ack).toBeDefined();
        }
      }
    });

    it('batch-produced envelopes all pass validation', () => {
      const bridge = new KnowledgeEventBridge();
      const observations = [
        createActivityCompletion(),
        createAssessmentResult(),
        createPackComplete(),
      ];

      const envelopes = bridge.toEnvelopes(observations);

      for (const envelope of envelopes) {
        const result = EventEnvelopeSchema.safeParse(envelope);
        expect(result.success).toBe(true);
      }
    });
  });

  // ========================================================================
  // Custom Routing
  // ========================================================================

  describe('custom source and destination', () => {
    it('applies custom source and destination to all converted envelopes', () => {
      const bridge = new KnowledgeEventBridge({
        source: 'ME-1',
        destination: 'GL-1',
      });

      const observations = [
        createActivityCompletion(),
        createAssessmentResult(),
      ];

      const envelopes = bridge.toEnvelopes(observations);

      for (const envelope of envelopes) {
        expect(envelope.source).toBe('ME-1');
        expect(envelope.destination).toBe('GL-1');
      }
    });
  });
});
