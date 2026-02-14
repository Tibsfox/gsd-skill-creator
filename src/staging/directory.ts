/**
 * Staging directory structure creation and validation.
 *
 * Creates the .planning/staging/ directory tree with all
 * required subdirectories for the staging pipeline.
 *
 * @module staging/directory
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ALL_STAGING_DIRS, STAGING_DIRS } from './types.js';

/**
 * Create the full .planning/staging/ directory tree.
 *
 * Creates all subdirectories defined in ALL_STAGING_DIRS. Uses recursive
 * mkdir so intermediate directories are created as needed. Idempotent --
 * calling multiple times is safe.
 *
 * Does NOT create queue.jsonl -- that file is managed by the queue module.
 *
 * @param basePath - Project root (parent of .planning/)
 * @returns Absolute path to the staging root directory
 */
export async function ensureStagingDirectory(basePath: string): Promise<string> {
  await Promise.all(
    ALL_STAGING_DIRS.map((relPath) => {
      const fullPath = join(basePath, relPath);
      return mkdir(fullPath, { recursive: true });
    }),
  );

  return join(basePath, STAGING_DIRS.root);
}
