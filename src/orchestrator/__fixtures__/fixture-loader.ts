/**
 * Fixture loader utility for orchestrator tests.
 *
 * Provides helpers to resolve absolute paths to versioned GSD fixture
 * snapshots and planning state fixtures. Used by all orchestrator tests
 * to avoid inline fixture strings and enable CI-safe testing.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the absolute path to a versioned GSD fixture directory.
 *
 * @param version - Fixture version directory name (default: 'gsd-v1.15')
 * @returns Absolute path to the versioned fixture directory
 */
export function getFixturePath(version: string = 'gsd-v1.15'): string {
  return join(__dirname, version);
}

/**
 * Get absolute paths to both the GSD base and planning fixture directories.
 *
 * @param version - Fixture version directory name (default: 'gsd-v1.15')
 * @returns Object with gsdBase and planningDir absolute paths
 */
export function getFixturePaths(version: string = 'gsd-v1.15'): {
  gsdBase: string;
  planningDir: string;
} {
  return {
    gsdBase: join(__dirname, version),
    planningDir: join(__dirname, 'planning'),
  };
}
