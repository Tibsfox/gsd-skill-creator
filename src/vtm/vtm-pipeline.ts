/**
 * VTMPipeline class wrapper -- stateful OOP interface around the VTM
 * functional API following the project's "functional API primary +
 * class wrapper" pattern (same as Den Dispatcher, Planner, etc.).
 *
 * The class holds a PipelineConfig and provides methods that delegate
 * to the pure functional API. Use `createVTMPipeline()` factory for
 * convenient construction.
 *
 * @module vtm/vtm-pipeline
 */

import type { VisionDocument } from './types.js';
import type { PipelineConfig, PipelineResult } from './pipeline.js';
import type { PipelineSpeed } from './research-utils.js';
import { runPipeline, selectPipelineSpeed } from './pipeline.js';
import { parseVisionDocument } from './vision-parser.js';
import type { ParseResult } from './vision-parser.js';
import { validateVisionDocument, checkQuality, classifyArchetype } from './vision-validator.js';
import type { VisionDiagnostic, Archetype } from './vision-validator.js';
import { compileResearch, checkSourceQuality } from './research-compiler.js';
import type { ResearchReference } from './types.js';
import type { SourceDiagnostic } from './research-compiler.js';
import { assembleMissionPackage } from './mission-assembler.js';
import type { MissionPackage } from './types.js';

// ---------------------------------------------------------------------------
// VTMPipeline class
// ---------------------------------------------------------------------------

/**
 * Stateful wrapper around the VTM functional API.
 *
 * Holds a `PipelineConfig` that is merged into every call, and tracks the
 * last pipeline result for inspection. All methods delegate to the
 * corresponding pure functions -- the class adds no new behaviour beyond
 * state management.
 *
 * Use `createVTMPipeline()` factory for convenient construction.
 */
export class VTMPipeline {
  private readonly config: PipelineConfig;
  private lastResult: PipelineResult | null = null;

  constructor(config?: PipelineConfig) {
    this.config = config ?? {};
  }

  /** Run the full pipeline (delegates to runPipeline). */
  async run(input: string | VisionDocument, configOverride?: PipelineConfig): Promise<PipelineResult> {
    const mergedConfig = { ...this.config, ...configOverride };
    this.lastResult = await runPipeline(input, mergedConfig);
    return this.lastResult;
  }

  /** Parse a vision document markdown string. */
  parse(markdown: string): ParseResult<VisionDocument> {
    return parseVisionDocument(markdown);
  }

  /** Validate a vision document (structural). */
  validate(doc: VisionDocument): VisionDiagnostic[] {
    return validateVisionDocument(doc);
  }

  /** Run quality checks on a vision document. */
  checkQuality(doc: VisionDocument): VisionDiagnostic[] {
    return checkQuality(doc);
  }

  /** Classify a vision document's archetype. */
  classify(doc: VisionDocument): Archetype {
    return classifyArchetype(doc);
  }

  /** Compile research references from a vision document. */
  compileResearch(doc: VisionDocument): ResearchReference {
    return compileResearch(doc);
  }

  /** Check source quality of compiled research. */
  checkSourceQuality(research: ResearchReference): SourceDiagnostic[] {
    return checkSourceQuality(research);
  }

  /** Assemble a mission package from vision document and optional research. */
  assembleMission(doc: VisionDocument, research?: ResearchReference): MissionPackage {
    return assembleMissionPackage(doc, research);
  }

  /** Select pipeline speed for a vision document. */
  selectSpeed(doc: VisionDocument): PipelineSpeed {
    return selectPipelineSpeed(doc, this.config);
  }

  /** Get the last pipeline result (null if run() never called). */
  getLastResult(): PipelineResult | null {
    return this.lastResult;
  }

  /** Get the current pipeline config (defensive copy). */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create a VTMPipeline instance.
 *
 * Convenience factory following the `createDispatcher()`, `createPlanner()`,
 * etc. naming convention used across the project.
 *
 * @param config - Optional pipeline configuration
 * @returns Configured VTMPipeline instance
 */
export function createVTMPipeline(config?: PipelineConfig): VTMPipeline {
  return new VTMPipeline(config);
}
