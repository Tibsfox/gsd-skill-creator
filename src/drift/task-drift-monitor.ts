/**
 * Task-drift activation-delta monitor at CAPCOM-gate boundaries.
 *
 * Adapts Abdelnabi et al. 2024 (arXiv:2406.00799) task-drift probe methodology.
 * Core finding: near-perfect AUROC for detecting prompt-injection-driven task-drift
 * using activation-delta signatures measured at pipeline boundaries.
 *
 * This module computes the L2 magnitude and normalised direction of the delta
 * between two activation snapshots (before/after a CAPCOM-gate boundary). It
 * classifies the result as 'clean', 'suspicious', or 'drift' and emits a
 * `drift.alignment.taskDrift.detected` telemetry event when the delta exceeds
 * the configured threshold.
 *
 * Default-off guarantee: this module exports pure functions. Nothing runs on
 * import. No global hooks are registered. Callers must opt in explicitly.
 * When the `drift.alignment.taskDriftMonitor` feature flag is false, the
 * monitor returns `{ classification: 'clean', drift_magnitude: 0, direction: null }`
 * and emits no side-effects — byte-identical to pre-monitor behaviour.
 *
 * Feature-flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "drift": {
 *       "alignment": {
 *         "taskDriftMonitor": true,
 *         "taskDriftThreshold": 0.5
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * Settings keys read by this module:
 *  - `drift.alignment.taskDriftMonitor` (boolean, default false) — enables the monitor
 *  - `drift.alignment.taskDriftThreshold` (number, default 0.5) — drift-classification floor
 *
 * Precedence for `threshold`: per-call `options.threshold` > settings value > default.
 *
 * Telemetry: emits a `drift.alignment.taskDrift.detected` event to
 * `.logs/drift-telemetry.jsonl` (same channel as semantic-drift.ts) when
 * classification is 'drift' or 'suspicious'. Best-effort write — never throws.
 *
 * @module drift/task-drift-monitor
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Activation snapshot — a numeric vector (real-valued). */
export type ActivationVector = number[];

/** Pair of activation snapshots at a gate boundary. */
export interface ActivationSnapshot {
  /** Activations captured before the gate boundary. */
  before: ActivationVector;
  /** Activations captured after the gate boundary. */
  after: ActivationVector;
}

/** Classification result from the task-drift monitor. */
export type DriftClassification = 'clean' | 'suspicious' | 'drift';

/** Result returned by `monitorTaskDrift`. */
export interface TaskDriftResult {
  /**
   * L2 magnitude of the activation delta (||after − before||₂).
   * Value in [0, ∞). Higher = larger shift.
   */
  drift_magnitude: number;
  /**
   * Normalised direction vector of the delta (unit vector pointing from
   * before to after in activation space). Null when magnitude is zero or
   * when input vectors have length 0.
   */
  direction: number[] | null;
  /**
   * Classification of the delta:
   *  - 'clean'      — magnitude < lower_threshold (no task-drift signal)
   *  - 'suspicious' — lower_threshold ≤ magnitude < threshold (borderline)
   *  - 'drift'      — magnitude ≥ threshold (task-drift detected)
   */
  classification: DriftClassification;
}

/** Options accepted by `monitorTaskDrift`. */
export interface TaskDriftMonitorOptions {
  /**
   * Threshold above which classification is 'drift'.
   * Default: 0.5. Per-call value takes precedence over the
   * `drift.alignment.taskDriftThreshold` settings value, which takes
   * precedence over the module default.
   */
  threshold?: number;
  /**
   * Lower boundary for 'suspicious' band.
   * Default: threshold * 0.5 (i.e., half the main threshold).
   */
  suspiciousThreshold?: number;
  /**
   * Path to the JSONL telemetry log.
   * Default: `.logs/drift-telemetry.jsonl` relative to process.cwd().
   */
  telemetryPath?: string;
  /**
   * Path to settings.json for reading the feature flag.
   * Default: `.claude/settings.json`.
   */
  settingsPath?: string;
  /**
   * Override the feature flag directly (skips settings.json read).
   * Useful for testing without filesystem writes.
   */
  flagOverride?: boolean;
}

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

/**
 * Read `drift.alignment.taskDriftMonitor` from settings.json.
 * Returns `false` on any read / parse / shape error.
 */
export function readTaskDriftMonitorFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return false;
    const alignment = (drift as Record<string, unknown>).alignment;
    if (!alignment || typeof alignment !== 'object') return false;
    const flag = (alignment as Record<string, unknown>).taskDriftMonitor;
    return flag === true;
  } catch {
    return false;
  }
}

/**
 * Read `drift.alignment.taskDriftThreshold` from settings.json.
 * Returns null on any read / parse / shape error (caller may fall back to
 * the per-call option or the module default of 0.5).
 */
export function readTaskDriftThresholdSetting(
  settingsPath: string = '.claude/settings.json',
): number | null {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return null;
    const drift = (scope as Record<string, unknown>).drift;
    if (!drift || typeof drift !== 'object') return null;
    const alignment = (drift as Record<string, unknown>).alignment;
    if (!alignment || typeof alignment !== 'object') return null;
    const value = (alignment as Record<string, unknown>).taskDriftThreshold;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Vector math helpers
// ---------------------------------------------------------------------------

/** Compute the element-wise difference (after − before). */
function _vectorDelta(before: ActivationVector, after: ActivationVector): number[] {
  const len = Math.min(before.length, after.length);
  const delta: number[] = new Array(len);
  for (let i = 0; i < len; i++) {
    delta[i] = after[i] - before[i];
  }
  return delta;
}

/** Compute the L2 norm of a vector. */
function _l2Norm(v: number[]): number {
  let sum = 0;
  for (const x of v) sum += x * x;
  return Math.sqrt(sum);
}

/** Normalise a vector to unit length. Returns null if norm is (near) zero. */
function _normalise(v: number[]): number[] | null {
  const norm = _l2Norm(v);
  if (norm < 1e-12) return null;
  return v.map((x) => x / norm);
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

interface TaskDriftTelemetryEvent {
  type: 'drift.alignment.taskDrift.detected';
  drift_magnitude: number;
  classification: DriftClassification;
  timestamp: string;
}

/**
 * Emit a telemetry event to the drift JSONL log.
 * Swallows all errors — must never throw.
 */
function _emitTelemetry(event: TaskDriftTelemetryEvent, telemetryPath: string): void {
  try {
    mkdirSync(dirname(telemetryPath), { recursive: true });
    appendFileSync(telemetryPath, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // intentionally swallowed
  }
}

// ---------------------------------------------------------------------------
// Core monitor
// ---------------------------------------------------------------------------

/**
 * Monitor activation delta at a CAPCOM-gate boundary for task-drift signals.
 *
 * Algorithm (Abdelnabi 2024 activation-delta probe):
 * 1. Compute delta = after − before (element-wise).
 * 2. Compute L2 magnitude of delta.
 * 3. Classify by magnitude relative to thresholds.
 * 4. If classification is 'drift' or 'suspicious', emit telemetry event.
 *
 * When the `drift.alignment.taskDriftMonitor` flag is false (default), the
 * monitor is a no-op: returns `{ classification: 'clean', drift_magnitude: 0,
 * direction: null }` with no telemetry emission.
 *
 * @param snapshot - Before/after activation pair at a gate boundary.
 * @param options  - Tuning parameters.
 * @returns TaskDriftResult with magnitude, direction, and classification.
 */
export function monitorTaskDrift(
  snapshot: ActivationSnapshot,
  options: TaskDriftMonitorOptions = {},
): TaskDriftResult {
  // Resolve feature flag.
  const flagEnabled =
    options.flagOverride !== undefined
      ? options.flagOverride
      : readTaskDriftMonitorFlag(options.settingsPath ?? '.claude/settings.json');

  // Default-off: no-op when flag is false.
  if (!flagEnabled) {
    return { classification: 'clean', drift_magnitude: 0, direction: null };
  }

  // Threshold precedence: per-call option > settings > module default.
  const settingsThreshold = readTaskDriftThresholdSetting(
    options.settingsPath ?? '.claude/settings.json',
  );
  const threshold = options.threshold ?? (settingsThreshold ?? 0.5);
  const suspiciousThreshold = options.suspiciousThreshold ?? threshold * 0.5;
  const telemetryPath =
    options.telemetryPath ?? join(process.cwd(), '.logs', 'drift-telemetry.jsonl');

  const { before, after } = snapshot;

  // Guard: empty vectors.
  if (before.length === 0 || after.length === 0) {
    return { classification: 'clean', drift_magnitude: 0, direction: null };
  }

  const delta = _vectorDelta(before, after);
  const magnitude = _l2Norm(delta);
  const direction = _normalise(delta);

  // Classify by magnitude.
  let classification: DriftClassification;
  if (magnitude >= threshold) {
    classification = 'drift';
  } else if (magnitude >= suspiciousThreshold) {
    classification = 'suspicious';
  } else {
    classification = 'clean';
  }

  // Emit telemetry for above-threshold events.
  if (classification === 'drift' || classification === 'suspicious') {
    const event: TaskDriftTelemetryEvent = {
      type: 'drift.alignment.taskDrift.detected',
      drift_magnitude: magnitude,
      classification,
      timestamp: new Date().toISOString(),
    };
    _emitTelemetry(event, telemetryPath);
  }

  return { drift_magnitude: magnitude, direction, classification };
}
