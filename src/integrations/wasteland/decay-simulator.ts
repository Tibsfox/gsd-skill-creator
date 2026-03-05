/**
 * Trust Decay Mechanics Simulator — Wasteland Federation
 *
 * Models how trust/reputation decays over time for rigs in the federation.
 * Supports three decay curves and separate parameters for human vs agent rigs.
 *
 * All functions are pure (no I/O).
 */

import type { ConfidenceDecayConfig } from './types.js';

// ============================================================================
// Types
// ============================================================================

export type RigType = 'human' | 'agent';
export type DecayCurveType = 'linear' | 'exponential' | 'step';

export interface DecayInput {
  /** Current trust level, 0..1 */
  currentTrustLevel: number;
  /** Days the rig has been inactive */
  daysInactive: number;
  /** Type of rig — drives default decay parameters */
  rigType: RigType;
  /** Optional override for decay config; merged with rig-type defaults */
  config?: Partial<ConfidenceDecayConfig>;
}

export interface CurveProjection {
  curveType: DecayCurveType;
  /** Projected trust level 30 days from now */
  at30Days: number;
  /** Projected trust level 60 days from now */
  at60Days: number;
  /** Projected trust level 90 days from now */
  at90Days: number;
}

export interface DecaySimulationResult {
  input: DecayInput;
  /** Projections for all three curves */
  curves: Record<DecayCurveType, CurveProjection>;
  /** Recommended curve for this rig type */
  recommendedCurve: DecayCurveType;
}

// ============================================================================
// Default configs per rig type
// ============================================================================

/**
 * Human rigs engage in discrete patterns — slower decay, higher floor.
 */
const HUMAN_DEFAULTS: ConfidenceDecayConfig = {
  decayStartDays: 14,
  decayRatePerWeek: 0.05,
  minimumConfidence: 0.2,
};

/**
 * Agent rigs are expected to be consistently active — faster decay, lower floor.
 */
const AGENT_DEFAULTS: ConfidenceDecayConfig = {
  decayStartDays: 7,
  decayRatePerWeek: 0.15,
  minimumConfidence: 0.05,
};

function resolveConfig(
  rigType: RigType,
  override?: Partial<ConfidenceDecayConfig>,
): ConfidenceDecayConfig {
  const defaults = rigType === 'human' ? HUMAN_DEFAULTS : AGENT_DEFAULTS;
  return { ...defaults, ...override };
}

// ============================================================================
// Decay curves
// ============================================================================

/**
 * Linear decay: trust decreases at a constant rate per day after decay starts.
 *
 * formula: trust - (ratePerDay * daysDecaying)
 */
export function linearDecay(
  currentTrust: number,
  daysInactive: number,
  config: ConfidenceDecayConfig,
): number {
  if (daysInactive <= config.decayStartDays) return currentTrust;

  const daysDecaying = daysInactive - config.decayStartDays;
  const ratePerDay = config.decayRatePerWeek / 7;
  const decayed = currentTrust - ratePerDay * daysDecaying;

  return Math.max(config.minimumConfidence, decayed);
}

/**
 * Exponential decay: trust decreases by a fixed percentage each week after decay starts.
 *
 * formula: trust * (1 - ratePerWeek) ^ weeksDecaying
 */
export function exponentialDecay(
  currentTrust: number,
  daysInactive: number,
  config: ConfidenceDecayConfig,
): number {
  if (daysInactive <= config.decayStartDays) return currentTrust;

  const weeksDecaying = (daysInactive - config.decayStartDays) / 7;
  const decayFactor = Math.pow(1 - config.decayRatePerWeek, weeksDecaying);
  const decayed = currentTrust * decayFactor;

  return Math.max(config.minimumConfidence, decayed);
}

/**
 * Step-function decay: trust drops at discrete inactivity thresholds.
 *
 * Thresholds are measured from decayStartDays:
 *   - 0–30 days past start → drop to 90%
 *   - 30–60 days past start → drop to 70%
 *   - 60+ days past start  → drop to 40%
 */
export function stepDecay(
  currentTrust: number,
  daysInactive: number,
  config: ConfidenceDecayConfig,
): number {
  const daysPastStart = daysInactive - config.decayStartDays;

  if (daysPastStart <= 0) return currentTrust;

  let factor: number;
  if (daysPastStart > 60) {
    factor = 0.4;
  } else if (daysPastStart > 30) {
    factor = 0.7;
  } else {
    factor = 0.9;
  }

  return Math.max(config.minimumConfidence, currentTrust * factor);
}

// ============================================================================
// Projection helper
// ============================================================================

function projectAt(
  curve: DecayCurveType,
  currentTrust: number,
  currentDaysInactive: number,
  futureDays: number,
  config: ConfidenceDecayConfig,
): number {
  const totalDays = currentDaysInactive + futureDays;
  switch (curve) {
    case 'linear':      return linearDecay(currentTrust, totalDays, config);
    case 'exponential': return exponentialDecay(currentTrust, totalDays, config);
    case 'step':        return stepDecay(currentTrust, totalDays, config);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Simulate all three decay curves and return a comparison.
 *
 * Projections are at 30/60/90 days from now, added to current daysInactive.
 */
export function simulateDecay(input: DecayInput): DecaySimulationResult {
  const config = resolveConfig(input.rigType, input.config);
  const curveTypes: DecayCurveType[] = ['linear', 'exponential', 'step'];

  const curves = {} as Record<DecayCurveType, CurveProjection>;
  for (const curve of curveTypes) {
    curves[curve] = {
      curveType: curve,
      at30Days: projectAt(curve, input.currentTrustLevel, input.daysInactive, 30, config),
      at60Days: projectAt(curve, input.currentTrustLevel, input.daysInactive, 60, config),
      at90Days: projectAt(curve, input.currentTrustLevel, input.daysInactive, 90, config),
    };
  }

  return {
    input,
    curves,
    recommendedCurve: recommendDecayCurve(input.rigType),
  };
}

/**
 * Recommend the best decay curve based on rig type.
 *
 * - agent → exponential: continuous activity expected; gradual degradation
 * - human → step: discrete engagement patterns; threshold-based drops
 */
export function recommendDecayCurve(rigType: RigType): DecayCurveType {
  return rigType === 'agent' ? 'exponential' : 'step';
}
