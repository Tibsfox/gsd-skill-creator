/**
 * HB-03 STD Calibration — re-injection middleware.
 *
 * When conversation depth approaches the active model's STD floor, the
 * middleware fires to re-inject the active omission constraints from the
 * GROUNDING.md / CLAUDE.md Hard Constraints set. The middleware is a
 * pure decision function: it returns a `ReInjectionDecision` describing
 * whether to fire and which constraints to re-inject; the host system is
 * responsible for actually splicing the re-injected constraints into the
 * outgoing context.
 *
 * Bootstrap interaction: when no calibration is present, the middleware
 * uses the conservative bootstrap floor as the STD value. The decision
 * surfaces `usedBootstrapFloor: true` so callers know to treat the result
 * as advisory (no autonomous fail-closed without the explicit trigger).
 *
 * Flag-off invariant: returns the disabled sentinel; never fires.
 *
 * @module safety/std-calibration/re-injection
 */

import { isStdCalibrationEnabled } from './settings.js';
import { lookupCalibration, readTable } from './calibration-table.js';
import {
  type CalibratedModel,
  type ReInjectionDecision,
  BOOTSTRAP_STD_FLOOR,
} from './types.js';

const DISABLED_DECISION: ReInjectionDecision = Object.freeze({
  triggered: false,
  depth: 0,
  std: 0,
  model: null,
  constraintsReinjected: Object.freeze([]) as ReadonlyArray<string>,
  usedBootstrapFloor: false,
  disabled: true,
});

/**
 * Decide whether to re-inject omission constraints at the current
 * conversation depth.
 *
 * Trigger condition: `depth >= std`. At depth = std-1, no fire; at
 * depth = std, fire.
 *
 * @param model The active model.
 * @param depth Current conversation depth (1-indexed turns).
 * @param activeConstraints The omission constraints currently in effect.
 * @param options Optional overrides for tests + dependency injection.
 */
export function decideReInjection(
  model: CalibratedModel,
  depth: number,
  activeConstraints: ReadonlyArray<string>,
  options: {
    tablePath?: string;
    settingsPath?: string;
  } = {},
): ReInjectionDecision {
  if (!isStdCalibrationEnabled(options.settingsPath)) {
    return DISABLED_DECISION;
  }
  const table = readTable(options.tablePath);
  const calibration = lookupCalibration(table, model);
  const usedBootstrapFloor = calibration === null;
  const std = calibration ? calibration.std : BOOTSTRAP_STD_FLOOR;
  const triggered = depth >= std;
  return Object.freeze({
    triggered,
    depth,
    std,
    model,
    constraintsReinjected: triggered
      ? Object.freeze([...activeConstraints]) as ReadonlyArray<string>
      : Object.freeze([]) as ReadonlyArray<string>,
    usedBootstrapFloor,
    disabled: false,
  });
}

/** Disabled-decision sentinel. */
export const RE_INJECTION_DISABLED_DECISION = DISABLED_DECISION;
