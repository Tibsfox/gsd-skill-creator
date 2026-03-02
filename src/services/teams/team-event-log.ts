/**
 * Per-team JSONL event log for lifecycle audit trails.
 *
 * Provides append-only logging and corruption-tolerant reading of
 * team lifecycle events. Each team gets its own events.jsonl file
 * at {teamsDir}/{teamName}/events.jsonl.
 *
 * Write failures are thrown (not swallowed) to preserve audit trail
 * integrity per TEAM-05.
 *
 * @module teams/team-event-log
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// ============================================================================
// Constants
// ============================================================================

/** Filename for per-team event logs. */
export const TEAM_EVENTS_FILENAME = 'events.jsonl';

// ============================================================================
// Types
// ============================================================================

/**
 * A lifecycle event for a team.
 *
 * Appended as a single JSON line to the team's events.jsonl file.
 */
export interface TeamLifecycleEvent {
  /** ISO timestamp when the event occurred. */
  timestamp: string;
  /** The lifecycle event type. */
  event: 'created' | 'activated' | 'dissolving' | 'dissolved';
  /** What caused the transition (e.g., 'cli:dissolve', 'autonomy:milestone-complete'). */
  trigger: string;
  /** Whether the team is managed by automation or manually. */
  managedBy: 'auto' | 'manual';
  /** Optional additional metadata about the event. */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Append
// ============================================================================

/**
 * Append a lifecycle event to a team's event log.
 *
 * Creates the team directory and events.jsonl file if they do not exist.
 * Throws on write failure to preserve audit trail integrity.
 *
 * @param teamsDir - Base teams directory
 * @param teamName - Name of the team
 * @param event - The lifecycle event to log
 * @throws Error on write failure
 */
export async function appendTeamEvent(
  teamsDir: string,
  teamName: string,
  event: TeamLifecycleEvent,
): Promise<void> {
  const teamDir = join(teamsDir, teamName);
  const logPath = join(teamDir, TEAM_EVENTS_FILENAME);
  await mkdir(teamDir, { recursive: true });
  await appendFile(logPath, JSON.stringify(event) + '\n', 'utf-8');
}

// ============================================================================
// Read
// ============================================================================

/**
 * Read all lifecycle events from a team's event log.
 *
 * Returns an empty array if the file does not exist (ENOENT).
 * Skips corrupted lines gracefully (try/catch per line).
 *
 * @param teamsDir - Base teams directory
 * @param teamName - Name of the team
 * @returns Array of parsed lifecycle events
 */
export async function readTeamEvents(
  teamsDir: string,
  teamName: string,
): Promise<TeamLifecycleEvent[]> {
  const logPath = join(teamsDir, teamName, TEAM_EVENTS_FILENAME);

  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const lines = content.split('\n').filter((line) => line.trim() !== '');
  const events: TeamLifecycleEvent[] = [];

  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as TeamLifecycleEvent);
    } catch {
      // Skip corrupted lines gracefully
    }
  }

  return events;
}
