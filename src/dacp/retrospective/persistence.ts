/**
 * JSONL persistence for drift score history.
 *
 * Drift scores are stored in an append-only JSONL file for historical
 * analysis. Default path: ~/.gsd/dacp/retrospective/drift-scores.jsonl
 *
 * @module dacp/retrospective/persistence
 */

import type { DriftScoreRecord } from './types.js';

/** Default path for the drift score JSONL file */
export const DEFAULT_DRIFT_PATH = '~/.gsd/dacp/retrospective/drift-scores.jsonl';

/**
 * Append a drift score record to the JSONL file.
 *
 * @param record - The drift score record to append
 * @param filePath - Path to the JSONL file (defaults to DEFAULT_DRIFT_PATH)
 */
export async function appendDriftScore(
  _record: DriftScoreRecord,
  _filePath?: string,
): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Read all drift score records from the JSONL file.
 *
 * @param filePath - Path to the JSONL file (defaults to DEFAULT_DRIFT_PATH)
 * @returns Array of drift score records, or empty array if file doesn't exist
 */
export async function readDriftHistory(
  _filePath?: string,
): Promise<DriftScoreRecord[]> {
  throw new Error('Not implemented');
}
