/**
 * Staging queue data collector.
 *
 * Reads queue state from the staging filesystem (queue-state.json) and
 * produces structured data for the dashboard staging queue panel renderer.
 *
 * Fault-tolerant: returns empty result on failures, never throws.
 * Follows the same pattern as planning-collector.ts.
 *
 * @module dashboard/collectors/staging-collector
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { QueueEntry } from '../../staging/queue/types.js';
import type { StagingQueuePanelData } from '../staging-queue-panel.js';
import type { StagingCollectorOptions } from './types.js';

/** Path to queue state file relative to basePath. */
const QUEUE_STATE_PATH = '.planning/staging/queue-state.json';

/** Empty result returned on any failure. */
const EMPTY_RESULT: StagingQueuePanelData = {
  entries: [],
  dependencies: [],
};

/**
 * Collect staging queue data from queue-state.json.
 *
 * Reads the queue state file, parses entries, and returns
 * structured data for the staging queue panel renderer.
 *
 * Fault-tolerant: returns empty entries and dependencies arrays
 * when the file is missing, empty, malformed, or not an array.
 *
 * @param options - Collector options (basePath).
 * @returns Staging queue panel data with entries and empty dependencies.
 */
export async function collectStagingQueue(
  options: StagingCollectorOptions = {},
): Promise<StagingQueuePanelData> {
  const basePath = options.basePath ?? process.cwd();
  const filePath = join(basePath, QUEUE_STATE_PATH);

  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    // Validate parsed data is an array
    if (!Array.isArray(parsed)) {
      return EMPTY_RESULT;
    }

    return {
      entries: parsed as QueueEntry[],
      dependencies: [],
    };
  } catch {
    // ENOENT, malformed JSON, or any other error → empty result
    return EMPTY_RESULT;
  }
}
