/**
 * v1.49.580 W3 — Multivariate IPM-BOED design selector.
 *
 * Multivariate analog of `selectIpmBoedDesign` from
 * `src/bayes-ab/ipm-boed.ts` (v1.49.579 W2). Same paired-θ + Monte-Carlo
 * structure; replace Beta with Dirichlet, replace `wasserstein1d` with
 * `slicedWasserstein`.
 *
 * Anchor: arXiv:2604.21849 §3 (the IPM-BOED objective). The 1-D case is
 * the K=2 specialisation of this multivariate case (Dirichlet([α, β]) ↔
 * Beta(α, β); slicedWasserstein in d=1 reduces to wasserstein1d).
 *
 * @module bayes-ab/ipm-boed-mv
 */

import { posteriorDirichlet, sampleDirichlet, summariseMultinomial } from './dirichlet.js';
import { slicedWasserstein, type MvEmpiricalDistribution } from './sliced-wasserstein.js';
import { mulberry32 } from './ipm-boed.js';
import {
  DEFAULT_DRAWS,
  type MonteCarloDraws,
  type SeedableRng,
} from './types.js';
import type { DirichletPrior, MvExperimentDesign } from './mv-types.js';

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PerDesignScoreMv {
  label: string;
  score: number;
}

export interface IpmBoedMvResult<P> {
  /** The chosen design (argmax_d score). */
  design: MvExperimentDesign<P>;
  /** Monte-Carlo estimate of E_y[SW(posterior, prior)] for the chosen design. */
  score: number;
  /** Per-design scores in the input order. */
  perDesign: PerDesignScoreMv[];
}

export interface SelectIpmBoedMvOptions<P> {
  /** Dirichlet prior over θ ∈ Δ^(K-1). */
  prior: DirichletPrior;

  /** Candidate experiment designs. Must be non-empty. */
  designs: MvExperimentDesign<P>[];

  /**
   * Caller-supplied data-generating model: returns one Categorical stream
   * (category indices in 0..K-1) for the given design under the given θ.
   * The conjugate posterior is computed from the tally of this stream.
   */
  mvModelSamples: (design: MvExperimentDesign<P>, theta: number[]) => number[];

  /** Monte-Carlo precision overrides (defaults to DEFAULT_DRAWS). */
  draws?: Partial<MonteCarloDraws>;

  /** Number of SW projection directions per inner iteration. Default 64. */
  projections?: number;

  /** Seedable RNG (defaults to mulberry32(0)). */
  rng?: SeedableRng;
}

const DEFAULT_PROJECTIONS = 64;

/**
 * Select the design maximising the multivariate IPM-BOED utility.
 *
 * Single-design call returns the sole design without consuming Monte-Carlo
 * draws (deterministic shortcut).
 */
export function selectIpmBoedDesignMv<P>(opts: SelectIpmBoedMvOptions<P>): IpmBoedMvResult<P> {
  if (opts.designs.length === 0) {
    throw new RangeError('selectIpmBoedDesignMv: designs must be non-empty');
  }

  if (opts.designs.length === 1) {
    return {
      design: opts.designs[0],
      score: 0,
      perDesign: [{ label: opts.designs[0].label, score: 0 }],
    };
  }

  const draws: MonteCarloDraws = {
    theta: opts.draws?.theta ?? DEFAULT_DRAWS.theta,
    post: opts.draws?.post ?? DEFAULT_DRAWS.post,
    prior: opts.draws?.prior ?? DEFAULT_DRAWS.prior,
  };
  const projections = opts.projections ?? DEFAULT_PROJECTIONS;
  const rng: SeedableRng = opts.rng ?? mulberry32(0);
  const K = opts.prior.alphas.length;

  // Pre-sample the prior once: shared reference across designs.
  const priorSamples: MvEmpiricalDistribution = {
    samples: Array.from({ length: draws.prior }, () => sampleDirichlet(opts.prior, rng)),
  };

  // Pre-sample θ values ONCE (paired across designs for variance reduction).
  // Same trick as the 1-D selector — without this, Monte-Carlo noise across
  // designs would dominate the actual information-gain difference.
  const thetaSamples = Array.from({ length: draws.theta }, () =>
    sampleDirichlet(opts.prior, rng),
  );

  const perDesign: PerDesignScoreMv[] = [];
  for (const d of opts.designs) {
    let total = 0;
    for (const theta of thetaSamples) {
      const outcomes = opts.mvModelSamples(d, theta);
      const summary = summariseMultinomial(outcomes, K);
      const posterior = posteriorDirichlet(opts.prior, summary);
      const postSamples: MvEmpiricalDistribution = {
        samples: Array.from({ length: draws.post }, () => sampleDirichlet(posterior, rng)),
      };
      total += slicedWasserstein(postSamples, priorSamples, { projections, rng });
    }
    const score = total / draws.theta;
    perDesign.push({ label: d.label, score });
  }

  // Pick argmax — break ties by input order (stable).
  let bestIdx = 0;
  for (let i = 1; i < perDesign.length; i++) {
    if (perDesign[i].score > perDesign[bestIdx].score) bestIdx = i;
  }

  return {
    design: opts.designs[bestIdx],
    score: perDesign[bestIdx].score,
    perDesign,
  };
}
