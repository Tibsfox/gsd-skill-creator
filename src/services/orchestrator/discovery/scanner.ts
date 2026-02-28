/**
 * GSD filesystem scanner.
 *
 * Provides reusable directory listing with file extension filtering
 * and subdirectory listing. Returns empty arrays for non-existent
 * directories instead of throwing, enabling graceful degradation.
 */

import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Scan a directory and return files matching the given extension.
 *
 * @param dirPath - Absolute path to the directory to scan
 * @param extension - File extension to filter by (default: '.md')
 * @returns Array of absolute file paths, or empty array if dir is missing
 */
export async function scanDirectory(dirPath: string, extension: string = '.md'): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
      .map((entry) => join(dirPath, entry.name));
  } catch {
    return [];
  }
}

/**
 * Scan a directory and return subdirectory names.
 *
 * Returns only directory names (not full paths) since the caller
 * knows the base path and can construct full paths as needed.
 *
 * @param dirPath - Absolute path to the directory to scan
 * @returns Array of subdirectory names, or empty array if dir is missing
 */
export async function scanDirectoryForDirs(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}
