/**
 * Knowledge Pack Runtime -- public API barrel.
 *
 * Re-exports the complete public surface from all src/knowledge/ modules.
 * Downstream consumers should import from 'src/knowledge/index.js' rather
 * than reaching into individual module files.
 *
 * @module
 */

// ============================================================================
// Types and Schemas
// ============================================================================

export {
  // Zod schemas
  KnowledgePackSchema,
  PackModuleSchema,
  PackActivitySchema,
  AssessmentMethodSchema,
  LearningOutcomeSchema,
  GradeLevelEntrySchema,
  LearningPathwaySchema,
  PackDependencySchema,
  PackStatusSchema,
  PackClassificationSchema,
  ModulesFileSchema,
  ContributorSchema,
  ModuleTimeEstimatesSchema,
  ModuleActivitiesSchema,
  CrossModuleCompetencySchema,
  ToolSchema,
  InteractiveElementSchema,
  TranslationEntrySchema,
  TranslationSchema,
  AccessibilitySchema,
  StandardAlignmentSchema,
  DifficultySchema,
  ContentFlagSchema,
  CommunitySchema,
  MaintenanceSchema,
  MetricsSchema,
  ResourceSchema,
  RelatedPackSchema,
  ChangelogEntrySchema,
  QaSchema,
  GsdIntegrationSchema,
  PackFilesSchema,
} from './types.js';

export type {
  KnowledgePack,
  PackModule,
  PackActivity,
  AssessmentMethod,
  LearningOutcome,
  GradeLevelEntry,
  LearningPathway,
  PackDependency,
  PackStatus,
  PackClassification,
  ModulesFile,
  Contributor,
  ModuleTimeEstimates,
  ModuleActivities,
  CrossModuleCompetency,
  Tool,
  InteractiveElement,
  TranslationEntry,
  Translation,
  Accessibility,
  StandardAlignment,
  Difficulty,
  ContentFlag,
  Community,
  Maintenance,
  Metrics,
  Resource,
  RelatedPack,
  ChangelogEntry,
  Qa,
  GsdIntegration,
  PackFiles,
} from './types.js';

// ============================================================================
// .skillmeta parser
// ============================================================================

export { parseSkillmeta, parseSkillmetaFile } from './skillmeta-parser.js';
export type { SkillmetaResult } from './skillmeta-parser.js';

// ============================================================================
// Content file parsers
// ============================================================================

export { parseVisionDocument } from './vision-parser.js';
export type { VisionDocument } from './vision-parser.js';

export { loadActivities, loadActivitiesFile } from './activity-loader.js';

export { parseAssessment, parseAssessmentFile } from './assessment-loader.js';
export type { AssessmentDocument, RubricLevel } from './assessment-loader.js';

export { parseResources, parseResourcesFile } from './resource-loader.js';
export type { ResourceCatalog, ResourceLink } from './resource-loader.js';

// ============================================================================
// Pack registry
// ============================================================================

export { PackRegistry, createRegistry } from './registry.js';

// ============================================================================
// Module loader
// ============================================================================

export { loadPack } from './module-loader.js';
export type { LoadedPack } from './module-loader.js';

// ============================================================================
// Dependency resolution
// ============================================================================

export { resolveDependencies, DependencyGraph, DependencyError } from './dependency-resolver.js';

// ============================================================================
// Prerequisite validation
// ============================================================================

export { validatePrerequisites } from './prerequisite-validator.js';
export type { PrerequisiteResult } from './prerequisite-validator.js';

// ============================================================================
// Grade-level routing
// ============================================================================

export { routeByGradeLevel } from './grade-router.js';
export type { GradeRouteResult } from './grade-router.js';

// ============================================================================
// Cross-pack connections
// ============================================================================

export { buildConnectionGraph, ConnectionGraph } from './connection-mapper.js';
export type { ConnectionEdge } from './connection-mapper.js';

// ============================================================================
// Content validation
// ============================================================================

export { validatePackContent } from './content-validator.js';
export type { PackValidationReport, FileValidationStatus } from './content-validator.js';
