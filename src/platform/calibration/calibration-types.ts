/**
 * Type definitions for calibration event collection.
 *
 * Calibration events record skill activation decisions and user outcomes
 * to enable threshold calibration and accuracy benchmarking.
 */
import { z } from 'zod';

/**
 * Calibration event outcome inferred from user behavior.
 * - 'continued': User continued with the activation (accepted)
 * - 'corrected': User corrected/rejected the activation
 * - 'unknown': Session ended or outcome unclear
 */
export type CalibrationOutcome = 'continued' | 'corrected' | 'unknown';

/**
 * Skill score snapshot at time of activation decision.
 */
export interface SkillScore {
  /** Name of the skill */
  skillName: string;
  /** Raw cosine similarity score (0-1) */
  similarity: number;
  /** Whether the skill would activate based on threshold at time */
  wouldActivate: boolean;
}

/**
 * A calibration event recording an activation decision and outcome.
 */
export interface CalibrationEvent {
  /** Unique identifier (UUID) */
  id: string;
  /** ISO timestamp when event was recorded */
  timestamp: string;
  /** User prompt text that triggered activation */
  prompt: string;
  /** All skill confidence scores at decision time */
  skillScores: SkillScore[];
  /** Which skill activated (null = none matched threshold) */
  activatedSkill: string | null;
  /** User behavior outcome after activation */
  outcome: CalibrationOutcome;
  /** Optional session grouping identifier */
  sessionId?: string;
  /** Threshold used for this activation decision (0-1) */
  threshold: number;
}

/**
 * Input for recording a calibration event (id/timestamp auto-generated).
 */
export type CalibrationEventInput = Omit<CalibrationEvent, 'id' | 'timestamp'>;

// Zod schemas for validation

/**
 * Schema for CalibrationOutcome enum validation.
 */
export const CalibrationOutcomeSchema = z.enum(['continued', 'corrected', 'unknown']);

/**
 * Schema for SkillScore validation.
 */
export const SkillScoreSchema = z.object({
  skillName: z.string().min(1),
  similarity: z.number().min(0).max(1),
  wouldActivate: z.boolean(),
});

/**
 * Schema for CalibrationEvent validation.
 */
export const CalibrationEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  prompt: z.string().min(1),
  skillScores: z.array(SkillScoreSchema),
  activatedSkill: z.string().nullable(),
  outcome: CalibrationOutcomeSchema,
  sessionId: z.string().optional(),
  threshold: z.number().min(0).max(1),
});

/**
 * Schema for CalibrationEventInput validation (without id/timestamp).
 */
export const CalibrationEventInputSchema = CalibrationEventSchema.omit({
  id: true,
  timestamp: true,
});
