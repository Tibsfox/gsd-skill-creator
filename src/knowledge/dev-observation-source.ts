/**
 * Dev-Session Observation Source.
 *
 * Reads the real on-disk dev-session streams and maps them into
 * {@link DevSessionObservation}s — the input side of the dev-domain memory path
 * (sibling of the education `LearnerObservation` pipeline, which dev sessions
 * are intentionally NOT routed through). Two streams under `.planning/sessions/`:
 *   - `current.jsonl`            — session-retro events `{t,kind,label,payload?}`
 *   - `current.tool-trace.jsonl` — flight recorder `{t,tool,file?,cmd?,duration_ms?}`
 * plus an optional caller-supplied session summary.
 *
 * Every mapper validates its output through `DevSessionObservationSchema` and
 * drops anything that does not parse, so no malformed or education-shaped record
 * ever escapes. The pure `map*` functions are fs-free (unit-testable); only
 * `readDevObservations` touches disk.
 *
 * Basename note: `source` is NOT a LoaderContext chokepoint trigger
 * (`loader|reader|scanner|walker|store`), and the fs surface here is a bounded
 * read of two known session files — no path comes from untrusted input.
 *
 * @module knowledge/dev-observation-source
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  DevSessionObservationSchema,
  type DevSessionObservation,
} from './dev-observation-types.js';

export interface DevObservationSourceCtx {
  readonly sessionId: string;
  readonly repo: string;
}

/** Optional whole-session roll-up the caller can supply (e.g. from a transcript summary). */
export interface DevSessionSummaryInput {
  summary?: string;
  durationMinutes?: number;
  activeSkills?: string[];
  reason?: string;
  toolCalls?: number;
  filesTouched?: number;
}

const SEVERITIES = new Set(['low', 'medium', 'high']);

function stableId(parts: Array<string | undefined>): string {
  const h = createHash('sha1').update(parts.map((p) => p ?? '').join('\x00')).digest('hex');
  return `dev-${h.slice(0, 16)}`;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;
}

/**
 * Map one `current.jsonl` retro event to a dev observation, or null if its kind
 * is not one we can honestly represent (tokens, notes, and any education kind
 * are dropped). The event `label` is the observation summary.
 */
export function mapEventLine(
  raw: { t?: unknown; kind?: unknown; label?: unknown; payload?: unknown },
  ctx: DevObservationSourceCtx,
): DevSessionObservation | null {
  const kindRaw = str(raw.kind);
  if (!kindRaw) return null;
  const kind = kindRaw === 'tool-use' ? 'tool_use' : kindRaw;
  const timestamp = str(raw.t) ?? '';
  const summary = str(raw.label);
  const payload =
    raw.payload && typeof raw.payload === 'object'
      ? (raw.payload as Record<string, unknown>)
      : {};
  const file = str(payload.file);
  const command = str(payload.cmd) ?? str(payload.command);
  const base = {
    id: stableId(['event', kind, timestamp, summary, file, command]),
    timestamp,
    sessionId: ctx.sessionId,
    repo: ctx.repo,
  };

  let candidate: unknown;
  switch (kind) {
    case 'friction': {
      if (!summary) return null;
      const severity = str(payload.severity);
      candidate = {
        ...base,
        kind: 'friction',
        summary,
        ...(file ? { file } : {}),
        ...(command ? { command } : {}),
        ...(severity && SEVERITIES.has(severity) ? { severity } : {}),
      };
      break;
    }
    case 'win':
    case 'correction': {
      if (!summary) return null;
      candidate = { ...base, kind, summary, ...(file ? { file } : {}) };
      break;
    }
    case 'decision':
    case 'checkpoint': {
      if (!summary) return null;
      candidate = { ...base, kind, summary };
      break;
    }
    case 'gap': {
      if (!summary) return null;
      candidate = {
        ...base,
        kind: 'gap',
        summary,
        ...(str(payload.missing) ? { missing: str(payload.missing) } : {}),
      };
      break;
    }
    default:
      // tokens, note, tool_use-from-event (no tool payload), education kinds.
      return null;
  }

  const parsed = DevSessionObservationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Map one `current.tool-trace.jsonl` flight-recorder record to a `tool_use`
 * observation, or null if it carries no tool name.
 */
export function mapTraceLine(
  raw: { t?: unknown; tool?: unknown; file?: unknown; cmd?: unknown; duration_ms?: unknown },
  ctx: DevObservationSourceCtx,
): DevSessionObservation | null {
  const tool = str(raw.tool);
  if (!tool) return null;
  const timestamp = str(raw.t) ?? '';
  const file = str(raw.file);
  const command = str(raw.cmd);
  const durationMs = num(raw.duration_ms);
  const candidate = {
    id: stableId(['trace', timestamp, tool, file, command]),
    timestamp,
    sessionId: ctx.sessionId,
    repo: ctx.repo,
    kind: 'tool_use',
    tool,
    ...(file ? { file } : {}),
    ...(command ? { command } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
  };
  const parsed = DevSessionObservationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Map a caller-supplied session roll-up to a `session_summary` observation. */
export function mapSessionSummary(
  input: DevSessionSummaryInput,
  ctx: DevObservationSourceCtx,
  timestamp = '',
): DevSessionObservation | null {
  const activeSkills = Array.isArray(input.activeSkills)
    ? input.activeSkills.filter((s): s is string => typeof s === 'string')
    : undefined;
  const candidate = {
    id: stableId(['session-summary', ctx.sessionId]),
    timestamp,
    sessionId: ctx.sessionId,
    repo: ctx.repo,
    kind: 'session_summary',
    ...(str(input.summary) ? { summary: str(input.summary) } : {}),
    ...(num(input.durationMinutes) !== undefined ? { durationMinutes: num(input.durationMinutes) } : {}),
    ...(activeSkills ? { activeSkills } : {}),
    ...(str(input.reason) ? { reason: str(input.reason) } : {}),
    ...(num(input.toolCalls) !== undefined ? { toolCalls: num(input.toolCalls) } : {}),
    ...(num(input.filesTouched) !== undefined ? { filesTouched: num(input.filesTouched) } : {}),
  };
  const parsed = DevSessionObservationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export interface ReadDevObservationsInput extends DevObservationSourceCtx {
  readonly sessionsDir: string;
  readonly sessionSummary?: DevSessionSummaryInput;
}

async function readJsonl(path: string): Promise<Record<string, unknown>[]> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf-8');
  } catch {
    return [];
  }
  const rows: Record<string, unknown>[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') rows.push(parsed as Record<string, unknown>);
    } catch {
      // Skip corrupt lines without throwing.
    }
  }
  return rows;
}

/**
 * Read the two on-disk session streams (+ optional summary) from `sessionsDir`
 * and return the dev observations they yield, in stream order. Missing files
 * yield no observations (never throws).
 */
export async function readDevObservations(
  input: ReadDevObservationsInput,
): Promise<DevSessionObservation[]> {
  const ctx: DevObservationSourceCtx = { sessionId: input.sessionId, repo: input.repo };
  const out: DevSessionObservation[] = [];

  for (const row of await readJsonl(join(input.sessionsDir, 'current.jsonl'))) {
    const obs = mapEventLine(row, ctx);
    if (obs) out.push(obs);
  }
  for (const row of await readJsonl(join(input.sessionsDir, 'current.tool-trace.jsonl'))) {
    const obs = mapTraceLine(row, ctx);
    if (obs) out.push(obs);
  }
  if (input.sessionSummary) {
    const obs = mapSessionSummary(input.sessionSummary, ctx);
    if (obs) out.push(obs);
  }
  return out;
}
