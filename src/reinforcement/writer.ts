/**
 * MA-6 Canonical Reinforcement Taxonomy — writer.
 *
 * Feeds `ReinforcementEvent` instances into the existing M3 trace-log surface
 * (`src/mesh/event-log.ts`) so there is no parallel log.  EXTEND posture:
 * the writer uses the exact same `writeMeshEvent` / append-only appendFile
 * machinery as the decision-trace writer — reinforcement events ride as
 * `reinforcement_event`-typed mesh events.
 *
 * Invariants:
 *   - Append-only (inherits from `writeMeshEvent` → `fs.appendFile`).
 *   - One JSON line per event — POSIX O_APPEND atomicity for writes
 *     ≤ PIPE_BUF bytes (every reinforcement event line is well under 4 KiB).
 *   - Redact-on-write: every string field passes through the M3 redact pass
 *     so API keys / tokens in free-form metadata never land in the log.
 *   - Round-trip lossless: canonical JSON form uses only JSON-native types.
 *
 * Source thread: A §5 (actor-critic wire).
 *
 * @module reinforcement/writer
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { writeMeshEvent, readMeshEvents } from '../mesh/event-log.js';
import { redactString } from '../traces/writer.js';
import type { ReinforcementEvent } from '../types/reinforcement.js';
import {
  clampMagnitude,
  directionFromMagnitude,
  isReinforcementChannel,
} from '../types/reinforcement.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default reinforcement log path (gitignored runtime state under .planning/). */
export const DEFAULT_REINFORCEMENT_PATH =
  '.planning/traces/reinforcement.jsonl';

// ─── Redaction ────────────────────────────────────────────────────────────────

/**
 * Recursively redact secret-like substrings from any string value nested in
 * the metadata object.  Reuses the M3 `redactString` rule so the redaction
 * surface remains a single source of truth (SC-M3 redaction invariant).
 */
function redactUnknown(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redactUnknown(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redactUnknown(v);
    }
    return out;
  }
  return value;
}

/**
 * Apply redact-on-write to a ReinforcementEvent.  Returns a new event with
 * every string field scanned; numeric / boolean fields are untouched.
 */
export function redactReinforcementEvent(
  event: ReinforcementEvent,
): ReinforcementEvent {
  // Re-use the discriminated union via a narrowed cast — redaction does not
  // alter the channel discriminator.
  const redactedActor = redactString(event.actor);
  const redactedMetadata = redactUnknown(event.metadata) as ReinforcementEvent['metadata'];
  // TypeScript cannot prove the redacted metadata still matches the narrowed
  // variant (its shape is preserved by construction), so we re-assemble the
  // event per channel.  Casting through the union satisfies the checker while
  // preserving run-time identity.
  return {
    ...event,
    actor: redactedActor,
    metadata: redactedMetadata,
  } as ReinforcementEvent;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Shallow runtime validation on the shape of a ReinforcementEvent.
 * Returns an array of error strings; empty array means valid.
 *
 * Used by readers to guard against hand-edited JSONL lines and by tests
 * to assert round-trip fidelity.
 */
export function validateReinforcementEvent(raw: unknown): string[] {
  const errs: string[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return ['event must be a non-null object'];
  }
  const e = raw as Record<string, unknown>;
  if (typeof e['id'] !== 'string' || e['id'].length === 0) errs.push('id must be a non-empty string');
  if (typeof e['ts'] !== 'number' || !Number.isFinite(e['ts'])) errs.push('ts must be a finite number');
  if (!isReinforcementChannel(e['channel'])) errs.push(`channel must be one of the five canonical values; got ${String(e['channel'])}`);
  if (typeof e['actor'] !== 'string' || e['actor'].length === 0) errs.push('actor must be a non-empty string');
  if (typeof e['metadata'] !== 'object' || e['metadata'] === null) errs.push('metadata must be an object');

  const value = e['value'];
  if (typeof value !== 'object' || value === null) {
    errs.push('value must be an object');
  } else {
    const v = value as Record<string, unknown>;
    if (typeof v['magnitude'] !== 'number' || !Number.isFinite(v['magnitude'])) {
      errs.push('value.magnitude must be a finite number');
    } else if (v['magnitude'] < -1 || v['magnitude'] > 1) {
      errs.push('value.magnitude must be in [-1, 1]');
    }
    if (v['direction'] !== 'positive' && v['direction'] !== 'negative' && v['direction'] !== 'neutral') {
      errs.push(`value.direction must be positive|negative|neutral; got ${String(v['direction'])}`);
    }
  }
  return errs;
}

// ─── Writer ──────────────────────────────────────────────────────────────────

/**
 * Append a ReinforcementEvent to the log.
 *
 * Fail-open: if the underlying appendFile throws (disk full, permissions),
 * the error is surfaced to the caller — the caller (channel-source adapter)
 * is expected to catch & log, never to crash.  This matches Barto 1983's
 * "reinforcement is feedback, not control": losing a feedback sample is
 * recoverable; crashing the reasoner is not.
 */
export async function writeReinforcementEvent(
  event: ReinforcementEvent,
  logPath: string = DEFAULT_REINFORCEMENT_PATH,
): Promise<ReinforcementEvent> {
  // Normalise magnitude/direction FIRST so hand-built events (fixture, replay)
  // land with the invariant preserved even if the caller forgot to clamp.
  // Validation runs on the normalised event so out-of-range magnitudes are
  // never rejected purely because of clampable numeric drift.
  const hasValue =
    event &&
    typeof event === 'object' &&
    'value' in event &&
    event.value !== null &&
    typeof event.value === 'object';
  const normalised: ReinforcementEvent = hasValue
    ? ({
        ...event,
        value: {
          magnitude: clampMagnitude(event.value.magnitude),
          direction: directionFromMagnitude(clampMagnitude(event.value.magnitude)),
        },
      } as ReinforcementEvent)
    : event;

  const errs = validateReinforcementEvent(normalised);
  if (errs.length > 0) {
    throw new Error(
      `invalid ReinforcementEvent: ${errs.join('; ')}`,
    );
  }

  const redacted = redactReinforcementEvent(normalised);

  await fs.mkdir(dirname(logPath), { recursive: true });

  // EXTEND posture: use the exact same append surface as M3.
  await writeMeshEvent(logPath, {
    nodeId: redacted.actor,
    eventType: 'reinforcement_event',
    payload: redacted as unknown as Record<string, unknown>,
  });

  return redacted;
}

/**
 * Append several events sequentially.  Order is preserved in the log file.
 */
export async function writeReinforcementEvents(
  events: ReinforcementEvent[],
  logPath: string = DEFAULT_REINFORCEMENT_PATH,
): Promise<ReinforcementEvent[]> {
  const out: ReinforcementEvent[] = [];
  for (const e of events) {
    out.push(await writeReinforcementEvent(e, logPath));
  }
  return out;
}

/**
 * Read all reinforcement events from the log.  Skips corrupt or
 * non-reinforcement lines silently so the reader is resilient to a
 * mixed-type mesh log.
 */
export async function readReinforcementEvents(
  logPath: string = DEFAULT_REINFORCEMENT_PATH,
): Promise<ReinforcementEvent[]> {
  const events = await readMeshEvents(logPath);
  const out: ReinforcementEvent[] = [];
  for (const e of events) {
    if (e.eventType !== 'reinforcement_event') continue;
    const payload = e.payload as unknown;
    if (validateReinforcementEvent(payload).length === 0) {
      out.push(payload as ReinforcementEvent);
    }
  }
  return out;
}

// ─── Class wrapper ───────────────────────────────────────────────────────────

/**
 * Stateful wrapper bound to a log path.  Mirrors the free-function API and
 * gives DI contexts (tests, alternative storage) a single seam.
 */
export class ReinforcementWriter {
  constructor(private readonly logPath: string = DEFAULT_REINFORCEMENT_PATH) {}

  write(event: ReinforcementEvent): Promise<ReinforcementEvent> {
    return writeReinforcementEvent(event, this.logPath);
  }

  writeAll(events: ReinforcementEvent[]): Promise<ReinforcementEvent[]> {
    return writeReinforcementEvents(events, this.logPath);
  }

  readAll(): Promise<ReinforcementEvent[]> {
    return readReinforcementEvents(this.logPath);
  }
}
