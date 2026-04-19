/**
 * MB-1 — Bridge between the Lyapunov-stable K_H adaptation law and M6.
 *
 * The bridge is **strictly additive** and **default-off**: when
 * `gsd-skill-creator.sensoria.lyapunov.enabled` is `false` (the default), the
 * bridge short-circuits and the caller falls back to `DesensitisationStore`'s
 * existing `recordActivation` behaviour byte-identically (SC-MB1-01).
 *
 * When the flag is on, the caller may invoke `computeLyapunovKH` instead of
 * (or in addition to) the ad-hoc decay rule. The bridge does **not** mutate
 * `DesensitisationStore`; it returns a new `effectiveK_H` and lets the caller
 * decide how to apply it. This preserves the purity contract for MB-1 and
 * keeps the two update paths decoupled at the storage level.
 *
 * @module lyapunov/desensitisation-bridge
 */

import type { TractabilityClass } from '../ace/settings.js';
import type { DesensitisationState, SensoriaBlock } from '../types/sensoria.js';
import {
  adaptKH,
  buildRegressor,
  resolveTractabilityGain,
  DEFAULT_GAIN_G,
  DEFAULT_GAIN_GAMMA,
  DEFAULT_RECENCY_TAU_MS,
  type AdaptKHResult,
} from './k_h-adaptation.js';
import { readLyapunovEnabledFlag } from './settings.js';

export interface BridgeInputs {
  /** M6 state snapshot for the skill (pre-update). */
  state: Pick<DesensitisationState, 'effectiveK_H' | 'lastUpdateTs'>;
  /** Skill sensoria frontmatter — provides the target K_H and K_L floor. */
  block: SensoriaBlock;
  /** Dose magnitude for this activation (M5's ligand-like score, ≥ 0). */
  dose: number;
  /** Observed activation rate (from M6 / M8 telemetry). */
  observedRate: number;
  /** Teaching-declared target rate (from the M8 symbiosis stream). */
  teachingDeclaredRate: number;
  /** Current wall-clock time in ms. */
  nowMs: number;
  /** ME-1 tractability class for the skill. */
  tractability: TractabilityClass;
  /** Optional ME-1 confidence scalar in `[0, 1]`; default 1. */
  tractabilityConfidence?: number;
  /**
   * Discrete-time step size in seconds. Defaults to the elapsed wall-clock
   * interval `(nowMs − state.lastUpdateTs) / 1000`, floored at 0.
   */
  stepSize?: number;
  /** Gradient step `g`. Default `DEFAULT_GAIN_G`. */
  gainG?: number;
  /** Lyapunov weighting `γ`. Default `DEFAULT_GAIN_GAMMA`. */
  gainGamma?: number;
  /** Recency timescale τ (ms). Default `DEFAULT_RECENCY_TAU_MS`. */
  tauMs?: number;
  /**
   * Lower bound ratio vs `block.K_L`. The new K_H is clamped below by
   * `block.K_L · floorRatio`. Defaults to 1 (mirrors M6 default floor).
   */
  floorRatio?: number;
  /**
   * Override the settings.json flag read. When provided, bypasses
   * `readLyapunovEnabledFlag()`. Used primarily by tests.
   */
  enabled?: boolean;
  /**
   * Path to settings.json; passed through to `readLyapunovEnabledFlag` when
   * `enabled` is not explicitly overridden.
   */
  settingsPath?: string;
}

export interface BridgeResult {
  /**
   * Whether the Lyapunov path was actually taken. When `false`, the caller
   * should fall through to the existing M6 `recordActivation` behaviour.
   */
  applied: boolean;
  /**
   * New effective K_H if the Lyapunov path was taken; undefined otherwise.
   */
  newEffectiveKH?: number;
  /** Full adaptation result for diagnostics / monitoring. Undefined when not applied. */
  adaptation?: AdaptKHResult;
  /** Effective tractability gain used. Undefined when not applied. */
  tractabilityGain?: number;
}

/**
 * Compute the Lyapunov-stable K_H update for one activation step.
 *
 * Flag-off path: returns `{ applied: false }` and performs no computation —
 * this is the SC-MB1-01 byte-identity guarantee. Callers MUST treat `applied:
 * false` as "use the legacy ad-hoc rule".
 *
 * Flag-on path: returns the new effective K_H, which the caller splices into
 * its own `DesensitisationState`. The bridge itself never mutates state.
 */
export function computeLyapunovKH(opts: BridgeInputs): BridgeResult {
  const enabled = opts.enabled ?? readLyapunovEnabledFlag(opts.settingsPath);
  if (!enabled) {
    return { applied: false };
  }

  const { state, block, dose, observedRate, teachingDeclaredRate, nowMs } = opts;

  const tractabilityGain = resolveTractabilityGain(
    opts.tractability,
    opts.tractabilityConfidence,
  );

  const ageMs = Math.max(0, nowMs - state.lastUpdateTs);
  const regressor = buildRegressor({
    doseMagnitude: dose,
    ageMs,
    tauMs: opts.tauMs ?? DEFAULT_RECENCY_TAU_MS,
  });

  const stepSize = opts.stepSize !== undefined && Number.isFinite(opts.stepSize)
    ? Math.max(0, opts.stepSize)
    : ageMs / 1000;

  const floorRatio = opts.floorRatio !== undefined && Number.isFinite(opts.floorRatio)
    ? Math.max(0, opts.floorRatio)
    : 1;

  const adaptation = adaptKH({
    currentKH: state.effectiveK_H,
    targetKH: block.K_H,
    observedRate,
    teachingDeclaredRate,
    regressor,
    tractabilityGain,
    stepSize,
    gainG: opts.gainG ?? DEFAULT_GAIN_G,
    gainGamma: opts.gainGamma ?? DEFAULT_GAIN_GAMMA,
    floor: block.K_L * floorRatio,
    ceiling: block.K_H,
  });

  return {
    applied: true,
    newEffectiveKH: adaptation.newKH,
    adaptation,
    tractabilityGain,
  };
}

/**
 * Convenience: apply the Lyapunov update in-place on an existing
 * `DesensitisationState`. The state is mutated only when the flag is on AND
 * the update is applied. Returns the same `BridgeResult` as `computeLyapunovKH`.
 *
 * This helper is exposed for integration callers who already hold a mutable
 * state reference and want a single-call update path; the pure
 * `computeLyapunovKH` remains the primary entry point.
 */
export function applyLyapunovKHInPlace(
  state: DesensitisationState,
  opts: Omit<BridgeInputs, 'state'>,
): BridgeResult {
  const result = computeLyapunovKH({ ...opts, state });
  if (result.applied && result.newEffectiveKH !== undefined) {
    state.effectiveK_H = result.newEffectiveKH;
    state.lastUpdateTs = opts.nowMs;
  }
  return result;
}
