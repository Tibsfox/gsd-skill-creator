/**
 * Amiga filesystem mapper for placing extracted archive files.
 *
 * Translates archive-relative paths into correct emulated AmigaOS filesystem
 * locations using standard Amiga assign conventions. Handles case-insensitive
 * assign lookup, volume prefix stripping, and configurable install paths.
 *
 * Standard assigns map to canonical directories under sysRoot:
 *   C: -> C/, Libs: -> Libs/, Devs: -> Devs/, S: -> S/, L: -> L/,
 *   Fonts: -> Fonts/, T: -> T/, Locale: -> Locale/, Classes: -> Classes/,
 *   Rexx: -> Rexx/, Prefs: -> Prefs/
 *
 * Non-system files go to Software/{packageBasename}/ by default, or to
 * a user-specified custom path.
 *
 * @module
 */

import { copyFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import type { InstallConfig, InstalledFile } from './types.js';
import { sanitizePath, stripVolumePrefix, walkDirectory } from './lha-extractor.js';
import { computeSha256 } from './integrity.js';

/**
 * Standard Amiga assign map.
 *
 * Keys are lowercase for case-insensitive lookup. Values are canonical
 * directory names matching AmigaOS conventions (mixed-case).
 *
 * Maps the 11 standard system assigns:
 * C:, LIBS:, DEVS:, S:, L:, FONTS:, T:, LOCALE:, CLASSES:, REXX:, Prefs:
 */
export const AMIGA_ASSIGN_MAP: Record<string, string> = {
  'c': 'C',
  'libs': 'Libs',
  'devs': 'Devs',
  's': 'S',
  'l': 'L',
  'fonts': 'Fonts',
  't': 'T',
  'locale': 'Locale',
  'classes': 'Classes',
  'rexx': 'Rexx',
  'prefs': 'Prefs',
};

/**
 * Map an extracted file path to its Amiga filesystem location.
 *
 * 1. Strips any Amiga volume prefix (SYS:, Work:, etc.)
 * 2. Splits on '/' and checks the first component against AMIGA_ASSIGN_MAP
 * 3. If matched: joins sysRoot + canonical assign name + remaining path
 * 4. If no match: joins sysRoot + (customPath || Software/{basename}) + full path
 * 5. Runs sanitizePath to prevent traversal in final result
 *
 * @param relativePath - Path relative to archive root (may include volume prefix)
 * @param packageName - Full Aminet package path (e.g., "game/shoot/Doom")
 * @param config - Install configuration with sysRoot and optional customPath
 * @returns Absolute path within sysRoot where the file should be placed
 *
 * @example
 * mapToAmigaPath('Libs/mylib.library', 'util/libs/MyLib', { sysRoot: '/amiga' })
 * // '/amiga/Libs/mylib.library'
 *
 * mapToAmigaPath('SYS:C/MyCmd', 'util/cli/MyCLI', { sysRoot: '/amiga' })
 * // '/amiga/C/MyCmd'
 *
 * mapToAmigaPath('readme.txt', 'game/shoot/Doom', { sysRoot: '/amiga' })
 * // '/amiga/Software/Doom/readme.txt'
 */
export function mapToAmigaPath(
  relativePath: string,
  packageName: string,
  config: InstallConfig,
): string {
  // Step 1: Strip volume prefix
  const cleaned = stripVolumePrefix(relativePath);

  // Step 2: Split on '/' to inspect first component
  const parts = cleaned.split('/');
  const firstComponent = parts[0];
  const assignKey = firstComponent.toLowerCase();

  // Step 3: Look up in assign map
  const canonicalAssign = AMIGA_ASSIGN_MAP[assignKey];

  let result: string;

  if (canonicalAssign && parts.length > 1) {
    // Matched an assign: use canonical name + remaining path
    const remaining = parts.slice(1).join('/');
    result = join(config.sysRoot, canonicalAssign, remaining);
  } else if (canonicalAssign && parts.length === 1) {
    // Single component that matches an assign name -- treat as the assign dir itself
    result = join(config.sysRoot, canonicalAssign);
  } else {
    // No assign match: use customPath or default Software/{basename}
    const installDir = config.customPath || join('Software', basename(packageName));
    result = join(config.sysRoot, installDir, cleaned);
  }

  // Step 5: Sanitize to prevent traversal
  return sanitizePath(result, config.sysRoot);
}

/**
 * Place extracted files into the emulated Amiga filesystem.
 *
 * Walks the extraction directory, maps each file to its Amiga location via
 * mapToAmigaPath, creates destination directories, copies files, and computes
 * SHA-256 hashes. Cleans up the source extraction directory after placement.
 *
 * @param extractDir - Temporary directory containing extracted files
 * @param packageName - Full Aminet package path for default placement
 * @param config - Install configuration with sysRoot and optional customPath
 * @returns Array of InstalledFile records with source, destination, and hash
 *
 * @example
 * const files = placeFiles('/tmp/lha-abc123', 'game/shoot/Doom', { sysRoot: '/amiga' });
 * // [{ sourcePath: 'readme.txt', destPath: '/amiga/Software/Doom/readme.txt', sha256: '...' }]
 */
export function placeFiles(
  extractDir: string,
  packageName: string,
  config: InstallConfig,
): InstalledFile[] {
  // Step 1: Walk extraction directory for all relative file paths
  const relativePaths = walkDirectory(extractDir, extractDir);

  const installed: InstalledFile[] = [];

  // Step 2: Map and copy each file
  for (const relPath of relativePaths) {
    const destPath = mapToAmigaPath(relPath, packageName, config);

    // Create destination directory
    mkdirSync(dirname(destPath), { recursive: true });

    // Copy file from extraction to destination
    copyFileSync(join(extractDir, relPath), destPath);

    // Compute SHA-256 of the placed file
    const fileData = readFileSync(destPath);
    const sha256 = computeSha256(fileData);

    installed.push({
      sourcePath: relPath,
      destPath,
      sha256,
    });
  }

  // Step 3: Clean up extraction directory
  rmSync(extractDir, { recursive: true, force: true });

  return installed;
}
