/**
 * Type definitions for the intake flow step tracker.
 *
 * Defines the ordered sequence of intake flow steps and the
 * persisted flow state structure. Step tracking enables crash
 * recovery (INTAKE-06) by recording progress to .meta.json.
 *
 * NOTE: This file is separate from types.ts (created by Plan 01)
 * to enable parallel execution. Plan 04 barrel consolidates all
 * type exports.
 *
 * @module staging/intake-flow/step-types
 */

/** Ordered intake flow steps -- a document progresses through each in sequence. */
export type IntakeFlowStep = 'staged' | 'hygiene' | 'assessed' | 'confirmed' | 'queued';

/** All intake flow steps in required execution order. */
export const INTAKE_FLOW_STEPS = [
  'staged',
  'hygiene',
  'assessed',
  'confirmed',
  'queued',
] as const;

/**
 * Persisted flow state for crash recovery.
 *
 * Stored in the document's .meta.json under the `intake_flow` key.
 * When a session crashes mid-intake, the system reads this state
 * and resumes from the last completed step.
 */
export interface IntakeFlowState {
  /** Where the flow is currently. */
  currentStep: IntakeFlowStep;
  /** Steps already finished (ordered). */
  completedSteps: IntakeFlowStep[];
  /** Persisted after assessment step (typed as unknown; orchestrator casts to ClarityAssessment). */
  assessment?: unknown;
  /** Summary persisted after hygiene step. */
  hygieneReport?: { overallRisk: string; findingCount: number };
  /** Set after "anything else?" confirmation (INTAKE-04). */
  userConfirmed?: boolean;
  /** Any extra context the user provided. */
  additionalContext?: string;
}
