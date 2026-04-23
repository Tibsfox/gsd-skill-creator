/**
 * Temporal retrieval check for Grove RAG path (DRIFT-23).
 *
 * Adapts the Chronos/DriftLens-style temporal staleness probe. Measures the
 * wall-clock lag between the most-recent SSoT update timestamp and the
 * retrieval timestamp, classifying retrieval freshness to detect stale-index
 * conditions that cause grounding drift.
 *
 * Classification bands:
 *  - 'fresh'             — lag_ms <= maxLagMs (default 24 h)
 *  - 'stale'             — maxLagMs < lag_ms <= 3 × maxLagMs
 *  - 'critically-stale'  — lag_ms > 3 × maxLagMs
 *
 * Default-off guarantee: this module exports pure functions. Nothing runs on
 * import. No global hooks are registered. When the
 * `drift.retrieval.temporalCheck` feature flag is false (default), the check
 * returns `{ lag_ms: 0, classification: 'fresh', alert: false }` and emits
 * no telemetry — byte-identical to pre-check behaviour.
 *
 * Feature-flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "drift": {
 *       "retrieval": {
 *         "temporalCheck": true,
 *         "maxLagMs": 86400000
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * Telemetry: emits a `drift.retrieval.stale_index_detected` event to
 * `.logs/drift-telemetry.jsonl` when classification is not 'fresh'.
 * Best-effort write — never throws.
 *
 * @module drift/temporal-retrieval
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Classification of retrieval freshness. */
export type FreshnessClassification = 'fresh' | 'stale' | 'critically-stale';

/** Input to `checkTemporalRetrieval`. */
export interface TemporalRetrievalInput {
  /** Timestamp at which retrieval occurred (Date or ISO string). */
  retrieval_timestamp: Date | string;
  /** Timestamp of the most-recent SSoT / index update (Date or ISO string). */
  ssot_timestamp: Date | string;
  /**
   * Maximum acceptable lag in milliseconds before classification becomes 'stale'.
   * Default: 86400000 (24 h). Configurable via `drift.retrieval.maxLagMs`.
   */
  max_lag_ms?: number;
}

/** Result returned by `checkTemporalRetrieval`. */
export interface TemporalRetrievalResult {
  /**
   * Signed lag in milliseconds: retrieval_timestamp − ssot_timestamp.
   * Positive = retrieval is ahead of SSoT update (normal case).
   * Negative = retrieval timestamp is BEFORE the SSoT update (unusual).
   */
  lag_ms: number;
  /** Freshness classification based on lag magnitude. */
  classification: FreshnessClassification;
  /** True when classification is not 'fresh' and the flag is enabled. */
  alert: boolean;
}

/** Options accepted by `checkTemporalRetrieval`. */
export interface TemporalRetrievalOptions {
  /**
   * Path to settings.json for reading the feature flag.
   * Default: `.claude/settings.json`.
   */
  settingsPath?: string;
  /**
   * Override the feature flag directly (skips settings.json read).
   * Useful for testing without filesystem access.
   */
  flagOverride?: boolean;
  /**
   * Path to the JSONL telemetry log.
   * Default: `.logs/drift-telemetry.jsonl` relative to process.cwd().
   */
  telemetryPath?: string;
}

// ---------------------------------------------------------------------------
// Default value
// ---------------------------------------------------------------------------

const DEFAULT_MAX_LAG_MS = 86_400_000; // 24 hours

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

/**
 * Read `drift.retrieval.temporalCheck` from settings.json.
 * Returns false on any read / parse / shape error.
 */
export function readTemporalCheckFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return false;
    const retrieval = (drift as Record<string, unknown>).retrieval;
    if (!retrieval || typeof retrieval !== 'object') return false;
    const flag = (retrieval as Record<string, unknown>).temporalCheck;
    return flag === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

interface TemporalTelemetryEvent {
  type: 'drift.retrieval.stale_index_detected';
  lag_ms: number;
  classification: FreshnessClassification;
  timestamp: string;
}

/**
 * Emit a telemetry event to the drift JSONL log.
 * Swallows all errors — must never throw.
 */
function _emitTelemetry(event: TemporalTelemetryEvent, telemetryPath: string): void {
  try {
    mkdirSync(dirname(telemetryPath), { recursive: true });
    appendFileSync(telemetryPath, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // intentionally swallowed
  }
}

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------

/**
 * Check whether the retrieval timestamp is within acceptable lag of the SSoT.
 *
 * Algorithm:
 * 1. Parse both timestamps to epoch milliseconds.
 * 2. Compute lag = retrieval_ms − ssot_ms.
 * 3. Classify by |lag| relative to maxLagMs.
 * 4. Emit telemetry when classification != 'fresh' and flag is enabled.
 *
 * When `drift.retrieval.temporalCheck` is false (default), returns
 * `{ lag_ms: 0, classification: 'fresh', alert: false }` with no telemetry.
 *
 * @param input   - Timestamps and optional max-lag override.
 * @param options - Flag, settings, telemetry path overrides.
 * @returns TemporalRetrievalResult with lag, classification, and alert flag.
 */
export function checkTemporalRetrieval(
  input: TemporalRetrievalInput,
  options: TemporalRetrievalOptions = {},
): TemporalRetrievalResult {
  // Resolve feature flag.
  const flagEnabled =
    options.flagOverride !== undefined
      ? options.flagOverride
      : readTemporalCheckFlag(options.settingsPath ?? '.claude/settings.json');

  // Default-off: no-op when flag is false.
  if (!flagEnabled) {
    return { lag_ms: 0, classification: 'fresh', alert: false };
  }

  const maxLagMs = input.max_lag_ms ?? DEFAULT_MAX_LAG_MS;
  const telemetryPath =
    options.telemetryPath ?? join(process.cwd(), '.logs', 'drift-telemetry.jsonl');

  // Parse timestamps.
  const retrievalMs =
    input.retrieval_timestamp instanceof Date
      ? input.retrieval_timestamp.getTime()
      : new Date(input.retrieval_timestamp).getTime();

  const ssotMs =
    input.ssot_timestamp instanceof Date
      ? input.ssot_timestamp.getTime()
      : new Date(input.ssot_timestamp).getTime();

  const lag_ms = retrievalMs - ssotMs;
  const absLag = Math.abs(lag_ms);

  // Classify by absolute lag.
  let classification: FreshnessClassification;
  if (absLag <= maxLagMs) {
    classification = 'fresh';
  } else if (absLag <= 3 * maxLagMs) {
    classification = 'stale';
  } else {
    classification = 'critically-stale';
  }

  const alert = classification !== 'fresh';

  // Emit telemetry for non-fresh results.
  if (alert) {
    const event: TemporalTelemetryEvent = {
      type: 'drift.retrieval.stale_index_detected',
      lag_ms,
      classification,
      timestamp: new Date().toISOString(),
    };
    _emitTelemetry(event, telemetryPath);
  }

  return { lag_ms, classification, alert };
}
