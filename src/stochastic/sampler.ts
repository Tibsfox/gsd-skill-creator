/**
 * MA-3 + MD-2 — Stochastic Score Sampler.
 *
 * `sampleByScore` takes an array of scores and a temperature, computes the
 * softmax probability distribution, and samples one index proportionally.
 *
 * The `rng` parameter is injectable for deterministic testing (seeded RNG).
 * When omitted, defaults to `Math.random`. The seeding strategy for the
 * default RNG is the caller's responsibility; in tests, pass a seeded
 * Mulberry32 instance for reproducibility (SC-MA3-01).
 *
 * At T=0, the sampler returns argmax deterministically (CF-MA3-01).
 *
 * @module stochastic/sampler
 */

import { softmax, TEMPERATURE_EPSILON } from './softmax.js';

/** Result of a stochastic sample call. */
export interface SampleResult {
  /** Chosen index into the scores array. */
  index: number;
  /** The score at the chosen index. */
  score: number;
  /** The softmax probability assigned to the chosen index. */
  probability: number;
}

/**
 * Seeded PRNG — Mulberry32 algorithm.
 *
 * Returns a factory that produces a new RNG function from a 32-bit seed.
 * Identical to the implementation in `src/graph/leiden.ts`.
 *
 * @param seed  32-bit unsigned integer seed.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function (): number {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sample one index from a score array using softmax-weighted probability.
 *
 * @param scores       Raw score values. Non-empty.
 * @param temperature  Boltzmann temperature T. At T ≤ 1e-9 → deterministic argmax.
 * @param rng          Optional RNG factory returning values in [0, 1).
 *                     Defaults to `Math.random`. Supply a seeded function for
 *                     reproducible tests.
 * @returns  `{ index, score, probability }` for the selected candidate.
 * @throws   RangeError if scores is empty.
 */
export function sampleByScore(
  scores: readonly number[],
  temperature: number,
  rng: () => number = Math.random,
): SampleResult {
  if (scores.length === 0) {
    throw new RangeError('sampleByScore: scores array must not be empty');
  }

  const probs = softmax(scores, temperature);

  // At T=0 or single-element, the softmax already returns a one-hot vector.
  // Deterministic path: return the hot index directly (CF-MA3-01).
  if (temperature <= TEMPERATURE_EPSILON || scores.length === 1) {
    const idx = probs.indexOf(1);
    const chosen = idx >= 0 ? idx : 0;
    return { index: chosen, score: scores[chosen], probability: probs[chosen] };
  }

  // CDF walk — linear scan over cumulative probabilities.
  const u = rng();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (u < cumulative) {
      return { index: i, score: scores[i], probability: probs[i] };
    }
  }

  // Numerical roundoff safety: return last index.
  const last = probs.length - 1;
  return { index: last, score: scores[last], probability: probs[last] };
}
