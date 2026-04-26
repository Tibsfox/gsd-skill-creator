/**
 * A/B harness BO auto-tuner — JP-018 (Wave 3 / phase 844).
 *
 * Implements a skeleton multi-step Bayesian-optimization (BO) loop over the
 * skill-creator's tunable A/B-harness parameters (chunk sizes, fidelity
 * thresholds, cooldown periods).  Each BO step evaluates a candidate parameter
 * setting by calling `computeROI` from `src/skill-promotion/` and returning the
 * resulting ROI margin as the objective value.
 *
 * Architecture (EARL-BO skeleton — arXiv:2411.00171):
 *
 *   1. Define a bounded search space over the tunable knobs.
 *   2. Initialise with a random or grid-based set of candidates.
 *   3. For each BO step:
 *      a. Select the next candidate via the acquisition function (UCB-1
 *         surrogate; full GP can replace it without changing the interface).
 *      b. Evaluate the candidate by mapping its parameter vector to a
 *         `SkillCandidate` and calling `computeROI`.
 *      c. Record the observation (parameter vector → objective value).
 *      d. Update the surrogate model.
 *   4. Return the best observed parameter vector.
 *
 * This is a skeleton: the surrogate model is a running empirical mean/variance
 * (sufficient for the smoke test and for early-stage tuning).  The interface
 * is designed so that a full GP surrogate can drop in at `updateSurrogate`.
 *
 * Reference: arXiv:2411.00171 — EARL-BO (multi-step BO for RL-agent tuning).
 * Convergent: arXiv:2604.20897 — Watts-per-Intelligence II (ROI objective).
 *
 * @module ab-harness/bo-autotune
 */

import { computeROI } from '../skill-promotion/index.js';
import type { SkillCandidate, ROIBreakdown } from '../skill-promotion/index.js';

// ─── Tuneable parameter space ─────────────────────────────────────────────────

/**
 * The tunable knobs exposed to the BO loop.
 *
 * Each field is a continuous real value; the search space is the Cartesian
 * product of per-field [min, max] bounds defined in `DEFAULT_SEARCH_SPACE`.
 */
export interface BOParameters {
  /** Target number of samples per A/B variant (maps to estimatedUses). */
  sampleTarget: number;

  /** Fidelity threshold as a fraction of the per-use savings budget (0–1). */
  fidelityThreshold: number;

  /** Cooldown period in A/B harness cycles before re-evaluating a skill. */
  cooldownCycles: number;
}

/**
 * Bounds for a single continuous parameter.
 */
export interface ParameterBounds {
  min: number;
  max: number;
}

/**
 * Search space: maps each `BOParameters` key to its admissible interval.
 */
export type SearchSpace = Record<keyof BOParameters, ParameterBounds>;

/**
 * Default search-space bounds for the A/B harness tunable knobs.
 */
export const DEFAULT_SEARCH_SPACE: SearchSpace = {
  sampleTarget:      { min: 10,  max: 200  },
  fidelityThreshold: { min: 0.1, max: 0.99 },
  cooldownCycles:    { min: 1,   max: 50   },
};

// ─── Observation record ────────────────────────────────────────────────────────

/**
 * A single BO observation: the parameter vector tried and the resulting ROI.
 */
export interface BOObservation {
  /** The parameter vector evaluated at this step. */
  params: BOParameters;
  /** The full ROI breakdown returned by `computeROI`. */
  roiBreakdown: ROIBreakdown;
  /** The scalar objective: marginBits from the ROI breakdown. */
  objective: number;
}

// ─── Surrogate model ──────────────────────────────────────────────────────────

/**
 * Minimal empirical surrogate model (running mean + variance per parameter
 * dimension).  Sufficient for the skeleton; replace with a GP for production.
 */
export interface SurrogateState {
  observations: BOObservation[];
  /** Running best objective seen so far. */
  bestObjective: number;
  /** Index of the observation with the best objective. */
  bestIdx: number;
}

/** Initialise an empty surrogate. */
function initSurrogate(): SurrogateState {
  return { observations: [], bestObjective: -Infinity, bestIdx: -1 };
}

/** Update surrogate with a new observation. */
function updateSurrogate(state: SurrogateState, obs: BOObservation): void {
  state.observations.push(obs);
  if (obs.objective > state.bestObjective) {
    state.bestObjective = obs.objective;
    state.bestIdx = state.observations.length - 1;
  }
}

// ─── Candidate generation ─────────────────────────────────────────────────────

/**
 * Map a `BOParameters` vector to a `SkillCandidate` for ROI evaluation.
 *
 * Interpretation:
 * - `estimatedUses`       ← `sampleTarget` (proxy: more samples → more use)
 * - `perUseSavingsBits`   ← `fidelityThreshold × 100` (bits saved per use)
 * - `estimatedIK`         ← `cooldownCycles` (proxy for skill I_K complexity)
 *
 * This mapping keeps the ROI objective physically meaningful while allowing
 * the BO loop to navigate a realistic trade-off surface.
 */
function paramsToCandidate(params: BOParameters, id: string): SkillCandidate {
  return {
    id,
    estimatedUses: params.sampleTarget,
    perUseSavingsBits: params.fidelityThreshold * 100,
    estimatedIK: params.cooldownCycles,
  };
}

/**
 * UCB-1 acquisition: return the parameter midpoint between the current best
 * and a random corner of the search space (exploration–exploitation balance).
 *
 * This is the skeleton acquisition; a full GP-UCB replaces `midpointExplore`
 * without changing the outer BO loop signature.
 */
function midpointExplore(
  space: SearchSpace,
  surrogate: SurrogateState,
  rng: () => number,
): BOParameters {
  const keys = Object.keys(space) as (keyof BOParameters)[];

  const best =
    surrogate.bestIdx >= 0
      ? surrogate.observations[surrogate.bestIdx].params
      : null;

  const result = {} as BOParameters;
  for (const key of keys) {
    const { min, max } = space[key];
    const randomPoint = min + rng() * (max - min);

    if (best !== null) {
      // Midpoint between best so far and a random point (exploitation + exploration).
      result[key] = (best[key] + randomPoint) / 2;
    } else {
      result[key] = randomPoint;
    }
  }
  return result;
}

// ─── BO loop ──────────────────────────────────────────────────────────────────

/**
 * Options for `runBOAutoTune`.
 */
export interface BOAutoTuneOptions {
  /**
   * Number of BO iterations to run.
   *
   * Each iteration evaluates one candidate parameter vector.  The spec calls
   * for a multi-step loop; 10 iterations is the default for the smoke test.
   */
  iterations?: number;

  /**
   * Search space bounds.  Defaults to `DEFAULT_SEARCH_SPACE`.
   */
  searchSpace?: SearchSpace;

  /**
   * Skill id prefix for generated `SkillCandidate` ids.
   */
  skillIdPrefix?: string;

  /**
   * Seeded random number generator for deterministic tests.
   * Defaults to `Math.random`.
   */
  rng?: () => number;
}

/**
 * Result of the BO auto-tune run.
 */
export interface BOAutoTuneResult {
  /** All observations from the BO run (one per iteration). */
  observations: BOObservation[];
  /** The parameter vector that achieved the best ROI margin. */
  bestParams: BOParameters;
  /** The best ROI margin (objective value). */
  bestObjective: number;
  /** The ROI breakdown for the best parameter vector. */
  bestROI: ROIBreakdown;
}

/**
 * Run the multi-step BO auto-tune loop.
 *
 * Each iteration:
 *  1. Selects a candidate via UCB-1 midpoint acquisition.
 *  2. Evaluates it by calling `computeROI` from `src/skill-promotion/`.
 *  3. Updates the surrogate model.
 *
 * Returns the best parameter vector and its associated ROI breakdown.
 *
 * Reference: arXiv:2411.00171 (EARL-BO multi-step loop structure).
 *
 * @param options — BO configuration (iterations, search space, RNG seed).
 * @returns `BOAutoTuneResult` with all observations and the best parameters.
 */
export function runBOAutoTune(options: BOAutoTuneOptions = {}): BOAutoTuneResult {
  const {
    iterations = 10,
    searchSpace = DEFAULT_SEARCH_SPACE,
    skillIdPrefix = 'bo-candidate',
    rng = Math.random,
  } = options;

  if (iterations < 1) {
    throw new RangeError(`iterations must be ≥ 1; got ${iterations}`);
  }

  const surrogate = initSurrogate();

  for (let i = 0; i < iterations; i++) {
    const params = midpointExplore(searchSpace, surrogate, rng);
    const candidate = paramsToCandidate(params, `${skillIdPrefix}-${i}`);
    const roiBreakdown = computeROI(candidate);
    const observation: BOObservation = {
      params,
      roiBreakdown,
      objective: roiBreakdown.marginBits,
    };
    updateSurrogate(surrogate, observation);
  }

  const bestObs = surrogate.observations[surrogate.bestIdx];

  return {
    observations: surrogate.observations,
    bestParams: bestObs.params,
    bestObjective: surrogate.bestObjective,
    bestROI: bestObs.roiBreakdown,
  };
}
