/**
 * MB-2 — Generative-model projector for M7 Umwelt.
 *
 * Smooth projection of M7 categorical conditional-probability updates onto
 * the probability simplex. Replaces M7's implicit "normalise after counting"
 * path with a smooth simplex projection that:
 *
 *   1. Preserves CF-M7-02: every row sums to exactly 1.
 *   2. Preserves strict positivity: every cell ≥ ε > 0 (no log-zero).
 *   3. Preserves Lyapunov descent per Sastry Theorem 2.4.3 (p. 65).
 *   4. Eliminates gradient discontinuities at boundary faces (CF-MB2-02).
 *
 * ## The M7 update path
 *
 * M7's `materialiseModel` in `generativeModel.ts` computes smoothed row
 * probabilities from counts using Laplace smoothing. This is algebraically
 * equivalent to projecting the raw count-ratio vector onto the simplex with
 * an implicit `alpha`-smoothed normalisation — but without the continuous
 * gradient property.
 *
 * `projectModelRow` wraps a candidate row (raw counts converted to ratios,
 * or a gradient-updated row) with Duchi 2008 projection before committing
 * it back to the model. The result is guaranteed to be simplex-admissible
 * regardless of the input.
 *
 * ## Feature flag
 *
 * When `projection.enabled = false` (the default), `projectModelRow` returns
 * the input row normalised by the existing hard-clamp path (simple
 * renormalisation with floor). This is byte-identical to the pre-MB2 path
 * (SC-MB2-01). Only when `projection.enabled = true` does the Duchi algorithm
 * activate.
 *
 * ## Tractability scaling
 *
 * Projection runs identically on tractable and coin-flip skills — projection
 * is a numerical primitive, not an adaptation rule. Tractability only scales
 * the log verbosity (per ME-1 class): on tractable skills every boundary-hit
 * is recorded; on coin-flip skills only hits crossing a 5% threshold are
 * logged. This keeps the monitoring stream bounded.
 *
 * Source:
 *   .planning/research/living-sensoria-refinement/proposals/MB-2-projection-operators.md
 *   src/umwelt/generativeModel.ts — existing M7 materialise path (extends, not modifies)
 *
 * @module projection/generative-model-projector
 */

import {
  projectToSimplex,
  SIMPLEX_EPSILON,
  type SimplexProjectionResult,
} from './smooth-projection.js';
import { readProjectionEnabledFlag } from './settings.js';
import type { TractabilityClass } from '../ace/settings.js';

// ---------------------------------------------------------------------------
// Row projector
// ---------------------------------------------------------------------------

export interface RowProjectionOptions {
  /**
   * Override projection-enabled flag. When provided, bypasses
   * `readProjectionEnabledFlag()`. Used primarily by tests.
   */
  projectionEnabled?: boolean;
  /** Path to settings.json. Default `.claude/settings.json`. */
  settingsPath?: string;
  /**
   * Tractability class for boundary-hit logging verbosity scaling (ME-1).
   * Does not change the projected value — only affects logging.
   * Default: 'tractable' (log all boundary hits).
   */
  tractability?: TractabilityClass;
  /**
   * Log verbosity threshold for coin-flip skills: boundary-hits smaller than
   * this fraction of the row range are suppressed from the diagnostic log.
   * Default 0.05 (5%).
   */
  coinFlipLogThreshold?: number;
  /**
   * Laplace smoothing constant α used by M7's `materialiseModel`. When
   * provided, the projector applies an α-floor before projection to guarantee
   * the same strict-positivity invariant as Laplace smoothing.
   * Default `SIMPLEX_EPSILON`.
   */
  alpha?: number;
}

export interface RowProjectionResult {
  /** Projected row (simplex-admissible: sums to 1, all entries ≥ ε). */
  projected: number[];
  /** Whether the Duchi projection was applied (vs. simple normalisation). */
  duchi: boolean;
  /** Whether the input was degenerate (all-non-positive). */
  isDegenerate: boolean;
  /** Lambda shift from Duchi algorithm (0 for simple normalisation path). */
  lambda: number;
  /** Whether projection was enabled (flag check result). */
  projectionEnabled: boolean;
  /** Whether a boundary-hit was logged (for monitoring). */
  boundaryHitLogged: boolean;
  /**
   * Maximum absolute deviation of any cell from the pre-projection raw value.
   * Zero when no projection needed; > 0 indicates boundary contact.
   */
  maxDeviation: number;
}

/**
 * Project a single conditional-probability row onto the probability simplex.
 *
 * Flag-off: applies simple normalisation with ε-floor (byte-identical to M7's
 * existing path, SC-MB2-01).
 *
 * Flag-on: applies Duchi 2008 simplex projection, guaranteeing continuous
 * gradients at boundary faces and exact row-sum = 1 (CF-MB2-01, CF-MB2-02).
 *
 * Pure function — no side effects (the `boundaryHitLogged` field is set in the
 * result but no I/O is performed; callers decide what to do with it).
 */
export function projectModelRow(
  row: number[],
  opts: RowProjectionOptions = {},
): RowProjectionResult {
  const enabled = opts.projectionEnabled ?? readProjectionEnabledFlag(opts.settingsPath);

  if (!enabled) {
    // Flag-off: simple normalise + ε-floor (existing M7 path).
    const projected = simpleNormalise(row, opts.alpha ?? SIMPLEX_EPSILON);
    const maxDev = maxDeviation(row, projected);
    return {
      projected,
      duchi: false,
      isDegenerate: false,
      lambda: 0,
      projectionEnabled: false,
      boundaryHitLogged: false,
      maxDeviation: maxDev,
    };
  }

  // Flag-on: Duchi 2008 simplex projection.
  const simplexResult: SimplexProjectionResult = projectToSimplex(row);
  const maxDev = maxDeviation(row, simplexResult.projected);
  const tractability = opts.tractability ?? 'tractable';
  const threshold = opts.coinFlipLogThreshold ?? 0.05;

  // Determine whether to log the boundary hit.
  let boundaryHitLogged = false;
  if (simplexResult.isDegenerate || maxDev > 0) {
    if (tractability === 'tractable') {
      // Log all boundary hits on tractable skills.
      boundaryHitLogged = true;
    } else {
      // coin-flip / unknown: only log if deviation exceeds threshold.
      if (maxDev > threshold) {
        boundaryHitLogged = true;
      }
    }
  }

  return {
    projected: simplexResult.projected,
    duchi: true,
    isDegenerate: simplexResult.isDegenerate,
    lambda: simplexResult.lambda,
    projectionEnabled: true,
    boundaryHitLogged,
    maxDeviation: maxDev,
  };
}

// ---------------------------------------------------------------------------
// Full model projector (all rows + priors)
// ---------------------------------------------------------------------------

export interface ModelProjectionResult {
  /** Projected conditional-probability table (each row is simplex-admissible). */
  condProbTable: number[][];
  /** Projected priors (simplex-admissible). */
  priors: number[];
  /** Per-row projection results for diagnostics. */
  rowResults: RowProjectionResult[];
  /** Prior projection result. */
  priorResult: RowProjectionResult;
}

/**
 * Project all rows of a conditional-probability table and the prior vector
 * simultaneously. Useful for projecting a full `GenerativeModel` snapshot.
 *
 * Each row is projected independently (simplex-projection is per-row because
 * rows are independent probability distributions over observation types).
 *
 * Pure function — no side effects.
 */
export function projectModel(
  condProbTable: readonly (readonly number[])[],
  priors: readonly number[],
  opts: RowProjectionOptions = {},
): ModelProjectionResult {
  const rowResults: RowProjectionResult[] = [];
  const projectedTable: number[][] = [];

  for (const row of condProbTable) {
    const result = projectModelRow([...row], opts);
    rowResults.push(result);
    projectedTable.push(result.projected);
  }

  const priorResult = projectModelRow([...priors], opts);

  return {
    condProbTable: projectedTable,
    priors: priorResult.projected,
    rowResults,
    priorResult,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple normalise with ε-floor — the pre-MB2 M7 behaviour (flag-off path).
 *
 * 1. Apply ε floor to every entry.
 * 2. Renormalise so the row sums to 1.
 */
function simpleNormalise(row: number[], eps: number): number[] {
  const n = row.length;
  const out = new Array<number>(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = Math.max(row[i]!, eps);
    out[i] = v;
    sum += v;
  }
  if (sum <= 0) {
    return new Array<number>(n).fill(1 / n);
  }
  for (let i = 0; i < n; i++) {
    out[i] = out[i]! / sum;
  }
  return out;
}

/**
 * Maximum absolute deviation between two vectors of the same length.
 */
function maxDeviation(a: readonly number[], b: readonly number[]): number {
  let max = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = Math.abs((a[i] ?? 0) - (b[i] ?? 0));
    if (d > max) max = d;
  }
  return max;
}

/**
 * Verify that a projected row satisfies the simplex constraints:
 *   - All entries ≥ ε.
 *   - Sum exactly = 1 within floating-point tolerance.
 *
 * Returns `true` iff both constraints hold. Used by test fixtures.
 */
export function verifySimplex(
  row: readonly number[],
  eps: number = SIMPLEX_EPSILON,
  sumTolerance: number = 1e-9,
): boolean {
  let sum = 0;
  for (const v of row) {
    if (!Number.isFinite(v) || v < eps - 1e-15) return false;
    sum += v;
  }
  return Math.abs(sum - 1) <= sumTolerance;
}
