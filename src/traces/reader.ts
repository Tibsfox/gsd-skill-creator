/**
 * M3 Decision-Trace Ledger — indexed JSONL reader.
 *
 * Reads canonical DecisionTrace records from the JSONL log via the event-log
 * EXTEND path (`readDecisionTraces`).  Supports filtering by:
 *   - Time window (tsFrom / tsTo)
 *   - Actor identity
 *   - Entity reference IDs
 *   - Intent keyword substring
 *
 * Rollover:
 *   When the log exceeds `maxEntries` lines the reader signals rollover via
 *   `shouldRollover()`.  Callers (or the writer) can then rotate to an annual
 *   file named `decisions-<YYYY>.jsonl`.  The reader itself reads from
 *   whichever path is supplied; rollover logic is the caller's responsibility.
 *
 * Growth bound (CF-M3-04):
 *   `readFiltered` accepts a `limit` option that caps returned results without
 *   truncating the underlying file (the file is append-only; truncation is not
 *   possible by construction).
 *
 * Phase 644, Wave 1 Track D (M3).
 *
 * @module traces/reader
 */

import { readDecisionTraces } from '../mesh/event-log.js';
import { fromCanonical, validateDecisionTrace } from './schema.js';
import type { DecisionTrace } from '../types/memory.js';
import type { CanonicalDecisionTrace } from './schema.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default max entries before rollover is signalled. Configurable per caller. */
export const DEFAULT_MAX_ENTRIES = 10_000;

// ─── Filter options ───────────────────────────────────────────────────────────

export interface TraceFilterOptions {
  /** Only return traces with ts >= tsFrom (Unix ms). */
  tsFrom?: number;
  /** Only return traces with ts <= tsTo (Unix ms). */
  tsTo?: number;
  /** Only return traces whose actor equals this string. */
  actor?: string;
  /** Only return traces that reference at least one of these entity IDs. */
  entityIds?: string[];
  /** Only return traces whose intent contains this substring (case-insensitive). */
  intentContains?: string;
  /** Cap the number of results returned (newest-first after filtering). */
  limit?: number;
}

// ─── Core reader ─────────────────────────────────────────────────────────────

/**
 * Read all DecisionTrace records from the log, optionally filtered.
 *
 * The reader delegates IO to `readDecisionTraces` (event-log EXTEND path).
 * Corrupt or invalid lines are skipped silently (validated by schema).
 */
export async function readTraces(
  logPath: string,
  options: TraceFilterOptions = {},
): Promise<DecisionTrace[]> {
  // readDecisionTraces returns raw payloads; validate each through schema.
  const raw = await readDecisionTraces(logPath);
  let traces: DecisionTrace[] = [];

  for (const item of raw) {
    const result = validateDecisionTrace(item);
    if (result.ok) {
      traces.push(result.trace);
    }
    // Skip invalid entries silently
  }

  // Apply filters
  if (options.tsFrom !== undefined) {
    const from = options.tsFrom;
    traces = traces.filter((t) => t.ts >= from);
  }
  if (options.tsTo !== undefined) {
    const to = options.tsTo;
    traces = traces.filter((t) => t.ts <= to);
  }
  if (options.actor !== undefined) {
    const actor = options.actor;
    traces = traces.filter((t) => t.actor === actor);
  }
  if (options.entityIds !== undefined && options.entityIds.length > 0) {
    const ids = new Set(options.entityIds);
    traces = traces.filter((t) =>
      t.refs.entityIds?.some((id) => ids.has(id)) ?? false,
    );
  }
  if (options.intentContains !== undefined) {
    const needle = options.intentContains.toLowerCase();
    traces = traces.filter((t) => t.intent.toLowerCase().includes(needle));
  }

  // Limit (newest-first when limiting)
  if (options.limit !== undefined && options.limit > 0) {
    traces = traces.slice(-options.limit);
  }

  return traces;
}

// ─── Rollover support (CF-M3-04) ─────────────────────────────────────────────

/**
 * Check whether a log file has exceeded `maxEntries`.
 * Returns true if the entry count >= maxEntries.
 *
 * The caller is responsible for rotating to an annual file
 * `decisions-<YYYY>.jsonl` when this returns true.
 */
export async function shouldRollover(
  logPath: string,
  maxEntries: number = DEFAULT_MAX_ENTRIES,
): Promise<boolean> {
  const raw = await readDecisionTraces(logPath).catch(() => []);
  return raw.length >= maxEntries;
}

/**
 * Derive the annual rollover filename for a given base path and year.
 * E.g. `.planning/traces/decisions.jsonl` + 2026 →
 *       `.planning/traces/decisions-2026.jsonl`
 */
export function annualRolloverPath(basePath: string, year: number): string {
  return basePath.replace(/\.jsonl$/, `-${year}.jsonl`);
}

// ─── TraceReader class ────────────────────────────────────────────────────────

/**
 * Stateful reader bound to a specific log path.
 */
export class TraceReader {
  constructor(
    private readonly logPath: string,
    private readonly maxEntries: number = DEFAULT_MAX_ENTRIES,
  ) {}

  /** Read all traces, optionally filtered. */
  read(options: TraceFilterOptions = {}): Promise<DecisionTrace[]> {
    return readTraces(this.logPath, options);
  }

  /** True if the log should roll over to an annual file. */
  shouldRollover(): Promise<boolean> {
    return shouldRollover(this.logPath, this.maxEntries);
  }

  /** Annual rollover path for the current year. */
  rolloverPath(year: number = new Date().getFullYear()): string {
    return annualRolloverPath(this.logPath, year);
  }

  /** Re-export fromCanonical for callers that hold canonical form. */
  static fromCanonical(c: CanonicalDecisionTrace): DecisionTrace {
    return fromCanonical(c);
  }
}
