/**
 * HB-03 STD Calibration — fail-closed bootstrap.
 *
 * Disposition: impact.md §4 #2.
 *
 * On first run with no calibration data:
 *   - the system enters bootstrap mode that defaults to a *conservative*
 *     STD-floor across all enabled models (≤ turn 5 — paper's lowest
 *     reported decay turn);
 *   - emits a one-time WARN-level diagnostic per process;
 *   - requires an explicit re-calibration trigger
 *     (`npx skill-creator safety std-calibrate <model>`) before fail-closed
 *     activates fully.
 *
 * Without the explicit trigger, the system does NOT silently switch to
 * autonomous fail-closed; it stays in conservative-floor advisory mode.
 *
 * Note: the warn-once latch is *per-test-process*. The `resetBootstrapLatch`
 * helper exposed below makes the latch testable without subprocess churn.
 *
 * @module safety/std-calibration/bootstrap
 */

import fs from 'node:fs';
import path from 'node:path';

import { isStdCalibrationEnabled } from './settings.js';
import { emitCapcomGate } from './capcom-gate.js';
import { readTable, defaultTablePath } from './calibration-table.js';
import {
  type BootstrapState,
  BOOTSTRAP_STD_FLOOR,
} from './types.js';

let warnedThisProcess = false;

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

/** Default path for the explicit-trigger marker (touched by the CLI). */
export function defaultTriggerMarkerPath(): string {
  return path.join(
    projectRoot(),
    '.planning',
    'safety',
    'std-calibrate-triggered.marker',
  );
}

/** Has the user run `npx skill-creator safety std-calibrate <model>`? */
export function isExplicitTriggerRecorded(markerPath?: string): boolean {
  const filePath = markerPath ?? defaultTriggerMarkerPath();
  return fs.existsSync(filePath);
}

const DISABLED_STATE: BootstrapState = Object.freeze({
  engaged: false,
  conservativeStd: 0,
  warned: false,
  explicitTriggerRecorded: false,
  disabled: true,
});

/**
 * Compute the bootstrap state given current on-disk inputs.
 *
 * Side effects:
 *   - emits one WARN-level diagnostic per process via `console.warn` when
 *     bootstrap engages and we have not yet warned this process;
 *   - emits a CAPCOM gate record when fail-closed activation would happen
 *     (i.e. when bootstrap-engaged + explicit trigger present + no CAPCOM
 *     authorization).
 *
 * Inputs:
 *   - reading the calibration table — empty / missing → bootstrap engages;
 *   - reading the trigger marker — present → caller can advance to
 *     fail-closed activation, gated on CAPCOM authorization;
 *   - reading the CAPCOM authorization marker — handled inside emitCapcomGate.
 */
export function evaluateBootstrap(options: {
  tablePath?: string;
  triggerMarkerPath?: string;
  capcomMarkerPath?: string;
  settingsPath?: string;
  /** Test hook — silence the WARN side effect when true. */
  silent?: boolean;
} = {}): BootstrapState {
  if (!isStdCalibrationEnabled(options.settingsPath)) {
    return DISABLED_STATE;
  }
  const table = readTable(options.tablePath ?? defaultTablePath());
  const haveCalibration = table.entries.length > 0;
  const explicitTriggerRecorded = isExplicitTriggerRecorded(
    options.triggerMarkerPath,
  );

  if (haveCalibration) {
    return Object.freeze({
      engaged: false,
      conservativeStd: 0,
      warned: warnedThisProcess,
      explicitTriggerRecorded,
      disabled: false,
    });
  }

  // Bootstrap path — no calibration data on disk.
  let warned = warnedThisProcess;
  if (!warned) {
    warnedThisProcess = true;
    warned = true;
    if (!options.silent) {
      // eslint-disable-next-line no-console
      console.warn(
        '[std-calibration] WARN: no calibration data found; engaging conservative bootstrap floor (STD=' +
          BOOTSTRAP_STD_FLOOR +
          '). Run `npx skill-creator safety std-calibrate <model>` to record a real calibration.',
      );
    }
  }

  // If the explicit trigger is present, fail-closed activation is being
  // requested — fire the CAPCOM gate. Without authorization, the gate
  // record reports authorized=false; calling code stays in conservative
  // mode regardless.
  if (explicitTriggerRecorded) {
    emitCapcomGate('fail-closed-activation', {
      model: null,
      proposedStd: BOOTSTRAP_STD_FLOOR,
      previousStd: null,
      note: 'bootstrap conservative floor activation',
      markerPath: options.capcomMarkerPath,
      settingsPath: options.settingsPath,
    });
  }

  return Object.freeze({
    engaged: true,
    conservativeStd: BOOTSTRAP_STD_FLOOR,
    warned,
    explicitTriggerRecorded,
    disabled: false,
  });
}

/**
 * Test-only helper — clear the per-process WARN latch so the
 * one-time-per-process invariant can be exercised by tests that need
 * a fresh starting state.
 */
export function resetBootstrapLatch(): void {
  warnedThisProcess = false;
}

export const BOOTSTRAP_DISABLED_STATE = DISABLED_STATE;
