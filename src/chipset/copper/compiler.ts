/**
 * Pipeline compiler -- pre-compiles Pipelines from plan metadata.
 *
 * The compiler transforms GSD plan metadata (phase, skills, lifecycle events)
 * into executable Pipelines containing WAIT/MOVE/SKIP instructions. This
 * makes the coprocessor data-driven: plans declare what to activate and when,
 * and the compiler generates the instruction program.
 *
 * The loader reads compiled lists from disk, validates them against the
 * PipelineSchema, and returns them for execution by PipelineExecutor.
 *
 * Serialization uses JSON (a valid YAML superset) to avoid adding a
 * dependency on a YAML library. Files use the .pipeline.yaml extension
 * for forward compatibility with full YAML parsers.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Pipeline,
  PipelineInstruction,
  PipelineMetadata,
  GsdLifecycleEvent,
  ActivationMode,
  MoveTargetType,
  SkipCondition,
} from './types.js';
import { PipelineSchema } from './schema.js';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Plan metadata extracted from YAML frontmatter.
 *
 * This is the input to the compiler -- it describes what a plan needs
 * in terms of skill activations and lifecycle synchronization points.
 */
export interface PlanMetadata {
  /** Phase identifier, e.g. '110-copper-executor'. */
  phase: string;

  /** Plan number within the phase, e.g. 1, 2, 3. */
  plan: number;

  /** Plan type: 'execute' or 'tdd'. */
  type?: string;

  /** Wave number for parallel execution. */
  wave?: number;

  /** Plans this plan depends on. */
  depends_on?: string[];

  /** Files modified by this plan. */
  files_modified?: string[];

  /** Whether the plan runs autonomously (no checkpoints). */
  autonomous?: boolean;

  /** Skills to activate during plan execution. */
  skills?: Array<{
    /** Skill name (e.g. 'git-commit', 'lint'). */
    name: string;

    /** Activation mode. Defaults to 'full' if omitted. */
    mode?: ActivationMode;

    /** Target type. Defaults to 'skill' if omitted. */
    target?: MoveTargetType;

    /** Optional condition for conditional activation (generates SKIP). */
    conditions?: SkipCondition;
  }>;

  /** GSD lifecycle events to synchronize with. Defaults to ['phase-start']. */
  lifecycle_events?: GsdLifecycleEvent[];
}

/**
 * Options for customizing compiled Pipeline metadata.
 */
export interface CompilerOptions {
  /** Priority score (1-100). Default: 50. */
  priority?: number;

  /** Confidence score (0-1). Default: 1.0. */
  confidence?: number;

  /** Tags for categorization. */
  tags?: string[];

  /** Human-readable description override. */
  description?: string;
}

// ============================================================================
// Compiler
// ============================================================================

/**
 * Compile a Pipeline from plan metadata.
 *
 * Transforms plan metadata into an executable instruction program:
 * 1. WAIT instructions for lifecycle events
 * 2. MOVE instructions for skill activations
 * 3. SKIP instructions for conditional activations
 *
 * The compiled list is validated against PipelineSchema before return.
 *
 * @param metadata - Plan metadata (phase, skills, lifecycle events)
 * @param options - Optional compiler options (priority, confidence, etc.)
 * @returns A validated Pipeline ready for execution
 */
export function compilePipeline(
  metadata: PlanMetadata,
  options?: CompilerOptions,
): Pipeline {
  const planNum = String(metadata.plan).padStart(2, '0');
  const listName = `${metadata.phase}-${planNum}`;

  // Determine lifecycle events (default to ['phase-start'])
  const lifecycleEvents = metadata.lifecycle_events ?? ['phase-start'];

  // Build instruction array
  const instructions: PipelineInstruction[] = [];

  // Start with WAIT for the first lifecycle event
  if (lifecycleEvents.length > 0) {
    instructions.push({
      type: 'wait' as const,
      event: lifecycleEvents[0],
    });
  }

  // Add MOVE (and optional SKIP) instructions for each skill
  const skills = metadata.skills ?? [];
  for (const skill of skills) {
    // If skill has conditions, prepend a SKIP instruction
    if (skill.conditions) {
      instructions.push({
        type: 'skip' as const,
        condition: skill.conditions,
      });
    }

    // Add MOVE instruction
    instructions.push({
      type: 'move' as const,
      target: skill.target ?? 'skill',
      name: skill.name,
      mode: skill.mode ?? 'full',
    });
  }

  // Add remaining lifecycle events as WAIT instructions
  for (let i = 1; i < lifecycleEvents.length; i++) {
    instructions.push({
      type: 'wait' as const,
      event: lifecycleEvents[i],
    });
  }

  // Safety: ensure at least one instruction
  if (instructions.length === 0) {
    instructions.push({
      type: 'wait' as const,
      event: 'phase-start',
    });
  }

  // Build metadata
  const pipelineMetadata: PipelineMetadata = {
    name: listName,
    description:
      options?.description ??
      `Pipeline for ${metadata.phase} plan ${metadata.plan}`,
    sourcePatterns: [metadata.phase],
    priority: options?.priority ?? 50,
    confidence: options?.confidence ?? 1.0,
    tags: options?.tags,
    version: 1,
  };

  const list: Pipeline = {
    metadata: pipelineMetadata,
    instructions,
  };

  // Validate against schema (throws on invalid)
  return PipelineSchema.parse(list) as Pipeline;
}

// ============================================================================
// Save / Load
// ============================================================================

/**
 * Save a compiled Pipeline to disk as a .pipeline.yaml file.
 *
 * Serializes using JSON (valid YAML superset). Creates the target
 * directory if it doesn't exist.
 *
 * @param list - The Pipeline to save
 * @param directory - Target directory path
 * @returns The absolute file path of the saved file
 */
export async function savePipeline(
  list: Pipeline,
  directory: string,
): Promise<string> {
  await mkdir(directory, { recursive: true });

  const filePath = join(directory, `${list.metadata.name}.pipeline.yaml`);
  const content = JSON.stringify(list, null, 2);

  await writeFile(filePath, content, 'utf-8');

  return filePath;
}

/**
 * Load all compiled Pipelines from a directory.
 *
 * Reads all .pipeline.yaml files, parses them as JSON, and validates
 * each against PipelineSchema. Invalid files are skipped with a
 * warning to stderr.
 *
 * @param directory - Directory to scan for .pipeline.yaml files
 * @param options - Optional filter options
 * @param options.phase - If provided, only load lists from a subdirectory matching this phase name
 * @returns Array of validated Pipeline objects
 */
export async function loadPipelines(
  directory: string,
  options?: { phase?: string },
): Promise<Pipeline[]> {
  // If phase filter is specified, look in the phase subdirectory
  const targetDir = options?.phase
    ? join(directory, options.phase)
    : directory;

  let entries: string[];
  try {
    entries = await readdir(targetDir);
  } catch {
    // Directory doesn't exist -- return empty
    return [];
  }

  // Filter for .pipeline.yaml files
  const pipelineFiles = entries.filter((f) => f.endsWith('.pipeline.yaml'));

  const lists: Pipeline[] = [];

  for (const file of pipelineFiles) {
    const filePath = join(targetDir, file);
    try {
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const result = PipelineSchema.safeParse(parsed);

      if (result.success) {
        lists.push(result.data as Pipeline);
      } else {
        process.stderr.write(
          `Warning: Skipping invalid Pipeline file "${file}": ${result.error.message}\n`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `Warning: Failed to parse Pipeline file "${file}": ${message}\n`,
      );
    }
  }

  return lists;
}
