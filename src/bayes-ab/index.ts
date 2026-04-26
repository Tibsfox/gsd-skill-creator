/**
 * v1.49.579 — Bayesian sequential A/B harness — barrel export.
 *
 * Public surface for the `src/bayes-ab/` subsystem. Functions land in W1+
 * (`conjugate.ts`, `ipm-boed.ts`, `coordinator.ts`); this barrel currently
 * re-exports the W0 type surface only.
 *
 * @module bayes-ab
 */

export type {
  BetaPrior,
  BernoulliOutcome,
  ExperimentDesign,
  MonteCarloDraws,
  SeedableRng,
  BayesABConfig,
} from './types.js';

export { DEFAULT_DRAWS } from './types.js';

// v1.49.580 — multivariate type surface.
export type {
  DirichletPrior,
  MultinomialOutcome,
  MvExperimentDesign,
} from './mv-types.js';
