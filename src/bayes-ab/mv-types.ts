/**
 * v1.49.580 — Bayesian sequential A/B harness — multivariate types.
 *
 * Multivariate-parameter extension to the v1.49.579 1-D type surface in
 * `src/bayes-ab/types.ts`. The conjugate prior here is Dirichlet (the
 * natural extension of Beta to >1-D); the likelihood is Categorical /
 * Multinomial (the natural extension of Bernoulli to K categories).
 *
 * Same conventions: pure data, no logic. Functions land in W1+
 * (`dirichlet.ts`, `sliced-wasserstein.ts`, `ipm-boed-mv.ts`,
 * `coordinator-mv.ts`); this barrel currently re-exports the W0 type
 * surface only.
 *
 * @module bayes-ab/mv-types
 */

/**
 * Dirichlet(α_1, ..., α_K) prior shape with all α_i > 0.
 * Length K = number of categories.
 */
export interface DirichletPrior {
  /** Concentration parameters, all > 0. */
  alphas: number[];
}

/**
 * Aggregated outcome from a Categorical / Multinomial stream.
 * Length K = number of categories.
 */
export interface MultinomialOutcome {
  /** Per-category counts, all ≥ 0. */
  counts: number[];
}

/**
 * Multivariate experiment design — opaque caller payload, same shape as
 * the 1-D `ExperimentDesign<P>` from `src/bayes-ab/types.ts`.
 */
export interface MvExperimentDesign<P = unknown> {
  /** Human-readable identifier. */
  label: string;
  /** Caller-defined design descriptor. */
  payload: P;
}
