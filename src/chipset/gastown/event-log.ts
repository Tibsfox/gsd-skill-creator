/**
 * Unified System Event Log for Gastown Chipset.
 *
 * Centralized, append-only event log aggregating all system events with
 * typed categories and structured details for full run reconstruction.
 * Consolidates events currently scattered across beads-state, witness,
 * and git into a single queryable log.
 *
 * Identified by the 12 Primitives analysis (Primitive 7) as a partial gap.
 * Maps to witness-observer and beads-state patterns.
 *
 * State directory layout:
 *   {stateDir}/events/{convoyId}.jsonl    Per-convoy event log (JSON Lines)
 *   {stateDir}/events/system.jsonl        System-level events (no convoy)
 *
 * Design principles:
 * - Append-only by construction (fs.appendFile, never writeFile)
 * - Structured events with typed payloads per category
 * - Convoy-scoped and system-scoped logs
 * - Queryable by category, severity, time range, agent
 * - Git-friendly: one event per line, deterministic serialization
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

// ============================================================================
// Types
// ============================================================================

/** Event categories matching the Gastown topology. */
export type EventCategory =
  | 'registry'     // Agent registration, deregistration, role changes
  | 'routing'      // Work item dispatch, assignment, reassignment
  | 'permission'   // Permission checks, escalation, denial
  | 'execution'    // Work item lifecycle (start, progress, complete, fail)
  | 'communication' // Inter-agent messages, nudges, mail
  | 'budget'       // Token budget checks, warnings, exhaustion
  | 'compaction'   // Transcript compaction checkpoints
  | 'system';      // Daemon lifecycle, config changes, errors

/** Severity levels for event triage. */
export type EventSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

/** A single system event record. */
export interface SystemEvent {
  /** Unique event identifier. */
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Event category. */
  category: EventCategory;
  /** Severity level. */
  severity: EventSeverity;
  /** Agent that generated this event (undefined for system events). */
  agentId?: string;
  /** Convoy this event belongs to (undefined for system events). */
  convoyId?: string;
  /** Short human-readable description. */
  message: string;
  /** Structured payload with category-specific details. */
  details: Record<string, unknown>;
}

/** Input for creating a new event. id and timestamp are generated. */
export interface CreateEventInput {
  category: EventCategory;
  severity: EventSeverity;
  agentId?: string;
  convoyId?: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Filter criteria for querying events. */
export interface EventFilter {
  /** Filter by category. */
  category?: EventCategory;
  /** Filter by minimum severity. */
  minSeverity?: EventSeverity;
  /** Filter by agent ID. */
  agentId?: string;
  /** Filter events after this timestamp (inclusive). */
  after?: string;
  /** Filter events before this timestamp (exclusive). */
  before?: string;
  /** Maximum number of events to return. */
  limit?: number;
}

/** Summary statistics for a convoy's event log. */
export interface EventLogStats {
  /** Total number of events. */
  totalEvents: number;
  /** Breakdown by category. */
  byCategory: Record<string, number>;
  /** Breakdown by severity. */
  bySeverity: Record<string, number>;
  /** Unique agent IDs that generated events. */
  uniqueAgents: string[];
  /** Timestamp of earliest event. */
  earliest?: string;
  /** Timestamp of latest event. */
  latest?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Version of the event log format. Increment on breaking changes. */
export const EVENT_LOG_VERSION = 1;

/** Severity ordering for filtering. */
const SEVERITY_ORDER: Record<EventSeverity, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

// ============================================================================
// Pure Functions — Event Building
// ============================================================================

/**
 * Build a SystemEvent from CreateEventInput, generating id and timestamp.
 * Pure function — no IO.
 */
export function buildEvent(input: CreateEventInput): SystemEvent {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    category: input.category,
    severity: input.severity,
    agentId: input.agentId,
    convoyId: input.convoyId,
    message: input.message,
    details: input.details ?? {},
  };
}

/**
 * Serialize a SystemEvent to a single JSON line.
 * Uses sorted keys for deterministic, git-diff-friendly output.
 * Pure function — no IO.
 */
export function serializeEvent(event: SystemEvent): string {
  return JSON.stringify(event, (_key: string, value: unknown) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  }) + '\n';
}

/**
 * Parse a single JSON line into a SystemEvent.
 * Pure function — no IO.
 */
export function parseEventLine(line: string): SystemEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as SystemEvent;
  } catch {
    return null;
  }
}

/**
 * Check if an event matches a filter.
 * Pure function — no IO.
 */
export function matchesFilter(event: SystemEvent, filter: EventFilter): boolean {
  if (filter.category && event.category !== filter.category) return false;

  if (filter.minSeverity) {
    const eventLevel = SEVERITY_ORDER[event.severity] ?? 0;
    const filterLevel = SEVERITY_ORDER[filter.minSeverity] ?? 0;
    if (eventLevel < filterLevel) return false;
  }

  if (filter.agentId && event.agentId !== filter.agentId) return false;

  if (filter.after && event.timestamp < filter.after) return false;
  if (filter.before && event.timestamp >= filter.before) return false;

  return true;
}

/**
 * Compute summary statistics from a list of events.
 * Pure function — no IO.
 */
export function computeStats(events: SystemEvent[]): EventLogStats {
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const agents = new Set<string>();

  for (const e of events) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
    if (e.agentId) agents.add(e.agentId);
  }

  return {
    totalEvents: events.length,
    byCategory,
    bySeverity,
    uniqueAgents: [...agents].sort(),
    earliest: events.length > 0 ? events[0].timestamp : undefined,
    latest: events.length > 0 ? events[events.length - 1].timestamp : undefined,
  };
}

// ============================================================================
// IO Functions — Append-Only Log Operations
// ============================================================================

/**
 * Resolve the log file path for a given convoy (or system log).
 */
function logPath(stateDir: string, convoyId?: string): string {
  const filename = convoyId ? `${convoyId}.jsonl` : 'system.jsonl';
  return join(stateDir, 'events', filename);
}

/**
 * Append a SystemEvent to the appropriate log file.
 *
 * CRITICAL: Uses fs.appendFile exclusively — never fs.writeFile.
 * Append-only by construction, matching the mesh/event-log.ts pattern.
 *
 * Creates the directory and file if they don't exist.
 */
export async function writeEvent(
  stateDir: string,
  input: CreateEventInput,
): Promise<SystemEvent> {
  const event = buildEvent(input);
  const filePath = logPath(stateDir, event.convoyId);
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(filePath, serializeEvent(event));
  return event;
}

/**
 * Read all events from a convoy log (or system log).
 * Returns events in chronological order.
 */
export async function readEvents(
  stateDir: string,
  convoyId?: string,
): Promise<SystemEvent[]> {
  const filePath = logPath(stateDir, convoyId);
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch {
    return [];
  }

  return content
    .split('\n')
    .map(parseEventLine)
    .filter((e): e is SystemEvent => e !== null);
}

/**
 * Query events with a filter.
 * Reads the log, applies the filter, and returns matching events.
 */
export async function queryEvents(
  stateDir: string,
  convoyId: string | undefined,
  filter: EventFilter,
): Promise<SystemEvent[]> {
  const events = await readEvents(stateDir, convoyId);
  let results = events.filter((e) => matchesFilter(e, filter));

  if (filter.limit && results.length > filter.limit) {
    results = results.slice(-filter.limit); // Keep most recent
  }

  return results;
}

/**
 * Get summary statistics for a convoy's event log.
 */
export async function getEventStats(
  stateDir: string,
  convoyId?: string,
): Promise<EventLogStats> {
  const events = await readEvents(stateDir, convoyId);
  return computeStats(events);
}

/**
 * List all convoy IDs that have event logs.
 */
export async function listEventLogs(stateDir: string): Promise<string[]> {
  const dir = join(stateDir, 'events');
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  return files
    .filter((f) => f.endsWith('.jsonl') && f !== 'system.jsonl')
    .map((f) => f.replace('.jsonl', ''))
    .sort();
}
