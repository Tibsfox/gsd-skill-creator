/**
 * Console directory structure creation and validation.
 *
 * Creates the .planning/console/ directory tree with all
 * required subdirectories for inbox/outbox message routing.
 *
 * @module console/directory
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ALL_CONSOLE_DIRS, CONSOLE_DIRS } from './types.js';

/**
 * Create the full .planning/console/ directory tree.
 *
 * Creates all subdirectories defined in CONSOLE_DIRS. Uses recursive
 * mkdir so intermediate directories are created as needed. Idempotent --
 * calling multiple times is safe.
 *
 * @param basePath - Project root (parent of .planning/)
 * @returns Absolute path to the console root directory
 */
export async function ensureConsoleDirectory(basePath: string): Promise<string> {
  await Promise.all(
    ALL_CONSOLE_DIRS.map((relPath) => {
      const fullPath = join(basePath, relPath);
      return mkdir(fullPath, { recursive: true });
    }),
  );

  return join(basePath, CONSOLE_DIRS.root);
}
