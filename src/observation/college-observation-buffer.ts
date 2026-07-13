/**
 * Persistent College observation buffer — the disk-backed "persistent bridge"
 * that lets a runtime College emitter (a `college` command in one process) feed
 * the session-boundary pump (a later process).
 *
 * The `.college/` `ObservationBridge` is purely in-memory, so its `flush()`
 * cannot span the separate CLI processes where College usage and the session
 * pump occur — which is why `wireCollegeObservations(bridge).pump()` forwarded
 * nothing (no producer fed the same bridge). This buffer closes that gap:
 *   - EMITTER: `recordCollegeEvent` appends an event as a college command runs.
 *   - PUMP: `pumpCollegeObservations` READS the buffer, presents the batch to the
 *     existing `wireCollegeObservations` adapter as a `CollegeBridgeLike`, forwards
 *     it into the pattern pipeline, and CLEARS the buffer only after a successful
 *     forward — so a transient forward failure never loses buffered events.
 *
 * Strictly opt-in: emitting and pumping are gated by the caller; nothing writes
 * or forwards by default. Best-effort — a buffer failure never breaks a college
 * command. Basename avoids the LoaderContext trigger set; the fs surface is a
 * bounded append/drain of one known buffer file.
 *
 * @module observation/college-observation-buffer
 */

import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  wireCollegeObservations,
  type CollegeBridgeLike,
  type CollegePatternSinkLike,
  type CollegeObservationAdapterDeps,
} from './college-observation-adapter.js';

/** Default buffer path (under .planning, gitignored — not committed). */
export const DEFAULT_COLLEGE_OBS_PATH = join('.planning', 'college', 'observations.jsonl');

/** A College observation event, structurally (mirrors the .college CollegeObservationEvent). */
export interface CollegeObservationEventLike {
  id: string;
  type: 'exploration' | 'translation' | 'skill-activation';
  conceptId: string;
  departmentId?: string;
  path?: string;
  panelIds?: string[];
  translationId?: string;
  sessionId?: string;
  timestamp: number;
  tokenCost?: number;
}

/** Append one event to the buffer. Best-effort: swallows any write error. */
export async function recordCollegeEvent(
  storePath: string,
  event: CollegeObservationEventLike,
): Promise<void> {
  try {
    await fs.mkdir(dirname(storePath), { recursive: true });
    await fs.appendFile(storePath, JSON.stringify(event) + '\n', 'utf-8');
  } catch {
    // Recording is observability, never a gate on the college command.
  }
}

/** Read every buffered event WITHOUT clearing. Returns [] on any read error. */
export async function readCollegeEvents(
  storePath: string,
): Promise<CollegeObservationEventLike[]> {
  let content: string;
  try {
    content = await fs.readFile(storePath, 'utf-8');
  } catch {
    return [];
  }
  const events: CollegeObservationEventLike[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as CollegeObservationEventLike);
    } catch {
      // skip corrupt line
    }
  }
  return events;
}

/** Delete the buffer file. Best-effort — a failure leaves the file in place. */
export async function clearCollegeBuffer(storePath: string): Promise<void> {
  try {
    await fs.rm(storePath, { force: true });
  } catch {
    // leave the file if it cannot be cleared; re-drain is idempotent enough
  }
}

/** Read every buffered event and CLEAR the buffer. Returns [] on any read error. */
export async function drainCollegeEvents(
  storePath: string,
): Promise<CollegeObservationEventLike[]> {
  const events = await readCollegeEvents(storePath);
  await clearCollegeBuffer(storePath);
  return events;
}

/**
 * Collapse a batch of College events into a SessionObservation-compatible
 * record (the shape `PatternStore.append('sessions', …)` stores). A src-side
 * conversion so the buffer needs no cross-rootDir import; the `college`-tagged
 * record marks it as College-derived signal.
 */
export function eventsToSessionObservation(
  events: CollegeObservationEventLike[],
  sessionId: string,
): Record<string, unknown> {
  const times = events.map((e) => e.timestamp).filter((t) => Number.isFinite(t));
  const startTime = times.length ? Math.min(...times) : 0;
  const endTime = times.length ? Math.max(...times) : 0;
  const concepts = [...new Set(events.map((e) => e.conceptId).filter(Boolean))];
  const types = [...new Set(events.map((e) => e.type))];
  return {
    sessionId,
    startTime,
    endTime,
    durationMinutes: (endTime - startTime) / 60000,
    source: 'college',
    reason: 'other',
    metrics: {
      userMessages: 0,
      assistantMessages: 0,
      toolCalls: events.length,
      uniqueFilesRead: 0,
      uniqueFilesWritten: 0,
      uniqueCommandsRun: 0,
    },
    topCommands: [],
    topFiles: [],
    topTools: types,
    activeSkills: ['college'],
    collegeConcepts: concepts,
    collegeEventCount: events.length,
  };
}

/**
 * Present an ALREADY-LOADED event batch to the `wireCollegeObservations` adapter
 * as a `CollegeBridgeLike`. `flush()` returns the in-memory batch; the connector
 * then converts it via `toSessionObservation`. Loading (reading from disk) and
 * clearing happen in the pump AROUND the forward, so a forward failure never
 * loses the batch (the buffer is cleared only after a successful forward).
 */
function makeLoadedCollegeBridge(
  events: CollegeObservationEventLike[],
  sessionId: string,
): CollegeBridgeLike {
  return {
    flush(): unknown[] {
      return events;
    },
    toSessionObservation(evs: unknown[]): Record<string, unknown> {
      return eventsToSessionObservation(evs as CollegeObservationEventLike[], sessionId);
    },
  };
}

export interface PumpCollegeOptions {
  sessionId?: string;
  /** Forwarding is off unless true (the connector's own gate). */
  enabled?: boolean;
  collection?: string;
  deps?: CollegeObservationAdapterDeps;
}

/**
 * Read the persistent buffer and forward its events into `sink` through the
 * existing `wireCollegeObservations` connector. Returns the number of
 * observations forwarded (0 when disabled or the buffer is empty).
 *
 * Two-phase for durability: READ (without deleting) → forward → CLEAR only on a
 * successful forward. If loading the connector or the sink append throws, the
 * buffer is left intact for a later retry — a transient failure never loses
 * buffered events (the "never corrupts the buffer" contract).
 */
export async function pumpCollegeObservations(
  storePath: string,
  sink: CollegePatternSinkLike,
  options: PumpCollegeOptions = {},
): Promise<number> {
  // Gate BEFORE reading: when forwarding is off the buffer must be preserved
  // (mirrors the connector's own no-op-and-preserve contract).
  if (!(options.enabled ?? false)) return 0;

  const sessionId = options.sessionId ?? 'college-session';
  const events = await readCollegeEvents(storePath);
  if (events.length === 0) return 0;

  const bridge = makeLoadedCollegeBridge(events, sessionId);
  const connector = await wireCollegeObservations(
    bridge,
    sink,
    { enabled: true, ...(options.collection ? { collection: options.collection } : {}) },
    options.deps ?? {},
  );
  // A throw here (connector import / sink append) propagates WITHOUT clearing the
  // buffer, so the events survive for a retry.
  const forwarded = await connector.pump();
  await clearCollegeBuffer(storePath);
  return forwarded;
}
