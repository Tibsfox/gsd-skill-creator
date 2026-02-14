/**
 * Resource manifest generator for the resource analysis pipeline.
 *
 * Composes all sub-analyzers (vision analyzer, skill matcher, topology
 * recommender, budget estimator, work decomposer) into a unified
 * ResourceManifest with HITL predictions and queue context.
 *
 * @module staging/resource/manifest
 */

import type {
  VisionAnalysis,
  SkillMatch,
  TopologyRecommendation,
  TokenBudgetBreakdown,
  ParallelDecomposition,
  ResourceManifest,
  ComplexityLevel,
  DomainRequirement,
} from './types.js';
import type { SkillCapability } from '../../capabilities/types.js';
import type { BudgetEstimateOptions } from './budget.js';

import { analyzeVision as defaultAnalyzeVision } from './analyzer.js';
import { matchSkills as defaultMatchSkills } from './skill-matcher.js';
import { recommendTopology as defaultRecommendTopology } from './topology.js';
import { estimateBudget as defaultEstimateBudget } from './budget.js';
import { decomposeWork as defaultDecomposeWork } from './decomposer.js';

// ============================================================================
// Types
// ============================================================================

/** Options for manifest generation. */
export interface ManifestOptions {
  /** Raw vision document content. */
  content: string;
  /** Available skills from the capability manifest. */
  availableSkills: SkillCapability[];
  /** Context window size in tokens (defaults to 200,000). */
  contextWindowSize?: number;
}

/**
 * Dependency injection interface for testability.
 *
 * Each function matches the signature of its corresponding sub-analyzer,
 * allowing callers to inject mocks for isolated testing.
 */
export interface ManifestDeps {
  analyzeVision: (content: string) => VisionAnalysis;
  matchSkills: (requirements: DomainRequirement[], skills: SkillCapability[]) => SkillMatch[];
  recommendTopology: (analysis: VisionAnalysis) => TopologyRecommendation;
  estimateBudget: (options: BudgetEstimateOptions) => TokenBudgetBreakdown;
  decomposeWork: (analysis: VisionAnalysis) => ParallelDecomposition;
}

// ============================================================================
// Constants
// ============================================================================

/** Complexity-to-priority mapping (lower number = higher priority). */
const PRIORITY_MAP: Record<ComplexityLevel, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

/** Complexity multiplier for duration estimation (minutes per requirement). */
const DURATION_MULTIPLIER: Record<ComplexityLevel, number> = {
  low: 5,
  medium: 10,
  high: 20,
  critical: 30,
};

// ============================================================================
// HITL Predictions
// ============================================================================

/**
 * Generate human-in-the-loop predictions from ambiguity markers
 * and complexity signals.
 *
 * Each ambiguity marker with vague language produces a decision
 * checkpoint prediction. High/critical complexity signals add
 * additional review checkpoints.
 */
function generateHitlPredictions(analysis: VisionAnalysis): string[] {
  const predictions: string[] = [];

  // Each ambiguity marker -> decision checkpoint
  for (const marker of analysis.ambiguities) {
    predictions.push(`Decision checkpoint likely for: ${marker.text}`);
  }

  // High/critical complexity signals -> review checkpoints
  for (const signal of analysis.complexity) {
    if (signal.level === 'high' || signal.level === 'critical') {
      predictions.push(`Review checkpoint for ${signal.signal} complexity: ${signal.evidence}`);
    }
  }

  return predictions;
}

// ============================================================================
// Queue Context
// ============================================================================

/**
 * Generate queue context from analysis results.
 *
 * Priority derived from overall complexity level.
 * Duration estimated from requirement count * complexity multiplier.
 * Tags from unique requirement categories.
 */
function generateQueueContext(
  analysis: VisionAnalysis,
): { priority: number; estimatedDuration: string; tags: string[] } {
  // Priority: complexity -> numeric priority
  const priority = PRIORITY_MAP[analysis.overallComplexity];

  // Duration: requirement count * complexity multiplier (in minutes)
  const multiplier = DURATION_MULTIPLIER[analysis.overallComplexity];
  const minutes = analysis.requirements.length * multiplier;
  const estimatedDuration = minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;

  // Tags: unique requirement categories
  const tags = [...new Set(analysis.requirements.map((r) => r.category))];

  return { priority, estimatedDuration, tags };
}

// ============================================================================
// Main Generator
// ============================================================================

/** Default dependencies using real implementations. */
const DEFAULT_DEPS: ManifestDeps = {
  analyzeVision: defaultAnalyzeVision,
  matchSkills: defaultMatchSkills,
  recommendTopology: defaultRecommendTopology,
  estimateBudget: defaultEstimateBudget,
  decomposeWork: defaultDecomposeWork,
};

/**
 * Generate a complete resource manifest from vision document content
 * and available skills.
 *
 * Orchestrates all sub-analyzers in sequence:
 * 1. analyzeVision -> VisionAnalysis
 * 2. matchSkills -> SkillMatch[]
 * 3. recommendTopology -> TopologyRecommendation
 * 4. estimateBudget -> TokenBudgetBreakdown
 * 5. decomposeWork -> ParallelDecomposition
 * 6. Generate HITL predictions from ambiguity and complexity
 * 7. Generate queue context from complexity and requirements
 *
 * @param options - Content, available skills, and optional context window size
 * @param deps - Optional dependency injection for testability
 * @returns Complete ResourceManifest
 */
export function generateResourceManifest(
  options: ManifestOptions,
  deps?: Partial<ManifestDeps>,
): ResourceManifest {
  const d: ManifestDeps = { ...DEFAULT_DEPS, ...deps };

  // 1. Analyze vision document
  const visionAnalysis = d.analyzeVision(options.content);

  // 2. Match skills against extracted requirements
  const skillMatches = d.matchSkills(
    visionAnalysis.requirements,
    options.availableSkills,
  );

  // 3. Recommend execution topology
  const topology = d.recommendTopology(visionAnalysis);

  // 4. Estimate token budget
  const tokenBudget = d.estimateBudget({
    complexity: visionAnalysis.overallComplexity,
    topology: topology.topology,
    requirementCount: visionAnalysis.requirements.length,
    skillCount: options.availableSkills.length,
    contextWindowSize: options.contextWindowSize,
  });

  // 5. Decompose work into parallel subtasks
  const decomposition = d.decomposeWork(visionAnalysis);

  // 6. Generate HITL predictions
  const hitlPredictions = generateHitlPredictions(visionAnalysis);

  // 7. Generate queue context
  const queueContext = generateQueueContext(visionAnalysis);

  // 8. Assemble manifest
  return {
    visionAnalysis,
    skillMatches,
    topology,
    tokenBudget,
    decomposition,
    hitlPredictions,
    queueContext,
    generatedAt: new Date().toISOString(),
  };
}
