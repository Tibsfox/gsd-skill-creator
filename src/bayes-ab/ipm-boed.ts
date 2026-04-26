/**
 * v1.49.579 W2 — IPM-BOED design selector (the real algorithm).
 *
 * Anchor: arXiv:2604.21849 — "Beyond Expected Information Gain: IPM-based
 * Bayesian Optimal Experimental Design" (2026), §3 (the IPM-BOED objective).
 *
 * For each candidate design `d` and a Beta prior, this module computes
 *
 *     U_W(d) = E_{θ~prior, y~p(y|d,θ)} [ W1(p(θ|y,d), p(θ)) ]
 *
 * via Monte-Carlo and returns the design with the highest expected
 * Wasserstein-1 posterior-vs-prior shift. The estimate is unbiased (modulo
 * Monte-Carlo variance) and has no hand-picked constants — only Monte-Carlo
 * draw counts (precision, not bias).
 *
 * The data-generating model `p(y | d, θ)` is supplied by the caller as a
 * `modelSamples: (d, θ) => number[]` callback. The function returns 0/1
 * Bernoulli draws (one outcome per trial). The conjugate posterior is
 * computed in closed form via `posteriorBeta` (W1).
 *
 * No global `Math.random` is consumed by this module. All randomness threads
 * through a `SeedableRng` for deterministic tests.
 *
 * @module bayes-ab/ipm-boed
 */

import { wasserstein1d } from '../ab-harness/wasserstein-boed.js';
import { posteriorBeta, summariseOutcomes } from './conjugate.js';
import {
  DEFAULT_DRAWS,
  type BetaPrior,
  type ExperimentDesign,
  type MonteCarloDraws,
  type SeedableRng,
} from './types.js';

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PerDesignScore {
  label: string;
  score: number;
}

export interface IpmBoedResult<P> {
  /** The chosen design (argmax_d score). */
  design: ExperimentDesign<P>;
  /** Monte-Carlo estimate of E_y[W1(posterior, prior)] for the chosen design. */
  score: number;
  /** Per-design scores in the input order — useful for diagnostics. */
  perDesign: PerDesignScore[];
}

export interface SelectIpmBoedOptions<P> {
  /** Beta prior for θ. */
  prior: BetaPrior;

  /** Candidate experiment designs. Must be non-empty. */
  designs: ExperimentDesign<P>[];

  /**
   * Caller-supplied data-generating model: returns one Bernoulli stream
   * (0/1 values) for the given design under the given θ. The conjugate
   * posterior is computed from the tally of this stream — so the length
   * of the returned array IS the experiment's per-design sample size.
   */
  modelSamples: (design: ExperimentDesign<P>, theta: number) => number[];

  /** Monte-Carlo precision overrides (defaults to DEFAULT_DRAWS). */
  draws?: Partial<MonteCarloDraws>;

  /** Seedable RNG (defaults to mulberry32 with seed 0). */
  rng?: SeedableRng;
}

/**
 * Select the design maximising the IPM-BOED Wasserstein-1 utility.
 *
 * Single-design call returns the sole design without consuming Monte-Carlo
 * draws (deterministic shortcut for trivial inputs).
 */
export function selectIpmBoedDesign<P>(opts: SelectIpmBoedOptions<P>): IpmBoedResult<P> {
  if (opts.designs.length === 0) {
    throw new RangeError('selectIpmBoedDesign: designs must be non-empty');
  }

  // Single-design shortcut: skip the BOED loop entirely.
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
  const rng: SeedableRng = opts.rng ?? mulberry32(0);

  // Pre-sample the prior once: every design's score is W1 against a
  // common prior-sample bag, so the reference is stable across designs
  // (Monte-Carlo variance still applies to the posterior side, but the
  // prior-side noise cancels in pairwise comparisons).
  const priorSamples = sampleBetas(opts.prior, draws.prior, rng);

  const perDesign: PerDesignScore[] = [];
  for (const d of opts.designs) {
    let total = 0;
    for (let i = 0; i < draws.theta; i++) {
      const theta = sampleBeta(opts.prior, rng);
      const outcomes = opts.modelSamples(d, theta);
      const summary = summariseOutcomes(outcomes);
      const posterior = posteriorBeta(opts.prior, summary);
      const postSamples = sampleBetas(posterior, draws.post, rng);
      total += wasserstein1d({ samples: postSamples }, { samples: priorSamples });
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

// ─── Beta sampler ────────────────────────────────────────────────────────────

/**
 * Sample one draw from Beta(α, β) via two Gamma draws:
 *   X ~ Gamma(α, 1), Y ~ Gamma(β, 1) ⇒ X / (X + Y) ~ Beta(α, β)
 *
 * The Gamma sampler is Marsaglia–Tsang (2000) "A Simple Method for
 * Generating Gamma Variables" with the Best (1978) boost for α < 1
 * (sample Gamma(α + 1) and multiply by U^(1/α)).
 */
export function sampleBeta(b: BetaPrior, rng: SeedableRng): number {
  const x = sampleGamma(b.alpha, rng);
  const y = sampleGamma(b.beta, rng);
  return x / (x + y);
}

/** Convenience: vector of n Beta samples. */
export function sampleBetas(b: BetaPrior, n: number, rng: SeedableRng): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = sampleBeta(b, rng);
  return out;
}

/**
 * Sample one Gamma(shape, scale=1) draw. Marsaglia–Tsang (2000) for
 * shape ≥ 1; Best (1978) boost for shape < 1.
 */
function sampleGamma(shape: number, rng: SeedableRng): number {
  if (shape <= 0) {
    throw new RangeError(`sampleGamma: shape must be > 0 (got ${shape})`);
  }
  if (shape < 1) {
    // Best 1978: Y ~ Gamma(shape + 1), U ~ Uniform(0,1) ⇒ Y * U^(1/shape) ~ Gamma(shape).
    const y = sampleGamma(shape + 1, rng);
    const u = rng.next();
    return y * Math.pow(u, 1 / shape);
  }
  // Marsaglia–Tsang shape ≥ 1.
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    // Generate v = (1 + c*x)^3 with x ~ N(0, 1) until v > 0.
    do {
      x = standardNormal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng.next();
    const x2 = x * x;
    // Squeeze test (cheap accept).
    if (u < 1 - 0.0331 * x2 * x2) return d * v;
    // Full test (expensive accept/reject).
    if (Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Standard normal via Box-Muller, single draw (discards the second). */
function standardNormal(rng: SeedableRng): number {
  // Avoid u1 = 0 to keep log finite.
  let u1 = rng.next();
  if (u1 < 1e-300) u1 = 1e-300;
  const u2 = rng.next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Seedable PRNG ───────────────────────────────────────────────────────────

/**
 * mulberry32 — fast, well-distributed seedable PRNG (32-bit state, period 2^32).
 * Reference: github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 *
 * Returns uniform [0, 1) draws. Same seed ⇒ same sequence forever.
 */
export function mulberry32(seed: number): SeedableRng {
  let s = seed >>> 0;
  return {
    next(): number {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
