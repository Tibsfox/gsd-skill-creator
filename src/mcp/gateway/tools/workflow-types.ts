/**
 * Workflow tool type definitions for the GSD-OS MCP gateway.
 *
 * Defines structured result types for each GSD pipeline stage:
 * research, requirements, plan, and execute. All types have
 * companion Zod schemas for runtime validation.
 *
 * @module mcp/gateway/tools/workflow-types
 */

import { z } from 'zod';

// ── Workflow Stage ──────────────────────────────────────────────────────────

/** GSD pipeline stages available through the gateway. */
export const WorkflowStageSchema = z.enum([
  'research',
  'requirements',
  'plan',
  'execute',
]);

/** Workflow stage identifier. */
export type WorkflowStage = z.infer<typeof WorkflowStageSchema>;

// ── Research Result ─────────────────────────────────────────────────────────

/** A single research finding. */
export const ResearchFindingSchema = z.object({
  /** Finding title. */
  title: z.string(),
  /** Detailed description. */
  description: z.string(),
  /** Source of the finding. */
  source: z.string(),
  /** Relevance score (0-1). */
  relevance: z.number().min(0).max(1),
});

/** Research finding. */
export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;

/** Result from workflow.research. */
export const ResearchResultSchema = z.object({
  /** Project name. */
  project: z.string(),
  /** Domain researched. */
  domain: z.string(),
  /** Research depth level (1-3). */
  depth: z.number().int().min(1).max(3),
  /** Key findings. */
  findings: z.array(ResearchFindingSchema),
  /** High-level recommendations. */
  recommendations: z.array(z.string()),
  /** When the research was completed (epoch ms). */
  completedAt: z.number(),
});

/** Research result. */
export type ResearchResult = z.infer<typeof ResearchResultSchema>;

// ── Requirements Result ─────────────────────────────────────────────────────

/** Priority levels for requirements. */
export const RequirementPrioritySchema = z.enum(['must-have', 'should-have', 'nice-to-have']);

/** Requirement priority. */
export type RequirementPriority = z.infer<typeof RequirementPrioritySchema>;

/** A single generated requirement. */
export const RequirementItemSchema = z.object({
  /** Requirement ID (e.g., REQ-001). */
  id: z.string(),
  /** Category grouping. */
  category: z.string(),
  /** Requirement description. */
  description: z.string(),
  /** Priority level. */
  priority: RequirementPrioritySchema,
});

/** Requirement item. */
export type RequirementItem = z.infer<typeof RequirementItemSchema>;

/** Result from workflow.requirements. */
export const RequirementsResultSchema = z.object({
  /** Project name. */
  project: z.string(),
  /** Scope filter applied. */
  scope: z.string().nullable(),
  /** Generated requirements. */
  requirements: z.array(RequirementItemSchema),
  /** Category summary counts. */
  categories: z.record(z.string(), z.number()),
  /** When the requirements were generated (epoch ms). */
  completedAt: z.number(),
});

/** Requirements result. */
export type RequirementsResult = z.infer<typeof RequirementsResultSchema>;

// ── Plan Result ─────────────────────────────────────────────────────────────

/** A single phase in an execution plan. */
export const PlanPhaseSchema = z.object({
  /** Phase number. */
  phase: z.number().int(),
  /** Phase title. */
  title: z.string(),
  /** Assigned wave (for parallel execution). */
  wave: z.number().int().min(1),
  /** Estimated task count. */
  taskCount: z.number().int().min(0),
  /** Dependencies on other phases. */
  dependencies: z.array(z.number().int()),
});

/** Plan phase. */
export type PlanPhase = z.infer<typeof PlanPhaseSchema>;

/** Result from workflow.plan. */
export const PlanResultSchema = z.object({
  /** Project name. */
  project: z.string(),
  /** Phase filter applied (null = all phases). */
  phaseNumber: z.number().int().nullable(),
  /** Generated phases. */
  phases: z.array(PlanPhaseSchema),
  /** Total wave count. */
  totalWaves: z.number().int().min(1),
  /** Total estimated tasks. */
  totalTasks: z.number().int().min(0),
  /** When the plan was created (epoch ms). */
  completedAt: z.number(),
});

/** Plan result. */
export type PlanResult = z.infer<typeof PlanResultSchema>;

// ── Execute Result ──────────────────────────────────────────────────────────

/** Result of a single stage execution. */
export const StageExecutionSchema = z.object({
  /** Pipeline stage. */
  stage: WorkflowStageSchema,
  /** Whether the stage succeeded. */
  success: z.boolean(),
  /** Duration in milliseconds. */
  durationMs: z.number().int().min(0),
  /** Summary of what the stage produced. */
  summary: z.string(),
});

/** Stage execution result. */
export type StageExecution = z.infer<typeof StageExecutionSchema>;

/** Result from workflow.execute. */
export const ExecuteResultSchema = z.object({
  /** Project name. */
  project: z.string(),
  /** Whether this was a dry run. */
  dryRun: z.boolean(),
  /** Phase filter applied (null = all). */
  phaseFilter: z.number().int().nullable(),
  /** Stages executed (or planned for dry run). */
  stages: z.array(StageExecutionSchema),
  /** Overall success. */
  success: z.boolean(),
  /** Total duration in milliseconds. */
  totalDurationMs: z.number().int().min(0),
  /** When the execution completed (epoch ms). */
  completedAt: z.number(),
});

/** Execute result. */
export type ExecuteResult = z.infer<typeof ExecuteResultSchema>;

// ── Invocation Record ───────────────────────────────────────────────────────

/** Record of a workflow stage invocation. */
export const WorkflowInvocationSchema = z.object({
  /** Unique invocation ID. */
  id: z.string().uuid(),
  /** Project name. */
  project: z.string(),
  /** Stage executed. */
  stage: WorkflowStageSchema,
  /** When the invocation occurred (epoch ms). */
  timestamp: z.number(),
  /** Whether the invocation succeeded. */
  success: z.boolean(),
});

/** Workflow invocation record. */
export type WorkflowInvocation = z.infer<typeof WorkflowInvocationSchema>;
