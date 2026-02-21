/**
 * Knowledge Pack Zod schemas and TypeScript types.
 *
 * Shared type definitions for the GSD Foundational Knowledge Pack runtime.
 * This file is the single source of truth for all knowledge pack data shapes.
 * Schemas faithfully mirror the .skillmeta YAML format defined in the
 * delivery package (SKILLMETA-FORMAT.md).
 *
 * Other modules in src/knowledge/ import from here.
 */

import { z } from 'zod';

// ============================================================================
// PackStatusSchema
// ============================================================================

/**
 * Pack lifecycle status.
 *
 * - alpha: initial development, structure may change
 * - beta: content complete, undergoing review
 * - stable: reviewed, tested, ready for learners
 * - deprecated: superseded or no longer maintained
 */
export const PackStatusSchema = z.enum(['alpha', 'beta', 'stable', 'deprecated']);

export type PackStatus = z.infer<typeof PackStatusSchema>;

// ============================================================================
// PackClassificationSchema
// ============================================================================

/**
 * Pack classification tier.
 *
 * - core_academic: foundational subjects (math, science, language, etc.)
 * - applied: practical skills (coding, design, music, etc.)
 * - specialized: deep-dive or niche topics (astronomy, philosophy, etc.)
 */
export const PackClassificationSchema = z.enum(['core_academic', 'applied', 'specialized']);

export type PackClassification = z.infer<typeof PackClassificationSchema>;

// ============================================================================
// GradeLevelEntrySchema
// ============================================================================

/**
 * A grade-level band with estimated learning hours.
 *
 * Supports labels like Foundation, Elementary, Middle School, High School,
 * College. Grades array contains string identifiers (PreK, K, 1-16).
 * Estimated hours is a [min, max] tuple.
 */
export const GradeLevelEntrySchema = z.object({
  label: z.string(),
  grades: z.array(z.string()),
  estimated_hours: z.tuple([z.number(), z.number()]).or(z.array(z.number())),
});

export type GradeLevelEntry = z.infer<typeof GradeLevelEntrySchema>;

// ============================================================================
// ContributorSchema
// ============================================================================

/**
 * A contributor to a knowledge pack (author, reviewer, etc.).
 */
export const ContributorSchema = z.object({
  name: z.string(),
  role: z.string(),
});

export type Contributor = z.infer<typeof ContributorSchema>;

// ============================================================================
// LearningOutcomeSchema
// ============================================================================

/**
 * A measurable learning outcome with a code, description, and applicable
 * grade levels.
 */
export const LearningOutcomeSchema = z.object({
  code: z.string(),
  description: z.string(),
  levels: z.array(z.string()),
});

export type LearningOutcome = z.infer<typeof LearningOutcomeSchema>;

// ============================================================================
// ModuleTimeEstimatesSchema
// ============================================================================

/**
 * Estimated hours per grade-level band within a module.
 * All fields optional since not every module covers every band.
 */
export const ModuleTimeEstimatesSchema = z
  .object({
    foundation: z.number(),
    elementary: z.number(),
    middle: z.number(),
    high: z.number(),
  })
  .partial();

export type ModuleTimeEstimates = z.infer<typeof ModuleTimeEstimatesSchema>;

// ============================================================================
// ModuleActivitiesSchema
// ============================================================================

/**
 * Summary of activities within a module: count and example names.
 */
export const ModuleActivitiesSchema = z.object({
  count: z.number(),
  examples: z.array(z.string()),
});

export type ModuleActivities = z.infer<typeof ModuleActivitiesSchema>;

// ============================================================================
// PackModuleSchema
// ============================================================================

/**
 * A module within a knowledge pack. Modules are the primary organizational
 * unit, containing learning outcomes, topics, activities, and assessments.
 */
export const PackModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  learning_outcomes: z.array(z.string()),
  topics: z.array(z.string()),
  grade_levels: z.array(z.string()),
  time_estimates: ModuleTimeEstimatesSchema,
  prerequisite_modules: z.array(z.string()),
  activities: ModuleActivitiesSchema.optional(),
  assessments: z.array(z.string()).optional(),
});

export type PackModule = z.infer<typeof PackModuleSchema>;

// ============================================================================
// PackActivitySchema
// ============================================================================

/**
 * A concrete learning activity tied to a module. Includes grade range,
 * duration, materials, and optional variations for differentiation.
 */
export const PackActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  module_id: z.string(),
  grade_range: z.array(z.string()),
  duration_minutes: z.number(),
  description: z.string(),
  materials: z.array(z.string()),
  learning_objectives: z.array(z.string()),
  variations: z.array(z.string()).optional(),
});

export type PackActivity = z.infer<typeof PackActivitySchema>;

// ============================================================================
// AssessmentMethodSchema
// ============================================================================

/**
 * An assessment method (formative or summative) with name and frequency.
 */
export const AssessmentMethodSchema = z.object({
  type: z.enum(['formative', 'summative']),
  name: z.string(),
  frequency: z.string(),
});

export type AssessmentMethod = z.infer<typeof AssessmentMethodSchema>;

// ============================================================================
// PackDependencySchema
// ============================================================================

/**
 * A dependency relationship between packs. Captures pack_id, relationship
 * type (prerequisite, enables, etc.), and optional description.
 */
export const PackDependencySchema = z.object({
  pack_id: z.string(),
  relationship: z.string(),
  description: z.string().optional(),
});

export type PackDependency = z.infer<typeof PackDependencySchema>;

// ============================================================================
// LearningPathwaySchema
// ============================================================================

/**
 * A recommended pathway through modules within a pack, with rationale
 * for why this ordering benefits learners.
 */
export const LearningPathwaySchema = z.object({
  name: z.string(),
  description: z.string(),
  rationale: z.string(),
});

export type LearningPathway = z.infer<typeof LearningPathwaySchema>;

// ============================================================================
// CrossModuleCompetencySchema
// ============================================================================

/**
 * A competency that spans multiple modules (e.g., mathematical
 * communication, problem-solving flexibility).
 */
export const CrossModuleCompetencySchema = z.object({
  name: z.string(),
  description: z.string(),
  assessed_in: z.array(z.string()),
});

export type CrossModuleCompetency = z.infer<typeof CrossModuleCompetencySchema>;

// ============================================================================
// ToolSchema
// ============================================================================

/**
 * A tool (required or optional) for a knowledge pack. May include a URL
 * for external tools or an integrated flag for built-in tools.
 */
export const ToolSchema = z.object({
  name: z.string(),
  url: z.string().optional().nullable(),
  integrated: z.boolean().optional(),
  description: z.string().optional(),
});

export type Tool = z.infer<typeof ToolSchema>;

// ============================================================================
// InteractiveElementSchema
// ============================================================================

/**
 * An interactive element type within a pack (manipulative, simulator,
 * visualization, game, etc.).
 */
export const InteractiveElementSchema = z.object({
  type: z.string(),
  name: z.string(),
});

export type InteractiveElement = z.infer<typeof InteractiveElementSchema>;

// ============================================================================
// TranslationEntrySchema
// ============================================================================

/**
 * A single translation with language code, name, completion status, and
 * optional progress percentage.
 */
export const TranslationEntrySchema = z.object({
  language_code: z.string(),
  name: z.string(),
  complete: z.boolean(),
  progress: z.string().optional(),
});

export type TranslationEntry = z.infer<typeof TranslationEntrySchema>;

// ============================================================================
// TranslationSchema
// ============================================================================

/**
 * Translation availability for a pack: completed/in-progress translations
 * and planned language targets.
 */
export const TranslationSchema = z.object({
  available: z.array(TranslationEntrySchema),
  planned: z.array(z.string()).optional(),
});

export type Translation = z.infer<typeof TranslationSchema>;

// ============================================================================
// AccessibilitySchema
// ============================================================================

/**
 * Accessibility features of a knowledge pack. All boolean fields are
 * optional to allow incremental disclosure.
 */
export const AccessibilitySchema = z
  .object({
    screen_reader_compatible: z.boolean(),
    large_text_available: z.boolean(),
    high_contrast_available: z.boolean(),
    keyboard_navigable: z.boolean(),
    alt_text_provided: z.boolean(),
    captions_available: z.boolean(),
  })
  .partial()
  .extend({
    notes: z.string().optional(),
  });

export type Accessibility = z.infer<typeof AccessibilitySchema>;

// ============================================================================
// StandardAlignmentSchema
// ============================================================================

/**
 * Alignment to an educational standard framework (e.g., Common Core, NCTM).
 * Alignments record maps standard codes to descriptions (strings) or
 * boolean coverage flags.
 */
export const StandardAlignmentSchema = z.object({
  framework: z.string(),
  version: z.union([z.number(), z.string()]),
  alignments: z.record(z.string(), z.string().or(z.boolean())),
});

export type StandardAlignment = z.infer<typeof StandardAlignmentSchema>;

// ============================================================================
// DifficultySchema
// ============================================================================

/**
 * Difficulty rating for a knowledge pack across conceptual, technical,
 * and prerequisite dimensions.
 */
export const DifficultySchema = z
  .object({
    conceptual_demand: z.string(),
    technical_demand: z.string(),
    prerequisites_required: z.string(),
  })
  .partial()
  .extend({
    notes: z.string().optional(),
  });

export type Difficulty = z.infer<typeof DifficultySchema>;

// ============================================================================
// ContentFlagSchema
// ============================================================================

/**
 * A content warning or flag with description and mitigation strategy.
 */
export const ContentFlagSchema = z.object({
  flag: z.string(),
  description: z.string(),
  mitigation: z.string(),
});

export type ContentFlag = z.infer<typeof ContentFlagSchema>;

// ============================================================================
// CommunitySchema
// ============================================================================

/**
 * Community and contribution information for a knowledge pack.
 */
export const CommunitySchema = z.object({
  discussion_forum: z.string().optional(),
  contribution_guidelines: z.string().optional(),
  open_issues_tag: z.string().optional(),
  looking_for: z.array(z.string()).optional(),
});

export type Community = z.infer<typeof CommunitySchema>;

// ============================================================================
// MaintenanceSchema
// ============================================================================

/**
 * Maintenance schedule and review history for a knowledge pack.
 */
export const MaintenanceSchema = z.object({
  review_frequency: z.string(),
  last_reviewed: z.string().optional(),
  next_review: z.string().optional(),
  maintainer: z.string().optional(),
});

export type Maintenance = z.infer<typeof MaintenanceSchema>;

// ============================================================================
// MetricsSchema
// ============================================================================

/**
 * Usage metrics for a knowledge pack. All fields are optional and nullable
 * since metrics are collected over time.
 */
export const MetricsSchema = z
  .object({
    active_learners: z.number().nullable(),
    completion_rate: z.number().nullable(),
    satisfaction_rating: z.number().nullable(),
  })
  .partial();

export type Metrics = z.infer<typeof MetricsSchema>;

// ============================================================================
// ResourceSchema
// ============================================================================

/**
 * An external resource (textbook, online course, video, etc.) recommended
 * alongside a knowledge pack.
 */
export const ResourceSchema = z.object({
  type: z.string(),
  title: z.string(),
  author: z.string().optional(),
  url: z.string().nullable().optional(),
});

export type Resource = z.infer<typeof ResourceSchema>;

// ============================================================================
// RelatedPackSchema
// ============================================================================

/**
 * A related knowledge pack with a description of the relationship.
 */
export const RelatedPackSchema = z.object({
  id: z.string(),
  relationship: z.string(),
});

export type RelatedPack = z.infer<typeof RelatedPackSchema>;

// ============================================================================
// ChangelogEntrySchema
// ============================================================================

/**
 * A changelog entry recording version, date, and list of changes.
 */
export const ChangelogEntrySchema = z.object({
  version: z.string(),
  date: z.string(),
  changes: z.array(z.string()),
});

export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

// ============================================================================
// QaSchema
// ============================================================================

/**
 * Quality assurance status for a knowledge pack. Boolean fields track
 * completion of various review processes.
 */
export const QaSchema = z
  .object({
    peer_reviewed: z.boolean(),
    tested_with_learners: z.boolean(),
    culturally_responsive: z.boolean(),
    bias_audit_completed: z.boolean(),
    accessibility_audit_completed: z.boolean(),
  })
  .partial()
  .extend({
    next_audit_scheduled: z.string().optional(),
  });

export type Qa = z.infer<typeof QaSchema>;

// ============================================================================
// GsdIntegrationSchema
// ============================================================================

/**
 * GSD-OS integration configuration: dashboard display, activity scaffolding,
 * skill-creator integration, adaptive pacing, and prompt caching keys.
 */
export const GsdIntegrationSchema = z.object({
  dashboard_display: z
    .object({
      icon: z.string(),
      color: z.string(),
      position: z.string(),
    })
    .optional(),
  activity_scaffolding: z.boolean().optional(),
  skill_creator_enabled: z.boolean().optional(),
  adaptive_pacing: z.boolean().optional(),
  cache_keys: z.array(z.string()).optional(),
});

export type GsdIntegration = z.infer<typeof GsdIntegrationSchema>;

// ============================================================================
// PackFilesSchema
// ============================================================================

/**
 * File references within a knowledge pack directory. All fields optional
 * since not every pack includes every file type.
 */
export const PackFilesSchema = z
  .object({
    vision_document: z.string(),
    modules_definition: z.string(),
    activities: z.string(),
    assessment: z.string(),
    resources: z.string(),
    readme: z.string(),
  })
  .partial();

export type PackFiles = z.infer<typeof PackFilesSchema>;

// ============================================================================
// KnowledgePackSchema
// ============================================================================

/**
 * The main knowledge pack schema. Represents the full .skillmeta YAML
 * structure from the delivery package. This is the root schema that
 * composes all supporting schemas above.
 */
export const KnowledgePackSchema = z.object({
  pack_id: z.string(),
  pack_name: z.string(),
  version: z.string(),
  release_date: z.string().optional(),
  status: PackStatusSchema,
  classification: PackClassificationSchema,
  learning_domain: z.string().optional(),
  description: z.string(),
  short_description: z.string().optional(),
  contributors: z.array(ContributorSchema),
  copyright: z.string(),
  maintained_by: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  prerequisite_packs: z.array(z.string()).default([]),
  recommended_prior_knowledge: z.array(z.string()).default([]),
  enables: z.array(z.string()).default([]),
  grade_levels: z.array(GradeLevelEntrySchema),
  modules: z.array(PackModuleSchema).default([]),
  learning_outcomes: z.array(LearningOutcomeSchema).default([]),
  assessment_methods: z.array(AssessmentMethodSchema).default([]),
  tools_required: z.array(ToolSchema).default([]),
  tools_optional: z.array(ToolSchema).default([]),
  interactive_elements: z.array(InteractiveElementSchema).default([]),
  translations: TranslationSchema.optional(),
  accessibility: AccessibilitySchema.optional(),
  standards_alignment: z.array(StandardAlignmentSchema).default([]),
  difficulty: DifficultySchema.optional(),
  content_flags: z.array(ContentFlagSchema).default([]),
  community: CommunitySchema.optional(),
  maintenance: MaintenanceSchema.optional(),
  metrics: MetricsSchema.optional(),
  tags: z.array(z.string()),
  resources: z.array(ResourceSchema).default([]),
  related_packs: z.array(RelatedPackSchema).default([]),
  gsd_integration: GsdIntegrationSchema,
  files: PackFilesSchema.optional(),
  changelog: z.array(ChangelogEntrySchema).default([]),
  qa: QaSchema.optional(),
});

export type KnowledgePack = z.infer<typeof KnowledgePackSchema>;

// ============================================================================
// ModulesFileSchema
// ============================================================================

/**
 * Schema for the modules.yaml file structure. Contains the pack's module
 * definitions, cross-module competencies, progression pathways, parallel
 * learning patterns, and skill-creator integration points.
 */
export const ModulesFileSchema = z.object({
  pack_id: z.string(),
  pack_name: z.string(),
  modules: z.array(PackModuleSchema),
  cross_module_competencies: z.array(CrossModuleCompetencySchema).default([]),
  progression_pathways: z.array(LearningPathwaySchema).default([]),
  parallel_patterns: z
    .array(
      z.object({
        pattern: z.string(),
        description: z.string(),
        cached: z.boolean().optional(),
      }),
    )
    .default([]),
  skill_creator_integration: z
    .object({
      observation_points: z.array(z.string()).default([]),
      pattern_detection: z.array(z.string()).default([]),
      skill_promotion: z.array(z.string()).default([]),
    })
    .optional(),
});

export type ModulesFile = z.infer<typeof ModulesFileSchema>;
