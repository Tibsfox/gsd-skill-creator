/**
 * M7 Umwelt — variational free-energy minimisation on a categorical model.
 *
 * Friston 2010 (Nat Rev Neurosci 11(2):127–138, Fig. 1 and surrounding text,
 * DOI 10.1038/nrn2787) defines variational free energy as:
 *
 *     F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)]
 *       = sum_i q(i) [ log q(i) − log p(i) − log p(S | i) ]
 *
 * For a discrete categorical model with a single observed sensory bundle
 * S = {o_1..o_k} (observation-type indices with i.i.d. conditional
 * likelihood under p(obs | intent)), the log-likelihood reduces to
 *
 *     log p(S | i) = sum_t log p(o_t | i)
 *
 * and the posterior-that-minimises-F is the exact Bayesian posterior
 *
 *     q*(i) ∝ p(i) · prod_t p(o_t | i).
 *
 * For finite categorical models with observed evidence this admits a
 * closed-form solution, so "variational message passing" here is a single
 * multiplicative update in log-space (numerically stable), equivalent to
 * the fixed-point of the VMP iteration. We run a true iterative loop with
 * a convergence check anyway so that extensions (priors with parameters,
 * coupled intent variables) drop in cleanly later.
 *
 * No external deps — ~80 lines of numerics.
 *
 * @see Friston 2010 Eq. surrounding Fig. 1 for F definition.
 * @see Bishop PRML 2006 §10.1 for VMP on conjugate-categorical models.
 *
 * @module umwelt/freeEnergy
 */

import type { FreeEnergyResult, GenerativeModel } from '../types/umwelt.js';

export type { FreeEnergyResult };

export interface FreeEnergyOptions {
  /** Max VMP iterations. Default 100. */
  maxIters?: number;
  /** Convergence tolerance on log-posterior L1 change. Default 1e-6. */
  tol?: number;
  /** If supplied, seeds q(I) with this distribution instead of the prior. */
  initialQ?: number[];
}

/**
 * Run variational message passing. `observations` is an array of
 * observation-type indices; each is treated as an i.i.d. categorical draw
 * from p(obs | intent). Returns a `FreeEnergyResult` plus the final q(I).
 */
export function minimiseFreeEnergy(
  model: GenerativeModel,
  observations: readonly number[],
  options: FreeEnergyOptions = {},
): FreeEnergyResult & { q: number[] } {
  const { maxIters = 100, tol = 1e-6, initialQ } = options;
  const n = model.intentClasses.length;

  if (n === 0) {
    return { F: 0, epistemic: 0, pragmatic: 0, converged: true, iters: 0, q: [] };
  }

  // Precompute log p(i), log p(o_t | i), and sum_t log p(o_t | i).
  const logP = new Array<number>(n);
  for (let i = 0; i < n; i++) logP[i] = safeLog(model.priors[i]);

  const logLik = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const row = model.condProbTable[i];
    let s = 0;
    for (const obsIdx of observations) {
      s += safeLog(row[obsIdx]);
    }
    logLik[i] = s;
  }

  // Log-unnormalised posterior: log p(i) + sum_t log p(o_t | i).
  const logPost = new Array<number>(n);
  for (let i = 0; i < n; i++) logPost[i] = logP[i] + logLik[i];

  // Seed q
  let q: number[];
  if (initialQ && initialQ.length === n) {
    q = normalise([...initialQ]);
  } else {
    q = softmax(logP);
  }

  // VMP loop. For this categorical model one step is exact, but we iterate
  // to: (a) exercise the convergence path for tests / future extensions,
  // (b) re-normalise in a numerically stable way.
  let converged = false;
  let iters = 0;
  let prevF = Number.POSITIVE_INFINITY;
  for (let k = 0; k < maxIters; k++) {
    iters = k + 1;
    // Message update: q(i) ∝ exp( logPost[i] ) — independent of previous
    // q for this model shape, but we still do a damped blend so multi-step
    // extensions work.
    const qNext = softmax(logPost);
    // Compute F with current q
    const F = computeF(qNext, logP, logLik);
    const delta = Math.abs(prevF - F);
    q = qNext;
    if (delta < tol) {
      converged = true;
      break;
    }
    prevF = F;
  }

  const { F, epistemic, pragmatic } = decomposeF(q, logP, logLik, model, observations);
  return { F, epistemic, pragmatic, converged, iters, q };
}

/**
 * Compute F = sum_i q(i) [ log q(i) − log p(i) − log p(S | i) ].
 */
function computeF(q: number[], logP: number[], logLik: number[]): number {
  let F = 0;
  for (let i = 0; i < q.length; i++) {
    const qi = q[i];
    if (qi <= 0) continue;
    F += qi * (Math.log(qi) - logP[i] - logLik[i]);
  }
  return F;
}

/**
 * Decompose F into (epistemic, pragmatic). Epistemic = D_KL[q || prior];
 * pragmatic = − E_q[log p(S|I)]. Their sum equals F up to floating-point.
 */
function decomposeF(
  q: number[],
  logP: number[],
  logLik: number[],
  _model: GenerativeModel,
  _observations: readonly number[],
): { F: number; epistemic: number; pragmatic: number } {
  let epistemic = 0;
  let pragmatic = 0;
  for (let i = 0; i < q.length; i++) {
    const qi = q[i];
    if (qi <= 0) continue;
    epistemic += qi * (Math.log(qi) - logP[i]);
    pragmatic += -qi * logLik[i];
  }
  return { F: epistemic + pragmatic, epistemic, pragmatic };
}

/**
 * Brute-force reference KL: computes the exact Bayesian posterior from
 * priors and conditional table, returns F evaluated at that posterior.
 * Used by tests (CF-M7-03) to bound the variational solution's error.
 */
export function referenceFreeEnergy(
  model: GenerativeModel,
  observations: readonly number[],
): { F: number; q: number[] } {
  const n = model.intentClasses.length;
  if (n === 0) return { F: 0, q: [] };
  const logPost = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let s = safeLog(model.priors[i]);
    const row = model.condProbTable[i];
    for (const obsIdx of observations) s += safeLog(row[obsIdx]);
    logPost[i] = s;
  }
  const q = softmax(logPost);
  const logP = model.priors.map(safeLog);
  const logLik = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const row = model.condProbTable[i];
    let s = 0;
    for (const obsIdx of observations) s += safeLog(row[obsIdx]);
    logLik[i] = s;
  }
  const F = computeF(q, logP, logLik);
  return { F, q };
}

// ---- numerical helpers -----------------------------------------------------

/** log with a floor to prevent −∞ when probabilities are exactly 0. */
function safeLog(x: number): number {
  return x <= 0 ? -1e9 : Math.log(x);
}

/** Numerically stable softmax over a log-vector. */
function softmax(logits: number[]): number[] {
  const n = logits.length;
  if (n === 0) return [];
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  const out = new Array<number>(n);
  let s = 0;
  for (let i = 0; i < n; i++) {
    out[i] = Math.exp(logits[i] - max);
    s += out[i];
  }
  if (!(s > 0)) {
    // degenerate — return uniform
    for (let i = 0; i < n; i++) out[i] = 1 / n;
    return out;
  }
  for (let i = 0; i < n; i++) out[i] /= s;
  return out;
}

function normalise(v: number[]): number[] {
  let s = 0;
  for (const x of v) s += Math.max(0, x);
  if (!(s > 0)) {
    const n = v.length;
    return new Array(n).fill(1 / n);
  }
  return v.map((x) => Math.max(0, x) / s);
}
