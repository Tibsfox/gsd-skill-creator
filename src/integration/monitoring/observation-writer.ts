/**
 * Observation writer for passive monitoring scans.
 *
 * Appends scan observation entries to sessions.jsonl in the same
 * format used by the post-commit hook and wrapper commands, but
 * with type: "scan" and source: "scan" fields.
 *
 * @module integration/monitoring/observation-writer
 */

import { appendFile, mkdir, access } from 'fs/promises';
import { dirname } from 'path';
import type { ScanObservation } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Default path for the sessions JSONL file. */
const DEFAULT_SESSIONS_PATH = '.planning/patterns/sessions.jsonl';

/** Default directory for pattern observation files. */
const DEFAULT_PATTERNS_DIR = '.planning/patterns';

// ============================================================================
// Options
// ============================================================================

/** Options for appendScanObservation. */
export interface AppendScanObservationOptions {
  /** Custom output path (default: .planning/patterns/sessions.jsonl). */
  outputPath?: string;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Append a scan observation entry to sessions.jsonl.
 *
 * Ensures the output directory exists (creating it if needed),
 * enforces `type: "scan"` and `source: "scan"` on the entry,
 * and writes compact single-line JSON followed by a newline.
 *
 * @param observation - The scan observation to write
 * @param options - Optional configuration (custom output path)
 * @throws If the file write fails (errors are not swallowed)
 */
export async function appendScanObservation(
  observation: ScanObservation,
  options?: AppendScanObservationOptions,
): Promise<void> {
  const outputPath = options?.outputPath ?? DEFAULT_SESSIONS_PATH;
  const directory = dirname(outputPath) || DEFAULT_PATTERNS_DIR;

  // Ensure the output directory exists
  try {
    await access(directory);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await mkdir(directory, { recursive: true });
    }
  }

  // Enforce scan provenance fields regardless of caller input
  const entry: ScanObservation = {
    ...observation,
    type: 'scan',
    source: 'scan',
  };

  // Write compact JSON (single line) with trailing newline
  const json = JSON.stringify(entry);
  await appendFile(outputPath, json + '\n', 'utf-8');
}
