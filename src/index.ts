// Types
export type {
  Pattern,
  PatternCategory,
  CommandPattern,
  DecisionPattern,
} from './types/pattern.js';

export type {
  Skill,
  SkillMetadata,
  SkillTrigger,
  SkillLearning,
  SkillCorrection,
} from './types/skill.js';

export {
  SKILL_NAME_PATTERN,
  MAX_DESCRIPTION_LENGTH,
  validateSkillName,
  validateSkillMetadata,
} from './types/skill.js';

// Scope types and utilities
export type { SkillScope, ScopedSkillPath } from './types/scope.js';
export {
  getSkillsBasePath,
  getSkillPath,
  parseScope,
  resolveScopedSkillPath,
  SCOPE_FLAG,
  SCOPE_FLAG_SHORT,
} from './types/scope.js';

// Team types
export type {
  TeamConfig,
  TeamMember,
  TeamTask,
  InboxMessage,
  TeamValidationResult,
} from './types/team.js';

export {
  TEAM_TOPOLOGIES,
  TEAM_ROLES,
  TEAM_TASK_STATUSES,
  TEAM_MEMBER_MODELS,
  BACKEND_TYPES,
  STRUCTURED_MESSAGE_TYPES,
} from './types/team.js';

export type {
  TeamTopology,
  TeamRole,
  TeamTaskStatus,
  TeamMemberModel,
  BackendType,
  StructuredMessageType,
} from './types/team.js';

// Storage - Import first so we can use in functions
import { PatternStore } from './storage/pattern-store.js';
import { SkillStore } from './storage/skill-store.js';
import { SkillIndex } from './storage/skill-index.js';

// Import scope utilities for factory functions
import { getSkillsBasePath } from './types/scope.js';
import type { SkillScope } from './types/scope.js';

// Re-export storage classes
export { PatternStore, SkillStore, SkillIndex };
export type { SkillIndexEntry, SkillIndexData, ScopedSkillEntry } from './storage/skill-index.js';
export { listAllScopes } from './storage/skill-index.js';

// Convenience factory for creating all stores with consistent paths
export function createStores(options?: {
  patternsDir?: string;
  skillsDir?: string;
  scope?: SkillScope;
}) {
  const patternsDir = options?.patternsDir ?? '.planning/patterns';
  // If scope provided and skillsDir not provided, use scope-based path
  const skillsDir = options?.skillsDir ??
    (options?.scope ? getSkillsBasePath(options.scope) : '.claude/skills');

  const patternStore = new PatternStore(patternsDir);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);

  return {
    patternStore,
    skillStore,
    skillIndex,
  };
}

/**
 * Create stores configured for a specific scope (user or project).
 *
 * @param scope - 'user' for ~/.claude/skills or 'project' for .claude/skills
 * @param options - Optional configuration
 * @returns Object containing all stores plus scope metadata
 */
export function createScopedStores(scope: SkillScope, options?: {
  patternsDir?: string;
}) {
  const skillsDir = getSkillsBasePath(scope);
  const patternsDir = options?.patternsDir ?? '.planning/patterns';

  const patternStore = new PatternStore(patternsDir);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);

  return {
    patternStore,
    skillStore,
    skillIndex,
    scope,
    skillsDir,
  };
}

// Validation
export {
  SkillInputSchema,
  TriggerPatternsSchema,
  SkillNameSchema,
  validateSkillInput,
  SkillUpdateSchema,
  validateSkillUpdate,
} from './validation/skill-validation.js';
export type { SkillInput, SkillUpdate } from './validation/skill-validation.js';

// Team validation
export {
  TeamMemberSchema,
  TeamConfigSchema,
  TeamTaskSchema,
  InboxMessageSchema,
  validateTeamConfig,
  validateInboxMessage,
} from './validation/team-validation.js';
export type { InboxMessageValidationResult } from './validation/team-validation.js';

// Message safety
export {
  sanitizeMessageText,
  truncateMessageText,
  sanitizeInboxMessage,
  DEFAULT_MAX_MESSAGE_LENGTH,
} from './validation/message-safety.js';
export type { MessageSanitizeResult } from './validation/message-safety.js';

// Teams module: templates, storage, agent generation, wizard, validation
export {
  generateLeaderWorkerTemplate,
  generatePipelineTemplate,
  generateSwarmTemplate,
  LEADER_TOOLS,
  WORKER_TOOLS,
  PIPELINE_STAGE_TOOLS,
  SWARM_WORKER_TOOLS,
  generateGsdResearchTeam,
  generateGsdDebuggingTeam,
  GSD_RESEARCH_AGENT_IDS,
  GSD_DEBUG_AGENT_IDS,
  RESEARCH_DIMENSIONS,
  TeamStore,
  getTeamsBasePath,
  getAgentsBasePath,
  writeTeamAgentFiles,
  generateAgentContent,
  teamCreationWizard,
  nonInteractiveCreate,
  validateTeamFull,
  validateMemberAgents,
  detectTaskCycles,
  detectToolOverlap,
  detectSkillConflicts,
  detectRoleCoherence,
} from './teams/index.js';
export type {
  TemplateOptions,
  TemplateResult,
  GsdTemplateOptions,
  TeamScope,
  AgentFileResult,
  AgentMemberInput,
  WizardOptions,
  CreatePaths,
  TeamFullValidationResult,
  TeamFullValidationOptions,
  MemberResolutionResult,
  CycleDetectionResult,
  ToolOverlapResult,
  SkillConflictResult,
  SkillConflictEntry,
  RoleCoherenceResult,
  RoleCoherenceWarning,
} from './teams/index.js';

// Workflows
export { createSkillWorkflow } from './workflows/create-skill-workflow.js';
export { listSkillsWorkflow } from './workflows/list-skills-workflow.js';
export { searchSkillsWorkflow } from './workflows/search-skills-workflow.js';

// Application types
export type {
  TokenCountResult,
  ScoredSkill,
  ActiveSkill,
  SessionState,
  ConflictResult,
  TokenTracking,
  ApplicationConfig,
  PriorityTier,
  SkippedSkill,
  BudgetWarning,
  BudgetProfile,
  ModelTier,
  ModelGuidance,
} from './types/application.js';

// Learning module
export * from './learning/index.js';

// Calibration module
export {
  CalibrationStore,
  ThresholdOptimizer,
  ThresholdHistory,
  calculateMCC,
  mccToPercentage,
  BenchmarkReporter,
} from './calibration/index.js';
export type {
  CalibrationEvent,
  CalibrationOutcome,
  CalibrationEventInput,
  SkillScore,
  OptimizationResult,
  ThresholdSnapshot,
  BenchmarkReport,
} from './calibration/index.js';

export { DEFAULT_CONFIG } from './types/application.js';

// Embeddings module
export {
  EmbeddingService,
  getEmbeddingService,
  cosineSimilarity,
  HeuristicEmbedder,
  EmbeddingCache,
} from './embeddings/index.js';
export type {
  EmbeddingVector,
  CacheEntry,
  CacheStore,
  EmbeddingServiceConfig,
  ProgressInfo,
  EmbeddingResult,
} from './embeddings/index.js';

// Conflicts module
export {
  ConflictDetector,
  ConflictFormatter,
  RewriteSuggester,
} from './conflicts/index.js';
export type {
  ConflictConfig,
  ConflictPair,
  ConflictResult as ConflictDetectionResult,
  RewriteSuggestion,
} from './conflicts/index.js';

// Application components
export { TokenCounter } from './application/token-counter.js';
export { RelevanceScorer } from './application/relevance-scorer.js';
export { ConflictResolver } from './application/conflict-resolver.js';
export { SkillSession } from './application/skill-session.js';
export type { SkillLoadResult, SessionReport } from './application/skill-session.js';
export { SkillApplicator } from './application/skill-applicator.js';
export type { ApplyResult, InvokeResult } from './application/skill-applicator.js';

// Pipeline infrastructure (Phase 52)
export { SkillPipeline, createEmptyContext } from './application/skill-pipeline.js';
export type { PipelineStage, PipelineContext } from './application/skill-pipeline.js';
export { ScoreStage, ResolveStage, LoadStage, BudgetStage, CacheOrderStage, ModelFilterStage, DEFAULT_CACHE_TIER } from './application/stages/index.js';
export type { CacheTier } from './application/stages/index.js';

// Budget profiles (Phase 53)
export { DEFAULT_PROFILES, getBudgetProfile, getTierForSkill } from './application/budget-profiles.js';

// Capabilities module (Phase 54)
export { CapabilityDiscovery, renderManifest, computeContentHash } from './capabilities/index.js';
export type { CapabilityManifest, SkillCapability, AgentCapability, TeamCapability } from './capabilities/index.js';

// Skill injection and scaffolding (Phase 56)
export { SkillInjector, CapabilityScaffolder } from './capabilities/index.js';
export type { InjectionRequest, InjectedSkill, InjectionResult, ScaffoldTask } from './capabilities/index.js';

// Research compression (Phase 58)
export { ResearchCompressor, StalenessChecker } from './capabilities/index.js';
export type { CompressedResearch, CompressionOptions, StalenessResult, ConflictResolution } from './capabilities/index.js';

// Post-phase invocation and collector agents (Phase 60)
export { PostPhaseInvoker, CollectorAgentGenerator, COLLECTOR_TOOLS } from './capabilities/index.js';
export type { InvocationRequest, InvocationInstruction, InvocationResult, CollectorAgentConfig, CollectorAgentResult } from './capabilities/index.js';

// Parallelization advisor (Phase 61)
export { ParallelizationAdvisor } from './capabilities/index.js';
export type { PlanDependencyInfo, WaveAssignment, AdvisoryReport } from './capabilities/index.js';

// Simulation module
export {
  ActivationSimulator,
  BatchSimulator,
  categorizeConfidence,
  formatConfidence,
  getDefaultThresholds,
  detectChallengers,
  isWeakMatch,
  generateDifferentiationHints,
  formatHints,
  generateExplanation,
  generateBriefNegativeExplanation,
} from './simulation/index.js';
export type {
  SkillInput as SimulationSkillInput,
  BatchConfig,
  BatchProgress,
  BatchResult,
  BatchStats,
  ConfidenceThresholds,
  ChallengerConfig,
  ChallengerResult,
  DifferentiationHint,
  ExplanationOptions,
  SimulationConfig,
  SimulationResult,
  SimulationTrace,
  SkillPrediction,
  ConfidenceLevel,
} from './simulation/index.js';

// Testing module
export {
  TestStore,
  ResultStore,
  TestRunner,
  ResultFormatter,
  formatTestResults,
  formatJSON as formatTestJSON,
  validateTestCaseInput,
  TestCaseInputSchema,
  ReviewWorkflow,
} from './testing/index.js';
export type {
  RunOptions,
  TestCase,
  TestResult,
  TestExpectation,
  TestCaseResult,
  RunMetrics,
  TestRunResult,
  TestRunSnapshot,
  TestCaseInput,
  ValidationWarning,
  FormatOptions,
  ReviewResult,
} from './testing/index.js';

// Import applicator for factory
import { SkillApplicator } from './application/skill-applicator.js';
import type { ApplicationConfig, BudgetProfile } from './types/application.js';

// Enhanced factory that includes applicator
export function createApplicationContext(options?: {
  patternsDir?: string;
  skillsDir?: string;
  config?: Partial<ApplicationConfig>;
  budgetProfile?: BudgetProfile;
  modelProfile?: string;
}) {
  const stores = createStores({
    patternsDir: options?.patternsDir,
    skillsDir: options?.skillsDir,
  });

  const applicator = new SkillApplicator(
    stores.skillIndex,
    stores.skillStore,
    options?.config,
    options?.budgetProfile,
    options?.modelProfile
  );

  return {
    ...stores,
    applicator,
  };
}
