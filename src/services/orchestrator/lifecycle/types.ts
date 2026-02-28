/**
 * Type definitions for the lifecycle coordination module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - PhaseArtifacts (result of scanning a phase directory)
 * - ActionSuggestion (a single suggested next action)
 * - NextStepSuggestion (complete suggestion with alternatives and context)
 *
 * All schemas use .passthrough() for forward compatibility.
 */

import { z } from 'zod';
import { LifecycleStageSchema } from '../intent/types.js';

// ============================================================================
// Phase Artifacts
// ============================================================================

/**
 * Zod schema for the result of scanning a phase directory.
 *
 * Captures which artifact files exist (PLAN, SUMMARY, CONTEXT, RESEARCH,
 * UAT, VERIFICATION) and computes derived fields like unexecutedPlans.
 */
export const PhaseArtifactsSchema = z.object({
  /** Phase number string (e.g., '39') */
  phaseNumber: z.string(),
  /** Phase name slug (e.g., 'lifecycle-coordination') */
  phaseName: z.string(),
  /** Phase directory name (e.g., '39-lifecycle-coordination') */
  phaseDirectory: z.string(),
  /** Whether a CONTEXT.md file exists */
  hasContext: z.boolean(),
  /** Whether a RESEARCH.md file exists */
  hasResearch: z.boolean(),
  /** Plan IDs found (e.g., ['39-01', '39-02']) */
  planIds: z.array(z.string()),
  /** Summary IDs found (e.g., ['39-01']) */
  summaryIds: z.array(z.string()),
  /** Whether a UAT.md file exists */
  hasUat: z.boolean(),
  /** Whether a VERIFICATION.md file exists */
  hasVerification: z.boolean(),
  /** Total number of PLAN files */
  planCount: z.number(),
  /** Total number of SUMMARY files */
  summaryCount: z.number(),
  /** Plan IDs that do not have matching SUMMARY files */
  unexecutedPlans: z.array(z.string()),
}).passthrough();

export type PhaseArtifacts = z.infer<typeof PhaseArtifactsSchema>;

// ============================================================================
// Action Suggestion
// ============================================================================

/**
 * Zod schema for a single suggested action.
 *
 * Represents one GSD command the user should run next,
 * with reasoning and optional clear-context hint.
 */
export const ActionSuggestionSchema = z.object({
  /** GSD command name (e.g., 'gsd:execute-phase') */
  command: z.string(),
  /** Command arguments (e.g., '39') */
  args: z.string().optional(),
  /** Human-readable reason for this suggestion */
  reason: z.string(),
  /** Whether /clear is recommended before running this command */
  clearContext: z.boolean().optional(),
}).passthrough();

export type ActionSuggestion = z.infer<typeof ActionSuggestionSchema>;

// ============================================================================
// Next Step Suggestion
// ============================================================================

/**
 * Zod schema for a complete next-step suggestion.
 *
 * Includes a primary suggestion, alternatives, the current lifecycle
 * stage, and a human-readable context summary.
 */
export const NextStepSuggestionSchema = z.object({
  /** Primary recommended action */
  primary: ActionSuggestionSchema,
  /** Alternative actions the user could take */
  alternatives: z.array(ActionSuggestionSchema),
  /** Current lifecycle stage */
  stage: LifecycleStageSchema,
  /** Human-readable status/context summary */
  context: z.string(),
}).passthrough();

export type NextStepSuggestion = z.infer<typeof NextStepSuggestionSchema>;
