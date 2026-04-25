/**
 * HB-03 STD Calibration — calibration table read/write.
 *
 * The persisted table lives at `.planning/safety/std-calibration.json`.
 * `.planning/` is gitignored — calibration is local-state-only by design.
 *
 * Active vs staged: a new calibration value for a given model that
 * replaces an existing one starts in `staged` and graduates to `entries`
 * only after CAPCOM gate authorization.
 *
 * @module safety/std-calibration/calibration-table
 */

import fs from 'node:fs';
import path from 'node:path';

import { isStdCalibrationEnabled } from './settings.js';
import {
  type CalibratedModel,
  type CalibrationTable,
  type StagedStdCalibration,
  type StdCalibration,
  STD_CALIBRATION_SCHEMA_VERSION,
} from './types.js';

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

/** Default calibration-table file path. */
export function defaultTablePath(): string {
  return path.join(projectRoot(), '.planning', 'safety', 'std-calibration.json');
}

const EMPTY_TABLE: CalibrationTable = Object.freeze({
  schemaVersion: STD_CALIBRATION_SCHEMA_VERSION,
  entries: Object.freeze([]) as ReadonlyArray<StdCalibration>,
  staged: Object.freeze([]) as ReadonlyArray<StagedStdCalibration>,
});

/**
 * Read the calibration table from disk. Returns an empty (frozen) table
 * on any error (missing file, malformed JSON, wrong shape) — callers
 * treat that case as "no calibration data exists yet" → bootstrap.
 *
 * Returns the empty-table sentinel if the flag is off.
 */
export function readTable(tablePath?: string): CalibrationTable {
  const filePath = tablePath ?? defaultTablePath();
  if (!fs.existsSync(filePath)) {
    return EMPTY_TABLE;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return EMPTY_TABLE;
  }
  if (!raw || typeof raw !== 'object') return EMPTY_TABLE;
  const obj = raw as Record<string, unknown>;
  const schemaVersion =
    typeof obj.schemaVersion === 'string' ? obj.schemaVersion : '';
  if (schemaVersion !== STD_CALIBRATION_SCHEMA_VERSION) return EMPTY_TABLE;
  const entries = sanitizeEntries(obj.entries);
  const staged = sanitizeStaged(obj.staged);
  return Object.freeze({
    schemaVersion: STD_CALIBRATION_SCHEMA_VERSION,
    entries: Object.freeze(entries) as ReadonlyArray<StdCalibration>,
    staged: Object.freeze(staged) as ReadonlyArray<StagedStdCalibration>,
  });
}

/**
 * Write the calibration table to disk (creates parent dirs as needed).
 * No-op when the flag is off.
 *
 * Returns the path written, or null when disabled.
 */
export function writeTable(
  table: CalibrationTable,
  tablePath?: string,
  settingsPath?: string,
): string | null {
  if (!isStdCalibrationEnabled(settingsPath)) {
    return null;
  }
  const filePath = tablePath ?? defaultTablePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(table, null, 2), 'utf8');
  return filePath;
}

/**
 * Lookup a model's active calibration. Returns null if not present.
 */
export function lookupCalibration(
  table: CalibrationTable,
  model: CalibratedModel,
): StdCalibration | null {
  for (const entry of table.entries) {
    if (entry.model === model) return entry;
  }
  return null;
}

/**
 * Stage a candidate calibration. The caller must subsequently obtain
 * CAPCOM authorization to graduate the staged record into `entries`.
 *
 * Staging is idempotent: a re-staging for the same model overwrites the
 * prior staged record (the latest candidate wins). Concurrent stagings
 * from parallel sessions resolve to last-writer-wins on disk; the in-memory
 * shape returned reflects the input arguments deterministically.
 */
export function stageCalibration(
  table: CalibrationTable,
  candidate: StdCalibration,
): CalibrationTable {
  const previous = lookupCalibration(table, candidate.model);
  const staged: StagedStdCalibration = Object.freeze({
    ...candidate,
    stagedAt: new Date().toISOString(),
    previousStd: previous ? previous.std : null,
  });
  const remainingStaged = (table.staged ?? []).filter(
    (s) => s.model !== candidate.model,
  );
  return Object.freeze({
    schemaVersion: STD_CALIBRATION_SCHEMA_VERSION,
    entries: table.entries,
    staged: Object.freeze([...remainingStaged, staged]) as ReadonlyArray<StagedStdCalibration>,
  });
}

/**
 * Promote a staged calibration to active `entries`. Caller must have
 * verified CAPCOM authorization before invoking. Returns the input
 * table unchanged when no staged record exists for the model.
 */
export function promoteStaged(
  table: CalibrationTable,
  model: CalibratedModel,
): CalibrationTable {
  const stagedSet = table.staged ?? [];
  const staged = stagedSet.find((s) => s.model === model);
  if (!staged) return table;
  const remainingEntries = table.entries.filter((e) => e.model !== model);
  const newEntry: StdCalibration = Object.freeze({
    model: staged.model,
    std: staged.std,
    measuredAt: staged.measuredAt,
    trialCount: staged.trialCount,
    complianceAtStd: staged.complianceAtStd,
  });
  const remainingStaged = stagedSet.filter((s) => s.model !== model);
  return Object.freeze({
    schemaVersion: STD_CALIBRATION_SCHEMA_VERSION,
    entries: Object.freeze([...remainingEntries, newEntry]) as ReadonlyArray<StdCalibration>,
    staged: Object.freeze(remainingStaged) as ReadonlyArray<StagedStdCalibration>,
  });
}

/** Empty-table sentinel for callers that need a known-good blank. */
export const EMPTY_CALIBRATION_TABLE = EMPTY_TABLE;

// ============================================================================
// Internal helpers.
// ============================================================================

function sanitizeEntries(raw: unknown): StdCalibration[] {
  if (!Array.isArray(raw)) return [];
  const out: StdCalibration[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (!isCalibratedModel(r.model)) continue;
    if (typeof r.std !== 'number' || !Number.isFinite(r.std)) continue;
    if (typeof r.measuredAt !== 'string') continue;
    if (typeof r.trialCount !== 'number') continue;
    if (typeof r.complianceAtStd !== 'number') continue;
    out.push(
      Object.freeze({
        model: r.model,
        std: r.std,
        measuredAt: r.measuredAt,
        trialCount: r.trialCount,
        complianceAtStd: r.complianceAtStd,
      }) as StdCalibration,
    );
  }
  return out;
}

function sanitizeStaged(raw: unknown): StagedStdCalibration[] {
  if (!Array.isArray(raw)) return [];
  const out: StagedStdCalibration[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (!isCalibratedModel(r.model)) continue;
    if (typeof r.std !== 'number' || !Number.isFinite(r.std)) continue;
    if (typeof r.measuredAt !== 'string') continue;
    if (typeof r.trialCount !== 'number') continue;
    if (typeof r.complianceAtStd !== 'number') continue;
    if (typeof r.stagedAt !== 'string') continue;
    const previousStd =
      r.previousStd === null
        ? null
        : typeof r.previousStd === 'number' && Number.isFinite(r.previousStd)
          ? r.previousStd
          : null;
    out.push(
      Object.freeze({
        model: r.model,
        std: r.std,
        measuredAt: r.measuredAt,
        trialCount: r.trialCount,
        complianceAtStd: r.complianceAtStd,
        stagedAt: r.stagedAt,
        previousStd,
      }) as StagedStdCalibration,
    );
  }
  return out;
}

function isCalibratedModel(value: unknown): value is CalibratedModel {
  return value === 'opus' || value === 'sonnet' || value === 'haiku';
}
