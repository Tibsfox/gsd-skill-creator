/**
 * Console page data collector.
 *
 * Gathers all data needed to render the console page: session status,
 * pending questions, milestone config, and activity log entries from
 * the .planning/console/ filesystem directory tree.
 *
 * Fault-tolerant: every read is wrapped in try/catch and returns safe
 * defaults on failure. Never throws.
 *
 * @module dashboard/collectors/console-collector
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONSOLE_DIRS } from '../../console/types.js';
import type { SessionStatus } from '../../console/status-writer.js';
import { MilestoneConfigSchema } from '../../console/milestone-config.js';
import type { MilestoneConfig } from '../../console/milestone-config.js';
import { QuestionPoller } from '../question-poller.js';
import { classifyLogEntry, type ActivityEntry } from '../console-activity.js';
import type { BridgeLogEntry } from '../../console/bridge-logger.js';
import type { ConsolePageData } from '../console-page.js';
import type { Question } from '../../console/question-schema.js';
import type { ConsoleCollectorOptions } from './types.js';

// ---------------------------------------------------------------------------
// Default helper URL
// ---------------------------------------------------------------------------

const DEFAULT_HELPER_URL = '/api/console/message';

// ---------------------------------------------------------------------------
// Internal data collection helpers (all fault-tolerant)
// ---------------------------------------------------------------------------

/**
 * Read and parse session status from outbox/status/current.json.
 * Returns null on any failure (missing file, malformed JSON, etc.).
 */
async function collectStatus(basePath: string): Promise<SessionStatus | null> {
  try {
    const statusPath = join(basePath, CONSOLE_DIRS.outboxStatus, 'current.json');
    const raw = await readFile(statusPath, 'utf-8');
    return JSON.parse(raw) as SessionStatus;
  } catch {
    return null;
  }
}

/**
 * Poll pending questions from outbox/questions/ via QuestionPoller.
 * Returns empty array on any failure.
 */
async function collectQuestions(basePath: string): Promise<Question[]> {
  try {
    const poller = new QuestionPoller(basePath);
    return await poller.poll();
  } catch {
    return [];
  }
}

/**
 * Read and validate milestone config from config/milestone-config.json.
 * Returns null on missing file, malformed JSON, or schema validation failure.
 */
async function collectConfig(basePath: string): Promise<MilestoneConfig | null> {
  try {
    const configPath = join(basePath, CONSOLE_DIRS.config, 'milestone-config.json');
    const raw = await readFile(configPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    const result = MilestoneConfigSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Read bridge.jsonl and classify each entry into an ActivityEntry.
 * Returns empty array on missing file or any parse error.
 */
async function collectActivity(basePath: string): Promise<ActivityEntry[]> {
  try {
    const logPath = join(basePath, CONSOLE_DIRS.logs, 'bridge.jsonl');
    const raw = await readFile(logPath, 'utf-8');
    const lines = raw.split('\n').filter((line) => line.trim().length > 0);
    const entries: ActivityEntry[] = [];

    for (const line of lines) {
      try {
        const logEntry = JSON.parse(line) as BridgeLogEntry;
        entries.push(classifyLogEntry(logEntry));
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return entries;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect all data needed to render the console page.
 *
 * Reads from .planning/console/ and returns a ConsolePageData object.
 * Every data source is independently fault-tolerant: a failure in one
 * does not affect the others.
 *
 * @param options - Optional basePath and helperUrl overrides.
 * @returns ConsolePageData with real data or safe defaults.
 */
export async function collectConsoleData(
  options?: ConsoleCollectorOptions,
): Promise<ConsolePageData> {
  const basePath = options?.basePath ?? process.cwd();
  const helperUrl = options?.helperUrl ?? DEFAULT_HELPER_URL;

  const [status, questions, config, activityEntries] = await Promise.all([
    collectStatus(basePath),
    collectQuestions(basePath),
    collectConfig(basePath),
    collectActivity(basePath),
  ]);

  return {
    status,
    questions,
    helperUrl,
    config,
    activityEntries,
  };
}
