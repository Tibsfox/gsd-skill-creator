/**
 * v1.49.580 W4 — Multivariate sequential Bayesian A/B harness.
 *
 * Multivariate analog of `runBayesAB` from `src/bayes-ab/coordinator.ts`
 * (v1.49.579 W3). Each round: pick design via the W3 IPM-BOED selector,
 * execute via caller-supplied runSkill, conjugate-update Dirichlet
 * posterior, peek at a bounded posterior-shift metric through the
 * JP-002 anytime-valid e-process. Stops when the gate rejects (Type-I
 * error bound holds at any sample size) or when maxRounds is hit.
 *
 * Reuses the v1.49.578 JP-002 primitive directly via
 * `src/orchestration/anytime-gate.ts` — same pattern as the 1-D coordinator.
 *
 * @module bayes-ab/coordinator-mv
 */

import { anytimeGate } from '../orchestration/anytime-gate.js';
import { selectIpmBoedDesignMv } from './ipm-boed-mv.js';
import { posteriorDirichlet, summariseMultinomial, dirichletMean } from './dirichlet.js';
import type {
  BayesABConfig,
  MonteCarloDraws,
  SeedableRng,
} from './types.js';
import type { DirichletPrior, MvExperimentDesign, MultinomialOutcome } from './mv-types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoundRecordMv {
  /** 1-based round index. */
  round: number;
  /** Label of the design picked by selectIpmBoedDesignMv this round. */
  designLabel: string;
  /** Tally of outcomes from runSkill this round. */
  summary: MultinomialOutcome;
  /** Posterior after this round's conjugate update. */
  posterior: DirichletPrior;
}

export interface RunBayesABMvResult {
  /** Posterior after the final round (or after the gate fired). */
  posterior: DirichletPrior;
  /** Per-round history. */
  history: RoundRecordMv[];
  /**
   * Why the loop exited:
   *   - 'anytime'   — the JP-002 gate rejected
   *   - 'max-rounds' — ran maxRounds and never rejected
   */
  exitReason: 'anytime' | 'max-rounds';
}

export type RunBayesABMvOptions<P> = BayesABConfig & {
  /** Initial Dirichlet prior for θ. */
  prior: DirichletPrior;
  /** Candidate designs offered to the IPM-BOED selector each round. */
  designs: MvExperimentDesign<P>[];
  /**
   * Hypothetical model used by the IPM-BOED selector to score designs.
   * Same shape as `selectIpmBoedDesignMv.mvModelSamples`.
   */
  mvModelSamples: (design: MvExperimentDesign<P>, theta: number[]) => number[];
  /**
   * Real experiment runner — supplies the actual outcomes for the chosen
   * design at each round. Returns a category-index stream (0..K-1).
   */
  runSkill: (design: MvExperimentDesign<P>, round: number) => Promise<number[]>;
  /** SW projection count used by the selector each round. Default 64. */
  projections?: number;
};

// ─── mvScaledPosteriorShift ──────────────────────────────────────────────────

/**
 * Bounded posterior-shift metric in [-1, 1] for the JP-002 e-process,
 * multivariate edition.
 *
 * Returns the L1 distance between posterior and prior mean vectors,
 * scaled by 2/K and clipped to [-1, 1]:
 *
 *   raw    = (2 / K) · Σ_k |posteriorMean_k - priorMean_k|
 *   metric = min(raw, 1)
 *
 * The 2/K scale matters: for K-class Dirichlet with uniform prior and
 * extreme-corner posterior (concentrated on one category), the L1 distance
 * is `2 (K - 1) / K` ≤ 2; the 2/K scale puts the worst case at
 * `4(K-1)/K²`, well inside [-1, 1] for any K. For K=2 (the 1-D
 * specialisation) this reduces to the same behaviour as the 1-D
 * `scaledPosteriorShift` from src/bayes-ab/coordinator.ts.
 *
 * Sign convention: shift magnitude only (always ≥ 0). The e-process
 * 'one-sided' hypothesis variant treats positive shifts as evidence
 * against H_0 (no shift); 'two-sided' is symmetric.
 */
export function mvScaledPosteriorShift(posterior: DirichletPrior, prior: DirichletPrior): number {
  if (posterior.alphas.length !== prior.alphas.length) {
    throw new RangeError(
      `mvScaledPosteriorShift: dimension mismatch (posterior K=${posterior.alphas.length}, prior K=${prior.alphas.length})`,
    );
  }
  const K = posterior.alphas.length;
  if (K === 0) return 0;
  const postMean = dirichletMean(posterior);
  const priorMean = dirichletMean(prior);
  let l1 = 0;
  for (let i = 0; i < K; i++) l1 += Math.abs(postMean[i] - priorMean[i]);
  const raw = (2 / K) * l1;
  if (raw > 1) return 1;
  return raw;
}

// ─── runBayesABMv ────────────────────────────────────────────────────────────

const DEFAULT_MAX_ROUNDS = 50;

/**
 * Run a multivariate sequential Bayesian A/B harness with optional
 * anytime-valid stop.
 */
export async function runBayesABMv<P>(opts: RunBayesABMvOptions<P>): Promise<RunBayesABMvResult> {
  const maxRounds = opts.maxRounds ?? DEFAULT_MAX_ROUNDS;
  if (maxRounds < 1) {
    throw new RangeError(`runBayesABMv: maxRounds must be ≥ 1 (got ${maxRounds})`);
  }

  const draws: Partial<MonteCarloDraws> | undefined = opts.draws;
  const rng: SeedableRng | undefined = opts.rng;
  const projections = opts.projections;
  const gate = opts.anytimeStop
    ? anytimeGate.create({
        alpha: opts.anytimeStop.alpha ?? 0.05,
        hypothesis: opts.anytimeStop.hypothesis ?? 'one-sided',
      })
    : null;

  const prior = opts.prior;
  const K = prior.alphas.length;
  let posterior = prior;
  const history: RoundRecordMv[] = [];
  let exitReason: RunBayesABMvResult['exitReason'] = 'max-rounds';

  for (let round = 1; round <= maxRounds; round++) {
    const pick = selectIpmBoedDesignMv({
      prior: posterior,
      designs: opts.designs,
      mvModelSamples: opts.mvModelSamples,
      draws,
      projections,
      rng,
    });
    const outcomes = await opts.runSkill(pick.design, round);
    const summary = summariseMultinomial(outcomes, K);
    posterior = posteriorDirichlet(posterior, summary);
    history.push({
      round,
      designLabel: pick.design.label,
      summary,
      posterior,
    });
    if (gate) {
      const metric = mvScaledPosteriorShift(posterior, prior);
      const r = gate.evaluate(metric);
      if (r.rejected) {
        exitReason = 'anytime';
        break;
      }
    }
  }

  return { posterior, history, exitReason };
}
