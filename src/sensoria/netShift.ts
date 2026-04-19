/**
 * M6 Sensoria — Lanzara Net-Shift Equation.
 *
 * Pure closed-form two-state equilibrium model. Given a ligand concentration
 * `[L]`, a total receptor count `R_T`, and two affinity constants `K_H`
 * (high-affinity) and `K_L` (low-affinity), the net shift from the low- to
 * high-affinity state is:
 *
 *     ΔR_H = [L] · R_T · (K_H − K_L) / ((1 + K_H·[L]) · (1 + K_L·[L]))
 *
 * This is the closed form from Lanzara 2023 (*Origins of Life's Sensoria*,
 * Appendix III), derived from the two-state binding equilibrium with the
 * conservation constraint `R_T = R_L + R_H + K_L·R_L·[L] + K_H·R_H·[L]`.
 *
 * Four properties fall out of the equation:
 *
 *  1. **Weber-Fechner log-linearity.** When `K_L·[L] ≪ 1 ≪ K_H·[L]`, the
 *     response is approximately log-linear in `[L]`.
 *  2. **Saturation.** As `[L] → ∞`, `ΔR_H → 0` (both affinity states occupied,
 *     differential signal vanishes).
 *  3. **Silent binder.** When `K_H === K_L`, the numerator factor
 *     `(K_H − K_L)` is exactly 0, so `ΔR_H` is exactly 0 — not ε-close, but
 *     identically zero by construction.
 *  4. **Tachyphylaxis.** Slow-timescale drift of `K_H → K_L` (implemented in
 *     `desensitisation.ts`) collapses the net-shift term under sustained
 *     ligand exposure.
 *
 * Technical analogy only. No biological truth is claimed; the equation is
 * used as an engineering convenience for log-linear, saturable, desensitising
 * signal response.
 *
 * @module sensoria/netShift
 */

import type { NetShiftResult } from '../types/sensoria.js';

/**
 * Compute the net receptor-state shift ΔR_H for a ligand-receptor pair.
 *
 * Pure function: no side effects, no external I/O, no hidden state. Callers
 * should compare `deltaR_H` against the skill's `theta` to decide activation;
 * this function returns both the raw shift and a pre-computed `activated`
 * boolean when `theta` is supplied.
 *
 * The equation matches Lanzara 2023 Appendix III: differences below 10⁻⁶
 * against hand-computed reference values are guarded by CF-M6-01.
 *
 * @param L     Ligand concentration `[L]`. Must be ≥ 0. `L = 0` yields
 *              `ΔR_H = 0` (trivially, since the numerator vanishes).
 * @param R_T   Total receptor amount. Must be ≥ 0.
 * @param K_H   High-affinity binding constant. Must be ≥ 0.
 * @param K_L   Low-affinity binding constant. Must be ≥ 0. When `K_H === K_L`
 *              the numerator factor `(K_H − K_L)` is exactly 0, so `ΔR_H`
 *              is exactly 0 — this is the silent-binder edge case (CF-M6-05).
 * @param theta Optional activation threshold. When supplied, the returned
 *              `activated` flag is `deltaR_H > theta`. When omitted,
 *              `activated` is always `false`.
 * @returns     `NetShiftResult` carrying `deltaR_H`, `activated`, and the
 *              derived equilibrium `R_H` / `R_L` state amounts.
 */
export function computeNetShift(
  L: number,
  R_T: number,
  K_H: number,
  K_L: number,
  theta?: number,
): NetShiftResult {
  // Guard: any negative input is a caller bug — fail loud with NaN rather
  // than silently returning a misleading number.
  if (!Number.isFinite(L) || !Number.isFinite(R_T) || !Number.isFinite(K_H) || !Number.isFinite(K_L)) {
    return { deltaR_H: NaN, activated: false, R_H: NaN, R_L: NaN };
  }
  if (L < 0 || R_T < 0 || K_H < 0 || K_L < 0) {
    return { deltaR_H: NaN, activated: false, R_H: NaN, R_L: NaN };
  }

  // Silent binder edge case: K_H === K_L → (K_H - K_L) is exactly 0 →
  // ΔR_H is exactly 0 regardless of [L] or R_T. Return without division.
  // CF-M6-05: this must be exactly 0, not epsilon-close.
  if (K_H === K_L) {
    const halfR_T = R_T / 2;
    return { deltaR_H: 0, activated: false, R_H: halfR_T, R_L: halfR_T };
  }

  // Zero ligand: numerator factor [L] is 0, so ΔR_H = 0. At rest, R_H = R_L = R_T/2.
  if (L === 0) {
    const halfR_T = R_T / 2;
    return { deltaR_H: 0, activated: false, R_H: halfR_T, R_L: halfR_T };
  }

  // Closed-form ΔR_H (Lanzara 2023, Appendix III).
  const denomH = 1 + K_H * L;
  const denomL = 1 + K_L * L;
  const deltaR_H = (L * R_T * (K_H - K_L)) / (denomH * denomL);

  // Equilibrium state amounts: the rest partition is R_T/2 each, and the
  // net shift redistributes from R_L toward R_H (by mass conservation this
  // is a pairwise swap, preserving R_H + R_L = R_T to numerical precision).
  const halfR_T = R_T / 2;
  const R_H = halfR_T + deltaR_H / 2;
  const R_L = halfR_T - deltaR_H / 2;

  const activated = theta !== undefined ? deltaR_H > theta : false;
  return { deltaR_H, activated, R_H, R_L };
}

/**
 * Compute the `[L]` at which `ΔR_H` is maximised for fixed `K_H`, `K_L`.
 *
 * Differentiating ΔR_H with respect to [L] and setting the derivative to
 * zero yields `[L]_peak = 1 / sqrt(K_H · K_L)`. Useful for placing test
 * probes inside the log-linear regime (Weber's-law window).
 */
export function peakLigand(K_H: number, K_L: number): number {
  if (K_H <= 0 || K_L <= 0) return NaN;
  return 1 / Math.sqrt(K_H * K_L);
}
