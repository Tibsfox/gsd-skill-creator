/**
 * LZX archive extraction via unlzx with cwd workaround.
 *
 * unlzx has no output directory flag, so extraction must use the cwd
 * option on execFile to control where files are placed. The archive
 * path is resolved to absolute before invocation since cwd changes
 * the working directory.
 *
 * LZX archives are rare on Aminet (~5%), so missing unlzx degrades
 * gracefully -- the tool is optional.
 *
 * @module
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import type { ExtractionResult } from './types.js';

const execFileAsync = promisify(execFile);

/** Timeout for extraction operations (30 seconds) */
const EXTRACTION_TIMEOUT_MS = 30_000;

/**
 * Recursively walk a directory and return relative file paths.
 *
 * Inlined here because lha-extractor.ts (which provides the shared
 * walkDirectory) may not exist when running in parallel with Plan 240-01.
 * When lha-extractor.ts is available, this can be replaced with an import.
 */
function walkDirectory(dir: string, root: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath, root));
    } else {
      results.push(relative(root, fullPath));
    }
  }
  return results.sort();
}

/**
 * Extract an LZX archive safely to a temp directory.
 *
 * Uses unlzx via execFile with:
 * - -x: extract mode
 * - cwd: temp directory (unlzx has no output dir flag)
 *
 * The archive path is resolved to absolute since cwd changes the
 * process working directory -- a relative path would resolve against
 * the extraction directory instead of the original working directory.
 *
 * @param archivePath - Path to the .lzx file (will be resolved to absolute)
 * @returns ExtractionResult with file list and temp directory
 * @throws Error if unlzx is not installed or extraction fails
 */
export async function extractLzx(archivePath: string): Promise<ExtractionResult> {
  const extractDir = mkdtempSync(join(tmpdir(), 'aminet-lzx-'));

  // MUST be absolute since cwd changes the working directory
  const absArchive = resolve(archivePath);

  try {
    await execFileAsync('unlzx', ['-x', absArchive], {
      cwd: extractDir,
      timeout: EXTRACTION_TIMEOUT_MS,
    });
  } catch (err: unknown) {
    // Clean up temp dir on failure
    rmSync(extractDir, { recursive: true, force: true });

    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as NodeJS.ErrnoException).code;

    if (code === 'ENOENT' || msg.includes('ENOENT')) {
      throw new Error(
        'unlzx command not found. Build from source: https://github.com/nhoudelot/unlzx\n' +
        'Or: sudo apt install unlzx (if available)',
      );
    }

    throw new Error(`LZX extraction failed for ${archivePath}: ${msg}`);
  }

  // Walk extracted files and collect relative paths
  const files = walkDirectory(extractDir, extractDir);
  return { files, extractDir, format: 'lzx' };
}
