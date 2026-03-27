/**
 * Extended Dynamic Mode Decomposition (EDMD) — Koopman Operator Approximation
 *
 * EDMD approximates the infinite-dimensional Koopman operator by lifting
 * state vectors into a higher-dimensional space of observables (the
 * dictionary), then applying standard DMD to the lifted data.
 *
 * Algorithm:
 * 1. Choose a dictionary of observable functions psi_1, ..., psi_p
 * 2. Evaluate each dictionary function on every state snapshot
 * 3. Form lifted snapshot matrix Psi = [psi(x_1), psi(x_2), ...]
 * 4. Apply standard DMD to Psi to get approximate Koopman eigenvalues/modes
 */

import type { KoopmanObservable, DMDResult, SnapshotMatrix } from './types.js';
import { dmd } from './dmd-core.js';

/**
 * Configuration for Extended DMD.
 */
export interface EDMDConfig {
  /** Dictionary of observable functions for lifting */
  dictionary: KoopmanObservable[];
  /** Optional SVD truncation rank */
  rank?: number;
}

/**
 * Lift state vectors into observable space using dictionary functions.
 *
 * Each state vector [x_1, x_2, ...] is mapped to a vector of observable
 * evaluations [psi_1(x), psi_2(x), ..., psi_p(x)].
 *
 * @param states - Array of state vectors (each entry is a state at one time)
 * @param dictionary - Array of observable functions
 * @returns Lifted data: each entry is [psi_1(x), psi_2(x), ...]
 */
export function liftDictionary(
  states: number[][],
  dictionary: KoopmanObservable[],
): number[][] {
  return states.map(state => dictionary.map(obs => obs.evaluate(state)));
}

/**
 * Extended Dynamic Mode Decomposition.
 *
 * Approximates the Koopman operator by:
 * 1. Lifting state data into observable space via the dictionary
 * 2. Applying standard DMD to the lifted snapshot matrix
 *
 * The resulting eigenvalues approximate Koopman eigenvalues; modes
 * are expressed in the dictionary coordinate system.
 *
 * @param states - Array of state vectors (time series of measurements)
 * @param config - EDMD configuration with dictionary and optional rank
 * @returns DMDResult from the lifted space (Koopman approximation)
 */
export function edmd(
  states: number[][],
  config: EDMDConfig,
): DMDResult {
  const { dictionary, rank } = config;

  if (states.length < 2 || dictionary.length === 0) {
    return {
      modes: [],
      eigenvalues: [],
      amplitudes: [],
      frequencies: [],
      growthRates: [],
      svdRank: 0,
      residual: 0,
    };
  }

  // Step 1: Lift state vectors to observable space
  const lifted = liftDictionary(states, dictionary);

  // Step 2: Form SnapshotMatrix from lifted data
  // Each entry in lifted is a "column" in the lifted space
  const snapshots: SnapshotMatrix = {
    data: lifted,
    timestamps: Array.from({ length: lifted.length }, (_, i) => i),
    labels: Array.from({ length: lifted.length }, (_, i) => `t${i}`),
  };

  // Step 3: Apply standard DMD to the lifted snapshots
  return dmd(snapshots, rank);
}
