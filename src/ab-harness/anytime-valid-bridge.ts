/**
 * JP-029 — A/B harness anytime-valid bridge.
 *
 * Migrates the A/B harness significance-gated stopping rule onto the shared
 * Wave 0 `src/anytime-valid/` e-process primitive (per user decision 3: single
 * shared primitive; no reimplementation of e-process logic in `src/ab-harness/`).
 *
 * ## Migration design
 *
 * The legacy A/B harness stopping rule (stats.ts `runSignificanceTest`) is a
 * fixed-window test: it collects exactly `N` samples per variant, then makes a
 * single decision. This is valid at the pre-agreed horizon N but provides no
 * Type-I protection if `result()` is inspected before all N samples arrive.
 *
 * This bridge provides two modes:
 *
 *   - `'fixed-horizon'` — **migration-equivalence mode**. Accumulates exactly
 *     `N` paired observations (mean-delta per pair), then issues a single
 *     decision at the horizon boundary. Reproduces the legacy behavior at the
 *     migration boundary while delegating threshold arithmetic to the shared
 *     e-process. Type-I guarantee holds at the fixed horizon.
 *
 *   - `'anytime'` — **continuous-peeking mode**. The bridge may be queried
 *     after every paired observation without inflating Type-I error. Under H_0
 *     the running e-value is a supermartingale (Ville's inequality), so
 *     `peek()` is safe at any sample count.
 *
 * ## Observation encoding
 *
 * For each paired (A, B) session the bridge derives a normalized observation:
 *
 *   x = clamp((scoreB - scoreA) / noiseFloor, -1, 1)
 *
 * This maps a zero mean-delta to x=0 (H_0 compatible) and a delta equal to the
 * noise floor to x=1. The e-process martingale then accumulates these as
 * bounded observations in [-1, 1].
 *
 * ## Legacy equivalence property
 *
 * At the migration boundary (after exactly N paired observations) the bridge
 * decision in `'fixed-horizon'` mode matches `runSignificanceTest` when the
 * mean of the encoded observations is positive and significant. Formally:
 *   - If `runSignificanceTest` returns `'commit-B'`, then `bridge.decide()`
 *     returns `'commit-B'` at horizon N (within the same alpha).
 *   - If `runSignificanceTest` returns `'keep-A'` / `'coin-flip'`, the bridge
 *     returns `'keep-A'`.
 *   - `'insufficient-data'` is preserved pre-horizon.
 *
 * Reference: arXiv:2604.21851 — Betting on Bets: Anytime-Valid Tests for
 * Stochastic Dominance.
 *
 * NEW-LAYER discipline: no Grove, no filesystem, no side effects.
 *
 * Phase 840, Wave 3 (JP-029).
 *
 * @module ab-harness/anytime-valid-bridge
 */

import {
  createEProcess,
  type EProcessConfig,
  type EProcessResult,
} from '../anytime-valid/index.js';
import type { ABDecision } from './stats.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Stopping-rule mode for the bridge.
 *
 * - `'fixed-horizon'` — migration-equivalence mode. Decision is made only at
 *   the configured horizon N. Mirrors the legacy `runSignificanceTest` behavior.
 * - `'anytime'` — continuous-peeking mode. `peek()` / `decide()` may be called
 *   after any number of paired observations; Type-I bound holds throughout.
 */
export type BridgeMode = 'fixed-horizon' | 'anytime';

/**
 * Configuration for `createAnytimeValidBridge`.
 */
export interface AnytimeValidBridgeConfig {
  /**
   * Stopping-rule mode (default: `'anytime'`).
   */
  mode?: BridgeMode;

  /**
   * Significance level α (default: 0.05).
   * Rejection threshold for the e-process: τ = 1/α.
   */
  alpha?: number;

  /**
   * Fixed-horizon sample count (paired observations). Required when
   * `mode === 'fixed-horizon'`; ignored in `'anytime'` mode.
   */
  horizon?: number;

  /**
   * Tractability-weighted noise floor used to normalise paired observations
   * before feeding into the e-process (default: 1.0).
   * A pair (scoreA, scoreB) maps to x = clamp((scoreB - scoreA) / noiseFloor, -1, 1).
   */
  noiseFloor?: number;

  /**
   * E-process configuration overrides (alpha from this config wins over
   * EProcessConfig if both are provided).
   */
  eProcessConfig?: Omit<EProcessConfig, 'alpha' | 'stoppingPolicy'>;
}

/**
 * A snapshot returned by `AnytimeValidBridge.peek()`.
 */
export interface BridgePeekResult {
  /** Whether the e-process has rejected H_0 at the configured α level. */
  rejected: boolean;
  /** The running e-value E_t. */
  evidence: number;
  /** Number of paired observations consumed. */
  observations: number;
  /**
   * A/B decision derived from the current e-value:
   *   - `'commit-B'` when `rejected === true`.
   *   - `'insufficient-data'` when observations < minObservations (anytime mode) or
   *     before horizon (fixed-horizon mode).
   *   - `'keep-A'` otherwise.
   */
  decision: ABDecision;
  /** The raw EProcessResult from the underlying primitive. */
  eProcessResult: EProcessResult;
}

/**
 * An anytime-valid bridge for the A/B harness significance-gated stopping rule.
 *
 * Created via `createAnytimeValidBridge(config)`.
 */
export interface AnytimeValidBridge {
  /**
   * Feed one paired session observation into the bridge.
   *
   * Internally computes x = clamp((scoreB - scoreA) / noiseFloor, -1, 1)
   * and updates the underlying e-process with x.
   *
   * @param scoreA — numeric score for variant A in this session.
   * @param scoreB — numeric score for variant B in this session.
   */
  update(scoreA: number, scoreB: number): void;

  /**
   * Peek at the current test state without committing to a decision.
   * Safe to call at any time in `'anytime'` mode (no Type-I inflation).
   * In `'fixed-horizon'` mode the decision field reflects horizon status.
   */
  peek(): BridgePeekResult;

  /**
   * Return the final A/B decision.
   *
   * In `'fixed-horizon'` mode this is equivalent to the legacy
   * `runSignificanceTest` decision at horizon N.
   * In `'anytime'` mode this returns the current decision (same as
   * `peek().decision`).
   */
  decide(): ABDecision;

  /**
   * Reset the bridge to its initial (no-evidence) state.
   */
  reset(): void;

  /**
   * The effective configuration resolved at construction time.
   */
  readonly config: Required<AnytimeValidBridgeConfig>;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_MODE: BridgeMode = 'anytime';
const DEFAULT_ALPHA = 0.05;
const DEFAULT_HORIZON = 0; // must be set by caller for fixed-horizon mode
const DEFAULT_NOISE_FLOOR = 1.0;
const MIN_OBSERVATIONS_ANYTIME = 1;

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Clamp x to the interval [-1, 1].
 * Protects the e-process martingale invariant (Hoeffding's lemma requires |x| ≤ 1).
 */
function clamp(x: number): number {
  return Math.max(-1, Math.min(1, x));
}

/**
 * Encode a paired (A, B) session score into a bounded e-process observation.
 *
 * x = clamp((scoreB - scoreA) / noiseFloor, -1, 1)
 *
 * When noiseFloor ≤ 0 we return the raw sign of (scoreB - scoreA) clamped to
 * [-1, 1] to avoid division by zero (defensive; callers should set noiseFloor > 0).
 */
function encodePair(scoreA: number, scoreB: number, noiseFloor: number): number {
  if (noiseFloor <= 0) {
    const delta = scoreB - scoreA;
    return delta > 0 ? 1 : delta < 0 ? -1 : 0;
  }
  return clamp((scoreB - scoreA) / noiseFloor);
}

class AnytimeValidBridgeImpl implements AnytimeValidBridge {
  private readonly ep: ReturnType<typeof createEProcess>;
  private _observations: number;
  readonly config: Required<AnytimeValidBridgeConfig>;

  constructor(cfg: Required<AnytimeValidBridgeConfig>) {
    this.config = cfg;
    this.ep = createEProcess({
      alpha: cfg.alpha,
      stoppingPolicy: cfg.mode === 'fixed-horizon' ? 'fixed-horizon' : 'continuous',
      ...cfg.eProcessConfig,
    });
    this._observations = 0;
  }

  update(scoreA: number, scoreB: number): void {
    const x = encodePair(scoreA, scoreB, this.config.noiseFloor);
    this.ep.update(x);
    this._observations += 1;
  }

  peek(): BridgePeekResult {
    const eResult = this.ep.result();
    const decision = this._resolveDecision(eResult);
    return {
      rejected: eResult.rejected,
      evidence: eResult.evidence,
      observations: this._observations,
      decision,
      eProcessResult: eResult,
    };
  }

  decide(): ABDecision {
    return this.peek().decision;
  }

  reset(): void {
    this.ep.reset();
    this._observations = 0;
  }

  // ── Decision resolution ────────────────────────────────────────────────────

  private _resolveDecision(eResult: EProcessResult): ABDecision {
    const { mode, horizon } = this.config;
    const n = this._observations;

    if (mode === 'fixed-horizon') {
      // Before the horizon: insufficient-data (mirrors legacy guard).
      if (n < horizon) {
        return 'insufficient-data';
      }
      // At or beyond the horizon: decide based on the e-process.
      return eResult.rejected ? 'commit-B' : 'keep-A';
    }

    // Anytime mode: need at least one observation; then decide continuously.
    if (n < MIN_OBSERVATIONS_ANYTIME) {
      return 'insufficient-data';
    }
    return eResult.rejected ? 'commit-B' : 'keep-A';
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a new anytime-valid bridge for the A/B harness.
 *
 * @param config — configuration (all fields optional).
 * @returns An `AnytimeValidBridge` instance.
 *
 * @example Fixed-horizon (migration-equivalence) mode
 * ```ts
 * const bridge = createAnytimeValidBridge({
 *   mode: 'fixed-horizon',
 *   horizon: 30,
 *   noiseFloor: 2.0,
 *   alpha: 0.10,
 * });
 * for (let i = 0; i < 30; i++) bridge.update(scoresA[i], scoresB[i]);
 * const decision = bridge.decide(); // 'commit-B' | 'keep-A'
 * ```
 *
 * @example Anytime (continuous-peeking) mode
 * ```ts
 * const bridge = createAnytimeValidBridge({ noiseFloor: 2.0, alpha: 0.05 });
 * for (const [a, b] of stream) {
 *   bridge.update(a, b);
 *   const { rejected } = bridge.peek();
 *   if (rejected) break; // safe to stop at any time
 * }
 * ```
 */
export function createAnytimeValidBridge(
  config: AnytimeValidBridgeConfig = {},
): AnytimeValidBridge {
  const mode = config.mode ?? DEFAULT_MODE;
  const alpha = config.alpha ?? DEFAULT_ALPHA;
  const horizon = config.horizon ?? DEFAULT_HORIZON;
  const noiseFloor = config.noiseFloor ?? DEFAULT_NOISE_FLOOR;
  const eProcessConfig = config.eProcessConfig ?? {};

  if (alpha <= 0 || alpha >= 1) {
    throw new RangeError(
      `createAnytimeValidBridge: alpha must be in (0, 1), got ${alpha}`,
    );
  }
  if (mode === 'fixed-horizon' && horizon < 1) {
    throw new RangeError(
      `createAnytimeValidBridge: horizon must be ≥ 1 for fixed-horizon mode, got ${horizon}`,
    );
  }

  const resolved: Required<AnytimeValidBridgeConfig> = {
    mode,
    alpha,
    horizon,
    noiseFloor,
    eProcessConfig,
  };

  return new AnytimeValidBridgeImpl(resolved);
}
