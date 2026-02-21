/**
 * VTM foundation data type system.
 *
 * Defines Zod schemas for the foundation types used across all VTM
 * (Vision-to-Mission) pipeline components. Every downstream module
 * (parsers, validators, assemblers, pipeline) imports these types.
 *
 * Schemas:
 * - ModelAssignmentSchema: 3-value enum for model tier (opus, sonnet, haiku)
 * - TokenEstimateSchema: model + estimated tokens + context windows
 * - TokenBudgetConstraintSchema: min/max ranges per model tier (60/40 principle)
 * - BudgetAllocationSchema: actual percentage allocation for budget validation
 * - EvalGateSchema: evaluation gate with check, threshold, command, action
 * - ChipsetConfigSchema: chipset YAML structure with skills, agents, evaluation
 * - VisionModuleSchema: individual module within a vision document
 * - VisionDocumentSchema: full vision document structure with all sections
 * - ResearchTopicSchema: research topic with safety concerns and cross-references
 * - ResearchReferenceSchema: research reference with topics and bibliography
 *
 * All schemas use Zod for runtime validation with inferred TypeScript types
 * (zero type duplication).
 */

import { z } from 'zod';

// ============================================================================
// ModelAssignment
// ============================================================================

/** All valid model assignment values. */
export const MODEL_ASSIGNMENTS = ['opus', 'sonnet', 'haiku'] as const;

/**
 * Validates model assignment values.
 *
 * Constrains to exactly three model tiers:
 * - opus: judgment, creativity, architectural decisions
 * - sonnet: structural implementation, schemas, pipelines
 * - haiku: scaffold, boilerplate, config generation
 */
export const ModelAssignmentSchema = z.enum(MODEL_ASSIGNMENTS);

/** Model assignment type inferred from schema. */
export type ModelAssignment = z.infer<typeof ModelAssignmentSchema>;

// ============================================================================
// TokenEstimate
// ============================================================================

/**
 * Validates token estimation objects.
 *
 * Represents the estimated token usage for a single task assignment:
 * - model: which model tier handles this task
 * - estimatedTokens: positive number of tokens expected
 * - contextWindows: positive integer count of context windows needed
 */
export const TokenEstimateSchema = z.object({
  model: ModelAssignmentSchema,
  estimatedTokens: z.number().positive(),
  contextWindows: z.number().int().positive(),
});

/** Token estimate type inferred from schema. */
export type TokenEstimate = z.infer<typeof TokenEstimateSchema>;

// ============================================================================
// TokenBudgetConstraint
// ============================================================================

/**
 * Validates a min/max range pair for budget percentage bounds.
 */
const BudgetRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
});

/**
 * Validates token budget constraint objects encoding the 60/40 principle.
 *
 * Each model tier has a min/max percentage range:
 * - sonnet: 55-65% (primary workhorse)
 * - opus: 25-35% (judgment and creativity)
 * - haiku: 5-15% (scaffold and boilerplate)
 */
export const TokenBudgetConstraintSchema = z.object({
  sonnet: BudgetRangeSchema,
  opus: BudgetRangeSchema,
  haiku: BudgetRangeSchema,
});

/** Token budget constraint type inferred from schema. */
export type TokenBudgetConstraint = z.infer<typeof TokenBudgetConstraintSchema>;

/**
 * Default budget ranges encoding the 60/40 principle.
 *
 * Sonnet handles ~60% of work (structural implementation),
 * Opus handles ~30% (judgment/creativity),
 * Haiku handles ~10% (scaffold/boilerplate).
 */
export const BUDGET_RANGES: TokenBudgetConstraint = {
  sonnet: { min: 55, max: 65 },
  opus: { min: 25, max: 35 },
  haiku: { min: 5, max: 15 },
} as const;

// ============================================================================
// BudgetAllocation
// ============================================================================

/**
 * Validates actual budget allocation percentages.
 *
 * Used by downstream validators to check that real task distributions
 * fall within the TokenBudgetConstraint ranges.
 */
export const BudgetAllocationSchema = z.object({
  sonnetPercent: z.number(),
  opusPercent: z.number(),
  haikuPercent: z.number(),
});

/** Budget allocation type inferred from schema. */
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

// ============================================================================
// EvalGate
// ============================================================================

/**
 * Validates evaluation gate entries in chipset configuration.
 *
 * Each gate defines a quality check with optional threshold and command:
 * - check: name of the quality check (e.g., 'test_coverage', 'type_check')
 * - threshold: optional numeric threshold for the check
 * - command: optional CLI command to run for the check
 * - action: what to do on failure — block, warn, or log
 */
export const EvalGateSchema = z.object({
  check: z.string(),
  threshold: z.number().optional(),
  command: z.string().optional(),
  action: z.enum(['block', 'warn', 'log']),
});

/** Evaluation gate type inferred from schema. */
export type EvalGate = z.infer<typeof EvalGateSchema>;

// ============================================================================
// ChipsetConfig
// ============================================================================

/**
 * Validates chipset configuration objects.
 *
 * Represents the YAML chipset configuration section from vision documents:
 * - name: kebab-case identifier
 * - version: semantic version string (X.Y.Z)
 * - description: human-readable description
 * - skills: map of skill names to domain/description objects
 * - agents: topology enum + array of named agent roles
 * - evaluation: pre-deploy quality gates
 */
export const ChipsetConfigSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1),
  skills: z.record(z.string(), z.object({
    domain: z.string(),
    description: z.string(),
  })),
  agents: z.object({
    topology: z.enum(['pipeline', 'router', 'map-reduce', 'swarm', 'leader-worker']),
    agents: z.array(z.object({
      name: z.string(),
      role: z.string(),
    })).min(1),
  }),
  evaluation: z.object({
    gates: z.object({
      preDeploy: z.array(EvalGateSchema),
    }),
  }),
});

/** Chipset configuration type inferred from schema. */
export type ChipsetConfig = z.infer<typeof ChipsetConfigSchema>;

// ============================================================================
// VisionModule
// ============================================================================

/**
 * Validates individual module entries within a vision document.
 *
 * Each module represents a learning unit or component with:
 * - name: module identifier
 * - concepts: list of key concepts covered
 * - trySession: optional first-experience session (name + description)
 * - safetyConcerns: optional safety notes for the module
 */
export const VisionModuleSchema = z.object({
  name: z.string(),
  concepts: z.array(z.string()),
  trySession: z.object({
    name: z.string(),
    description: z.string(),
  }).optional(),
  safetyConcerns: z.string().optional(),
});

/** Vision module type inferred from schema. */
export type VisionModule = z.infer<typeof VisionModuleSchema>;

// ============================================================================
// VisionDocument
// ============================================================================

/**
 * Validates complete vision document objects.
 *
 * Schema fields derived from vision-template.md:
 * - name: pack/feature name
 * - date: YYYY-MM-DD format
 * - status: lifecycle status enum
 * - dependsOn: list of dependent docs/components
 * - context: 1-2 sentence scope statement
 * - vision: narrative section
 * - problemStatement: array of named problems (min 1)
 * - coreConcept: interaction model with optional diagram
 * - architecture: module map and connections
 * - modules: array of VisionModule entries
 * - chipsetConfig: embedded chipset configuration
 * - successCriteria: observable criteria (min 1)
 * - relationships: optional cross-document references
 * - throughLine: ecosystem alignment statement
 */
export const VisionDocumentSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['initial-vision', 'pre-research', 'research-complete', 'mission-ready']),
  dependsOn: z.array(z.string()),
  context: z.string().min(1),
  vision: z.string().min(1),
  problemStatement: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).min(1),
  coreConcept: z.object({
    interactionModel: z.string(),
    description: z.string(),
    diagram: z.string().optional(),
  }),
  architecture: z.object({
    moduleMap: z.string().optional(),
    connections: z.array(z.object({
      from: z.string(),
      to: z.string(),
      relationship: z.string(),
    })),
  }),
  modules: z.array(VisionModuleSchema),
  chipsetConfig: ChipsetConfigSchema,
  successCriteria: z.array(z.string()).min(1),
  relationships: z.array(z.object({
    document: z.string(),
    relationship: z.string(),
  })).optional(),
  throughLine: z.string().min(1),
});

/** Vision document type inferred from schema. */
export type VisionDocument = z.infer<typeof VisionDocumentSchema>;

// ============================================================================
// ResearchTopic
// ============================================================================

/**
 * Validates individual research topic entries.
 *
 * Each topic covers a domain area with:
 * - name: topic identifier
 * - foundation: evidence-based foundation content
 * - techniques: implementable techniques/specifications
 * - safetyConcerns: optional array of boundary classifications
 * - crossReferences: optional links to related topics
 */
export const ResearchTopicSchema = z.object({
  name: z.string(),
  foundation: z.string(),
  techniques: z.string(),
  safetyConcerns: z.array(z.object({
    condition: z.string(),
    recommendation: z.string(),
    boundaryType: z.enum(['annotate', 'gate', 'redirect']),
  })).optional(),
  crossReferences: z.array(z.string()).optional(),
});

/** Research topic type inferred from schema. */
export type ResearchTopic = z.infer<typeof ResearchTopicSchema>;

// ============================================================================
// ResearchReference
// ============================================================================

/**
 * Validates complete research reference objects.
 *
 * Schema fields derived from research-reference-template.md:
 * - name: reference document name
 * - date: YYYY-MM-DD format
 * - status: compilation lifecycle status
 * - sourceDocument: vision doc filename this references
 * - purpose: what this reference provides
 * - howToUse: usage instructions for mission agents
 * - sourceOrganizations: authoritative sources (min 1)
 * - topics: research topic entries (min 1)
 * - integrationNotes: optional cross-topic integration
 */
export const ResearchReferenceSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['research-compilation', 'draft', 'final']),
  sourceDocument: z.string().min(1),
  purpose: z.string().min(1),
  howToUse: z.string().min(1),
  sourceOrganizations: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).min(1),
  topics: z.array(ResearchTopicSchema).min(1),
  integrationNotes: z.object({
    sharedSafetyFramework: z.string().optional(),
    culturalSensitivity: z.string().optional(),
    bibliography: z.object({
      professional: z.array(z.string()),
      clinical: z.array(z.string()),
      technical: z.array(z.string()),
      historical: z.array(z.string()),
    }).optional(),
  }).optional(),
});

/** Research reference type inferred from schema. */
export type ResearchReference = z.infer<typeof ResearchReferenceSchema>;

// ============================================================================
// VTM_SCHEMAS convenience object
// ============================================================================

// ============================================================================
// ComponentSpec (stub — Plan 02)
// ============================================================================

/** Stub schema for ComponentSpec. Replaced in Plan 02 Task 2. */
export const ComponentSpecSchema = z.never();

/** Component spec type inferred from schema. */
export type ComponentSpec = z.infer<typeof ComponentSpecSchema>;

// ============================================================================
// WaveExecutionPlan sub-schemas (stubs — Plan 02)
// ============================================================================

/** Stub schema for WaveSummaryEntry. */
export const WaveSummaryEntrySchema = z.never();

/** Wave summary entry type inferred from schema. */
export type WaveSummaryEntry = z.infer<typeof WaveSummaryEntrySchema>;

/** Stub schema for WaveTask. */
export const WaveTaskSchema = z.never();

/** Wave task type inferred from schema. */
export type WaveTask = z.infer<typeof WaveTaskSchema>;

/** Stub schema for Track. */
export const TrackSchema = z.never();

/** Track type inferred from schema. */
export type Track = z.infer<typeof TrackSchema>;

/** Stub schema for Wave. */
export const WaveSchema = z.never();

/** Wave type inferred from schema. */
export type Wave = z.infer<typeof WaveSchema>;

/** Stub schema for WaveExecutionPlan. */
export const WaveExecutionPlanSchema = z.never();

/** Wave execution plan type inferred from schema. */
export type WaveExecutionPlan = z.infer<typeof WaveExecutionPlanSchema>;

// ============================================================================
// TestPlan sub-schemas (stubs — Plan 02)
// ============================================================================

/** Stub schema for TestCategory. */
export const TestCategorySchema = z.never();

/** Test category type inferred from schema. */
export type TestCategory = z.infer<typeof TestCategorySchema>;

/** Stub schema for TestSpec. */
export const TestSpecSchema = z.never();

/** Test spec type inferred from schema. */
export type TestSpec = z.infer<typeof TestSpecSchema>;

/** Stub schema for TestPlan. */
export const TestPlanSchema = z.never();

/** Test plan type inferred from schema. */
export type TestPlan = z.infer<typeof TestPlanSchema>;

// ============================================================================
// MilestoneSpec (stub — Plan 02)
// ============================================================================

/** Stub schema for MilestoneSpec. */
export const MilestoneSpecSchema = z.never();

/** Milestone spec type inferred from schema. */
export type MilestoneSpec = z.infer<typeof MilestoneSpecSchema>;

// ============================================================================
// MissionPackage (stub — Plan 02)
// ============================================================================

/** Stub schema for MissionPackage. */
export const MissionPackageSchema = z.never();

/** Mission package type inferred from schema. */
export type MissionPackage = z.infer<typeof MissionPackageSchema>;

// ============================================================================
// VTM_SCHEMAS convenience object
// ============================================================================

/**
 * Maps type name strings to their Zod schemas for programmatic
 * iteration and validation.
 */
export const VTM_SCHEMAS = {
  ModelAssignment: ModelAssignmentSchema,
  TokenEstimate: TokenEstimateSchema,
  TokenBudgetConstraint: TokenBudgetConstraintSchema,
  VisionDocument: VisionDocumentSchema,
  ResearchReference: ResearchReferenceSchema,
  ChipsetConfig: ChipsetConfigSchema,
  ComponentSpec: ComponentSpecSchema,
  WaveExecutionPlan: WaveExecutionPlanSchema,
  TestPlan: TestPlanSchema,
  MilestoneSpec: MilestoneSpecSchema,
  MissionPackage: MissionPackageSchema,
} as const;
