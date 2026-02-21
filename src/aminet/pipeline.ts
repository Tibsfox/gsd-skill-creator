/**
 * Pipeline stage orchestrator for the Aminet package lifecycle.
 *
 * Thin coordination layer that delegates each pipeline stage to existing
 * barrel exports. Does NOT chain stages together -- that is the team
 * coordinator's job. Each call to executePipelineStage handles exactly
 * one stage. The team YAML (aminet-pipeline.yaml) defines the chaining;
 * this module provides the per-stage execution function.
 *
 * Pipeline stages:
 *   discover -> fetch -> scan -> install -> launch
 *
 * The scan gate (AGT-03) is enforced between scan and install: infected
 * packages block the pipeline with a SCAN_GATE_BLOCKED error.
 *
 * @module
 */

import { searchPackages } from './search.js';
import { fetchPackage } from './package-fetcher.js';
import { scanPackage } from './scan-orchestrator.js';
import { checkScanGate, installPackage } from './scan-gate.js';
import type { InstallPackageOptions } from './scan-gate.js';
import type {
  AminetPackage,
  PackageReadme,
  SearchOptions,
  DownloadConfig,
  VirusSignature,
  ScanPolicyConfig,
  ScanDepth,
} from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * The 5 pipeline stages in the Aminet package lifecycle.
 */
export type PipelineStage = 'discover' | 'fetch' | 'scan' | 'install' | 'launch';

/**
 * Structured result from executing a single pipeline stage.
 */
export interface PipelineStageResult {
  /** Which stage was executed */
  stage: PipelineStage | string;
  /** Whether the stage completed successfully */
  success: boolean;
  /** Stage output data (shape varies per stage) */
  data?: unknown;
  /** Structured error when success is false */
  error?: { code: string; message: string };
}

/**
 * Context object for executing a single pipeline stage.
 *
 * Each stage uses a different subset of fields. Only the stage field
 * is always required; other fields are stage-specific.
 */
export interface StageContext {
  /** Which pipeline stage to execute */
  stage: PipelineStage;

  // -- discover stage fields --
  /** Search query string */
  query?: string;
  /** Search options (query, category, subcategory, limit) */
  searchOptions?: SearchOptions;
  /** INDEX packages array for search */
  indexPackages?: AminetPackage[];
  /** Readme index map for author search */
  readmeIndex?: Map<string, PackageReadme>;

  // -- fetch stage fields --
  /** Package object for fetchPackage */
  fetchPackage?: AminetPackage;
  /** Download configuration */
  downloadConfig?: DownloadConfig;

  // -- scan stage fields --
  /** Full Aminet path for scan report */
  scanFullPath?: string;
  /** File content as Uint8Array */
  scanData?: Uint8Array;
  /** Loaded virus signatures */
  scanSignatures?: VirusSignature[];
  /** Scan policy configuration */
  scanPolicy?: ScanPolicyConfig;
  /** Scan depth override */
  scanDepth?: ScanDepth;

  // -- install stage fields --
  /** Install orchestrator options (includes scan gate check) */
  installOptions?: InstallPackageOptions;

  // -- launch stage fields --
  /** Launch configuration (opaque, passed through) */
  launchConfig?: Record<string, unknown>;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Execute a single pipeline stage, delegating to existing barrel exports.
 *
 * This is a THIN orchestrator. It handles exactly one stage per call.
 * The scan gate (AGT-03) is enforced before the install stage: if
 * checkScanGate returns allowed: false, the stage returns a structured
 * SCAN_GATE_BLOCKED error without calling installPackage.
 *
 * All errors are caught and returned as structured PipelineStageResult
 * objects with success: false -- the pipeline never throws.
 *
 * @param ctx - Stage context with stage-specific fields
 * @returns Pipeline stage result with success/failure and data/error
 */
export async function executePipelineStage(
  ctx: StageContext,
): Promise<PipelineStageResult> {
  try {
    switch (ctx.stage) {
      case 'discover': {
        const results = searchPackages(
          ctx.indexPackages ?? [],
          ctx.readmeIndex ?? new Map(),
          ctx.searchOptions ?? { query: ctx.query ?? '' },
        );
        return { stage: 'discover', success: true, data: results };
      }

      case 'fetch': {
        const result = await fetchPackage(
          ctx.fetchPackage!,
          ctx.downloadConfig!,
        );
        return { stage: 'fetch', success: true, data: result };
      }

      case 'scan': {
        const report = scanPackage(
          ctx.scanFullPath!,
          ctx.scanData!,
          ctx.scanSignatures!,
          ctx.scanPolicy!,
          ctx.scanDepth,
        );
        return { stage: 'scan', success: true, data: report };
      }

      case 'install': {
        // AGT-03: Enforce scan gate before installation
        const opts = ctx.installOptions!;
        const gate = checkScanGate(opts.fullPath, opts.state, opts.scanVerdict);

        if (!gate.allowed) {
          return {
            stage: 'install',
            success: false,
            error: {
              code: 'SCAN_GATE_BLOCKED',
              message: `Installation blocked: ${gate.reason}`,
            },
          };
        }

        const result = await installPackage(opts);
        return { stage: 'install', success: true, data: result };
      }

      case 'launch': {
        // Launch stage passes config through -- actual emulator launch is external
        return {
          stage: 'launch',
          success: true,
          data: ctx.launchConfig ?? {},
        };
      }

      default: {
        return {
          stage: ctx.stage,
          success: false,
          error: {
            code: 'UNKNOWN_STAGE',
            message: `Unknown pipeline stage: ${ctx.stage}`,
          },
        };
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      stage: ctx.stage,
      success: false,
      error: { code: 'STAGE_ERROR', message },
    };
  }
}
