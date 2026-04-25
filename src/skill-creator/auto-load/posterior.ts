/**
 * HB-07 AEL bandit — Beta-posterior storage + Thompson Sampling.
 *
 * The posterior store is **private to the AelBandit extension**: HB-04
 * deliberately exposes no shared store, and the `posterior-isolation.test.ts`
 * fixture verifies the bandit's posterior cannot be accessed via any HB-04
 * surface.
 *
 * Beta(α, β) updates are conjugate to Bernoulli observations:
 *   - success → α += 1
 *   - failure → β += 1
 * Posterior mean = α / (α + β); concentration grows with α + β.
 *
 * Thompson Sampling: for each arm, draw θ ~ Beta(α, β); pick the arm with
 * the largest sample. The Beta sample is computed via two independent
 * Gamma draws (Marsaglia & Tsang 2000) seeded by the injected PRNG, which
 * makes tests deterministic.
 *
 * @module skill-creator/auto-load/posterior
 */

import type { BetaPosterior, PolicyId } from './types.js';

/** Frozen empty posterior store. */
export const EMPTY_POSTERIORS: Readonly<Record<PolicyId, BetaPosterior>> =
  Object.freeze({});

/** Initialise a posterior with the supplied prior. */
export function makePosterior(alpha = 1, beta = 1): BetaPosterior {
  if (!Number.isFinite(alpha) || alpha <= 0) {
    throw new RangeError(`prior alpha must be > 0; got ${alpha}`);
  }
  if (!Number.isFinite(beta) || beta <= 0) {
    throw new RangeError(`prior beta must be > 0; got ${beta}`);
  }
  return Object.freeze({ alpha, beta });
}

/** Posterior mean = α / (α + β). */
export function posteriorMean(p: BetaPosterior): number {
  return p.alpha / (p.alpha + p.beta);
}

/** Update on a Bernoulli observation; returns a NEW frozen posterior. */
export function updatePosterior(
  p: BetaPosterior,
  reward: 0 | 1,
): BetaPosterior {
  if (reward === 1) return Object.freeze({ alpha: p.alpha + 1, beta: p.beta });
  return Object.freeze({ alpha: p.alpha, beta: p.beta + 1 });
}

/**
 * Update the entire posterior map for a single (policy, reward) pair.
 * Returns a NEW frozen map; input is not mutated.
 */
export function updatePosteriorMap(
  store: Readonly<Record<PolicyId, BetaPosterior>>,
  policy: PolicyId,
  reward: 0 | 1,
  prior: BetaPosterior = makePosterior(),
): Readonly<Record<PolicyId, BetaPosterior>> {
  const current = store[policy] ?? prior;
  const next: Record<PolicyId, BetaPosterior> = { ...store };
  next[policy] = updatePosterior(current, reward);
  return Object.freeze(next);
}

// ───────────── Beta sampling via two Gammas (Marsaglia–Tsang) ─────────────

/**
 * Marsaglia–Tsang (2000) "A Simple Method for Generating Gamma Variables".
 * For α >= 1 this rejection sampler is exact; for α < 1 we use the standard
 * boost: Gamma(α) = Gamma(α + 1) * U^(1/α).
 */
function sampleGamma(shape: number, rand: () => number): number {
  if (shape < 1) {
    const u = rand();
    // Avoid log(0). The injected PRNG should never return exactly 0/1, but
    // guard anyway.
    const safeU = u > 0 ? u : Number.MIN_VALUE;
    return sampleGamma(shape + 1, rand) * Math.pow(safeU, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  // Marsaglia–Tsang loop. Bounded expected iterations < 2.
  while (true) {
    let x: number;
    let v: number;
    // Box–Muller for a normal sample, again from the injected PRNG.
    let u1 = rand();
    let u2 = rand();
    if (u1 <= 0) u1 = Number.MIN_VALUE;
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    x = z;
    v = (1 + c * x) ** 3;
    if (v <= 0) continue;
    const u = rand();
    const x2 = x * x;
    if (u < 1 - 0.0331 * x2 * x2) return d * v;
    if (Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Draw a single Beta(α, β) sample using two Gamma draws. */
export function sampleBeta(
  posterior: BetaPosterior,
  rand: () => number,
): number {
  const x = sampleGamma(posterior.alpha, rand);
  const y = sampleGamma(posterior.beta, rand);
  if (x + y === 0) return 0.5;
  return x / (x + y);
}

/**
 * Thompson Sampling over a posterior store: sample one Beta per arm and
 * return the arm id with the highest sample. Returns `null` if the store
 * is empty.
 */
export function thompsonSelect(
  store: Readonly<Record<PolicyId, BetaPosterior>>,
  arms: ReadonlyArray<PolicyId>,
  rand: () => number,
  prior: BetaPosterior = makePosterior(),
): PolicyId | null {
  if (arms.length === 0) return null;
  let bestArm: PolicyId | null = null;
  let bestSample = -Infinity;
  for (const arm of arms) {
    const post = store[arm] ?? prior;
    const s = sampleBeta(post, rand);
    if (s > bestSample) {
      bestSample = s;
      bestArm = arm;
    }
  }
  return bestArm;
}
