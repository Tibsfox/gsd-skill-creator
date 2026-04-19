/**
 * MA-2 ACE — actor-critic loop orchestration.
 *
 * Phase 655 / v1.49.561 Refinement R2. The per-observation-tick loop that
 * wires the substrate modules together:
 *
 *   perceive (MA-6 r(t), MA-1 e_c(t), M7 F(t))
 *     → compute TD error δ (ace/td-error)
 *     → fold into critic estimate (ace/critic)
 *     → emit ActorSignal (ace/actor-update)
 *     → M5 selector consumes via optional `aceSignal` parameter
 *
 * The loop is driven per OBSERVATION TICK, not per wall-clock second — this
 * is the explicit decoupling from the clock the phase 655 briefing requires.
 * Callers increment the tick by invoking `loop.tick(...)` at each decision
 * boundary; there is no internal timer.
 *
 * Flag-off behaviour (SC-MA2-01): when the ACE flag is off, `tick(...)` is a
 * no-op and returns `null`. The selector must not receive an ActorSignal in
 * this regime. `loop.ts` reads the flag ONCE at construction and caches it;
 * `setEnabled(...)` provides explicit runtime override for tests.
 *
 * Markov-blanket compliance: see `actor-update.ts` header.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MA-2-ace-reinforcement.md
 *
 * @module ace/loop
 */

import type { ReinforcementChannel } from '../types/reinforcement.js';
import { AdaptiveCriticElement, type CriticOptions } from './critic.js';
import { computeTDError, type ChannelReading, type TDErrorOptions } from './td-error.js';
import { buildActorSignal, type ActorSignal, type ActorUpdateOptions } from './actor-update.js';
import { readAceEnabledFlag } from './settings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AceLoopOptions {
  /** TD / tractability options forwarded to `computeTDError`. */
  tdOptions?: TDErrorOptions;
  /** Critic configuration (α_c, initial estimate). */
  criticOptions?: CriticOptions;
  /** Actor-signal clamp configuration. */
  actorOptions?: ActorUpdateOptions;
  /**
   * Initial value of `−F(t−1)` to seed the loop. Default `0`. Setting a
   * realistic seed (e.g. a warm-start `-F` from prior session) accelerates
   * convergence but is not required.
   */
  initialPrevNegF?: number;
  /**
   * Explicit flag override. When provided, bypasses `readAceEnabledFlag()`.
   * Primary use: tests that want deterministic flag state without touching
   * `.claude/settings.json`. `undefined` → read from settings.json.
   */
  enabledOverride?: boolean;
  /**
   * Optional settings.json path — forwarded to `readAceEnabledFlag`. When
   * `enabledOverride` is set, this is ignored.
   */
  settingsPath?: string;
}

export interface AceLoopTickInput {
  /** Eligibility + reinforcement readings for each tracked channel. */
  readings: readonly ChannelReading[];
  /** Current tick's `−F(t)`; caller supplies the negation. */
  negFCurr: number;
}

export interface AceLoopTickResult {
  /** Emitted actor signal (for M5 consumption). */
  signal: ActorSignal;
  /** Tractability-weighted TD error (`signal.delta` before clamp). */
  delta: number;
  /** Critic estimate snapshot after applying δ. */
  criticEstimate: number;
  /** Tick index this result corresponds to. */
  tick: number;
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

/**
 * ACE loop — one instance per session / per actor.
 *
 * Not thread-safe; single-writer per instance.
 */
export class AceLoop {
  private readonly critic: AdaptiveCriticElement;
  private readonly tdOptions: TDErrorOptions;
  private readonly actorOptions: ActorUpdateOptions;
  private prevNegF: number;
  private tickCounter: number;
  private enabled: boolean;

  constructor(opts: AceLoopOptions = {}) {
    this.critic = new AdaptiveCriticElement(opts.criticOptions);
    this.tdOptions = opts.tdOptions ?? {};
    this.actorOptions = opts.actorOptions ?? {};
    this.prevNegF = opts.initialPrevNegF ?? 0;
    this.tickCounter = 0;
    this.enabled = opts.enabledOverride ?? readAceEnabledFlag(opts.settingsPath);
  }

  /** Runtime enable/disable — used by tests and explicit operator toggle. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Whether the loop will emit signals (flag-on). */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Current tick counter (incremented on every `tick(...)`). */
  get currentTick(): number {
    return this.tickCounter;
  }

  /** Access the critic (for tests / telemetry). */
  get criticRef(): AdaptiveCriticElement {
    return this.critic;
  }

  /**
   * Run one observation tick.
   *
   * Returns `null` when the ACE flag is off — SC-MA2-01 byte-identity
   * requirement. Otherwise returns the computed signal plus telemetry.
   */
  tick(input: AceLoopTickInput): AceLoopTickResult | null {
    if (!this.enabled) {
      // FLAG-OFF: no-op. No state mutation. No signal emitted.
      // Byte-identical path per SC-MA2-01.
      return null;
    }

    this.tickCounter += 1;

    // 1. Compute TD error δ = weight · (r̄ + γ·ΔF_curr − ΔF_prev)
    const td = computeTDError(
      input.readings,
      this.prevNegF,
      input.negFCurr,
      this.tdOptions,
    );

    // 2. Fold into critic.
    this.critic.update(td.delta);

    // 3. Advance the previous-NegF memory.
    this.prevNegF = input.negFCurr;

    // 4. Build the actor signal.
    const signal = buildActorSignal(
      td.delta,
      td.weight,
      input.readings,
      this.tickCounter,
      this.actorOptions,
    );

    return {
      signal,
      delta: td.delta,
      criticEstimate: this.critic.estimate,
      tick: this.tickCounter,
    };
  }

  /**
   * Reset loop state (tests / session bounds). Preserves the cached flag
   * state — call `setEnabled(false)` explicitly to disable.
   */
  reset(initialPrevNegF: number = 0): void {
    this.critic.reset(0);
    this.prevNegF = initialPrevNegF;
    this.tickCounter = 0;
  }
}

/**
 * One-shot convenience runner: construct a loop, feed N ticks, return the
 * sequence of results. Useful for fixture-driven tests and batch replay.
 *
 * Returns an array of length `inputs.length` where flag-off indices are
 * populated with `null`.
 */
export function runAceLoop(
  inputs: readonly AceLoopTickInput[],
  opts: AceLoopOptions = {},
): Array<AceLoopTickResult | null> {
  const loop = new AceLoop(opts);
  return inputs.map((input) => loop.tick(input));
}

/**
 * Re-export the channel type so barrel consumers can reach it without
 * crossing into `src/types/` directly.
 */
export type { ReinforcementChannel };
