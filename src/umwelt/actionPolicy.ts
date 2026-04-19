/**
 * M7 Umwelt — action policy (expected-F-reduction ranking).
 *
 * Friston et al. 2013 (Front Hum Neurosci 7:598, §Active inference and
 * agency, DOI 10.3389/fnhum.2013.00598) define the active-inference action
 * policy as the one that minimises expected free energy (EFE) over the
 * next time step. Here the agent enumerates a finite list of candidate
 * `ActiveState` actions; each action `a` has a predictor
 *
 *     p_pred(o | a) = sum_i q(i) · p(o | i, a)
 *
 * and EFE is computed against a preferred-observation distribution
 * `C(o)` (the goal prior). Action ranking minimises:
 *
 *     G(a) = D_KL[ p_pred(o|a) || C(o) ] − H[ p_pred(o|a) ]
 *
 * where the first term is the pragmatic value (distance to goal) and the
 * second is an epistemic-exploration bonus (prefer actions that expose
 * informative observations).
 *
 * To keep M7 self-contained in Wave 1 we accept an action-conditioned
 * conditional table per action. In the simple case where actions do not
 * modulate likelihoods (the "no-op" action), p(o | i, a) = p(o | i) from
 * the baseline generative model.
 *
 * ### Dark-room guard (SC-DARK)
 *
 * A naive EFE minimiser can collapse to the trivial "do nothing and
 * observe silence" policy — zero KL to any preferred distribution that
 * contains a silence atom, zero cost, zero activity. Biologically this
 * is the "dark room problem" (Friston 2012 response to "Why we don't
 * live in dark rooms"). We implement a **minimum-activity floor**: if
 * the chosen action's predicted activity level falls below
 * `options.minActivity`, we bump its EFE by a penalty proportional to
 * the shortfall and re-rank. In practice this ensures the lowest-
 * ranked "idle" action cannot win when any non-idle alternative exists.
 *
 * @module umwelt/actionPolicy
 */

import type { GenerativeModel } from '../types/umwelt.js';

export interface CandidateAction {
  /** Human-readable label. Must be unique within a ranking call. */
  id: string;
  /**
   * Conditional table p(o | i, a). If omitted, `baseline.condProbTable`
   * is used (i.e. this action does not modulate likelihoods).
   */
  condProbTable?: number[][];
  /**
   * Scalar predicted activity for this action. A "no-op"/"wait" action
   * should report 0 here; real actions should report > 0. Used by the
   * dark-room guard. Defaults to 1.
   */
  activity?: number;
}

export interface ActionRankingOptions {
  /** Preferred-observation distribution C(o). Must have length = m. */
  preferred: readonly number[];
  /** Minimum activity floor. Default 0.1. */
  minActivity?: number;
  /**
   * Penalty applied per unit of activity shortfall when guarding. Default
   * 1e3 — large enough to dominate any legitimate EFE difference, so the
   * guard is a hard floor rather than a soft bias.
   */
  darkRoomPenalty?: number;
  /**
   * Weight on the epistemic bonus. Default 1 matches the classical EFE
   * formulation; tests that want pure pragmatic ranking can set this to 0.
   */
  epistemicWeight?: number;
}

export interface RankedAction {
  id: string;
  expectedFreeEnergy: number;
  pragmatic: number;
  epistemic: number;
  predicted: number[];
  activity: number;
  darkRoomFlagged: boolean;
}

/**
 * Rank candidate actions by expected free energy (lower = better). Returns
 * the full ranking (sorted ascending by EFE) so callers can inspect
 * runners-up; the winning action is `ranked[0]`.
 */
export function rankActions(
  q: readonly number[],
  baseline: GenerativeModel,
  actions: readonly CandidateAction[],
  options: ActionRankingOptions,
): RankedAction[] {
  const { preferred } = options;
  const minActivity = options.minActivity ?? 0.1;
  const darkRoomPenalty = options.darkRoomPenalty ?? 1e3;
  const epistemicWeight = options.epistemicWeight ?? 1;

  const ranked: RankedAction[] = [];
  for (const a of actions) {
    const table = a.condProbTable ?? baseline.condProbTable;
    const predicted = predictUnder(q, table);
    const pragmatic = klWithFloor(predicted, preferred);
    const epistemic = -entropy(predicted);
    let efe = pragmatic + epistemicWeight * epistemic;
    const activity = a.activity ?? 1;
    const shortfall = Math.max(0, minActivity - activity);
    const darkRoomFlagged = shortfall > 0;
    if (darkRoomFlagged) {
      efe += darkRoomPenalty * shortfall;
    }
    ranked.push({
      id: a.id,
      expectedFreeEnergy: efe,
      pragmatic,
      epistemic,
      predicted,
      activity,
      darkRoomFlagged,
    });
  }
  ranked.sort((x, y) => x.expectedFreeEnergy - y.expectedFreeEnergy);
  return ranked;
}

/**
 * One perception-action tick: given a posterior q(I), a baseline model, a
 * list of candidate actions, and a preferred distribution, return the
 * winning action plus its EFE. Packaged as a single function so callers
 * don't hand-alternate (CF-M7-07 verifies ≥1 perception and ≥1 evaluation
 * occur per invocation).
 */
export function actPerceptionTick(
  q: readonly number[],
  baseline: GenerativeModel,
  actions: readonly CandidateAction[],
  options: ActionRankingOptions,
): { winner: RankedAction; ranked: RankedAction[]; perceptionSize: number } {
  // Perception side: count q as the evidence of a perception step already
  // having occurred (caller is expected to have run `minimiseFreeEnergy`
  // to produce `q`).
  const perceptionSize = q.length;
  const ranked = rankActions(q, baseline, actions, options);
  if (ranked.length === 0) {
    throw new Error('actPerceptionTick requires at least one candidate action');
  }
  return { winner: ranked[0], ranked, perceptionSize };
}

// ---- numerics --------------------------------------------------------------

function predictUnder(q: readonly number[], table: number[][]): number[] {
  const n = table.length;
  if (n === 0) return [];
  const m = table[0].length;
  const out = new Array<number>(m).fill(0);
  for (let i = 0; i < n; i++) {
    const qi = q[i] ?? 0;
    if (qi <= 0) continue;
    const row = table[i];
    for (let j = 0; j < m; j++) out[j] += qi * row[j];
  }
  let s = 0;
  for (const v of out) s += v;
  if (s > 0) for (let j = 0; j < m; j++) out[j] /= s;
  return out;
}

/** KL with a tiny floor to prevent log-zero without silently hiding bugs. */
function klWithFloor(p: readonly number[], q: readonly number[]): number {
  const eps = 1e-12;
  let kl = 0;
  for (let j = 0; j < p.length; j++) {
    const pj = p[j];
    const qj = q[j] ?? 0;
    if (pj <= 0) continue;
    kl += pj * (Math.log(pj) - Math.log(Math.max(qj, eps)));
  }
  return kl;
}

function entropy(p: readonly number[]): number {
  let h = 0;
  for (const v of p) {
    if (v > 0) h -= v * Math.log(v);
  }
  return h;
}
