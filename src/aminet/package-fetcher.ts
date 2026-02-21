/**
 * Single-package fetcher with mirror fallback.
 *
 * Downloads one .lha archive from the first working Aminet mirror,
 * preserving the Aminet directory hierarchy (category/subcategory/)
 * in the local mirror directory. Optionally downloads the companion
 * .readme file; readme failure is non-fatal.
 *
 * This is the atomic download unit that the bulk downloader (Plan 04)
 * calls repeatedly. All HTTP requests include the configured User-Agent
 * header and use AbortController for timeout enforcement.
 *
 * @module
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type { AminetPackage, DownloadConfig } from './types.js';

// ============================================================================
// FetchResult
// ============================================================================

/**
 * Result of fetching a single Aminet package.
 *
 * Always contains the .lha path and data. The .readme fields are null
 * when the readme could not be fetched (non-fatal).
 */
export interface FetchResult {
  /** Absolute path where the .lha was saved */
  lhaPath: string;
  /** Raw .lha file contents */
  lhaData: Buffer;
  /** Absolute path where the .readme was saved, or null */
  readmePath: string | null;
  /** Raw .readme file contents, or null */
  readmeData: Buffer | null;
}

// ============================================================================
// fetchPackage
// ============================================================================

/**
 * Download a single Aminet package (.lha + optional .readme) from mirrors.
 *
 * Tries each mirror in `config.mirrors` order. On the first successful
 * .lha download, saves the file to `config.mirrorDir/<pkg.fullPath>`,
 * creating intermediate directories as needed.
 *
 * After the .lha succeeds, attempts to fetch the .readme from the same
 * mirror. Readme failure is silently ignored.
 *
 * @param pkg    - The Aminet package to download.
 * @param config - Download configuration with mirrors, timeout, and paths.
 * @returns A FetchResult with paths and data for both files.
 * @throws Error if all mirrors fail to serve the .lha.
 */
export async function fetchPackage(
  pkg: AminetPackage,
  config: DownloadConfig,
): Promise<FetchResult> {
  const errors: Array<{ mirror: string; error: Error }> = [];

  for (const mirror of config.mirrors) {
    try {
      // Construct .lha URL: mirror base + "/" + full Aminet path
      // No hardcoded /aminet/ prefix -- the mirror URL already contains
      // any needed prefix (e.g., "http://de.aminet.net/aminet")
      const lhaUrl = `${mirror}/${pkg.fullPath}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      let response: Response;
      try {
        response = await fetch(lhaUrl, {
          headers: { 'User-Agent': config.userAgent },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${lhaUrl}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const lhaData = Buffer.from(arrayBuffer);

      // Create directory hierarchy: mirrorDir/category/subcategory/
      const dirPath = join(config.mirrorDir, pkg.directory);
      mkdirSync(dirPath, { recursive: true });

      // Write .lha file
      const lhaPath = join(config.mirrorDir, pkg.fullPath);
      writeFileSync(lhaPath, lhaData);

      // Attempt .readme download (non-fatal)
      const { readmePath, readmeData } = await fetchReadme(
        pkg,
        mirror,
        config,
        dirPath,
      );

      return { lhaPath, lhaData, readmePath, readmeData };
    } catch (err) {
      errors.push({
        mirror,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  // All mirrors failed -- aggregate error
  const details = errors
    .map((e) => `  ${e.mirror}: ${e.error.message}`)
    .join('\n');
  throw new Error(
    `All ${config.mirrors.length} mirrors failed to fetch ${pkg.fullPath}:\n${details}`,
  );
}

// ============================================================================
// fetchReadme (internal)
// ============================================================================

/**
 * Attempt to download the companion .readme for a package.
 *
 * Constructs the readme URL by replacing the .lha extension with .readme
 * in the full path. Failure is non-fatal: returns nulls on any error.
 */
async function fetchReadme(
  pkg: AminetPackage,
  mirror: string,
  config: DownloadConfig,
  dirPath: string,
): Promise<{ readmePath: string | null; readmeData: Buffer | null }> {
  try {
    const readmeFullPath = pkg.fullPath.replace(/\.lha$/, '.readme');
    const readmeUrl = `${mirror}/${readmeFullPath}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(readmeUrl, {
        headers: { 'User-Agent': config.userAgent },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return { readmePath: null, readmeData: null };
    }

    const arrayBuffer = await response.arrayBuffer();
    const readmeData = Buffer.from(arrayBuffer);

    const readmeFilename = pkg.filename.replace(/\.lha$/, '.readme');
    const readmePath = join(dirPath, readmeFilename);
    writeFileSync(readmePath, readmeData);

    return { readmePath, readmeData };
  } catch {
    // Non-fatal: readme failure should never prevent .lha success
    return { readmePath: null, readmeData: null };
  }
}
