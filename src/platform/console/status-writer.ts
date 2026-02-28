/**
 * Writes session status updates to the console outbox.
 *
 * Creates/overwrites outbox/status/current.json with the current
 * session state so the dashboard can display live progress.
 *
 * @module console/status-writer
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CONSOLE_DIRS } from './types.js';

/** Session status data written to current.json. */
export interface SessionStatus {
  phase: string;
  plan: string;
  status: string;
  progress: number;
  updated_at: string;
}

/**
 * Writes session status to the console outbox filesystem.
 *
 * Creates outbox/status/current.json with structured status data.
 * Each write overwrites the previous file (always reflects current state).
 */
export class StatusWriter {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Write current session status to outbox/status/current.json.
   *
   * @param phase - Current phase identifier
   * @param plan - Current plan identifier
   * @param status - Status string (e.g. 'executing', 'complete', 'blocked')
   * @param progress - Progress as a number (0.0 to 1.0)
   * @returns Absolute path to the written current.json file
   */
  async writeStatus(phase: string, plan: string, status: string, progress: number): Promise<string> {
    const statusDir = join(this.basePath, CONSOLE_DIRS.outboxStatus);
    await mkdir(statusDir, { recursive: true });

    const data: SessionStatus = {
      phase,
      plan,
      status,
      progress,
      updated_at: new Date().toISOString(),
    };

    const filePath = join(statusDir, 'current.json');
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }
}
