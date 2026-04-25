/**
 * HB-03 STD Calibration — CAPCOM HARD GATE.
 *
 * The gate fires in two production scenarios:
 *
 *   1. **Calibration update.** When a new STD value would replace an
 *      existing one for a given model. Without authorization, the new
 *      value is staged-only (not active).
 *   2. **Fail-closed activation.** When bootstrap defaults are about to
 *      take effect at a critical decision point. Without authorization,
 *      the system stays in most-conservative posture (no constraint
 *      re-injection) until calibration is provided.
 *
 * Authorization is recorded as a file with a single line containing a
 * non-empty signature/identifier. The marker file lives at
 * `.planning/safety/std-calibration.capcom`. Presence + non-empty content
 * is the gate-pass condition (Phase 808 gate-pattern, mirrors the
 * v1.49.574 megakernel HB-04 adapter-selection-schema gate).
 *
 * The flag-off invariant: when the std-calibration flag is off, the gate
 * is fully disabled — no record emitted, no authorization checked.
 *
 * @module safety/std-calibration/capcom-gate
 */

import fs from 'node:fs';
import path from 'node:path';

import { isStdCalibrationEnabled } from './settings.js';
import {
  type CalibratedModel,
  type CapcomGateRecord,
  type CapcomGateResult,
  type CapcomGateReason,
} from './types.js';

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

/** Default path for the CAPCOM authorization marker file. */
export function defaultCapcomMarkerPath(): string {
  return path.join(
    projectRoot(),
    '.planning',
    'safety',
    'std-calibration.capcom',
  );
}

const DISABLED_RESULT: CapcomGateResult = Object.freeze({
  emitted: false,
  authorized: false,
  disabled: true,
  record: null,
});

/**
 * Is the CAPCOM authorization marker present and non-empty?
 *
 * Returns false if the file is missing, empty, or unreadable.
 */
export function isCapcomAuthorized(markerPath?: string): boolean {
  const filePath = markerPath ?? defaultCapcomMarkerPath();
  if (!fs.existsSync(filePath)) return false;
  let contents = '';
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  return contents.trim().length > 0;
}

/**
 * Emit a CAPCOM gate record for a candidate change to the calibration
 * surface. The record is *always* emitted when the flag is on; it
 * reports `authorized: true` only when the marker is present.
 *
 * Calling code MUST refuse to activate the proposed change when
 * `authorized === false`.
 */
export function emitCapcomGate(
  reason: CapcomGateReason,
  options: {
    model?: CalibratedModel | null;
    proposedStd?: number | null;
    previousStd?: number | null;
    note?: string;
    markerPath?: string;
    settingsPath?: string;
  } = {},
): CapcomGateResult {
  if (!isStdCalibrationEnabled(options.settingsPath)) {
    return DISABLED_RESULT;
  }
  const authorized = isCapcomAuthorized(options.markerPath);
  const record: CapcomGateRecord = Object.freeze({
    reason,
    model: options.model ?? null,
    proposedStd:
      typeof options.proposedStd === 'number' ? options.proposedStd : null,
    previousStd:
      typeof options.previousStd === 'number' ? options.previousStd : null,
    timestamp: new Date().toISOString(),
    authorized,
    note: options.note ?? '',
  });
  return Object.freeze({
    emitted: true,
    authorized,
    disabled: false,
    record,
  });
}

/** Disabled-result sentinel for callers + tests. */
export const CAPCOM_GATE_DISABLED_RESULT = DISABLED_RESULT;
