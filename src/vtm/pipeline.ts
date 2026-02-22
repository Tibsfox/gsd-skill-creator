/**
 * Pipeline orchestrator types and speed selector.
 *
 * Defines the typed contract for the three-stage VTM pipeline
 * (vision -> research -> mission). The speed selector wraps
 * `detectResearchNecessity` from research-utils with manual override
 * support, providing automatic pipeline speed detection with
 * explicit override capability.
 *
 * Types:
 * - PipelineSpeed: re-exported from research-utils ('full' | 'skip-research' | 'mission-only')
 * - PipelineStage: literal union for the three pipeline stages
 * - PipelineConfig: configuration for a pipeline run with skip flags and speed override
 * - VisionStageResult: typed intermediate artifact from vision stage
 * - ResearchStageResult: typed intermediate artifact from research stage
 * - MissionStageResult: typed intermediate artifact from mission stage
 * - PipelineError: structured error for stage failures with partial output
 * - PipelineResult: complete pipeline output with stages, manifest, and summary
 *
 * Functions:
 * - selectPipelineSpeed(): pure function returning manual override or auto-detected speed
 *
 * @module vtm/pipeline
 */

import type { VisionDocument, ResearchReference, MissionPackage } from './types.js';
import type { VisionDiagnostic, Archetype } from './vision-validator.js';
import type { KnowledgeTiers, SafetySection } from './research-utils.js';
import { detectResearchNecessity } from './research-utils.js';
import type { SourceDiagnostic } from './research-compiler.js';
import type { SelfContainmentDiagnostic } from './mission-assembly.js';
import type { CacheReport } from './cache-optimizer.js';
import type { BudgetValidationResult } from './model-budget.js';

// Re-export PipelineSpeed from research-utils for downstream consumers
export type { PipelineSpeed } from './research-utils.js';

// Import PipelineSpeed as a value-level type for use in this module
import type { PipelineSpeed } from './research-utils.js';

// ---------------------------------------------------------------------------
// PipelineStage
// ---------------------------------------------------------------------------

/** The three sequential stages of the VTM pipeline. */
export type PipelineStage = 'vision' | 'research' | 'mission';

// ---------------------------------------------------------------------------
// PipelineConfig
// ---------------------------------------------------------------------------

/**
 * Configuration for a pipeline run.
 *
 * Controls pipeline speed (manual override or auto-detected),
 * validation/quality check toggling, and cache report inclusion.
 */
export interface PipelineConfig {
  /** Manual speed override. If omitted, auto-detected via speed selector. */
  speed?: PipelineSpeed;
  /** Skip vision document validation (default false). */
  skipValidation?: boolean;
  /** Skip quality checker (default false). */
  skipQualityCheck?: boolean;
  /** Include cache optimization report in result (default true). */
  includeCache?: boolean;
}

// ---------------------------------------------------------------------------
// VisionStageResult
// ---------------------------------------------------------------------------

/**
 * Typed intermediate artifact from the vision stage.
 *
 * Contains the parsed vision document, validation diagnostics,
 * classified archetype, and extracted dependencies.
 */
export interface VisionStageResult {
  /** Parsed vision document. */
  visionDoc: VisionDocument;
  /** Validation diagnostics from vision validator. */
  diagnostics: VisionDiagnostic[];
  /** Classified archetype from vision validator. */
  archetype: Archetype;
  /** Extracted dependencies from vision parser. */
  dependencies: string[];
}

// ---------------------------------------------------------------------------
// ResearchStageResult
// ---------------------------------------------------------------------------

/**
 * Typed intermediate artifact from the research stage.
 *
 * Contains the compiled research reference, chunked knowledge tiers,
 * extracted safety section, and source quality diagnostics.
 */
export interface ResearchStageResult {
  /** Compiled research reference. */
  research: ResearchReference;
  /** Chunked knowledge tiers (summary/active/reference). */
  knowledgeTiers: KnowledgeTiers;
  /** Extracted safety section from research topics. */
  safety: SafetySection;
  /** Source quality diagnostics. */
  sourceDiagnostics: SourceDiagnostic[];
}

// ---------------------------------------------------------------------------
// MissionStageResult
// ---------------------------------------------------------------------------

/**
 * Typed intermediate artifact from the mission stage.
 *
 * Contains the assembled mission package, self-containment validation
 * diagnostics, optional cache optimization report, and budget validation.
 */
export interface MissionStageResult {
  /** Assembled mission package. */
  missionPackage: MissionPackage;
  /** Self-containment validation diagnostics. */
  selfContainmentDiagnostics: SelfContainmentDiagnostic[];
  /** Optional cache optimization report. */
  cacheReport?: CacheReport;
  /** Model budget validation result. */
  budgetValidation: BudgetValidationResult;
}

// ---------------------------------------------------------------------------
// PipelineError
// ---------------------------------------------------------------------------

/**
 * Structured error for pipeline stage failures.
 *
 * Captures which stage failed, the underlying error, any partial output
 * produced before failure, and whether the partial output is usable
 * (recoverable is true if at least the vision stage completed).
 */
export interface PipelineError {
  /** Which stage failed. */
  stage: PipelineStage;
  /** The underlying error. */
  error: Error | string;
  /** Partial output produced before failure. */
  partialOutput: {
    vision?: VisionStageResult;
    research?: ResearchStageResult;
  };
  /** Whether partial output is usable (true if at least vision stage completed). */
  recoverable: boolean;
}

// ---------------------------------------------------------------------------
// PipelineResult
// ---------------------------------------------------------------------------

/**
 * Complete pipeline output.
 *
 * Contains success status, speed used, stage results, optional error,
 * file manifest, execution summary, and total duration.
 */
export interface PipelineResult {
  /** Whether the pipeline completed successfully. */
  success: boolean;
  /** Speed used (auto-detected or overridden). */
  speed: PipelineSpeed;
  /** Stage results. Research and mission are optional (may be skipped by speed). */
  stages: {
    vision: VisionStageResult;
    research?: ResearchStageResult;
    mission?: MissionStageResult;
  };
  /** Present when success is false. */
  error?: PipelineError;
  /** List of output files produced by the pipeline. */
  fileManifest: Array<{ name: string; type: string; size: string }>;
  /** Execution summary from MissionPackage.executionSummary. */
  executionSummary: {
    totalTasks: number;
    parallelTracks: number;
    sequentialDepth: number;
    modelSplit: {
      opus: { count: number; percentage: number };
      sonnet: { count: number; percentage: number };
      haiku: { count: number; percentage: number };
    };
    estimatedWallTime: string;
    totalTests: number;
    safetyCriticalTests: number;
  };
  /** Total pipeline execution time in milliseconds. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// selectPipelineSpeed
// ---------------------------------------------------------------------------

/**
 * Select the pipeline speed for a given vision document and config.
 *
 * If `config.speed` is set, returns it directly (manual override).
 * Otherwise, delegates to `detectResearchNecessity(visionDoc)` and
 * returns the recommended speed.
 *
 * This is a pure function with no side effects.
 *
 * @param visionDoc - The parsed VisionDocument to analyze
 * @param config - Pipeline configuration with optional speed override
 * @returns The PipelineSpeed to use for this pipeline run
 */
export function selectPipelineSpeed(
  visionDoc: VisionDocument,
  config: PipelineConfig,
): PipelineSpeed {
  if (config.speed !== undefined) {
    return config.speed;
  }

  const recommendation = detectResearchNecessity(visionDoc);
  return recommendation.speed;
}
