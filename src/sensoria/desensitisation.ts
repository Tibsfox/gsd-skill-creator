/**
 * M6 Sensoria — Slow-timescale desensitisation and tachyphylaxis.
 *
 * The net-shift equation (`netShift.ts`) is instantaneous: it takes `K_H`,
 * `K_L`, `R_T`, `[L]` and returns ΔR_H. Over repeated activations the
 * biological analogy has the system adapt — high-affinity sites downregulate
 * under sustained dose (tachyphylaxis), and the total receptor pool shrinks
 * under chronic overuse (desensitisation).
 *
 * This module maintains the slow-timescale state per skill:
 *
 *  - `integratedDose` — time-integrated ligand exposure (trapezoidal sum)
 *  - `effectiveK_H`   — K_H adjusted by dose history; drifts toward K_L
 *  - `R_T`            — total receptor amount; slowly shrinks on sustained use
 *  - `fadeCount`      — number of activations observed (diagnostics)
 *
 * Technical analogy only — no biological truth claimed.
 *
 * Source: Lanzara 2023, Appendix III (tachyphylaxis as slow K_H drift).
 *
 * @module sensoria/desensitisation
 */

import type { DesensitisationState, SensoriaBlock } from '../types/sensoria.js';

/**
 * Tunable parameters for the slow-timescale adjustment. These are deliberately
 * conservative defaults; callers may override per-mission.
 */
export interface DesensitisationParams {
  /**
   * Fraction of the gap `(effectiveK_H − K_L)` removed per unit integrated
   * dose. Higher = faster tachyphylaxis. Default tuned to produce ≥30% fade
   * over 20 sustained unit-dose activations (CF-M6-03).
   */
  kHDecayPerDose: number;
  /**
   * Fraction of R_T removed per unit integrated dose. Much smaller than
   * `kHDecayPerDose` — desensitisation is a longer-horizon effect than
   * tachyphylaxis.
   */
  rTDecayPerDose: number;
  /**
   * Recovery fraction applied per unit elapsed wall-clock millisecond since
   * `lastUpdateTs`. When a skill is not used for a while, `effectiveK_H`
   * drifts back toward its initial value. Kept small so that short gaps
   * between activations do not immediately restore sensitivity.
   */
  recoveryPerMs: number;
  /**
   * Lower bound on `effectiveK_H` relative to `K_L`. `effectiveK_H` never
   * falls below `K_L · floorRatio`; this prevents the net-shift term from
   * flipping sign under extreme dose history.
   */
  floorRatio: number;
}

export const DEFAULT_DESENS_PARAMS: DesensitisationParams = {
  // 0.10 per unit dose produces ~40% ΔR_H fade over 20 peak-ligand activations
  // in the default K_H=10, K_L=0.1 regime — comfortably above the CF-M6-03
  // ≥30% gate with margin for recovery interactions.
  kHDecayPerDose: 0.10,
  rTDecayPerDose: 0.002,
  recoveryPerMs: 1e-7,
  floorRatio: 1.0,
};

/**
 * Per-skill desensitisation registry. Keyed by `skillId`. State is kept in
 * memory for the life of the enclosing process; M6 does not persist across
 * restarts (the net-shift signal is session-scoped).
 *
 * Trunk and M4-style branches should hold independent `DesensitisationStore`
 * instances — state never leaks across branch boundaries (IT-05).
 */
export class DesensitisationStore {
  private states = new Map<string, DesensitisationState>();

  constructor(private params: DesensitisationParams = DEFAULT_DESENS_PARAMS) {}

  /**
   * Return (or create) the desensitisation state for a skill. When absent,
   * initialises from the skill's `SensoriaBlock` defaults.
   */
  getOrInit(skillId: string, block: SensoriaBlock, nowMs: number): DesensitisationState {
    const existing = this.states.get(skillId);
    if (existing) return existing;
    const fresh: DesensitisationState = {
      skillId,
      integratedDose: 0,
      effectiveK_H: block.K_H,
      lastUpdateTs: nowMs,
      fadeCount: 0,
    };
    this.states.set(skillId, fresh);
    return fresh;
  }

  /**
   * Record an activation at dose `L` and advance the slow-timescale state.
   * Returns the `(effectiveK_H, R_T)` pair that should be fed into the next
   * `computeNetShift` call for this skill.
   *
   * Recovery is applied first (clock-forward), then decay (dose-forward).
   * This ordering guarantees that a single sustained dose with no gaps
   * produces monotone tachyphylaxis, and that long idle gaps restore
   * sensitivity toward the skill's original `K_H`.
   */
  recordActivation(
    skillId: string,
    block: SensoriaBlock,
    L: number,
    R_T: number,
    nowMs: number,
  ): { effectiveK_H: number; R_T: number } {
    const state = this.getOrInit(skillId, block, nowMs);

    // 1) Recovery: drift effectiveK_H back toward block.K_H proportional to
    //    elapsed time since last update. Bounded to [K_L·floor, K_H].
    const elapsed = Math.max(0, nowMs - state.lastUpdateTs);
    const recovered = state.effectiveK_H
      + this.params.recoveryPerMs * elapsed * (block.K_H - state.effectiveK_H);
    state.effectiveK_H = clamp(
      recovered,
      block.K_L * this.params.floorRatio,
      block.K_H,
    );

    // 2) Dose-integrated decay: push effectiveK_H toward K_L and shrink R_T.
    state.integratedDose += Math.max(0, L);
    const gap = state.effectiveK_H - block.K_L;
    state.effectiveK_H = block.K_L + gap * (1 - this.params.kHDecayPerDose * Math.max(0, L));
    state.effectiveK_H = clamp(
      state.effectiveK_H,
      block.K_L * this.params.floorRatio,
      block.K_H,
    );

    const newR_T = R_T * (1 - this.params.rTDecayPerDose * Math.max(0, L));
    const clampedR_T = Math.max(0, newR_T);

    state.lastUpdateTs = nowMs;
    state.fadeCount += 1;

    return { effectiveK_H: state.effectiveK_H, R_T: clampedR_T };
  }

  /**
   * Reset state for a skill (used by test fixtures and by operator resets).
   */
  reset(skillId: string): void {
    this.states.delete(skillId);
  }

  /**
   * Reset all state. Used by branch-context fixtures (IT-05).
   */
  clear(): void {
    this.states.clear();
  }

  /**
   * Snapshot for diagnostics. Returns a copy; mutations to the returned
   * object do not affect the store.
   */
  snapshot(skillId: string): DesensitisationState | undefined {
    const s = this.states.get(skillId);
    return s ? { ...s } : undefined;
  }
}

function clamp(value: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}
