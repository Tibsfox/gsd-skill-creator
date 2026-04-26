/**
 * v1.49.579 — Bayesian sequential A/B harness — shared types.
 *
 * 1-D Beta-Bernoulli conjugate world. Skill quality θ ∈ (0, 1) modeled as
 * Beta(α, β); per-trial outcomes are Bernoulli(θ). The conjugate update
 * gives a closed-form posterior, and the IPM-BOED design selector
 * (`src/bayes-ab/ipm-boed.ts`) uses Wasserstein-1 of posterior-vs-prior
 * samples to rank candidate experiment designs.
 *
 * No runtime code in this module — only types + barrel export from
 * `src/bayes-ab/index.ts`.
 *
 * @module bayes-ab/types
 */

/** Beta(α, β) distribution shape, with α, β > 0. */
export interface BetaPrior {
  /** Shape α (pseudo-count of successes; must be > 0). */
  alpha: number;
  /** Shape β (pseudo-count of failures; must be > 0). */
  beta: number;
}

/** Aggregated outcome from a Bernoulli stream — N = successes + failures trials. */
export interface BernoulliOutcome {
  /** Number of trials with y = 1. */
  successes: number;
  /** Number of trials with y = 0. */
  failures: number;
}

/**
 * An experiment design `d`. The `payload` is opaque to the harness — callers
 * use it to carry whatever structure their `modelSamples` callback needs to
 * realise the data-generating model `p(y | d, θ)`.
 *
 * Example payload shapes:
 *   - sample-size choice: `{ payload: number }`
 *   - allocation split: `{ payload: { ratioA: number; ratioB: number } }`
 *   - rubric variant: `{ payload: { rubricId: string } }`
 */
export interface ExperimentDesign<P = unknown> {
  /** Human-readable identifier (e.g. 'n=200', 'split-50-50'). */
  label: string;
  /** Caller-defined design descriptor consumed by `modelSamples`. */
  payload: P;
}

/** Monte-Carlo precision knobs for the IPM-BOED outer loop. */
export interface MonteCarloDraws {
  /** Number of θ samples drawn from the prior per design (default 32). */
  theta: number;
  /** Number of posterior samples per (design, θ) pair (default 64). */
  post: number;
  /** Number of prior samples paired with the posterior samples (default 64). */
  prior: number;
}

/** Default Monte-Carlo draws — moderate precision suitable for tests + production. */
export const DEFAULT_DRAWS: MonteCarloDraws = {
  theta: 32,
  post: 64,
  prior: 64,
};

/**
 * Seedable uniform-[0,1) PRNG. The harness never calls `Math.random()`
 * directly — every randomness path threads through a `SeedableRng` so tests
 * are deterministic with a fixed seed.
 */
export interface SeedableRng {
  /** Next uniform draw in [0, 1). */
  next(): number;
}

/** Configuration for `runBayesAB` (the sequential loop in coordinator.ts). */
export interface BayesABConfig {
  /** Monte-Carlo precision overrides for the design selector (defaults applied otherwise). */
  draws?: Partial<MonteCarloDraws>;

  /** RNG override (defaults to mulberry32 with seed 0). */
  rng?: SeedableRng;

  /**
   * Optional anytime-valid stopping rule (passed through to the JP-002
   * `src/orchestration/anytime-gate.ts` factory). When absent, the loop
   * runs until `maxRounds`.
   */
  anytimeStop?: {
    /** Type-I error level for the e-process (default 0.05). */
    alpha?: number;
    /** One-sided ('posterior-shifted-up') or two-sided ('posterior-shifted'). Default 'one-sided'. */
    hypothesis?: 'one-sided' | 'two-sided';
  };

  /** Maximum number of rounds the sequential loop will run (default 50). */
  maxRounds?: number;
}
