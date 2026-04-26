/**
 * v1.49.579 W0 — type-shape smoke test for src/bayes-ab/types.ts.
 *
 * Pure type-only module — there are no runtime functions to test. We verify
 * the public surface exists and has the expected shape via a structural
 * sanity check on `DEFAULT_DRAWS` (the one runtime export from W0) and via
 * the import succeeding at all.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DRAWS,
  type BetaPrior,
  type BernoulliOutcome,
  type ExperimentDesign,
  type MonteCarloDraws,
  type SeedableRng,
  type BayesABConfig,
} from '../index.js';

describe('src/bayes-ab/types — public surface', () => {
  it('DEFAULT_DRAWS has the three Monte-Carlo precision knobs', () => {
    expect(DEFAULT_DRAWS).toEqual({ theta: 32, post: 64, prior: 64 });
    // Each value is a positive integer
    expect(Number.isInteger(DEFAULT_DRAWS.theta)).toBe(true);
    expect(DEFAULT_DRAWS.theta).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULT_DRAWS.post)).toBe(true);
    expect(DEFAULT_DRAWS.post).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULT_DRAWS.prior)).toBe(true);
    expect(DEFAULT_DRAWS.prior).toBeGreaterThan(0);
  });

  it('type shapes accept canonical instances', () => {
    // BetaPrior
    const prior: BetaPrior = { alpha: 1, beta: 1 };
    expect(prior.alpha).toBe(1);

    // BernoulliOutcome
    const outcome: BernoulliOutcome = { successes: 5, failures: 3 };
    expect(outcome.successes + outcome.failures).toBe(8);

    // ExperimentDesign with typed payload
    const design: ExperimentDesign<{ n: number }> = {
      label: 'n=10',
      payload: { n: 10 },
    };
    expect(design.payload.n).toBe(10);

    // MonteCarloDraws
    const draws: MonteCarloDraws = { theta: 16, post: 32, prior: 32 };
    expect(draws.theta).toBe(16);

    // SeedableRng — minimal compliant impl
    const rng: SeedableRng = { next: () => 0.5 };
    expect(rng.next()).toBe(0.5);

    // BayesABConfig with all optional fields populated
    const cfg: BayesABConfig = {
      draws: { theta: 8 },
      rng,
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 30,
    };
    expect(cfg.maxRounds).toBe(30);
  });
});
