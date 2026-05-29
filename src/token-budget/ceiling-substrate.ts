/**
 * Production substrate consumer for the `token_budget.max_percent`
 * calibratable threshold (v1.49.893 — closes the v888 deferred half).
 *
 * v888 wired the READ side (calibration loop can load
 * `TokenBudgetMaxEvent`s). v893 wires the WRITE side: a production code
 * path that reads `token_budget.max_percent` from the integration config,
 * compares a usagePercent reading against it, AND auto-emits a
 * `TokenBudgetMaxEvent` per check so the calibration loop has
 * traffic-attributed observations to draw on.
 *
 * Mirrors v837 → v846 (predictive low-confidence wire → substrate auto-emit)
 * and v884 → v891 (observation-retention read-side → substrate auto-emit).
 * Second instance of the substrate-wrapper pattern (v891 retention was
 * first). Promotes the pattern from 1-instance candidate to 2-instance
 * ESTABLISHED.
 *
 * ## Outcome-driven auto-emit kind
 *
 * Differs from v891's default-fixed pattern in that the kind is derived
 * from the (usagePercent, max_percent) comparison rather than a fixed
 * default. When `usagePercent < max_percent`, emit `under_budget` (+1,
 * favoring LOWER threshold). When `usagePercent >= max_percent`, emit
 * `blocked` (-1, favoring RAISING threshold). The `defaultKind` option
 * overrides this for cases where the caller wants to force a polarity
 * (mirrors v891's explicit override hook).
 *
 * This outcome-driven shape is more natural here than v891's
 * default-fixed shape because the threshold-compare IS the substrate:
 * the polarity falls out of the same comparison that drives the result.
 * In v891 the substrate (`RetentionManager.prune`) is async work whose
 * outcome doesn't determine polarity; in v893 the substrate is a pure
 * inequality.
 *
 * ## Failure contract (Lesson #10427 + #10437)
 *
 * `appendTokenBudgetMaxEvent` is invoked fire-and-forget. Disk-full or
 * permission-denied during the auto-emit MUST NOT break the check —
 * forensic surface per #10427, subscriber-gated observability-only pattern
 * per #10437.
 *
 * @module token-budget/ceiling-substrate
 */

import {
  appendTokenBudgetMaxEvent,
  type TokenBudgetMaxEventKind,
} from '../bounded-learning/token-budget-max-events.js';

/**
 * Minimal shape of the integration config consumed here. Avoids importing
 * the full `IntegrationConfig` type to keep this module's surface narrow.
 */
export interface TokenBudgetMaxConfig {
  token_budget: {
    max_percent: number;
  };
}

export interface CeilingCheckOptions {
  /**
   * When false, disables the auto-emit. Default true. Tests and callers
   * who want a pure ceiling-compare without observability pass
   * `{ autoEmit: false }`.
   */
  autoEmit?: boolean;
  /**
   * Override the path the auto-emit writes to. Defaults to the events
   * module's default JSONL location.
   */
  eventsPath?: string;
  /**
   * Force a specific kind regardless of the outcome-driven default.
   * Production callers SHOULD prefer the outcome-driven default; operators
   * who need to record a discrepancy use the CLI manual recorder.
   */
  defaultKind?: TokenBudgetMaxEventKind;
  /**
   * Free-form note recorded on the event (best-effort).
   */
  reason?: string;
}

export interface CeilingCheckResult {
  /** True when usagePercent is strictly below max_percent. */
  underBudget: boolean;
  /** The usagePercent reading passed in. */
  usagePercent: number;
  /** The max_percent threshold value read from config. */
  maxPercent: number;
  /** The kind that was auto-emitted (or would be, if autoEmit were true). */
  emittedKind: TokenBudgetMaxEventKind;
}

/**
 * Compare `usagePercent` against `config.token_budget.max_percent` and
 * auto-emit a `TokenBudgetMaxEvent` for the calibration loop.
 *
 * First production caller of `token_budget.max_percent` (v1.49.893).
 *
 * Synchronous — the only async work is the fire-and-forget auto-emit,
 * which is intentionally not awaited per the #10437 contract.
 */
export function runTokenBudgetCeilingCheck(
  config: TokenBudgetMaxConfig,
  usagePercent: number,
  options: CeilingCheckOptions = {},
): CeilingCheckResult {
  const maxPercent = config.token_budget.max_percent;
  const underBudget = usagePercent < maxPercent;
  const outcomeKind: TokenBudgetMaxEventKind = underBudget ? 'under_budget' : 'blocked';
  const emittedKind = options.defaultKind ?? outcomeKind;

  if (options.autoEmit !== false) {
    const appendOptions = options.eventsPath !== undefined
      ? { path: options.eventsPath }
      : {};
    // Fire-and-forget per #10437. Failure MUST NOT break the substrate.
    appendTokenBudgetMaxEvent(
      {
        timestamp: new Date().toISOString(),
        kind: emittedKind,
        usagePercent,
        maxPercent,
        ...(options.reason !== undefined ? { reason: options.reason } : {}),
      },
      appendOptions,
    ).catch(() => {
      /* auto-emit is observability-only; never break the check */
    });
  }

  return { underBudget, usagePercent, maxPercent, emittedKind };
}
