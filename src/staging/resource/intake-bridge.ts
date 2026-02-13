/**
 * Bridge between intake flow confirmation and resource manifest generation.
 *
 * Wraps confirmIntake with resource manifest generation so that confirming
 * a document generates a manifest and adds the work to the staging queue.
 * Uses dependency injection for testability -- all external dependencies
 * are injected via IntakeBridgeDeps.
 *
 * @module staging/resource/intake-bridge
 */

import { join } from 'node:path';
import { readFile as fsReadFile, writeFile as fsWriteFile } from 'node:fs/promises';
import type { IntakeFlowResult, IntakeDependencies } from '../intake-flow/orchestrator.js';
import type { IntakeFlowStep, IntakeFlowState } from '../intake-flow/step-types.js';
import type { ResourceManifest } from './types.js';
import type { SkillCapability } from '../../capabilities/types.js';
import type { ManifestOptions } from './manifest.js';
import { confirmIntake as realConfirmIntake } from '../intake-flow/orchestrator.js';
import { generateResourceManifest as realGenerateResourceManifest } from './manifest.js';
import { recordStep as realRecordStep } from '../intake-flow/step-tracker.js';
import { STAGING_DIRS } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/** Options for confirming with resource manifest generation. */
export interface ConfirmResourceOptions {
  /** Project root (parent of .planning/). */
  basePath: string;
  /** Document filename in the staging pipeline. */
  filename: string;
  /** Optional extra context from user ("anything else?"). */
  additionalContext?: string;
  /** Available skills from the capability manifest. */
  availableSkills: SkillCapability[];
  /** Context window size in tokens (defaults to 200,000). */
  contextWindowSize?: number;
}

/** Result of confirming with resource manifest generation. */
export interface ConfirmResourceResult {
  /** Result from the intake confirmation flow. */
  intakeResult: IntakeFlowResult;
  /** Generated resource manifest. */
  manifest: ResourceManifest;
  /** Absolute path where the manifest was persisted. */
  manifestPath: string;
}

/** Dependency injection interface for testability. */
export interface IntakeBridgeDeps {
  /** Confirm intake flow (wraps confirmIntake from orchestrator). */
  confirmIntake: (options: {
    basePath: string;
    filename: string;
    additionalContext?: string;
    deps?: Partial<IntakeDependencies>;
  }) => Promise<IntakeFlowResult>;
  /** Generate a resource manifest from document content and skills. */
  generateResourceManifest: (options: ManifestOptions) => ResourceManifest;
  /** Read a file from disk. */
  readFile: (path: string) => Promise<string>;
  /** Write a file to disk. */
  writeFile: (path: string, data: string) => Promise<void>;
  /** Record a step in the intake flow state tracker. */
  recordStep: (step: IntakeFlowStep, metadataPath: string, data?: Partial<IntakeFlowState>) => Promise<void>;
}

// ============================================================================
// Default Dependencies
// ============================================================================

/** Build default real dependencies. */
function defaultDeps(): IntakeBridgeDeps {
  return {
    confirmIntake: realConfirmIntake,
    generateResourceManifest: realGenerateResourceManifest,
    readFile: (path: string) => fsReadFile(path, 'utf-8'),
    writeFile: (path: string, data: string) => fsWriteFile(path, data, 'utf-8'),
    recordStep: realRecordStep,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Confirm intake and generate a resource manifest.
 *
 * Wraps the intake confirmation flow with resource manifest generation:
 * 1. Call confirmIntake to move document to ready state
 * 2. Read document content from the ready directory
 * 3. Generate resource manifest from content and available skills
 * 4. Write manifest as pretty JSON next to metadata in ready directory
 * 5. Record 'queued' step on the ready-directory metadata
 * 6. Return combined result
 *
 * @param options - Confirmation options with skills and context window
 * @param deps - Optional dependency injection for testing
 * @returns Combined intake result, manifest, and manifest path
 */
export async function confirmWithResources(
  options: ConfirmResourceOptions,
  deps?: IntakeBridgeDeps,
): Promise<ConfirmResourceResult> {
  const d = deps ?? defaultDeps();
  const { basePath, filename, additionalContext, availableSkills, contextWindowSize } = options;

  // 1. Confirm intake (moves document to ready)
  const intakeResult = await d.confirmIntake({
    basePath,
    filename,
    additionalContext,
  });

  // 2. Read document content from ready directory
  const documentPath = join(basePath, STAGING_DIRS.ready, filename);
  const content = await d.readFile(documentPath);

  // 3. Generate resource manifest
  const manifest = d.generateResourceManifest({
    content,
    availableSkills,
    contextWindowSize,
  });

  // 4. Write manifest to disk as pretty JSON
  const manifestPath = join(basePath, STAGING_DIRS.ready, `${filename}.manifest.json`);
  await d.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  // 5. Record 'queued' step on metadata in ready directory
  const metadataPath = join(basePath, STAGING_DIRS.ready, `${filename}.meta.json`);
  await d.recordStep('queued', metadataPath);

  // 6. Return combined result
  return {
    intakeResult,
    manifest,
    manifestPath,
  };
}
