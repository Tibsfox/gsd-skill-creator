/**
 * Bulk download engine for Aminet packages.
 *
 * Orchestrates concurrent downloads with global rate limiting, resume from
 * interruption, and mirror state integration. Ties together the fetcher,
 * integrity verifier, and state manager into a complete download pipeline.
 *
 * @module
 */

import type { AminetPackage, DownloadConfig } from './types.js';

/**
 * Result of a bulk download operation.
 */
export interface BulkDownloadResult {
  /** fullPaths that downloaded + verified */
  succeeded: string[];
  /** Packages that failed to download or verify */
  failed: Array<{ fullPath: string; error: string }>;
  /** Already mirrored, skipped on resume */
  skipped: string[];
  /** Total packages in the input list */
  total: number;
}

/**
 * Download a batch of Aminet packages with concurrency control and rate limiting.
 *
 * @param packages - Packages to download
 * @param config - Download configuration
 * @returns BulkDownloadResult with succeeded, failed, and skipped arrays
 */
export async function bulkDownload(
  _packages: AminetPackage[],
  _config: DownloadConfig,
): Promise<BulkDownloadResult> {
  throw new Error('Not implemented');
}
