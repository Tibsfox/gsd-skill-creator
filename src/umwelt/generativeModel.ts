/**
 * M7 Umwelt — categorical generative model.
 *
 * Tiny categorical graphical model over (intent class × observation type).
 * p(obs | intent) stored as a row-stochastic `condProbTable`; `priors` holds
 * p(intent). The model is updated online by counting co-occurrences of
 * (intent, observation) and renormalising with Laplace (add-α) smoothing.
 *
 * This module exposes a `GenerativeModelInitialiser` interface so that M1
 * (community-structure extractor, Phase 640.1) can populate the intent
 * classes from the actual semantic-memory graph once it lands. Until then,
 * `makeUniformModel` is sufficient for unit tests and early bootstrap.
 *
 * No external numerical deps — textbook categorical updates implemented in
 * ~150 lines of TS.
 *
 * @module umwelt/generativeModel
 */

import type { GenerativeModel } from '../types/umwelt.js';

export type { GenerativeModel };

/**
 * Pluggable initialiser. M1 will provide an implementation that reads
 * community structure from the semantic-memory graph; for bootstrap we
 * ship `UniformInitialiser` which returns uniform priors and a uniform
 * row-stochastic table.
 */
export interface GenerativeModelInitialiser {
  init(
    intentClasses: readonly string[],
    observationTypes: readonly string[],
  ): GenerativeModel;
}

/**
 * Default initialiser: uniform priors, uniform row-stochastic conditional
 * table. Corresponds to a maximally-uncertain prior before any sensory
 * evidence is accumulated.
 */
export class UniformInitialiser implements GenerativeModelInitialiser {
  init(
    intentClasses: readonly string[],
    observationTypes: readonly string[],
  ): GenerativeModel {
    return makeUniformModel(intentClasses, observationTypes);
  }
}

/**
 * Build a uniform categorical model. Rows sum to exactly 1 (modulo
 * floating-point); priors sum to exactly 1.
 */
export function makeUniformModel(
  intentClasses: readonly string[],
  observationTypes: readonly string[],
): GenerativeModel {
  const n = intentClasses.length;
  const m = observationTypes.length;
  const pObs = m === 0 ? 0 : 1 / m;
  const pIntent = n === 0 ? 0 : 1 / n;
  const condProbTable: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = new Array(m);
    for (let j = 0; j < m; j++) row[j] = pObs;
    condProbTable.push(row);
  }
  const priors: number[] = new Array(n);
  for (let i = 0; i < n; i++) priors[i] = pIntent;
  return { intentClasses: [...intentClasses], condProbTable, priors };
}

/**
 * Counts bookkeeping for online updates. Kept separate from the
 * `GenerativeModel` itself so that callers can inspect / serialise either
 * the raw counts or the smoothed probability view independently.
 */
export interface ModelCounts {
  /** intentCounts[i] — number of times intent class i observed */
  intentCounts: number[];
  /** coCounts[i][j] — number of (intent i, observation j) pairs seen */
  coCounts: number[][];
  /** Laplace smoothing constant, applied to every numerator. */
  alpha: number;
  /** Cached axis sizes for quick validation. */
  n: number;
  m: number;
  observationTypes: string[];
}

/**
 * Initialise empty counts for an `n × m` model. `alpha > 0` guarantees that
 * every smoothed probability is strictly positive (so the model can never
 * rule out an observation — prevents log-zero blowups in the free-energy
 * loop).
 */
export function makeCounts(
  intentClasses: readonly string[],
  observationTypes: readonly string[],
  alpha: number = 1,
): ModelCounts {
  const n = intentClasses.length;
  const m = observationTypes.length;
  const intentCounts = new Array(n).fill(0);
  const coCounts: number[][] = [];
  for (let i = 0; i < n; i++) coCounts.push(new Array(m).fill(0));
  return {
    intentCounts,
    coCounts,
    alpha,
    n,
    m,
    observationTypes: [...observationTypes],
  };
}

/**
 * Online update: observe (intent, observation) pair and bump counts.
 * Returns the counts object (mutated in place) for chaining.
 */
export function observe(
  counts: ModelCounts,
  intentIdx: number,
  observationIdx: number,
): ModelCounts {
  if (intentIdx < 0 || intentIdx >= counts.n) {
    throw new RangeError(`intentIdx ${intentIdx} out of range [0, ${counts.n})`);
  }
  if (observationIdx < 0 || observationIdx >= counts.m) {
    throw new RangeError(
      `observationIdx ${observationIdx} out of range [0, ${counts.m})`,
    );
  }
  counts.intentCounts[intentIdx]++;
  counts.coCounts[intentIdx][observationIdx]++;
  return counts;
}

/**
 * Render current counts as a smoothed `GenerativeModel`. Each row:
 *
 *     p(obs_j | intent_i) = (coCounts[i][j] + α) / (sum_k coCounts[i][k] + m·α)
 *
 * Priors:
 *
 *     p(intent_i) = (intentCounts[i] + α) / (sum_k intentCounts[k] + n·α)
 */
export function materialiseModel(
  intentClasses: readonly string[],
  counts: ModelCounts,
): GenerativeModel {
  const { n, m, alpha } = counts;
  const condProbTable: number[][] = [];
  for (let i = 0; i < n; i++) {
    const rowSum = counts.coCounts[i].reduce((s, v) => s + v, 0) + m * alpha;
    const row: number[] = new Array(m);
    for (let j = 0; j < m; j++) {
      row[j] = (counts.coCounts[i][j] + alpha) / rowSum;
    }
    condProbTable.push(row);
  }
  const intentSum = counts.intentCounts.reduce((s, v) => s + v, 0) + n * alpha;
  const priors: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    priors[i] = (counts.intentCounts[i] + alpha) / intentSum;
  }
  return { intentClasses: [...intentClasses], condProbTable, priors };
}

/**
 * Validate that a `GenerativeModel` has consistent shape and that its rows
 * are row-stochastic (sum to 1 within `eps`). Priors also checked. Throws
 * on failure; otherwise returns `model` unchanged for fluent usage.
 */
export function validateModel(
  model: GenerativeModel,
  eps: number = 1e-9,
): GenerativeModel {
  const n = model.intentClasses.length;
  if (model.condProbTable.length !== n) {
    throw new Error(
      `condProbTable row count ${model.condProbTable.length} != intentClasses.length ${n}`,
    );
  }
  if (model.priors.length !== n) {
    throw new Error(`priors length ${model.priors.length} != intentClasses.length ${n}`);
  }
  if (n === 0) return model;
  const m = model.condProbTable[0].length;
  for (let i = 0; i < n; i++) {
    if (model.condProbTable[i].length !== m) {
      throw new Error(`condProbTable row ${i} has inconsistent length`);
    }
    let s = 0;
    for (let j = 0; j < m; j++) {
      const v = model.condProbTable[i][j];
      if (!(v >= 0) || !Number.isFinite(v)) {
        throw new Error(`condProbTable[${i}][${j}] is not a finite non-negative: ${v}`);
      }
      s += v;
    }
    if (Math.abs(s - 1) > eps) {
      throw new Error(`condProbTable row ${i} sums to ${s}, not 1`);
    }
  }
  let pSum = 0;
  for (let i = 0; i < n; i++) {
    if (!(model.priors[i] >= 0) || !Number.isFinite(model.priors[i])) {
      throw new Error(`priors[${i}] is not a finite non-negative: ${model.priors[i]}`);
    }
    pSum += model.priors[i];
  }
  if (Math.abs(pSum - 1) > eps) {
    throw new Error(`priors sum to ${pSum}, not 1`);
  }
  return model;
}
