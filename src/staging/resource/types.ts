/**
 * Type definitions and constants for the resource analysis pipeline.
 *
 * Defines domain requirements, complexity signals, ambiguity markers,
 * external dependencies, vision analysis, skill matching, topology
 * recommendations, token budgets, parallel decomposition, and the
 * aggregate resource manifest.
 *
 * @module staging/resource/types
 */

// ============================================================================
// Complexity
// ============================================================================

/** Complexity level for signals and subtasks. */
export type ComplexityLevel = 'low' | 'medium' | 'high' | 'critical';

/** All complexity levels as a const array for runtime use. */
export const COMPLEXITY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

// ============================================================================
// External Dependency Types
// ============================================================================

/** Type classification for external dependencies. */
export type ExternalDepType = 'api' | 'library' | 'service' | 'database' | 'tool';

/** All external dependency types as a const array for runtime use. */
export const EXTERNAL_DEP_TYPES = [
  'api',
  'library',
  'service',
  'database',
  'tool',
] as const;

// ============================================================================
// Domain Requirement
// ============================================================================

/**
 * An extracted requirement from a vision document.
 *
 * Category is a free-form domain label (e.g., "authentication",
 * "data-storage", "ui-rendering"). Confidence ranges 0-1.
 */
export interface DomainRequirement {
  /** Unique requirement identifier. */
  id: string;
  /** Human-readable description of the requirement. */
  description: string;
  /** Free-form domain category label. */
  category: string;
  /** Extraction confidence (0-1). */
  confidence: number;
}

// ============================================================================
// Complexity Signal
// ============================================================================

/**
 * A detected complexity indicator from document analysis.
 *
 * Signal is a short label like "multi-phase", "novel-domain",
 * "external-integration", "cross-cutting", "data-migration",
 * "concurrent-access". Level is severity.
 */
export interface ComplexitySignal {
  /** Short complexity label. */
  signal: string;
  /** Severity level of this signal. */
  level: ComplexityLevel;
  /** Evidence text supporting this signal. */
  evidence: string;
}

// ============================================================================
// Ambiguity Marker
// ============================================================================

/**
 * A span of text that is vague, contradictory, or missing critical details.
 *
 * Location is a descriptive position (e.g., "paragraph 2",
 * "requirements section").
 */
export interface AmbiguityMarker {
  /** The vague or ambiguous text. */
  text: string;
  /** Reason this text is considered ambiguous. */
  reason: string;
  /** Descriptive position in the document. */
  location: string;
}

// ============================================================================
// External Dependency
// ============================================================================

/**
 * An external service, API, or library referenced in the document.
 */
export interface ExternalDependency {
  /** Name of the external dependency. */
  name: string;
  /** Classification of the dependency. */
  type: ExternalDepType;
  /** Extraction confidence (0-1). */
  confidence: number;
}

// ============================================================================
// Vision Analysis
// ============================================================================

/**
 * Complete analysis result from processing a vision document.
 */
export interface VisionAnalysis {
  /** Extracted domain requirements. */
  requirements: DomainRequirement[];
  /** Detected complexity signals. */
  complexity: ComplexitySignal[];
  /** Identified ambiguity markers. */
  ambiguities: AmbiguityMarker[];
  /** Extracted external dependencies. */
  dependencies: ExternalDependency[];
  /** Overall complexity level (max across all signals). */
  overallComplexity: ComplexityLevel;
  /** 1-2 sentence summary of the vision scope. */
  summary: string;
}

// ============================================================================
// Skill Matching
// ============================================================================

/** Status of a skill match against a requirement. */
export type SkillMatchStatus = 'ready' | 'flagged' | 'missing' | 'recommended';

/** All skill match statuses as a const array for runtime use. */
export const SKILL_MATCH_STATUSES = [
  'ready',
  'flagged',
  'missing',
  'recommended',
] as const;

/**
 * Result of matching a requirement to an available skill.
 */
export interface SkillMatch {
  /** Name of the matched skill. */
  skillName: string;
  /** Match status. */
  status: SkillMatchStatus;
  /** Relevance score (0-1). */
  relevance: number;
  /** Reason for the match status. */
  reason: string;
  /** Scope of the skill (user-level or project-level). */
  scope?: 'user' | 'project';
}

// ============================================================================
// Topology Recommendation
// ============================================================================

/**
 * Agent/team topology types relevant for execution.
 *
 * Subset of team.ts TEAM_TOPOLOGIES, excluding 'leader-worker',
 * 'swarm', 'custom' which are Claude Code team concepts, not
 * staging recommendations.
 */
export type TopologyType = 'single' | 'pipeline' | 'map-reduce' | 'router' | 'hybrid';

/** All topology types as a const array for runtime use. */
export const TOPOLOGY_TYPES = [
  'single',
  'pipeline',
  'map-reduce',
  'router',
  'hybrid',
] as const;

/**
 * Recommended execution topology for the work.
 */
export interface TopologyRecommendation {
  /** Recommended topology pattern. */
  topology: TopologyType;
  /** Reasoning for the recommendation. */
  rationale: string;
  /** Confidence in the recommendation (0-1). */
  confidence: number;
  /** Suggested number of agents. */
  agentCount: number;
  /** Optional team name suggestion. */
  teamSuggestion?: string;
}

// ============================================================================
// Token Budget
// ============================================================================

/** Budget allocation categories. */
export type BudgetCategory =
  | 'skill-loading'
  | 'planning'
  | 'execution'
  | 'research'
  | 'verification'
  | 'hitl'
  | 'safety-margin';

/** All budget categories as a const array for runtime use. */
export const BUDGET_CATEGORIES = [
  'skill-loading',
  'planning',
  'execution',
  'research',
  'verification',
  'hitl',
  'safety-margin',
] as const;

/**
 * Token budget breakdown by category.
 */
export interface TokenBudgetBreakdown {
  /** Total token budget. */
  total: number;
  /** Allocation per category. */
  categories: Record<BudgetCategory, number>;
  /** Context window size used for calculation. */
  contextWindowSize: number;
  /** Percentage of context window utilized. */
  utilizationPercent: number;
}

// ============================================================================
// Parallel Decomposition
// ============================================================================

/**
 * A decomposed unit of work.
 */
export interface Subtask {
  /** Unique subtask identifier. */
  id: string;
  /** Description of the work unit. */
  description: string;
  /** IDs of subtasks this depends on. */
  dependencies: string[];
  /** Resources shared with other subtasks. */
  sharedResources: string[];
  /** Estimated complexity of this subtask. */
  estimatedComplexity: ComplexityLevel;
}

/**
 * Full parallelization plan for work decomposition.
 */
export interface ParallelDecomposition {
  /** All subtasks in the decomposition. */
  subtasks: Subtask[];
  /** IDs of subtasks on the critical path. */
  criticalPath: string[];
  /** Maximum number of subtasks that can run in parallel. */
  maxParallelism: number;
  /** Resources shared across subtasks. */
  sharedResources: string[];
}

// ============================================================================
// Resource Manifest
// ============================================================================

/**
 * The complete resource manifest aggregating all analysis results.
 *
 * This is the final output of the resource analysis pipeline,
 * combining vision analysis, skill matching, topology, token budget,
 * parallelization, HITL predictions, and queue context.
 */
export interface ResourceManifest {
  /** Vision document analysis results. */
  visionAnalysis: VisionAnalysis;
  /** Skill match results for extracted requirements. */
  skillMatches: SkillMatch[];
  /** Recommended execution topology. */
  topology: TopologyRecommendation;
  /** Token budget breakdown. */
  tokenBudget: TokenBudgetBreakdown;
  /** Parallel work decomposition. */
  decomposition: ParallelDecomposition;
  /** Predicted human-in-the-loop interaction points. */
  hitlPredictions: string[];
  /** Queue context for scheduling. */
  queueContext: {
    /** Execution priority (higher = more urgent). */
    priority: number;
    /** Estimated execution duration. */
    estimatedDuration: string;
    /** Classification tags. */
    tags: string[];
  };
  /** ISO 8601 timestamp when this manifest was generated. */
  generatedAt: string;
}
