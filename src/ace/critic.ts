/**
 * MA-2 ACE — Adaptive Critic Element.
 *
 * Phase 655 / v1.49.561 Refinement R2. Maintains the running estimate of
 * expected free-energy reduction (`p̂(t) = −F̂(t)`) over time, updated by TD
 * errors. This is the "adaptive critic" half of the Barto/Sutton/Anderson
 * (1983) ASE/ACE pair — the ACE produces the internal-reinforcement signal
 * that densifies the sparse external reinforcement channel, which the ASE
 * (our M5 selector) consumes via `actor-update.ts`.
 *
 * In Barto 1983 Eq. 4 (p. 842) the critic's prediction is a linear function
 * of input features updated by TD error; here we maintain a scalar running
 * expectation of `−F` as the simplest on-policy critic that composes cleanly
 * with M7's categorical free-energy minimiser. Non-linear / feature-based
 * critics are explicitly out-of-scope per proposal Constraints and Failure
 * Mode 1 (TD divergence under non-linear function approximation).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MA-2-ace-reinforcement.md
 *
 * @module ace/critic
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CriticOptions {
  /** Learning rate for the critic's running estimate. Default 0.1. */
  alphaCritic?: number;
  /** Seed value for the estimate. Default 0. */
  initialEstimate?: number;
}

export interface CriticSnapshot {
  /** Current running estimate of `−F` (i.e. the ACE's `p̂(t)`). */
  estimate: number;
  /** Number of TD updates applied since construction. */
  updateCount: number;
  /** Sum of raw TD errors applied (sanity telemetry). */
  cumulativeDelta: number;
}

// ---------------------------------------------------------------------------
// Critic
// ---------------------------------------------------------------------------

/**
 * Scalar running-expectation critic for the MA-2 actor-critic loop.
 *
 * Usage pattern:
 *   1. Construct once per session (or per skill, depending on scope).
 *   2. On each tick, after computing the TD error δ via
 *      `computeTDError(...)`, call `critic.update(delta)` to fold it into the
 *      running estimate.
 *   3. Optionally query `critic.estimate` to obtain the current `p̂(t)` the
 *      actor is tracking.
 *
 * Not thread-safe (single-writer per instance is the current session model).
 */
export class AdaptiveCriticElement {
  private _estimate: number;
  private _updateCount: number;
  private _cumulativeDelta: number;
  private readonly alphaCritic: number;

  constructor(opts: CriticOptions = {}) {
    this._estimate = opts.initialEstimate ?? 0;
    this._updateCount = 0;
    this._cumulativeDelta = 0;
    this.alphaCritic = opts.alphaCritic ?? 0.1;
  }

  /**
   * Apply a single TD-error update.
   *
   *   p̂(t+1) = p̂(t) + α_c · δ(t)
   *
   * This is the critic-side analogue of Barto 1983 Eq. 6 (p. 842). It
   * converges on-policy under the Tsitsiklis–Van Roy (1997) linear-TD
   * guarantee (proposal §Mechanism "Stability").
   */
  update(delta: number): void {
    if (!Number.isFinite(delta)) return; // no-op on NaN/Inf guard
    this._estimate += this.alphaCritic * delta;
    this._updateCount += 1;
    this._cumulativeDelta += delta;
  }

  /** Current running estimate of `p̂(t) = −F̂(t)`. */
  get estimate(): number {
    return this._estimate;
  }

  /** Number of update() calls since construction. */
  get updateCount(): number {
    return this._updateCount;
  }

  /** Sum of all raw TD errors folded in so far. */
  get cumulativeDelta(): number {
    return this._cumulativeDelta;
  }

  /** Serialisable snapshot of critic state. */
  snapshot(): CriticSnapshot {
    return {
      estimate: this._estimate,
      updateCount: this._updateCount,
      cumulativeDelta: this._cumulativeDelta,
    };
  }

  /** Reset the critic to its initial state (tests / session bounds). */
  reset(initialEstimate: number = 0): void {
    this._estimate = initialEstimate;
    this._updateCount = 0;
    this._cumulativeDelta = 0;
  }
}
