/**
 * LhA archive extraction engine with path traversal prevention.
 *
 * Extracts LhA archives (the dominant Aminet archive format, ~95% of packages)
 * to a temporary directory using the lhasa/lha command-line tool. Includes:
 * - Amiga volume prefix stripping (SYS:, Work:, LIBS:, etc.)
 * - Zip-Slip path traversal prevention
 * - 30-second timeout for corrupted archives
 * - Clear install guidance when lha is not found
 *
 * @module
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, readdirSync } from 'node:fs';
import { join, resolve, relative, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import type { ExtractionResult } from './types.js';

const execFileAsync = promisify(execFile);

/** Timeout for extraction operations (30 seconds) */
const EXTRACTION_TIMEOUT_MS = 30_000;

/**
 * Strip Amiga volume prefix from a path.
 *
 * Amiga paths use volume names like SYS:, Work:, LIBS: etc. These must
 * be stripped before placing files on a Unix filesystem.
 *
 * @param rawPath - Path that may contain an Amiga volume prefix
 * @returns Path with volume prefix removed, or unchanged if none found
 *
 * @example
 * stripVolumePrefix('SYS:C/MyCommand')  // 'C/MyCommand'
 * stripVolumePrefix('Work:Games/Doom')   // 'Games/Doom'
 * stripVolumePrefix('normal/path')       // 'normal/path'
 */
export function stripVolumePrefix(rawPath: string): string {
  if (rawPath === '') return '';
  // Match any sequence of non-slash/non-backslash characters followed by colon
  return rawPath.replace(/^[^/\\]+:/, '');
}

/**
 * Sanitize an extracted file path, preventing path traversal attacks.
 *
 * Strips Amiga volume prefixes, normalizes the path, then resolves it
 * against the target directory. Throws if the resolved path escapes
 * the target directory (Zip-Slip prevention).
 *
 * @param rawPath - Raw path from the archive
 * @param targetDir - Target extraction directory (must be absolute)
 * @returns Absolute sanitized path within targetDir
 * @throws Error if path traversal is detected
 *
 * @example
 * sanitizePath('Libs/mylib.library', '/tmp/target')
 * // '/tmp/target/Libs/mylib.library'
 *
 * sanitizePath('../../../etc/passwd', '/tmp/target')
 * // throws 'Path traversal detected'
 */
export function sanitizePath(rawPath: string, targetDir: string): string {
  const stripped = stripVolumePrefix(rawPath);
  const normalized = normalize(stripped);
  const resolved = resolve(targetDir, normalized);
  const resolvedTarget = resolve(targetDir);

  if (!resolved.startsWith(resolvedTarget)) {
    throw new Error(
      `Path traversal detected: "${rawPath}" resolves to "${resolved}" which is outside "${resolvedTarget}"`,
    );
  }

  return resolved;
}

/**
 * Recursively walk a directory, collecting relative file paths.
 *
 * Returns only files (not directories), with paths relative to the
 * root directory, sorted alphabetically.
 *
 * @param dir - Directory to walk
 * @param root - Root directory for computing relative paths
 * @returns Sorted array of relative file paths
 */
export function walkDirectory(dir: string, root: string): string[] {
  const files: string[] = [];

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDirectory(fullPath, root));
    } else {
      files.push(relative(root, fullPath));
    }
  }

  return files.sort();
}

/**
 * Get platform-specific install guidance for the lha command.
 *
 * @returns Human-readable install instructions
 */
function getLhaInstallGuide(): string {
  const platform = process.platform;
  if (platform === 'linux') {
    return 'Install lhasa: sudo apt install lhasa  (Debian/Ubuntu) or sudo dnf install lhasa  (Fedora)';
  }
  if (platform === 'darwin') {
    return 'Install lhasa: brew install lhasa';
  }
  return 'Install lhasa from https://fragglet.github.io/lhasa/';
}

/**
 * Extract an LhA archive to a temporary directory.
 *
 * Uses the lhasa `lha` command with flags:
 * - `-e`: extract
 * - `-f`: force overwrite
 * - `-q2`: quiet mode (suppress output)
 * - `-w=DIR`: set extraction directory
 *
 * @param archivePath - Absolute path to the .lha archive file
 * @returns ExtractionResult with file list, extract directory, and format
 * @throws Error if lha is not installed (with install guidance)
 * @throws Error if extraction times out (30s) or fails
 *
 * @example
 * const result = await extractLha('/downloads/ProTracker36.lha');
 * console.log(result.files);      // ['ProTracker', 'ProTracker.info', ...]
 * console.log(result.extractDir); // '/tmp/lha-abc123'
 * console.log(result.format);     // 'lha'
 */
export async function extractLha(archivePath: string): Promise<ExtractionResult> {
  const extractDir = mkdtempSync(join(tmpdir(), 'lha-'));

  try {
    await execFileAsync('lha', [`-efq2w=${extractDir}`, archivePath], {
      timeout: EXTRACTION_TIMEOUT_MS,
    });
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException & { killed?: boolean };

    if (error.code === 'ENOENT') {
      // lha binary not found -- provide install guidance
      throw new Error(
        `lha command not found. ${getLhaInstallGuide()}`,
      );
    }

    if (error.killed) {
      throw new Error(
        `LhA extraction failed: extraction timed out after ${EXTRACTION_TIMEOUT_MS}ms for "${archivePath}"`,
      );
    }

    throw new Error(
      `LhA extraction failed with code ${error.code}: ${error.message}`,
    );
  }

  const files = walkDirectory(extractDir, extractDir);

  return {
    files,
    extractDir,
    format: 'lha',
  };
}
