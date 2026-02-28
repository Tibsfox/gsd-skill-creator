/**
 * Self-Improvement Lifecycle -- core type system.
 *
 * Zod schemas and inferred TypeScript types for the retrospective domain.
 * Plan 01 creates template generation and changelog watch; Plan 02 creates
 * calibration delta, action generator, and observation harvester. All modules
 * import their type shapes from this file.
 *
 * Only allowed import: zod.
 *
 * @module retro/types
 */

import { z } from 'zod';

// ============================================================================
// FeatureClassification enum
// ============================================================================

/**
 * How a Claude Code changelog feature relates to GSD workflows.
 *
 * - LEVERAGE_NOW: feature is available and directly useful
 * - PLAN_FOR: feature is in beta/preview, plan integration
 * - WATCH: feature is planned/future, monitor for readiness
 */
export const FeatureClassification = z.enum(['LEVERAGE_NOW', 'PLAN_FOR', 'WATCH']);
export type FeatureClassification = z.infer<typeof FeatureClassification>;

// ============================================================================
// ChangelogEntry
// ============================================================================

/**
 * A single feature extracted from a Claude Code changelog.
 *
 * Changelog watch parses markdown changelogs, extracts feature bullets, and
 * classifies each into one of three categories for retrospective reporting.
 */
export const ChangelogEntrySchema = z.object({
  /** Feature name (extracted from bold text or first sentence) */
  name: z.string(),

  /** Classification category for this feature */
  classification: FeatureClassification,

  /** Description of impact on GSD workflows */
  impact: z.string(),

  /** Concrete next step to take for this feature */
  action: z.string(),

  /** Version where feature appeared */
  version: z.string().optional(),
});

export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

// ============================================================================
// ChangelogWatchResult
// ============================================================================

/**
 * Complete result of a changelog watch run.
 *
 * Captures the version range observed and all classified features found
 * in that range. Persisted as JSON alongside the retrospective.
 */
export const ChangelogWatchResultSchema = z.object({
  /** Claude version at milestone start */
  version_start: z.string(),

  /** Claude version at milestone end */
  version_end: z.string(),

  /** ISO date when the watch was performed */
  checked_at: z.string(),

  /** Classified features found in the changelog */
  features: z.array(ChangelogEntrySchema),
});

export type ChangelogWatchResult = z.infer<typeof ChangelogWatchResultSchema>;

// ============================================================================
// MilestoneMetrics
// ============================================================================

/**
 * Quantitative metrics captured at milestone completion.
 *
 * Every milestone produces a metrics snapshot. The template generator renders
 * these as a comparison table; the calibration delta engine computes
 * estimated-vs-actual ratios from them.
 */
export const MilestoneMetricsSchema = z.object({
  /** Milestone display name (e.g., "v1.39 -- GSD-OS Bootstrap & READY Prompt") */
  milestone_name: z.string(),

  /** Milestone version string (e.g., "v1.39") */
  milestone_version: z.string(),

  /** ISO date when milestone was completed */
  completion_date: z.string(),

  /** Actual wall-clock time in minutes */
  wall_time_minutes: z.number(),

  /** Estimated wall-clock time in minutes (from planning) */
  estimated_wall_time_minutes: z.number(),

  /** Total tokens consumed across all models */
  total_tokens: z.number(),

  /** Tokens consumed by Opus model */
  opus_tokens: z.number(),

  /** Tokens consumed by Sonnet model */
  sonnet_tokens: z.number(),

  /** Tokens consumed by Haiku model */
  haiku_tokens: z.number(),

  /** Number of context windows used */
  context_windows: z.number(),

  /** Number of sessions */
  sessions: z.number(),

  /** Number of phases executed */
  phases: z.number(),

  /** Number of plans executed */
  plans: z.number(),

  /** Number of commits created */
  commits: z.number(),

  /** Number of tests written */
  tests_written: z.number(),

  /** Number of tests passing */
  tests_passing: z.number(),

  /** Total requirements in milestone */
  requirements_total: z.number(),

  /** Requirements met/verified */
  requirements_met: z.number(),

  /** Source lines of code produced */
  source_loc: z.number(),
});

export type MilestoneMetrics = z.infer<typeof MilestoneMetricsSchema>;

// ============================================================================
// CalibrationDelta
// ============================================================================

/**
 * Estimated-vs-actual comparison for a single metric.
 *
 * The calibration delta engine computes these for every metric that has an
 * estimated counterpart. The ratio drives direction classification:
 * - over (ratio > 1.1): actual exceeded estimate
 * - under (ratio < 0.9): actual fell short of estimate
 * - accurate (0.9 <= ratio <= 1.1): estimate was on target
 */
export const CalibrationDeltaSchema = z.object({
  /** Name of the metric being compared */
  metric_name: z.string(),

  /** Estimated value (from planning) */
  estimated: z.number(),

  /** Actual value (measured) */
  actual: z.number(),

  /** Ratio: actual / estimated */
  ratio: z.number(),

  /** Direction classification based on ratio */
  direction: z.enum(['over', 'under', 'accurate']),
});

export type CalibrationDelta = z.infer<typeof CalibrationDeltaSchema>;

// ============================================================================
// ActionItem
// ============================================================================

/**
 * A concrete action for the next milestone, generated from retrospective data.
 *
 * Action items are sourced from calibration deltas (estimation adjustments),
 * changelog features (leverage/adopt decisions), observations (new skills),
 * or manual input during the retrospective.
 */
export const ActionItemSchema = z.object({
  /** What needs to be done */
  description: z.string(),

  /** Where this action item originated */
  source: z.enum(['calibration', 'changelog', 'observation', 'manual']),

  /** Priority level (high items are addressed first) */
  priority: z.enum(['high', 'medium', 'low']),

  /** Optional owner for the action item */
  owner: z.string().optional(),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

// ============================================================================
// RetroTemplateData
// ============================================================================

/**
 * Complete data package for retrospective template generation.
 *
 * Combines metrics, changelog analysis, calibration deltas, observations,
 * and human-input sections into a single structure that the template
 * generator renders into RETROSPECTIVE.md.
 */
export const RetroTemplateDataSchema = z.object({
  /** Milestone metrics snapshot */
  metrics: MilestoneMetricsSchema,

  /** Changelog watch result (optional if no changelog available) */
  changelog: ChangelogWatchResultSchema.optional(),

  /** Calibration deltas for all metric pairs */
  calibration_deltas: z.array(CalibrationDeltaSchema),

  /** Skill-creator observations from session data */
  observations: z.object({
    new_patterns: z.array(z.string()),
    skill_suggestions: z.array(z.string()),
    promotion_candidates: z.array(z.string()),
  }),

  /** Action items for next milestone */
  action_items: z.array(ActionItemSchema),

  /** Human-input: what went well (filled during retrospective) */
  what_went_well: z.array(z.string()).default([]),

  /** Human-input: what didn't go well (filled during retrospective) */
  what_didnt_go_well: z.array(z.string()).default([]),

  /** Human-input: lessons learned (filled during retrospective) */
  lessons_learned: z.array(z.string()).default([]),
});

export type RetroTemplateData = z.infer<typeof RetroTemplateDataSchema>;
