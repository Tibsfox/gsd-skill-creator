/**
 * Tests for ObservationEmitter class.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ObservationEmitter, type ObservationSink } from '../observation-hooks.js';
import { type LearnerObservation } from '../observation-types.js';

describe('ObservationEmitter', () => {
  let emitter: ObservationEmitter;

  beforeEach(() => {
    emitter = new ObservationEmitter();
  });

  describe('constructor and sink management', () => {
    it('creates emitter with zero sinks', () => {
      expect(emitter.getSinkCount()).toBe(0);
    });

    it('addSink increases sink count', () => {
      const sink = () => {};
      emitter.addSink(sink);
      expect(emitter.getSinkCount()).toBe(1);
    });

    it('addSink allows duplicate registrations', () => {
      const sink = () => {};
      emitter.addSink(sink);
      emitter.addSink(sink);
      expect(emitter.getSinkCount()).toBe(2);
    });

    it('removeSink decreases count by 1 on first match', () => {
      const sink = () => {};
      emitter.addSink(sink);
      emitter.addSink(sink);
      expect(emitter.getSinkCount()).toBe(2);

      emitter.removeSink(sink);
      expect(emitter.getSinkCount()).toBe(1);

      emitter.removeSink(sink);
      expect(emitter.getSinkCount()).toBe(0);
    });

    it('removeSink is no-op for unknown sink', () => {
      const sink1 = () => {};
      const sink2 = () => {};
      emitter.addSink(sink1);

      emitter.removeSink(sink2);
      expect(emitter.getSinkCount()).toBe(1);
    });

    it('destroy clears all sinks', () => {
      emitter.addSink(() => {});
      emitter.addSink(() => {});
      emitter.destroy();
      expect(emitter.getSinkCount()).toBe(0);
    });
  });

  describe('emitActivityCompletion', () => {
    it('creates observation with auto id and timestamp', () => {
      const observations: LearnerObservation[] = [];
      emitter.addSink((obs) => observations.push(obs));

      const emitted = emitter.emitActivityCompletion({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      });

      expect(emitted.id).toBeTruthy();
      expect(emitted.id.length).toBeGreaterThan(0);
      expect(emitted.timestamp).toBeTruthy();
      expect(emitted.kind).toBe('activity_completion');
      expect(observations.length).toBe(1);
      expect(observations[0]).toEqual(emitted);
    });

    it('returns typed ActivityCompletion observation', () => {
      const emitted = emitter.emitActivityCompletion({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
        score: 85,
      });

      expect(emitted.kind).toBe('activity_completion');
      expect(emitted.score).toBe(85);
    });

    it('throws on invalid data', () => {
      expect(() => {
        emitter.emitActivityCompletion({
          learnerId: 'learner-123',
          packId: 'MATH-101',
          moduleId: 'mod-001',
          durationMinutes: -5, // invalid: must be nonnegative
          completed: true,
        } as any);
      }).toThrow();
    });

    it('dispatches to all registered sinks', () => {
      const calls1: LearnerObservation[] = [];
      const calls2: LearnerObservation[] = [];
      emitter.addSink((obs) => calls1.push(obs));
      emitter.addSink((obs) => calls2.push(obs));

      emitter.emitActivityCompletion({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      });

      expect(calls1.length).toBe(1);
      expect(calls2.length).toBe(1);
      expect(calls1[0].kind).toBe('activity_completion');
      expect(calls2[0].kind).toBe('activity_completion');
    });
  });

  describe('emitAssessmentResult', () => {
    it('creates assessment result with correct kind', () => {
      const observations: LearnerObservation[] = [];
      emitter.addSink((obs) => observations.push(obs));

      const emitted = emitter.emitAssessmentResult({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        moduleId: 'mod-001',
        rubricLevel: 'proficient',
        score: 78,
        timeSpentMinutes: 30,
      });

      expect(emitted.kind).toBe('assessment_result');
      expect(emitted.rubricLevel).toBe('proficient');
      expect(observations.length).toBe(1);
    });

    it('defaults strengths and areasForGrowth', () => {
      const emitted = emitter.emitAssessmentResult({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        moduleId: 'mod-001',
        rubricLevel: 'developing',
        score: 60,
        timeSpentMinutes: 20,
      });

      expect(emitted.strengths).toEqual([]);
      expect(emitted.areasForGrowth).toEqual([]);
    });

    it('throws on invalid rubricLevel', () => {
      expect(() => {
        emitter.emitAssessmentResult({
          learnerId: 'learner-123',
          packId: 'MATH-101',
          moduleId: 'mod-001',
          rubricLevel: 'excellent' as any,
          score: 95,
          timeSpentMinutes: 30,
        });
      }).toThrow();
    });
  });

  describe('emitTimeSpent', () => {
    it('creates time spent observation with correct kind', () => {
      const observations: LearnerObservation[] = [];
      emitter.addSink((obs) => observations.push(obs));

      const emitted = emitter.emitTimeSpent({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        minutes: 45,
        sessionDate: '2026-02-20',
      });

      expect(emitted.kind).toBe('time_spent');
      expect(emitted.minutes).toBe(45);
      expect(observations.length).toBe(1);
    });

    it('accepts optional moduleId and activityId', () => {
      const emitted = emitter.emitTimeSpent({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        moduleId: 'mod-001',
        activityId: 'act-001',
        minutes: 20,
        sessionDate: '2026-02-20',
      });

      expect(emitted.moduleId).toBe('mod-001');
      expect(emitted.activityId).toBe('act-001');
    });

    it('throws on zero minutes', () => {
      expect(() => {
        emitter.emitTimeSpent({
          learnerId: 'learner-123',
          packId: 'MATH-101',
          minutes: 0,
          sessionDate: '2026-02-20',
        });
      }).toThrow();
    });
  });

  describe('emitPackLifecycle', () => {
    it('emits pack_start event', () => {
      const observations: LearnerObservation[] = [];
      emitter.addSink((obs) => observations.push(obs));

      const emitted = emitter.emitPackLifecycle({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'pack_start',
      });

      expect(emitted.kind).toBe('pack_start');
      expect(observations.length).toBe(1);
    });

    it('emits pack_complete event', () => {
      const observations: LearnerObservation[] = [];
      emitter.addSink((obs) => observations.push(obs));

      const emitted = emitter.emitPackLifecycle({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'pack_complete',
      });

      expect(emitted.kind).toBe('pack_complete');
      expect(observations.length).toBe(1);
    });

    it('emits module_start event', () => {
      const observations: LearnerObservation[] = [];
      emitter.addSink((obs) => observations.push(obs));

      const emitted = emitter.emitPackLifecycle({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        kind: 'module_start',
      });

      expect(emitted.kind).toBe('module_start');
      expect(observations.length).toBe(1);
    });
  });

  describe('dispatch error isolation', () => {
    it('failing sink does not prevent other sinks from receiving event', () => {
      const calls: LearnerObservation[] = [];
      const failingSink = () => {
        throw new Error('Sink error');
      };
      const goodSink = (obs: LearnerObservation) => {
        calls.push(obs);
      };

      emitter.addSink(failingSink);
      emitter.addSink(goodSink);

      // Should not throw even though first sink fails
      expect(() => {
        emitter.emitActivityCompletion({
          learnerId: 'learner-123',
          packId: 'MATH-101',
          activityId: 'act-001',
          moduleId: 'mod-001',
          durationMinutes: 25,
          completed: true,
        });
      }).not.toThrow();

      // Good sink still received the event
      expect(calls.length).toBe(1);
    });

    it('multiple sinks all receive event despite errors', () => {
      const goodCalls: LearnerObservation[] = [];
      const goodCalls2: LearnerObservation[] = [];

      const failingSink = () => {
        throw new Error('Sink error');
      };
      const goodSink1 = (obs: LearnerObservation) => {
        goodCalls.push(obs);
      };
      const goodSink2 = (obs: LearnerObservation) => {
        goodCalls2.push(obs);
      };

      emitter.addSink(goodSink1);
      emitter.addSink(failingSink);
      emitter.addSink(goodSink2);

      emitter.emitActivityCompletion({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      });

      expect(goodCalls.length).toBe(1);
      expect(goodCalls2.length).toBe(1);
    });
  });

  describe('destroy', () => {
    it('clears all sinks', () => {
      emitter.addSink(() => {});
      emitter.addSink(() => {});
      expect(emitter.getSinkCount()).toBe(2);

      emitter.destroy();
      expect(emitter.getSinkCount()).toBe(0);
    });

    it('subsequent emits dispatch to no one', () => {
      const calls: LearnerObservation[] = [];
      emitter.addSink((obs) => calls.push(obs));
      emitter.destroy();

      emitter.emitActivityCompletion({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      });

      expect(calls.length).toBe(0);
    });

    it('allows re-registering sinks after destroy', () => {
      const calls: LearnerObservation[] = [];
      emitter.addSink(() => {});
      emitter.destroy();
      emitter.addSink((obs) => calls.push(obs));

      emitter.emitActivityCompletion({
        learnerId: 'learner-123',
        packId: 'MATH-101',
        activityId: 'act-001',
        moduleId: 'mod-001',
        durationMinutes: 25,
        completed: true,
      });

      expect(calls.length).toBe(1);
    });
  });
});
