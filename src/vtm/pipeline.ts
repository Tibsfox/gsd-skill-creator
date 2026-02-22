/**
 * Pipeline orchestrator types, speed selector, and runPipeline function.
 *
 * Defines the typed contract for the three-stage VTM pipeline
 * (vision -> research -> mission) and provides the capstone `runPipeline`
 * function that composes all prior phases (280-288) into a single call.
 *
 * `runPipeline` transforms a vision document markdown string (or pre-parsed
 * VisionDocument) into a complete mission package with configurable stage
 * skipping, auto-speed selection, typed stage transitions, file manifest,
 * execution metrics, and structured error reporting with partial output
 * recovery.
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
 * - runPipeline(): three-stage pipeline orchestrator with error wrapping
 *
 * @module vtm/pipeline
 */

import type { VisionDocument, ResearchReference, MissionPackage } from './types.js';
import type { VisionDiagnostic, Archetype } from './vision-validator.js';
import { validateVisionDocument, checkQuality, classifyArchetype } from './vision-validator.js';
import type { KnowledgeTiers, SafetySection } from './research-utils.js';
import { detectResearchNecessity, chunkKnowledge, extractSafety } from './research-utils.js';
import { parseVisionDocument, extractDependencies } from './vision-parser.js';
import { compileResearch, checkSourceQuality } from './research-compiler.js';
import type { SourceDiagnostic } from './research-compiler.js';
import { assembleMissionPackage } from './mission-assembler.js';
import { validateSelfContainment, generateReadme, renderMissionDocuments } from './mission-assembly.js';
import type { SelfContainmentDiagnostic, RenderedDocument } from './mission-assembly.js';
import { generateCacheReport } from './cache-optimizer.js';
import type { CacheReport } from './cache-optimizer.js';
import { validateBudget } from './model-budget.js';
import type { BudgetValidationResult, BudgetTask } from './model-budget.js';

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
  /** Rendered documents from template system (may be empty if templates not on disk). */
  renderedDocuments?: RenderedDocument[];
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Create an empty PipelineResult shell for error cases.
 *
 * When the pipeline fails before completing, this provides the minimum
 * structure for a failure response with the given speed and error.
 */
function createErrorResult(
  speed: PipelineSpeed,
  error: PipelineError,
  visionStage?: VisionStageResult,
  durationMs: number = 0,
): PipelineResult {
  return {
    success: false,
    speed,
    stages: {
      vision: visionStage ?? {
        visionDoc: {} as VisionDocument,
        diagnostics: [],
        archetype: 'infrastructure-component',
        dependencies: [],
      },
    },
    error,
    fileManifest: [],
    executionSummary: {
      totalTasks: 0,
      parallelTracks: 0,
      sequentialDepth: 0,
      modelSplit: {
        opus: { count: 0, percentage: 0 },
        sonnet: { count: 0, percentage: 0 },
        haiku: { count: 0, percentage: 0 },
      },
      estimatedWallTime: '0min',
      totalTests: 0,
      safetyCriticalTests: 0,
    },
    durationMs,
  };
}

/**
 * Build the file manifest from a MissionPackage.
 *
 * Lists each component spec, the milestone spec, wave plan, test plan, and
 * README as entries with { name, type, size } where size is a human-readable
 * estimated token count.
 */
function buildFileManifest(
  missionPackage: MissionPackage,
  readmeTokens: number,
): Array<{ name: string; type: string; size: string }> {
  const manifest: Array<{ name: string; type: string; size: string }> = [];

  // Milestone spec
  manifest.push({
    name: `${missionPackage.milestoneSpec.name.toLowerCase().replace(/\s+/g, '-')}.md`,
    type: 'milestone-spec',
    size: `~${Math.ceil(JSON.stringify(missionPackage.milestoneSpec).length / 4)} tokens`,
  });

  // Component specs
  for (const spec of missionPackage.componentSpecs) {
    manifest.push({
      name: `${spec.name.toLowerCase().replace(/\s+/g, '-')}-spec.md`,
      type: 'component-spec',
      size: `~${spec.estimatedTokens} tokens`,
    });
  }

  // Wave execution plan
  manifest.push({
    name: 'wave-plan.md',
    type: 'wave-plan',
    size: `~${Math.ceil(JSON.stringify(missionPackage.waveExecutionPlan).length / 4)} tokens`,
  });

  // Test plan
  manifest.push({
    name: 'test-plan.md',
    type: 'test-plan',
    size: `~${Math.ceil(JSON.stringify(missionPackage.testPlan).length / 4)} tokens`,
  });

  // README (token size from generateReadme output)
  manifest.push({
    name: 'README.md',
    type: 'readme',
    size: `~${readmeTokens} tokens`,
  });

  return manifest;
}

/**
 * Map MissionPackage.executionSummary to PipelineResult.executionSummary.
 *
 * Converts the flat opusTasks/sonnetTasks/haikuTasks shape from the
 * MissionPackage into the nested modelSplit shape used by PipelineResult.
 */
function mapExecutionSummary(execSummary: MissionPackage['executionSummary']): PipelineResult['executionSummary'] {
  return {
    totalTasks: execSummary.totalTasks,
    parallelTracks: execSummary.parallelTracks,
    sequentialDepth: execSummary.sequentialDepth,
    modelSplit: {
      opus: { count: execSummary.opusTasks.count, percentage: execSummary.opusTasks.percentage },
      sonnet: { count: execSummary.sonnetTasks.count, percentage: execSummary.sonnetTasks.percentage },
      haiku: { count: execSummary.haikuTasks.count, percentage: execSummary.haikuTasks.percentage },
    },
    estimatedWallTime: execSummary.estimatedWallTime,
    totalTests: execSummary.totalTests,
    safetyCriticalTests: execSummary.safetyCriticalTests,
  };
}

// ---------------------------------------------------------------------------
// runPipeline
// ---------------------------------------------------------------------------

/**
 * Run the three-stage VTM pipeline: vision -> research -> mission.
 *
 * This is the capstone function for the VTM module. It composes all prior
 * phases (280-288) into a single call that transforms a vision document
 * markdown string (or pre-parsed VisionDocument) into a complete mission
 * package.
 *
 * Features:
 * - Configurable stage skipping via PipelineConfig.speed or auto-detection
 * - String input: full pipeline from raw markdown
 * - VisionDocument input: skip parsing, run from validation onward
 * - Structured error reporting with partial output recovery
 * - File manifest listing all output artifacts
 * - Execution summary with model split percentages
 * - Duration tracking via Date.now() delta
 *
 * @param input - Raw vision document markdown string or pre-parsed VisionDocument
 * @param config - Optional pipeline configuration (speed, skip flags, cache toggle)
 * @returns PipelineResult with success status, stages, manifest, summary, and timing
 */
export async function runPipeline(
  input: string | VisionDocument,
  config?: PipelineConfig,
): Promise<PipelineResult> {
  const startTime = Date.now();
  const cfg: PipelineConfig = config ?? {};

  // ---- Stage 1: Vision ----
  let visionDoc: VisionDocument;
  let visionDiagnostics: VisionDiagnostic[] = [];
  let dependencies: string[] = [];
  let rawInput: string | undefined;
  let visionStage: VisionStageResult;

  try {
    if (typeof input === 'string') {
      rawInput = input;

      // Parse the markdown
      const parseResult = parseVisionDocument(input);
      if (!parseResult.success) {
        const durationMs = Date.now() - startTime;
        return createErrorResult(
          cfg.speed ?? 'full',
          {
            stage: 'vision',
            error: new Error(`Vision parsing failed: ${parseResult.errors.map(e => e.message).join('; ')}`),
            partialOutput: {},
            recoverable: false,
          },
          undefined,
          durationMs,
        );
      }

      visionDoc = parseResult.data;
    } else {
      visionDoc = input;
    }

    // Validation (unless skipped)
    if (!cfg.skipValidation) {
      const validationDiags = validateVisionDocument(visionDoc);
      visionDiagnostics = [...visionDiagnostics, ...validationDiags];
    }

    // Quality check (unless skipped)
    if (!cfg.skipQualityCheck) {
      const qualityDiags = checkQuality(visionDoc);
      visionDiagnostics = [...visionDiagnostics, ...qualityDiags];
    }

    // Classify archetype
    const archetype = classifyArchetype(visionDoc);

    // Extract dependencies
    if (rawInput !== undefined) {
      dependencies = extractDependencies(rawInput);
    } else {
      dependencies = [...visionDoc.dependsOn];
    }

    visionStage = {
      visionDoc,
      diagnostics: visionDiagnostics,
      archetype,
      dependencies,
    };
  } catch (e) {
    const durationMs = Date.now() - startTime;
    return createErrorResult(
      cfg.speed ?? 'full',
      {
        stage: 'vision',
        error: e instanceof Error ? e : new Error(String(e)),
        partialOutput: {},
        recoverable: false,
      },
      undefined,
      durationMs,
    );
  }

  // ---- Speed selection ----
  const speed = selectPipelineSpeed(visionDoc, cfg);

  // ---- Stage 2: Research (skipped when speed != 'full') ----
  let researchStage: ResearchStageResult | undefined;
  let research: ResearchReference | undefined;

  if (speed === 'full') {
    try {
      // Compile research
      const compiledResearch = compileResearch(visionDoc);
      research = compiledResearch;

      // Check source quality
      const sourceDiags = checkSourceQuality(compiledResearch);

      // Chunk knowledge
      const knowledgeTiers = chunkKnowledge(compiledResearch);

      // Extract safety
      const safety = extractSafety(compiledResearch);

      researchStage = {
        research: compiledResearch,
        knowledgeTiers,
        safety,
        sourceDiagnostics: sourceDiags,
      };
    } catch (e) {
      const durationMs = Date.now() - startTime;
      return createErrorResult(
        speed,
        {
          stage: 'research',
          error: e instanceof Error ? e : new Error(String(e)),
          partialOutput: { vision: visionStage },
          recoverable: true,
        },
        visionStage,
        durationMs,
      );
    }
  }

  // ---- Stage 3: Mission ----
  let missionStage: MissionStageResult;

  let readmeContent: string;

  try {
    // Assemble mission package
    const missionPackage = assembleMissionPackage(visionDoc, research);

    // Generate README from mission package
    const fileCount = 2 + missionPackage.componentSpecs.length + 2; // README + milestone-spec + component-specs + wave-plan + test-plan
    readmeContent = generateReadme(
      visionDoc,
      missionPackage.milestoneSpec,
      missionPackage.componentSpecs,
      fileCount,
    );

    // Validate self-containment
    const selfContainmentDiags = validateSelfContainment(missionPackage.componentSpecs);

    // Cache report (default true)
    let cacheReport: CacheReport | undefined;
    const includeCache = cfg.includeCache !== false;
    if (includeCache) {
      cacheReport = generateCacheReport(
        missionPackage.waveExecutionPlan,
        missionPackage.componentSpecs,
      );
    }

    // Budget validation
    const budgetTasks: BudgetTask[] = missionPackage.componentSpecs.map(spec => ({
      model: spec.modelAssignment,
      estimatedTokens: spec.estimatedTokens,
    }));
    const budgetValidation = validateBudget(budgetTasks);

    // Template rendering (additive layer -- failures do not fail the pipeline)
    let renderedDocuments: RenderedDocument[] = [];
    try {
      const rendered = await renderMissionDocuments(missionPackage);
      renderedDocuments = rendered.documents;
    } catch {
      // Template rendering is optional; swallow errors gracefully
      renderedDocuments = [];
    }

    missionStage = {
      missionPackage,
      selfContainmentDiagnostics: selfContainmentDiags,
      cacheReport,
      budgetValidation,
      renderedDocuments,
    };
  } catch (e) {
    const durationMs = Date.now() - startTime;
    return createErrorResult(
      speed,
      {
        stage: 'mission',
        error: e instanceof Error ? e : new Error(String(e)),
        partialOutput: {
          vision: visionStage,
          research: researchStage,
        },
        recoverable: true,
      },
      visionStage,
      durationMs,
    );
  }

  // ---- Result assembly ----
  const durationMs = Date.now() - startTime;
  const missionPackage = missionStage.missionPackage;

  return {
    success: true,
    speed,
    stages: {
      vision: visionStage,
      research: researchStage,
      mission: missionStage,
    },
    fileManifest: buildFileManifest(missionPackage, Math.ceil(readmeContent.length / 4)),
    executionSummary: mapExecutionSummary(missionPackage.executionSummary),
    durationMs,
  };
}
