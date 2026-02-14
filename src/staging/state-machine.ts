/**
 * State machine for moving documents between staging states.
 *
 * Documents progress through: inbox -> checking -> attention -> ready -> aside.
 * Each move physically relocates the document and its companion .meta.json,
 * and updates the metadata status field to match the new state.
 *
 * @module staging/state-machine
 */

import { rename, readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { STAGING_DIRS } from './types.js';
import type { StagingState } from './types.js';
import { StagingMetadataSchema } from './schema.js';

/**
 * Allowed state transitions in the staging pipeline.
 *
 * - inbox -> checking: start processing
 * - inbox -> aside: set aside before processing
 * - checking -> attention: needs human attention (hygiene issues found)
 * - checking -> ready: passed all checks
 * - checking -> aside: set aside during processing
 * - attention -> checking: re-check after user addresses issues
 * - attention -> ready: user approves despite findings
 * - attention -> aside: user defers
 * - ready -> checking: re-check (e.g., after pattern reference update)
 * - ready -> aside: user defers
 * - aside -> inbox: re-submit for processing
 */
export const VALID_TRANSITIONS: Record<StagingState, StagingState[]> = {
  inbox: ['checking', 'aside'],
  checking: ['attention', 'ready', 'aside'],
  attention: ['checking', 'ready', 'aside'],
  ready: ['checking', 'aside'],
  aside: ['inbox'],
};

/** Result of a successful document move. */
export interface MoveDocumentResult {
  /** Absolute path to the document in its new location. */
  documentPath: string;
  /** Absolute path to the metadata file in its new location. */
  metadataPath: string;
}

/** Options for moving a document between staging states. */
interface MoveDocumentOptions {
  /** Project root (parent of .planning/). */
  basePath: string;
  /** Document filename (e.g., 'my-skill.md'). */
  filename: string;
  /** Current staging state. */
  fromState: StagingState;
  /** Target staging state. */
  toState: StagingState;
}

/**
 * Resolve the absolute directory path for a staging state.
 */
function dirForState(basePath: string, state: StagingState): string {
  const dirMap: Record<StagingState, string> = {
    inbox: STAGING_DIRS.inbox,
    checking: STAGING_DIRS.checking,
    attention: STAGING_DIRS.attention,
    ready: STAGING_DIRS.ready,
    aside: STAGING_DIRS.aside,
  };
  return join(basePath, dirMap[state]);
}

/**
 * Move a document from one staging state to another.
 *
 * Physically relocates the document file and its .meta.json companion,
 * updates the metadata status field to match the new state, and
 * validates the updated metadata through the Zod schema.
 *
 * @throws Error if fromState === toState (same-state move)
 * @throws Error if transition is not in VALID_TRANSITIONS
 * @throws Error if source document does not exist
 */
export async function moveDocument(options: MoveDocumentOptions): Promise<MoveDocumentResult> {
  const { basePath, filename, fromState, toState } = options;

  // Validate: same-state move
  if (fromState === toState) {
    throw new Error(`Cannot move document to the same state: ${fromState}`);
  }

  // Validate: allowed transition
  const allowed = VALID_TRANSITIONS[fromState];
  if (!allowed.includes(toState)) {
    throw new Error(`Invalid state transition: ${fromState} -> ${toState}`);
  }

  // Resolve source and target paths
  const sourceDir = dirForState(basePath, fromState);
  const targetDir = dirForState(basePath, toState);

  const sourceDocPath = join(sourceDir, filename);
  const sourceMetaPath = join(sourceDir, filename + '.meta.json');
  const targetDocPath = join(targetDir, filename);
  const targetMetaPath = join(targetDir, filename + '.meta.json');

  // Ensure target directory exists
  await mkdir(targetDir, { recursive: true });

  // Read current metadata
  const rawMeta = await readFile(sourceMetaPath, 'utf-8');
  const parsedMeta = JSON.parse(rawMeta);

  // Update status to match new state
  parsedMeta.status = toState;

  // Validate updated metadata through schema
  const validatedMeta = StagingMetadataSchema.parse(parsedMeta);

  // Move document file (atomic rename on same filesystem)
  await rename(sourceDocPath, targetDocPath);

  // Write updated metadata to target location
  await writeFile(targetMetaPath, JSON.stringify(validatedMeta, null, 2), 'utf-8');

  // Remove old metadata file
  await unlink(sourceMetaPath);

  return {
    documentPath: targetDocPath,
    metadataPath: targetMetaPath,
  };
}
