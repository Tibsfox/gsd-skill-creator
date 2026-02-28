/**
 * Zod validation schema for milestone execution configuration.
 *
 * Defines the shape and constraints for all configurable settings
 * that control how a milestone is executed: execution mode, research
 * settings, planning granularity, verification strictness, resource
 * limits, and notification preferences.
 *
 * @module console/milestone-config
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema Sections
// ---------------------------------------------------------------------------

const MilestoneSection = z.object({
  /** Milestone name, 1-100 characters. */
  name: z.string().min(1).max(100),
  /** Optional filename of uploaded source document. */
  source_document: z.string().optional(),
  /** ISO 8601 timestamp of when this config was submitted. */
  submitted_at: z.string().min(1),
  /** Where this config was submitted from. */
  submitted_by: z.enum(['dashboard', 'cli']),
});

const PausePointsSection = z.object({
  after_planning: z.boolean().default(true),
  after_each_phase: z.boolean().default(true),
  after_verification: z.boolean().default(true),
});

const ExecutionSection = z.object({
  /** Execution mode: hitl (human-in-the-loop), supervised, or yolo. */
  mode: z.enum(['hitl', 'supervised', 'yolo']).default('supervised'),
  /** Shortcut flag: true when mode === 'yolo'. */
  yolo: z.boolean().default(false),
  /** Where to pause during execution. */
  pause_points: PausePointsSection.default({
    after_planning: true,
    after_each_phase: true,
    after_verification: true,
  }),
});

const ResearchSection = z.object({
  enabled: z.boolean().default(true),
  web_search: z.boolean().default(false),
  /** Maximum research time in minutes, 1-120. */
  max_research_time_minutes: z.number().int().min(1).max(120).default(30),
  skip_if_vision_sufficient: z.boolean().default(true),
});

const PlanningSection = z.object({
  auto_approve: z.boolean().default(false),
  /** How granularly the user reviews plans. */
  review_granularity: z.enum(['phase', 'plan', 'task']).default('phase'),
  /** Maximum plans per phase, 1-20. */
  max_plans_per_phase: z.number().int().min(1).max(20).default(10),
  require_tdd: z.boolean().default(true),
});

const VerificationSection = z.object({
  run_tests: z.boolean().default(true),
  type_check: z.boolean().default(true),
  lint: z.boolean().default(true),
  block_on_failure: z.boolean().default(true),
  /** Code coverage threshold percentage, 0-100. */
  coverage_threshold: z.number().int().min(0).max(100).default(80),
});

const ResourcesSection = z.object({
  /** Context window budget percentage, 1-100. */
  token_budget_pct: z.number().int().min(1).max(100).default(50),
  /** Maximum number of phases, 1-50. */
  max_phases: z.number().int().min(1).max(50).default(20),
  /** Maximum wall clock time in minutes, 1-1440 (24h). */
  max_wall_time_minutes: z.number().int().min(1).max(1440).default(480),
  /** Model selection preference. */
  model_preference: z.enum(['quality', 'balanced', 'speed']).default('quality'),
});

const NotificationsSection = z.object({
  on_phase_complete: z.boolean().default(true),
  on_question: z.boolean().default(true),
  on_error: z.boolean().default(true),
  on_milestone_complete: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Complete Schema
// ---------------------------------------------------------------------------

/**
 * Zod schema for milestone execution configuration.
 *
 * Usage:
 * ```typescript
 * const config = MilestoneConfigSchema.parse(rawData);
 * // config is now typed and validated with defaults applied
 * ```
 */
export const MilestoneConfigSchema = z.object({
  milestone: MilestoneSection,
  execution: ExecutionSection.default({
    mode: 'supervised',
    yolo: false,
    pause_points: {
      after_planning: true,
      after_each_phase: true,
      after_verification: true,
    },
  }),
  research: ResearchSection.default({
    enabled: true,
    web_search: false,
    max_research_time_minutes: 30,
    skip_if_vision_sufficient: true,
  }),
  planning: PlanningSection.default({
    auto_approve: false,
    review_granularity: 'phase',
    max_plans_per_phase: 10,
    require_tdd: true,
  }),
  verification: VerificationSection.default({
    run_tests: true,
    type_check: true,
    lint: true,
    block_on_failure: true,
    coverage_threshold: 80,
  }),
  resources: ResourcesSection.default({
    token_budget_pct: 50,
    max_phases: 20,
    max_wall_time_minutes: 480,
    model_preference: 'quality',
  }),
  notifications: NotificationsSection.default({
    on_phase_complete: true,
    on_question: true,
    on_error: true,
    on_milestone_complete: true,
  }),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * TypeScript type inferred from the Zod schema.
 * Use this for type annotations in consuming code.
 */
export type MilestoneConfig = z.infer<typeof MilestoneConfigSchema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Sensible default milestone configuration.
 *
 * Uses supervised mode, research enabled, TDD required,
 * 80% coverage threshold, quality model preference.
 */
export const DEFAULT_MILESTONE_CONFIG: MilestoneConfig = {
  milestone: {
    name: 'New Milestone',
    submitted_at: new Date().toISOString(),
    submitted_by: 'dashboard',
  },
  execution: {
    mode: 'supervised',
    yolo: false,
    pause_points: {
      after_planning: true,
      after_each_phase: true,
      after_verification: true,
    },
  },
  research: {
    enabled: true,
    web_search: false,
    max_research_time_minutes: 30,
    skip_if_vision_sufficient: true,
  },
  planning: {
    auto_approve: false,
    review_granularity: 'phase',
    max_plans_per_phase: 10,
    require_tdd: true,
  },
  verification: {
    run_tests: true,
    type_check: true,
    lint: true,
    block_on_failure: true,
    coverage_threshold: 80,
  },
  resources: {
    token_budget_pct: 50,
    max_phases: 20,
    max_wall_time_minutes: 480,
    model_preference: 'quality',
  },
  notifications: {
    on_phase_complete: true,
    on_question: true,
    on_error: true,
    on_milestone_complete: true,
  },
};
