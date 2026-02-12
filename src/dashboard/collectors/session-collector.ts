/**
 * Session metrics collector.
 *
 * Reads sessions.jsonl and .session-cache.json to produce typed
 * {@link SessionCollectorResult} objects with session summaries,
 * durations, message counts, tool calls, and files touched.
 *
 * Fault-tolerant: returns empty result on failures, never throws.
 *
 * @module dashboard/collectors/session-collector
 */

import { readFile } from 'fs/promises';
import type {
  SessionMetric,
  SessionCollectorResult,
  SessionCollectorOptions,
} from './types.js';
import type { SessionObservation } from '../../types/observation.js';

/**
 * Check if a parsed JSONL entry has the shape of a SessionObservation
 * (session-type entry with sessionId, startTime, endTime).
 */
function isSessionObservation(entry: unknown): entry is SessionObservation {
  if (typeof entry !== 'object' || entry === null) return false;
  const obj = entry as Record<string, unknown>;
  return (
    typeof obj.sessionId === 'string' &&
    typeof obj.startTime === 'number' &&
    typeof obj.endTime === 'number'
  );
}

/**
 * Map a SessionObservation to a SessionMetric.
 */
function toSessionMetric(obs: SessionObservation): SessionMetric {
  return {
    sessionId: obs.sessionId,
    startTime: obs.startTime,
    endTime: obs.endTime,
    durationMinutes: obs.durationMinutes,
    model: 'unknown',
    source: obs.source,
    userMessages: obs.metrics.userMessages,
    assistantMessages: obs.metrics.assistantMessages,
    toolCalls: obs.metrics.toolCalls,
    filesRead: obs.metrics.uniqueFilesRead,
    filesWritten: obs.metrics.uniqueFilesWritten,
    commandsRun: obs.metrics.uniqueCommandsRun,
    topFiles: obs.topFiles,
    topCommands: obs.topCommands,
    activeSkills: obs.activeSkills || [],
  };
}

/**
 * Read and parse sessions.jsonl into SessionMetric[].
 *
 * Skips malformed lines and entries without sessionId/startTime/endTime.
 * Returns empty array on ENOENT or other read errors.
 */
async function readSessionsFile(path: string): Promise<SessionMetric[]> {
  try {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const sessions: SessionMetric[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (isSessionObservation(parsed)) {
          sessions.push(toSessionMetric(parsed));
        }
      } catch {
        // Skip malformed JSON lines
      }
    }

    return sessions;
  } catch {
    // ENOENT or other read error — return empty
    return [];
  }
}

/**
 * Read .session-cache.json for the currently active session.
 *
 * Returns null on ENOENT, parse errors, or missing fields.
 */
async function readActiveSession(
  path: string,
): Promise<SessionCollectorResult['activeSession']> {
  try {
    const content = await readFile(path, 'utf-8');
    const data = JSON.parse(content);

    if (
      typeof data === 'object' &&
      data !== null &&
      typeof data.sessionId === 'string' &&
      typeof data.model === 'string' &&
      typeof data.startTime === 'number'
    ) {
      return {
        sessionId: data.sessionId,
        model: data.model,
        startTime: data.startTime,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Collect session metrics from sessions.jsonl and .session-cache.json.
 *
 * Reads session observations from the JSONL file and extracts the active
 * session from the cache file. Both reads are independent — failure of
 * one does not affect the other.
 *
 * Fault-tolerant: returns empty result on any failure instead of throwing.
 *
 * @param options - Collector options (sessionsPath, cachePath, cwd)
 * @returns Session metrics with active session info
 */
export async function collectSessionMetrics(
  options: SessionCollectorOptions = {},
): Promise<SessionCollectorResult> {
  const {
    sessionsPath = '.planning/patterns/sessions.jsonl',
    cachePath = '.planning/patterns/.session-cache.json',
  } = options;

  const [sessions, activeSession] = await Promise.all([
    readSessionsFile(sessionsPath),
    readActiveSession(cachePath),
  ]);

  return {
    sessions,
    totalSessions: sessions.length,
    activeSession,
  };
}
