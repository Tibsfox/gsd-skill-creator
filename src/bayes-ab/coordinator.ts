/**
 * v1.49.579 W3 — Sequential Bayesian A/B harness — coordinator.
 *
 * Bayesian sibling of `src/ab-harness/coordinator.ts::runAB`. Each round:
 *   1. pick the next experiment design via the W2 IPM-BOED selector
 *   2. execute it via a caller-supplied runSkill callback
 *   3. conjugate-update the posterior (W1)
 *   4. feed a bounded posterior-shift metric into the JP-002 anytime-valid
 *      e-process from src/orchestration/anytime-gate.ts; stop when the gate
 *      rejects (Type-I error bound holds at any sample size)
 *
 * Reuses the v1.49.578 JP-002 primitive directly — does NOT reimplement an
 * e-process inside src/bayes-ab/.
 *
 * @module bayes-ab/coordinator
 */

import { anytimeGate } from '../orchestration/anytime-gate.js';
import { selectIpmBoedDesign } from './ipm-boed.js';
import { posteriorBeta, summariseOutcomes, betaMean } from './conjugate.js';
import type {
  BayesABConfig,
  BernoulliOutcome,
  BetaPrior,
  ExperimentDesign,
  MonteCarloDraws,
  SeedableRng,
} from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoundRecord {
  /** 1-based round index. */
  round: number;
  /** Label of the design picked by selectIpmBoedDesign this round. */
  designLabel: string;
  /** Tally of the outcomes from runSkill this round. */
  summary: BernoulliOutcome;
  /** Posterior after this round's conjugate update. */
  posterior: BetaPrior;
}

export interface RunBayesABResult {
  /** Posterior after the final round (or after the gate fired). */
  posterior: BetaPrior;
  /** Per-round history. */
  history: RoundRecord[];
  /**
   * Why the loop exited:
   *   - 'anytime'   — the JP-002 gate rejected
   *   - 'max-rounds' — ran maxRounds and never rejected
   */
  exitReason: 'anytime' | 'max-rounds';
}

export type RunBayesABOptions<P> = BayesABConfig & {
  /** Initial Beta prior for θ. */
  prior: BetaPrior;
  /** Candidate designs offered to the IPM-BOED selector each round. */
  designs: ExperimentDesign<P>[];
  /**
   * Hypothetical model used by the IPM-BOED selector to score designs.
   * Same shape as `selectIpmBoedDesign.modelSamples`. The selector calls
   * this with sampled θ values from the current posterior to estimate
   * each design's expected information yield.
   */
  modelSamples: (design: ExperimentDesign<P>, theta: number) => number[];
  /**
   * Real experiment runner — supplies the actual outcomes for the chosen
   * design at each round. Returns a 0/1 stream (one entry per trial).
   * The summarised tally feeds the conjugate posterior update.
   */
  runSkill: (design: ExperimentDesign<P>, round: number) => Promise<number[]>;
};

// ─── scaledPosteriorShift ────────────────────────────────────────────────────

/**
 * Bounded posterior-shift metric in [-1, 1] for the JP-002 e-process.
 *
 * Returns 2× the difference of posterior and prior means, clipped to
 * [-1, 1]:
 *
 *   metric = clip(2 · (betaMean(posterior) − betaMean(prior)), -1, +1)
 *
 * The 2× scale matters: at the JP-002 default Hoeffding parameter λ=0.5,
 * the per-step log-e-value is `λ·x − λ²/2`. The unscaled difference x is
 * bounded by `min(priorMean, 1 − priorMean)` ≤ 0.5; for a Beta(1,1)
 * uniform prior the maximum is exactly 0.5, putting the e-process at its
 * breakeven point (0.5·0.5 − 0.125 = 0). Doubling the metric gives the
 * gate non-trivial accumulation under H₁ while still respecting the
 * Hoeffding-bound's [-1, 1] support requirement.
 *
 * Under H₀ (posterior mean = prior mean), the metric is exactly zero;
 * under H₁ it accumulates positive (or, two-sided, signed) evidence. Sign
 * convention: positive ⇒ posterior mean has shifted *upward* from the
 * prior mean (more "successful skill" evidence).
 */
export function scaledPosteriorShift(posterior: BetaPrior, prior: BetaPrior): number {
  const raw = 2 * (betaMean(posterior) - betaMean(prior));
  if (raw > 1) return 1;
  if (raw < -1) return -1;
  return raw;
}

// ─── runBayesAB ──────────────────────────────────────────────────────────────

const DEFAULT_MAX_ROUNDS = 50;

/**
 * Run a sequential Bayesian A/B harness with optional anytime-valid stop.
 *
 * Picks a design via IPM-BOED, runs the experiment, conjugate-updates the
 * posterior, peeks at a bounded posterior-shift metric through a JP-002
 * e-process, and stops when the e-process rejects (or runs out of rounds).
 */
export async function runBayesAB<P>(opts: RunBayesABOptions<P>): Promise<RunBayesABResult> {
  const maxRounds = opts.maxRounds ?? DEFAULT_MAX_ROUNDS;
  if (maxRounds < 1) {
    throw new RangeError(`runBayesAB: maxRounds must be ≥ 1 (got ${maxRounds})`);
  }

  const draws: Partial<MonteCarloDraws> | undefined = opts.draws;
  const rng: SeedableRng | undefined = opts.rng;
  const gate = opts.anytimeStop
    ? anytimeGate.create({
        alpha: opts.anytimeStop.alpha ?? 0.05,
        hypothesis: opts.anytimeStop.hypothesis ?? 'one-sided',
      })
    : null;

  const prior = opts.prior;
  let posterior = prior;
  const history: RoundRecord[] = [];
  let exitReason: RunBayesABResult['exitReason'] = 'max-rounds';

  for (let round = 1; round <= maxRounds; round++) {
    const pick = selectIpmBoedDesign({
      prior: posterior,
      designs: opts.designs,
      modelSamples: opts.modelSamples,
      draws,
      rng,
    });
    const outcomes = await opts.runSkill(pick.design, round);
    const summary = summariseOutcomes(outcomes);
    posterior = posteriorBeta(posterior, summary);
    history.push({
      round,
      designLabel: pick.design.label,
      summary,
      posterior,
    });
    if (gate) {
      const metric = scaledPosteriorShift(posterior, prior);
      const r = gate.evaluate(metric);
      if (r.rejected) {
        exitReason = 'anytime';
        break;
      }
    }
  }

  return { posterior, history, exitReason };
}
