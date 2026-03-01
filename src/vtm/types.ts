/**
 * VTM (Vision-to-Mission) complete type system.
 *
 * Defines Zod schemas for the entire VTM document hierarchy used across
 * all pipeline components. Every downstream module (parsers, validators,
 * assemblers, pipeline orchestrator) imports these types.
 *
 * Foundation schemas (Plan 01):
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
 * Composite schemas (Plan 02):
 * - ComponentSpecSchema: self-contained build instruction for one component
 * - WaveSummaryEntrySchema, WaveTaskSchema, TrackSchema, WaveSchema: wave sub-schemas
 * - WaveExecutionPlanSchema: multi-wave parallel execution plan
 * - TestCategorySchema, TestSpecSchema: test classification sub-schemas
 * - TestPlanSchema: categorized test plan with verification matrix
 * - MilestoneSpecSchema: milestone specification with component breakdown
 * - MissionPackageSchema: top-level aggregate composing all sub-documents
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
 * @justification Type: Accepted heuristic
 * Budget ranges map token tiers to operational limits. Each tier's boundaries
 * are derived from model context window sizes and empirical testing of skill
 * generation quality at each budget level.
 *
 * Default budget ranges encoding the 60/40 principle.
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
// ComponentSpec
// ============================================================================

/**
 * Validates component specification objects.
 *
 * Each component spec is a self-contained build instruction for a single
 * pipeline component. References ModelAssignmentSchema for model tier.
 *
 * Schema fields derived from component-spec-template.md:
 * - name: component name
 * - milestone: parent milestone name
 * - wave: wave/track placement (e.g., "Wave 1, Track A")
 * - modelAssignment: opus/sonnet/haiku tier
 * - estimatedTokens: positive token count
 * - dependencies: prior tasks/artifacts this needs
 * - produces: artifacts this creates
 * - objective: what this component does
 * - context: self-contained background for implementing agent
 * - technicalSpec: interface definitions and specs (min 1)
 * - implementationSteps: ordered atomic steps (min 1)
 * - testCases: tests that must pass before handoff (min 1)
 * - verificationGate: completion conditions and handoff instruction
 * - safetyBoundaries: optional must/mustNot/boundaryType constraints
 */
export const ComponentSpecSchema = z.object({
  name: z.string().min(1),
  milestone: z.string().min(1),
  wave: z.string().min(1),
  modelAssignment: ModelAssignmentSchema,
  estimatedTokens: z.number().positive(),
  dependencies: z.array(z.string()),
  produces: z.array(z.string()),
  objective: z.string().min(1),
  context: z.string().min(1),
  technicalSpec: z.array(z.object({
    name: z.string(),
    spec: z.string(),
  })).min(1),
  implementationSteps: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).min(1),
  testCases: z.array(z.object({
    name: z.string(),
    input: z.string(),
    expected: z.string(),
  })).min(1),
  verificationGate: z.object({
    conditions: z.array(z.string()).min(1),
    handoff: z.string(),
  }),
  safetyBoundaries: z.object({
    must: z.array(z.string()),
    mustNot: z.array(z.string()),
    boundaryType: z.enum(['annotate', 'gate', 'redirect']),
  }).optional(),
});

/** Component spec type inferred from schema. */
export type ComponentSpec = z.infer<typeof ComponentSpecSchema>;

// ============================================================================
// WaveExecutionPlan sub-schemas
// ============================================================================

/**
 * Validates wave summary table entries.
 *
 * Each entry provides an overview row for one wave:
 * - wave: wave number
 * - tasks: task count in this wave
 * - parallelTracks: number of parallel tracks
 * - estimatedTime: human-readable time estimate
 * - cacheDependencies: what prior waves this depends on
 */
export const WaveSummaryEntrySchema = z.object({
  wave: z.number(),
  tasks: z.number(),
  parallelTracks: z.number(),
  estimatedTime: z.string(),
  cacheDependencies: z.string(),
});

/** Wave summary entry type inferred from schema. */
export type WaveSummaryEntry = z.infer<typeof WaveSummaryEntrySchema>;

/**
 * Validates individual wave task entries.
 *
 * Each task has an ID, description, produces artifact, model assignment,
 * token estimate, and dependency list.
 */
export const WaveTaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  produces: z.string(),
  model: ModelAssignmentSchema,
  estimatedTokens: z.number(),
  dependsOn: z.array(z.string()),
});

/** Wave task type inferred from schema. */
export type WaveTask = z.infer<typeof WaveTaskSchema>;

/**
 * Validates parallel track entries within a wave.
 *
 * Each track groups tasks that share no mutable state.
 */
export const TrackSchema = z.object({
  name: z.string(),
  tasks: z.array(WaveTaskSchema).min(1),
});

/** Track type inferred from schema. */
export type Track = z.infer<typeof TrackSchema>;

/**
 * Validates wave entries in a wave execution plan.
 *
 * Each wave has a number, name, purpose, sequential flag,
 * at least one track, and an optional verification gate.
 */
export const WaveSchema = z.object({
  number: z.number(),
  name: z.string(),
  purpose: z.string(),
  isSequential: z.boolean(),
  tracks: z.array(TrackSchema).min(1),
  verificationGate: z.string().optional(),
});

/** Wave type inferred from schema. */
export type Wave = z.infer<typeof WaveSchema>;

/**
 * Validates complete wave execution plan objects.
 *
 * Schema fields derived from wave-execution-plan-template.md:
 * - milestoneName: parent milestone
 * - milestoneSpec: spec filename
 * - totalTasks: positive integer task count
 * - parallelTracks: non-negative track count
 * - sequentialDepth: positive integer wave count
 * - estimatedWallTime: human-readable time
 * - criticalPath: critical path description
 * - waveSummary: overview table (min 1)
 * - waves: detailed wave definitions (min 1)
 * - cacheOptimization: optional cache strategy
 * - dependencyGraph: optional ASCII DAG
 * - riskFactors: optional risk analysis
 */
export const WaveExecutionPlanSchema = z.object({
  milestoneName: z.string().min(1),
  milestoneSpec: z.string().min(1),
  totalTasks: z.number().int().positive(),
  parallelTracks: z.number().int().nonnegative(),
  sequentialDepth: z.number().int().positive(),
  estimatedWallTime: z.string().min(1),
  criticalPath: z.string().min(1),
  waveSummary: z.array(WaveSummaryEntrySchema).min(1),
  waves: z.array(WaveSchema).min(1),
  cacheOptimization: z.object({
    sharedSkillLoads: z.array(z.record(z.string(), z.unknown())),
    schemaReuse: z.array(z.record(z.string(), z.unknown())),
    preComputedKnowledge: z.array(z.record(z.string(), z.unknown())),
    tokenSavings: z.array(z.record(z.string(), z.unknown())),
  }).optional(),
  dependencyGraph: z.string().optional(),
  riskFactors: z.array(z.object({
    risk: z.string(),
    impact: z.string(),
    mitigation: z.string(),
  })).optional(),
});

/** Wave execution plan type inferred from schema. */
export type WaveExecutionPlan = z.infer<typeof WaveExecutionPlanSchema>;

// ============================================================================
// TestPlan sub-schemas
// ============================================================================

/**
 * Validates test category entries.
 *
 * Categories classify tests by severity and handling:
 * - name: category enum (safety-critical, core, integration, edge-case)
 * - count: number of tests in this category
 * - priority: handling priority (mandatory-pass, required, best-effort)
 * - failureAction: what to do on failure (block, log)
 */
export const TestCategorySchema = z.object({
  name: z.enum(['safety-critical', 'core', 'integration', 'edge-case']),
  count: z.number(),
  priority: z.enum(['mandatory-pass', 'required', 'best-effort']),
  failureAction: z.enum(['block', 'log']),
});

/** Test category type inferred from schema. */
export type TestCategory = z.infer<typeof TestCategorySchema>;

/**
 * Validates individual test specification entries.
 *
 * Test IDs follow the categorized pattern:
 * - S-NNN: safety-critical tests
 * - C-NNN: core functionality tests
 * - I-NNN: integration tests
 * - E-NNN: edge case tests
 */
export const TestSpecSchema = z.object({
  id: z.string().regex(/^[SCIE]-\d{3}$/),
  category: z.enum(['safety-critical', 'core', 'integration', 'edge-case']),
  verifies: z.string(),
  expectedBehavior: z.string(),
  component: z.string().optional(),
});

/** Test spec type inferred from schema. */
export type TestSpec = z.infer<typeof TestSpecSchema>;

/**
 * Validates complete test plan objects.
 *
 * Schema fields derived from test-plan-template.md:
 * - milestoneName: parent milestone
 * - milestoneSpec: spec filename
 * - visionDocument: vision doc filename
 * - totalTests: positive integer test count
 * - safetyCriticalCount: non-negative safety test count
 * - targetCoverage: 0-100 percentage
 * - categories: test category definitions (min 1)
 * - tests: individual test specs (min 1)
 * - verificationMatrix: criterion-to-test mapping (min 1)
 */
export const TestPlanSchema = z.object({
  milestoneName: z.string().min(1),
  milestoneSpec: z.string().min(1),
  visionDocument: z.string().min(1),
  totalTests: z.number().int().positive(),
  safetyCriticalCount: z.number().int().nonnegative(),
  targetCoverage: z.number().min(0).max(100),
  categories: z.array(TestCategorySchema).min(1),
  tests: z.array(TestSpecSchema).min(1),
  verificationMatrix: z.array(z.object({
    criterion: z.string(),
    testIds: z.array(z.string()).min(1),
    component: z.string().optional(),
  })).min(1),
});

/** Test plan type inferred from schema. */
export type TestPlan = z.infer<typeof TestPlanSchema>;

// ============================================================================
// MilestoneSpec
// ============================================================================

/**
 * Validates complete milestone specification objects.
 *
 * Schema fields derived from milestone-spec-template.md:
 * - name: milestone name
 * - date: YYYY-MM-DD format
 * - visionDocument: vision doc filename
 * - researchReference: optional research reference filename
 * - estimatedExecution: context windows, sessions, hours
 * - missionObjective: concrete "done" description
 * - architectureOverview: ASCII diagram and description
 * - systemLayers: optional named responsibility layers
 * - deliverables: numbered deliverables with acceptance criteria
 * - componentBreakdown: components with model assignments and token estimates
 * - modelRationale: percentage/component/reason per model tier
 * - crossComponentInterfaces: optional shared types/events/filesystem
 * - safetyBoundaries: optional non-negotiable constraints
 * - preComputedKnowledge: optional tiered knowledge loading strategy
 */
export const MilestoneSpecSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visionDocument: z.string().min(1),
  researchReference: z.string().optional(),
  estimatedExecution: z.object({
    contextWindows: z.number(),
    sessions: z.number(),
    hours: z.number(),
  }),
  missionObjective: z.string().min(1),
  architectureOverview: z.string().min(1),
  systemLayers: z.array(z.object({
    name: z.string(),
    responsibility: z.string(),
  })).optional(),
  deliverables: z.array(z.object({
    number: z.number().int().positive(),
    deliverable: z.string(),
    acceptanceCriteria: z.string(),
    componentSpec: z.string(),
  })),
  componentBreakdown: z.array(z.object({
    component: z.string(),
    specDocument: z.string(),
    dependencies: z.array(z.string()),
    model: ModelAssignmentSchema,
    estimatedTokens: z.number().positive(),
  })),
  modelRationale: z.object({
    opus: z.object({
      percentage: z.number(),
      components: z.array(z.string()),
      reason: z.string(),
    }),
    sonnet: z.object({
      percentage: z.number(),
      components: z.array(z.string()),
      reason: z.string(),
    }),
    haiku: z.object({
      percentage: z.number(),
      components: z.array(z.string()),
      reason: z.string(),
    }),
  }),
  crossComponentInterfaces: z.object({
    sharedTypes: z.string().optional(),
    eventSchema: z.string().optional(),
    filesystemContracts: z.string().optional(),
  }).optional(),
  safetyBoundaries: z.array(z.object({
    boundary: z.string(),
    reason: z.string(),
  })).optional(),
  preComputedKnowledge: z.array(z.object({
    tier: z.enum(['summary', 'active', 'reference']),
    size: z.string(),
    loadingStrategy: z.string(),
  })).optional(),
});

/** Milestone spec type inferred from schema. */
export type MilestoneSpec = z.infer<typeof MilestoneSpecSchema>;

// ============================================================================
// MissionPackage
// ============================================================================

/**
 * Validates complete mission package objects.
 *
 * The top-level aggregate that composes all VTM sub-documents:
 * - name: mission package name
 * - date: YYYY-MM-DD format
 * - status: ready/draft/in-progress
 * - visionDocument: vision doc filename
 * - researchReference: optional research reference filename
 * - milestoneSpec: composed MilestoneSpec object
 * - componentSpecs: array of composed ComponentSpec objects (min 1)
 * - waveExecutionPlan: composed WaveExecutionPlan object
 * - testPlan: composed TestPlan object
 * - executionSummary: aggregate metrics for the mission
 */
export const MissionPackageSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['ready', 'draft', 'in-progress']),
  visionDocument: z.string().min(1),
  researchReference: z.string().optional(),
  milestoneSpec: MilestoneSpecSchema,
  componentSpecs: z.array(ComponentSpecSchema).min(1),
  waveExecutionPlan: WaveExecutionPlanSchema,
  testPlan: TestPlanSchema,
  executionSummary: z.object({
    totalTasks: z.number(),
    parallelTracks: z.number(),
    sequentialDepth: z.number(),
    opusTasks: z.object({ count: z.number(), percentage: z.number() }),
    sonnetTasks: z.object({ count: z.number(), percentage: z.number() }),
    haikuTasks: z.object({ count: z.number(), percentage: z.number() }),
    estimatedContextWindows: z.number(),
    estimatedWallTime: z.string(),
    criticalPathSessions: z.number(),
    totalTests: z.number(),
    safetyCriticalTests: z.number(),
  }),
});

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
