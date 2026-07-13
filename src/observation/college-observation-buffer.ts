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
 *   - PUMP: `pumpCollegeObservations` presents the buffer to the existing
 *     `wireCollegeObservations` adapter as a `CollegeBridgeLike` whose `flush()`
 *     drains the persisted events, so the tested connector forwards them into
 *     the pattern pipeline.
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

/** Read every buffered event and CLEAR the buffer. Returns [] on any read error. */
export async function drainCollegeEvents(
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
  try {
    await fs.rm(storePath, { force: true });
  } catch {
    // leave the file if it cannot be cleared; re-drain is idempotent enough
  }
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
 * Present the persistent buffer at `storePath` to the `wireCollegeObservations`
 * adapter as a `CollegeBridgeLike`. `flush()` drains the buffer; the events are
 * cached so the connector's subsequent `toSessionObservation(events)` sees the
 * same drained batch.
 */
export function makePersistentCollegeBridge(
  storePath: string,
  sessionId: string,
): CollegeBridgeLike {
  let drained: CollegeObservationEventLike[] = [];
  return {
    // The batch is loaded (drained from disk) via `_load()` before the connector
    // pumps, so `flush()` returns the cached batch the connector then converts.
    flush(): unknown[] {
      return drained;
    },
    toSessionObservation(events: unknown[]): Record<string, unknown> {
      return eventsToSessionObservation(events as CollegeObservationEventLike[], sessionId);
    },
    // Non-interface helper the pump uses to load the batch before flushing.
    async _load(): Promise<void> {
      drained = await drainCollegeEvents(storePath);
    },
  } as CollegeBridgeLike & { _load(): Promise<void> };
}

export interface PumpCollegeOptions {
  sessionId?: string;
  /** Forwarding is off unless true (the connector's own gate). */
  enabled?: boolean;
  collection?: string;
  deps?: CollegeObservationAdapterDeps;
}

/**
 * Drain the persistent buffer and forward its events into `sink` through the
 * existing `wireCollegeObservations` connector. Returns the number of
 * observations forwarded (0 when disabled or the buffer is empty).
 */
export async function pumpCollegeObservations(
  storePath: string,
  sink: CollegePatternSinkLike,
  options: PumpCollegeOptions = {},
): Promise<number> {
  // Gate BEFORE draining: when forwarding is off the buffer must be preserved
  // (mirrors the connector's own no-op-and-preserve contract).
  if (!(options.enabled ?? false)) return 0;

  const sessionId = options.sessionId ?? 'college-session';
  const bridge = makePersistentCollegeBridge(storePath, sessionId) as CollegeBridgeLike & {
    _load(): Promise<void>;
  };
  await bridge._load();
  const connector = await wireCollegeObservations(
    bridge,
    sink,
    { enabled: true, ...(options.collection ? { collection: options.collection } : {}) },
    options.deps ?? {},
  );
  return connector.pump();
}
