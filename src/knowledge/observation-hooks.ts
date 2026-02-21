/**
 * Observation Emitter and Sink Registration
 *
 * ObservationEmitter provides a simple event system for learner observations.
 * Callers register sink functions via addSink(), then emit observations via
 * typed emit methods. The emitter auto-generates IDs and timestamps, validates
 * against schemas, and dispatches to all registered sinks.
 *
 * Error isolation: if one sink throws, other sinks still receive the event.
 *
 * Usage:
 *   const emitter = new ObservationEmitter()
 *   emitter.addSink(logObservation)
 *   emitter.addSink(uploadToAPI)
 *   const obs = emitter.emitActivityCompletion({ learnerId: '123', ... })
 */

import { randomUUID } from 'node:crypto';
import {
  ActivityCompletionSchema,
  AssessmentResultSchema,
  TimeSpentSchema,
  PackLifecycleSchema,
  LearnerObservationSchema,
  type LearnerObservation,
  type ActivityCompletion,
  type AssessmentResult,
  type TimeSpent,
  type PackLifecycle,
} from './observation-types.js';

// ============================================================================
// ObservationSink Type
// ============================================================================

/**
 * A sink is a function that receives a validated observation.
 *
 * Sinks are called synchronously after validation. If a sink throws,
 * the error is caught and logged, but other sinks still receive the event.
 */
export type ObservationSink = (observation: LearnerObservation) => void;

// ============================================================================
// ObservationEmitter Class
// ============================================================================

/**
 * Manages registered sinks and emits typed observations.
 *
 * Provides methods to:
 * - Register and unregister sink functions
 * - Emit activity completions, assessment results, time spent, lifecycle events
 * - Get current sink count
 * - Destroy the emitter (clear all sinks)
 *
 * Each emit method:
 * 1. Accepts observation data (without id, timestamp, kind)
 * 2. Auto-generates id (UUID) and timestamp (ISO 8601)
 * 3. Validates the complete observation with Zod schema
 * 4. Throws if validation fails
 * 5. Dispatches to all registered sinks
 * 6. Returns the validated observation
 */
export class ObservationEmitter {
  private sinks: ObservationSink[] = [];

  /**
   * Register a new sink. The same sink can be registered multiple times.
   */
  addSink(sink: ObservationSink): void {
    this.sinks.push(sink);
  }

  /**
   * Unregister a sink by reference equality. Removes only the first match.
   */
  removeSink(sink: ObservationSink): void {
    const index = this.sinks.indexOf(sink);
    if (index !== -1) {
      this.sinks.splice(index, 1);
    }
  }

  /**
   * Return the number of registered sinks.
   */
  getSinkCount(): number {
    return this.sinks.length;
  }

  /**
   * Emit an activity completion observation.
   *
   * Validates that data includes: learnerId, packId, activityId, moduleId,
   * durationMinutes, completed. Score is optional.
   *
   * @throws if validation fails
   * @returns the validated ActivityCompletion observation
   */
  emitActivityCompletion(
    data: Omit<ActivityCompletion, 'id' | 'timestamp' | 'kind'>,
  ): ActivityCompletion {
    const observation = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      kind: 'activity_completion' as const,
      ...data,
    };

    const result = ActivityCompletionSchema.safeParse(observation);
    if (!result.success) {
      throw new Error(`Activity completion validation failed: ${result.error.message}`);
    }

    this.dispatch(result.data);
    return result.data;
  }

  /**
   * Emit an assessment result observation.
   *
   * Validates that data includes: learnerId, packId, moduleId, rubricLevel,
   * score, timeSpentMinutes. strengths and areasForGrowth default to [].
   *
   * @throws if validation fails
   * @returns the validated AssessmentResult observation
   */
  emitAssessmentResult(
    data: Omit<
      Omit<AssessmentResult, 'id' | 'timestamp' | 'kind'>,
      'strengths' | 'areasForGrowth'
    > & {
      strengths?: string[];
      areasForGrowth?: string[];
    },
  ): AssessmentResult {
    const observation = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      kind: 'assessment_result' as const,
      ...data,
    };

    const result = AssessmentResultSchema.safeParse(observation);
    if (!result.success) {
      throw new Error(`Assessment result validation failed: ${result.error.message}`);
    }

    this.dispatch(result.data);
    return result.data;
  }

  /**
   * Emit a time spent observation.
   *
   * Validates that data includes: learnerId, packId, minutes, sessionDate.
   * moduleId and activityId are optional.
   *
   * @throws if validation fails
   * @returns the validated TimeSpent observation
   */
  emitTimeSpent(data: Omit<TimeSpent, 'id' | 'timestamp' | 'kind'>): TimeSpent {
    const observation = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      kind: 'time_spent' as const,
      ...data,
    };

    const result = TimeSpentSchema.safeParse(observation);
    if (!result.success) {
      throw new Error(`Time spent validation failed: ${result.error.message}`);
    }

    this.dispatch(result.data);
    return result.data;
  }

  /**
   * Emit a pack lifecycle observation (module_start, pack_start, or pack_complete).
   *
   * Caller specifies the 'kind' to determine which lifecycle event this is.
   *
   * @throws if validation fails
   * @returns the validated PackLifecycle observation
   */
  emitPackLifecycle(
    data: Omit<PackLifecycle, 'id' | 'timestamp'> &
      Partial<Pick<PackLifecycle, 'timestamp'>>,
  ): PackLifecycle {
    const observation: PackLifecycle = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...data,
    };

    const result = PackLifecycleSchema.safeParse(observation);
    if (!result.success) {
      throw new Error(`Pack lifecycle validation failed: ${result.error.message}`);
    }

    this.dispatch(result.data);
    return result.data;
  }

  /**
   * Dispatch observation to all registered sinks.
   *
   * Errors from individual sinks are caught and logged, but don't prevent
   * other sinks from receiving the event.
   *
   * @private
   */
  private dispatch(observation: LearnerObservation): void {
    for (const sink of this.sinks) {
      try {
        sink(observation);
      } catch (error) {
        // One bad sink must not block others. Log the error (silently in this impl).
        // In a real system, this might emit to an error handler or logger.
        console.error('Sink error:', error);
      }
    }
  }

  /**
   * Clear all registered sinks.
   *
   * After calling destroy(), the emitter still works but dispatches to no one
   * until sinks are re-registered via addSink().
   */
  destroy(): void {
    this.sinks = [];
  }
}
