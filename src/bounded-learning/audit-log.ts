/**
 * Bounded-learning calibration loop — append-only audit log (v1.49.799).
 *
 * Writes one JSON line per calibration-loop CLI invocation to
 * `.planning/patterns/bounded-learning-log.jsonl` (configurable). Closes
 * the no-history gap flagged in the v795-v798 retrospectives: every
 * `runCalibrationLoop` call that goes through the CLI now leaves a
 * forensic trail of the threshold + observation count + decision +
 * applied outcome.
 *
 * Append semantics:
 *   - File created lazily on first write (parent dir created via mkdir).
 *   - Atomic single-line appends via fs.appendFile.
 *   - No retention enforcement here — operator manages rotation/truncation
 *     out-of-band. Future ship may add `--audit-log-max-bytes` rotation
 *     once the log accumulates enough entries to need it.
 *
 * Read semantics:
 *   - Tolerant of malformed lines (skipped silently).
 *   - Returns entries in file order (= chronological for a sequential log).
 *   - Missing file returns empty array (= "no history yet" honest baseline).
 *
 * @module bounded-learning/audit-log
 */

import { existsSync } from 'node:fs';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { observationSourceFor } from './observation-sources.js';
import type {
  AdjustmentDirection,
  CalibratableThreshold,
  CalibrationRecommendation,
} from './types.js';

/**
 * Default audit-log path. Tests override via `path` option.
 */
export const DEFAULT_AUDIT_LOG_PATH = join(
  process.cwd(),
  '.planning',
  'patterns',
  'bounded-learning-log.jsonl',
);

/**
 * One audit-log entry. Captures everything needed for forensic analysis
 * of a single calibration-loop run.
 */
export interface AuditLogEntry {
  /** ISO 8601 timestamp when the entry was written. */
  timestamp: string;
  /** The threshold the loop ran against. */
  threshold: CalibratableThreshold;
  /** The value the threshold held before this loop run. */
  currentValue: number;
  /** The proposed new value, or null when direction is hold. */
  proposedValue: number | null;
  /** Whether and how to move the threshold. */
  direction: AdjustmentDirection;
  /** Whether the e-process rejected H_0 at the configured alpha. */
  rejected: boolean;
  /** Number of observations consumed. */
  observations: number;
  /** Mean of the observation values. */
  meanObservation: number;
  /** Accumulated e-value at point of emission. */
  evidence: number;
  /** Configured alpha. */
  alpha: number;
  /** Applied outcome: dry-run / applied / noop. */
  applied: 'dry-run' | 'applied' | 'noop';
  /** Per-class observation source metadata (v798 registry). */
  observationSource: {
    sourceId: string;
    wired: boolean;
  };
}

/**
 * Build an `AuditLogEntry` from a `CalibrationRecommendation` and the
 * applied outcome. Pulls observationSource metadata from the v798 registry
 * so the audit log carries source provenance per entry.
 */
export function buildAuditLogEntry(
  rec: CalibrationRecommendation,
  applied: 'dry-run' | 'applied' | 'noop',
  options: { now?: () => Date } = {},
): AuditLogEntry {
  const now = options.now ?? (() => new Date());
  const source = observationSourceFor(rec.threshold);
  return {
    timestamp: now().toISOString(),
    threshold: rec.threshold,
    currentValue: rec.currentValue,
    proposedValue: rec.proposedValue,
    direction: rec.direction,
    rejected: rec.rejected,
    observations: rec.observations,
    meanObservation: rec.meanObservation,
    evidence: rec.evidence,
    alpha: rec.alpha,
    applied,
    observationSource: {
      sourceId: source.sourceId,
      wired: source.wired,
    },
  };
}

/**
 * Atomically append a single audit-log entry to the JSONL file. Creates
 * the parent directory if missing. Returns the path that was written to.
 */
export async function appendAuditLogEntry(
  entry: AuditLogEntry,
  options: { path?: string } = {},
): Promise<string> {
  const path = options.path ?? DEFAULT_AUDIT_LOG_PATH;
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify(entry) + '\n';
  await appendFile(path, line, 'utf8');
  return path;
}

/**
 * Read the audit log, returning entries in file order. Tolerates
 * malformed lines (skipped) + missing file (returns empty).
 */
export async function readAuditLog(path: string): Promise<AuditLogEntry[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const entries: AuditLogEntry[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (isAuditLogEntry(parsed)) entries.push(parsed);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return entries;
}

function isAuditLogEntry(value: unknown): value is AuditLogEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'string' &&
    typeof obj.threshold === 'string' &&
    typeof obj.currentValue === 'number' &&
    (obj.proposedValue === null || typeof obj.proposedValue === 'number') &&
    typeof obj.direction === 'string' &&
    typeof obj.applied === 'string'
  );
}
