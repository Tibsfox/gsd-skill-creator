/**
 * JSONL persistence for drift score history.
 *
 * Drift scores are stored in an append-only JSONL file for historical
 * analysis. Default path: ~/.gsd/dacp/retrospective/drift-scores.jsonl
 *
 * @module dacp/retrospective/persistence
 */

import { mkdir, appendFile, readFile } from 'fs/promises';
import { dirname } from 'path';
import type { DriftScoreRecord } from './types.js';

/** Default path for the drift score JSONL file */
export const DEFAULT_DRIFT_PATH = '~/.gsd/dacp/retrospective/drift-scores.jsonl';

/**
 * Resolve home directory tilde in a file path.
 *
 * @param filePath - Path that may start with ~/
 * @returns Resolved absolute path
 */
function resolveHome(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return filePath.replace('~', process.env.HOME ?? '/tmp');
  }
  return filePath;
}

/**
 * Append a drift score record to the JSONL file.
 * Creates the directory structure if it doesn't exist.
 * Each record is written as a single JSON line followed by a newline.
 *
 * @param record - The drift score record to append
 * @param filePath - Path to the JSONL file (defaults to DEFAULT_DRIFT_PATH)
 */
export async function appendDriftScore(
  record: DriftScoreRecord,
  filePath: string = DEFAULT_DRIFT_PATH,
): Promise<void> {
  const resolved = resolveHome(filePath);
  await mkdir(dirname(resolved), { recursive: true });
  const line = JSON.stringify(record) + '\n';
  await appendFile(resolved, line, 'utf-8');
}

/**
 * Read all drift score records from the JSONL file.
 * Returns an empty array if the file doesn't exist or is empty.
 *
 * @param filePath - Path to the JSONL file (defaults to DEFAULT_DRIFT_PATH)
 * @returns Array of drift score records in chronological order
 */
export async function readDriftHistory(
  filePath: string = DEFAULT_DRIFT_PATH,
): Promise<DriftScoreRecord[]> {
  const resolved = resolveHome(filePath);
  let content: string;
  try {
    content = await readFile(resolved, 'utf-8');
  } catch {
    return [];
  }
  if (!content.trim()) return [];
  return content
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as DriftScoreRecord);
}
