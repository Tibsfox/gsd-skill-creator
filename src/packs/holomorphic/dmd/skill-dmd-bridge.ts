/**
 * Skill-DMD Bridge — Maps DMD results to SkillDynamics
 *
 * Bridges the gap between data-driven DMD analysis and the
 * skill-creator's dynamical model. The dominant DMD eigenvalue
 * determines the skill's fixed-point classification, and DMD
 * modes/growth rates populate the extended dynamics structure.
 *
 * The bridge enables: run DMD on skill activation history →
 * get SkillDynamicsExtended → use existing skill-dynamics
 * classification (attracting/repelling/indifferent) for
 * promotion decisions, bounded learning enforcement, etc.
 */

import type {
  ComplexNumber,
  SkillDynamics,
  SkillPosition,
  FixedPointClassification,
} from '../types.js';
import type { DMDResult, DMDEigenvalueClassification } from './types.js';
import { magnitude, argument } from '../complex/arithmetic.js';
import { classifyDMDEigenvalue } from './dmd-core.js';

/**
 * Extended SkillDynamics with DMD mode information.
 *
 * Augments the base SkillDynamics with the full DMD decomposition:
 * modes, eigenvalues, growth rates, frequencies, and the index
 * of the dominant mode driving the skill's behavior.
 */
export interface SkillDynamicsExtended extends SkillDynamics {
  /** Dynamic modes from DMD (each mode is a vector of complex numbers) */
  dmdModes: ComplexNumber[][];
  /** Eigenvalues of the DMD operator */
  dmdEigenvalues: ComplexNumber[];
  /** Growth rates: Re(log(lambda)) for each mode */
  dmdGrowthRates: number[];
  /** Frequencies: Im(log(lambda)) for each mode */
  dmdFrequencies: number[];
  /** Index of the dominant mode (largest amplitude * magnitude) */
  dominantMode: number;
}

/**
 * Bridge a DMD result to SkillDynamicsExtended.
 *
 * The dominant eigenvalue determines the skill's fixed-point
 * classification and convergence behavior. Growth rates from DMD
 * map to the convergence rate, and eigenvalue position determines
 * Fatou/Julia classification.
 *
 * @param position - Skill position on the complex plane
 * @param dmdResult - DMD decomposition of the skill's activation history
 * @returns Extended skill dynamics populated from DMD analysis
 */
export function bridgeDMDToSkillDynamics(
  position: SkillPosition,
  dmdResult: DMDResult,
): SkillDynamicsExtended {
  const { modes, eigenvalues, amplitudes, frequencies, growthRates } = dmdResult;

  // Find dominant mode (largest |amplitude| * |eigenvalue|)
  let dominantIdx = 0;
  let maxWeight = 0;
  for (let i = 0; i < eigenvalues.length; i++) {
    const ampMag = magnitude(amplitudes[i]);
    const eigMag = magnitude(eigenvalues[i]);
    const weight = ampMag * eigMag;
    if (weight > maxWeight) {
      maxWeight = weight;
      dominantIdx = i;
    }
  }

  // Map dominant eigenvalue to fixed-point classification
  const dominantEig = eigenvalues.length > 0
    ? eigenvalues[dominantIdx]
    : { re: 0, im: 0 };

  const dmdClass = classifyDMDEigenvalue(dominantEig);
  const classification = dmdClassToFixedPoint(dmdClass);

  // Multiplier is the dominant eigenvalue
  const multiplier = dominantEig;

  // Fatou domain: attracting/neutral eigenvalues indicate Fatou
  // (stable behavior), repelling indicate Julia boundary
  const fatouDomain = magnitude(dominantEig) <= 1.01;

  // Convergence rate from dominant growth rate
  const convergenceRate = growthRates.length > 0
    ? growthRates[dominantIdx]
    : 0;

  // Build iteration history from eigenvalue evolution
  // (synthetic: reconstruct dominant mode trajectory)
  const iterationHistory: ComplexNumber[] = [];
  if (eigenvalues.length > 0) {
    for (let t = 0; t < 10; t++) {
      const mag_t = Math.exp(growthRates[dominantIdx] * t);
      const arg_t = frequencies[dominantIdx] * t;
      iterationHistory.push({
        re: mag_t * Math.cos(arg_t),
        im: mag_t * Math.sin(arg_t),
      });
    }
  }

  return {
    position,
    multiplier,
    classification,
    fatouDomain,
    iterationHistory,
    convergenceRate,
    dmdModes: modes,
    dmdEigenvalues: eigenvalues,
    dmdGrowthRates: growthRates,
    dmdFrequencies: frequencies,
    dominantMode: dominantIdx,
  };
}

/**
 * Map DMD eigenvalue classification to fixed-point classification.
 *
 * DMD classification is based on magnitude and oscillation;
 * fixed-point classification adds the holomorphic dynamics
 * distinction between rational and irrational indifference.
 *
 * Mapping:
 * - attracting / oscillating_decay → 'attracting'
 * - repelling / oscillating_growth → 'repelling'
 * - neutral → 'rationally_indifferent' (periodic behavior)
 */
function dmdClassToFixedPoint(
  dmdClass: DMDEigenvalueClassification,
): FixedPointClassification {
  switch (dmdClass) {
    case 'attracting':
    case 'oscillating_decay':
      return 'attracting';
    case 'repelling':
    case 'oscillating_growth':
      return 'repelling';
    case 'neutral':
      return 'rationally_indifferent';
  }
}
