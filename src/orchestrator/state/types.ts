/**
 * Type definitions for GSD state reading module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - Phase and plan info (from ROADMAP.md)
 * - Parsed roadmap, state, and project data
 * - GSD configuration (from config.json)
 * - Composite ProjectState combining all artifacts
 *
 * All object schemas use .passthrough() for forward compatibility
 * with new fields added in future GSD versions.
 */

import { z } from 'zod';

// ============================================================================
// Roadmap Types
// ============================================================================

/**
 * Information about a single phase from ROADMAP.md.
 *
 * Extracted from the `## Phases` checkbox list:
 * - [x] **Phase 36: Discovery Foundation** (Complete 2026-02-08) - Description
 */
export const PhaseInfoSchema = z.object({
  number: z.string(),
  name: z.string(),
  complete: z.boolean(),
  completedInfo: z.string().optional(),
  description: z.string().optional(),
  directory: z.string().optional(),
  capabilities: z.array(z.object({
    verb: z.string(),
    type: z.string(),
    name: z.string(),
  }).passthrough()).optional(),
}).passthrough();

export type PhaseInfo = z.infer<typeof PhaseInfoSchema>;

/**
 * Information about a single plan within a phase from ROADMAP.md.
 *
 * Extracted from phase detail sections:
 * - [x] 36-01-PLAN.md -- Description of the plan
 */
export const PlanInfoSchema = z.object({
  id: z.string(),
  complete: z.boolean(),
  description: z.string().optional(),
}).passthrough();

export type PlanInfo = z.infer<typeof PlanInfoSchema>;

/**
 * Parsed ROADMAP.md content.
 *
 * Contains the phase list and a map of plan lists keyed by phase number.
 */
export const ParsedRoadmapSchema = z.object({
  phases: z.array(PhaseInfoSchema),
  plansByPhase: z.record(z.string(), z.array(PlanInfoSchema)),
  capabilitiesByPhase: z.record(z.string(), z.array(z.object({
    verb: z.string(),
    type: z.string(),
    name: z.string(),
  }).passthrough())).optional(),
}).passthrough();

export type ParsedRoadmap = z.infer<typeof ParsedRoadmapSchema>;

// ============================================================================
// State Types
// ============================================================================

/**
 * Current position within the project lifecycle.
 *
 * Extracted from STATE.md `## Current Position` section.
 */
export const CurrentPositionSchema = z.object({
  phase: z.number().nullable(),
  totalPhases: z.number().nullable(),
  phaseName: z.string().nullable(),
  phaseStatus: z.string().nullable(),
  plan: z.number().nullable(),
  totalPlans: z.number().nullable(),
  status: z.string().nullable(),
  progressPercent: z.number().nullable(),
  lastActivity: z.string().nullable(),
}).passthrough();

export type CurrentPosition = z.infer<typeof CurrentPositionSchema>;

/**
 * Parsed STATE.md content.
 *
 * Contains current position, accumulated decisions, blockers,
 * pending todos, and session continuity fields.
 */
export const ParsedStateSchema = z.object({
  position: CurrentPositionSchema,
  decisions: z.array(z.string()),
  blockers: z.array(z.string()),
  pendingTodos: z.array(z.string()),
  sessionContinuity: z.object({
    lastSession: z.string().nullable(),
    stoppedAt: z.string().nullable(),
    resumeFile: z.string().nullable(),
  }),
}).passthrough();

export type ParsedState = z.infer<typeof ParsedStateSchema>;

// ============================================================================
// Project Types
// ============================================================================

/**
 * Parsed PROJECT.md content.
 *
 * Contains project identity, core value, current milestone, and description.
 */
export const ParsedProjectSchema = z.object({
  name: z.string().nullable(),
  coreValue: z.string().nullable(),
  currentMilestone: z.string().nullable(),
  description: z.string().nullable(),
}).passthrough();

export type ParsedProject = z.infer<typeof ParsedProjectSchema>;

// ============================================================================
// Config Types
// ============================================================================

/**
 * GSD configuration from config.json.
 *
 * All fields have defaults so partial configs are handled gracefully.
 * The parallelization field is a union of boolean and object to support
 * both simple `true`/`false` and advanced `{ max_parallel: N }` forms.
 */
export const GsdConfigSchema = z.object({
  mode: z.string().default('interactive'),
  verbosity: z.number().int().min(1).max(5).default(3),
  depth: z.string().default('standard'),
  model_profile: z.string().default('balanced'),
  parallelization: z.union([
    z.boolean(),
    z.object({
      max_parallel: z.number().optional(),
    }).passthrough(),
  ]).default(false),
  commit_docs: z.boolean().default(true),
  workflow: z.object({
    research: z.boolean().default(true),
    plan_check: z.boolean().default(true),
    verifier: z.boolean().default(true),
  }).passthrough().default(() => ({ research: true, plan_check: true, verifier: true })),
  gates: z.object({
    require_plan_approval: z.boolean().default(false),
    require_checkpoint_approval: z.boolean().default(true),
  }).passthrough().default(() => ({ require_plan_approval: false, require_checkpoint_approval: true })),
  safety: z.object({
    max_files_per_commit: z.number().default(20),
    require_tests: z.boolean().default(true),
  }).passthrough().default(() => ({ max_files_per_commit: 20, require_tests: true })),
  git: z.object({
    auto_commit: z.boolean().default(true),
    commit_style: z.string().default('conventional'),
  }).passthrough().default(() => ({ auto_commit: true, commit_style: 'conventional' })),
}).passthrough();

export type GsdConfig = z.infer<typeof GsdConfigSchema>;

// ============================================================================
// Composite ProjectState
// ============================================================================

/**
 * Complete project state combining all .planning/ artifacts.
 *
 * This is the top-level type that downstream consumers (intent
 * classification, lifecycle coordination, CLI) interact with.
 */
export const ProjectStateSchema = z.object({
  initialized: z.boolean(),
  config: GsdConfigSchema,
  position: CurrentPositionSchema.nullable(),
  phases: z.array(PhaseInfoSchema),
  plansByPhase: z.record(z.string(), z.array(PlanInfoSchema)),
  project: ParsedProjectSchema.nullable(),
  state: ParsedStateSchema.nullable(),
  hasRoadmap: z.boolean(),
  hasState: z.boolean(),
  hasProject: z.boolean(),
  hasConfig: z.boolean(),
}).passthrough();

export type ProjectState = z.infer<typeof ProjectStateSchema>;

// ============================================================================
// Utility
// ============================================================================

/**
 * Read a file safely, returning null for missing or empty files.
 *
 * @param filePath - Absolute path to the file
 * @returns File content as trimmed string, or null if missing/empty
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  const { readFile } = await import('node:fs/promises');
  try {
    const content = await readFile(filePath, 'utf-8');
    const trimmed = content.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}
